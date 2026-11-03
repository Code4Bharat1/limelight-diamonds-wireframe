// ─────────────────────────────────────────────────────────────────────────────
// MOCK API — Limelight Diamonds wireframe.
// Same exports and response shapes as the real axios client, but every call is
// answered from the in-memory dummy data in ./mockDb.js. No backend needed.
// ─────────────────────────────────────────────────────────────────────────────
import {
  warehouses, users, products, suppliers, customers, movements, adjustments, audits,
  notifications, goals, attendance, salarySlips,
  newId, dateStr, buildMovement, productRef, userRef, whRef, cRef, computeSlip,
} from './mockDb';

const LATENCY = 250;

const respond = (body) => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true, ...body } }), LATENCY));
const ok = (data, extra = {}) => respond({ data, ...extra });
const fail = (message, status = 400) =>
  new Promise((_, reject) => setTimeout(() => reject({ message, response: { status, data: { success: false, message } } }), LATENCY));

const clone = (x) => JSON.parse(JSON.stringify(x));
const toObj = (data) => (typeof FormData !== 'undefined' && data instanceof FormData ? Object.fromEntries(data.entries()) : { ...(data || {}) });
const paginate = (list, params = {}) => {
  const limit = Number(params.limit) || list.length || 1;
  const page = Number(params.page) || 1;
  return { data: clone(list.slice((page - 1) * limit, page * limit)), total: list.length, page, pages: Math.max(1, Math.ceil(list.length / limit)) };
};

function currentUser() {
  if (typeof window === 'undefined') return users[0];
  try {
    const u = JSON.parse(localStorage.getItem('de_user') || 'null');
    return users.find((x) => x._id === u?._id) || users[0];
  } catch { return users[0]; }
}

async function ensureQR(list) {
  const pending = list.filter((p) => p.qrCodeValue && !p.qrCodeImage);
  if (!pending.length || typeof window === 'undefined') return;
  try {
    const QR = (await import('qrcode')).default;
    await Promise.all(pending.map(async (p) => { p.qrCodeImage = await QR.toDataURL(p.qrCodeValue, { width: 240, margin: 1, color: { dark: '#2b4a0c', light: '#ffffff' } }); }));
  } catch {}
}

function adjustStock(productId, warehouseId, delta) {
  const p = products.find((x) => x._id === productId);
  if (!p) return;
  p.currentStock = Math.max(0, p.currentStock + delta);
  if (!warehouseId) return;
  let ws = p.warehouseStock.find((w) => w.warehouse._id === warehouseId);
  if (!ws) { ws = { warehouse: { _id: warehouseId, name: whRef(warehouseId)?.name }, quantity: 0 }; p.warehouseStock.push(ws); }
  ws.quantity = Math.max(0, ws.quantity + delta);
}

function notify(type, title, message, priority = 'medium') {
  notifications.unshift({ _id: newId('n'), type, title, message, priority, isRead: false, createdAt: new Date().toISOString() });
}

function recordMovement(type, d) {
  const me = currentUser();
  const quantity = Number(d.quantity) || 0;
  if (!d.productId) return fail('Please select a product');
  if (quantity <= 0) return fail('Quantity must be greater than zero');
  const p = products.find((x) => x._id === d.productId);
  if (!p) return fail('Product not found', 404);

  if (['outgoing', 'damaged'].includes(type) || type === 'transfer') {
    const fromId = type === 'transfer' ? d.fromWarehouseId : d.warehouseId;
    const ws = p.warehouseStock.find((w) => w.warehouse._id === fromId);
    const available = fromId ? (ws?.quantity || 0) : p.currentStock;
    if (quantity > available) return fail(`Insufficient stock. Available: ${available} ${p.unit}`);
    if (type === 'transfer' && d.fromWarehouseId === d.toWarehouseId) return fail('Source and destination must differ');
  }

  const isIn = ['incoming', 'return'].includes(type);
  const mv = buildMovement({
    type, productId: d.productId, quantity,
    fromWarehouseId: type === 'transfer' ? d.fromWarehouseId : isIn ? null : d.warehouseId,
    toWarehouseId: type === 'transfer' ? d.toWarehouseId : isIn ? d.warehouseId : null,
    supplierId: d.supplierId, customerId: d.customerId, performedById: me._id,
    reason: d.reason, notes: d.notes, referenceNo: d.referenceNo, unitPrice: d.unitPrice, disposition: d.disposition,
  });
  movements.unshift(mv);

  if (type === 'transfer') { adjustStock(d.productId, d.fromWarehouseId, -quantity); adjustStock(d.productId, d.toWarehouseId, quantity); }
  else if (type === 'return') { if (d.disposition !== 'write_off') adjustStock(d.productId, d.warehouseId, quantity); }
  else adjustStock(d.productId, d.warehouseId, isIn ? quantity : -quantity);

  if (p.currentStock <= p.minStockLevel) notify('low_stock', `Low stock: ${p.name}`, `Only ${p.currentStock} ${p.unit} left (minimum ${p.minStockLevel}).`, 'high');
  return ok(clone(mv), { message: 'Recorded successfully' });
}

const enrichGoal = (g) => {
  const n = Date.now();
  const dl = new Date(g.deadline).getTime();
  const closed = ['dispatched', 'delivered', 'cancelled'].includes(g.status);
  const isOverdue = !closed && dl < n;
  const isDueSoon = !closed && !isOverdue && dl - n <= 24 * 3600000;
  return { ...clone(g), isOverdue, isDueSoon, isUrgentAlert: !closed && (isOverdue || isDueSoon || g.priority === 'urgent'), remainingHours: closed ? null : parseFloat(((dl - n) / 3600000).toFixed(1)) };
};
const visibleGoals = () => {
  const me = currentUser();
  if (me.role !== 'worker') return goals;
  return goals.filter((g) => !g.assignedWorkers.length || g.assignedWorkers.some((w) => w._id === me._id) || g.warehouse?._id === me.assignedWarehouse?._id);
};

const warehouseStats = (w) => {
  const totalStock = products.reduce((s, p) => s + (p.warehouseStock.find((x) => x.warehouse._id === w._id)?.quantity || 0), 0);
  const lowStockCount = products.filter((p) => { const q = p.warehouseStock.find((x) => x.warehouse._id === w._id)?.quantity; return q !== undefined && q <= Math.ceil(p.minStockLevel / 3); }).length;
  return { ...clone(w), totalStock, lowStockCount, capacityUsed: Math.min(100, Math.round((totalStock / (w.capacity || 1)) * 100)) };
};

const toCSV = (rows) => {
  if (!rows.length) return '';
  const flat = rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v && typeof v === 'object' ? v.name ?? '' : v ?? ''])));
  const head = Object.keys(flat[0]);
  return [head.join(','), ...flat.map((r) => head.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(','))].join('\n');
};

function buildReport(type, params = {}) {
  const live = products.filter((p) => p.isActive);
  switch (type) {
    case 'stock-summary':
      return live.map((p) => ({ name: p.name, sku: p.sku, category: p.category, currentStock: p.currentStock, minStockLevel: p.minStockLevel, unit: p.unit, sellingPrice: p.sellingPrice }));
    case 'valuation':
      return live.map((p) => ({ name: p.name, sku: p.sku, currentStock: p.currentStock, purchasePrice: p.purchasePrice, stockValue: p.currentStock * p.purchasePrice }));
    case 'low-stock':
      return live.filter((p) => p.currentStock <= p.minStockLevel).map((p) => ({ name: p.name, sku: p.sku, category: p.category, currentStock: p.currentStock, minStockLevel: p.minStockLevel, shortBy: p.minStockLevel - p.currentStock }));
    case 'movement': {
      const to = params.to ? new Date(params.to) : new Date();
      const from = params.from ? new Date(params.from) : new Date(to.getTime() - 13 * 86400000);
      const days = [];
      for (let d = new Date(from); d <= to && days.length < 62; d = new Date(d.getTime() + 86400000)) days.push(dateStr(d));
      return days.map((date, i) => {
        const real = movements.filter((m) => dateStr(m.createdAt) === date);
        const inc = real.filter((m) => m.type === 'incoming').reduce((s, m) => s + m.quantity, 0);
        const out = real.filter((m) => m.type === 'outgoing').reduce((s, m) => s + m.quantity, 0);
        return { date: date.slice(5), incoming: inc || 4 + ((i * 7) % 11), outgoing: out || 3 + ((i * 5) % 9) };
      });
    }
    default:
      return [];
  }
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: ({ email, password } = {}) => {
    const u = users.find((x) => x.email.toLowerCase() === String(email || '').trim().toLowerCase());
    if (!u || !password) return fail('Invalid email or password. Use one of the Quick Demo Login accounts.', 401);
    if (!u.isActive) return fail('Account is deactivated. Contact admin.', 403);
    return ok({ ...clone(u), token: `demo-token-${u._id}` });
  },
  register: (data) => ok({ ...data, _id: newId('u') }),
  getMe: () => ok(clone(currentUser())),
  updateProfile: (data) => { const u = currentUser(); Object.assign(u, toObj(data)); return ok(clone(u), { message: 'Profile updated' }); },
  changePassword: () => ok(null, { message: 'Password changed successfully' }),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: async (params = {}) => {
    let list = products.filter((p) => p.isActive);
    if (params.search) { const s = params.search.toLowerCase(); list = list.filter((p) => [p.name, p.sku, p.brand, p.category].some((v) => v?.toLowerCase().includes(s))); }
    if (params.category) list = list.filter((p) => p.category === params.category);
    if (params.lowStock === true || params.lowStock === 'true') list = list.filter((p) => p.currentStock <= p.minStockLevel);
    await ensureQR(list);
    return respond(paginate(list, params));
  },
  getById: async (id) => { const p = products.find((x) => x._id === id); if (!p) return fail('Product not found', 404); await ensureQR([p]); return ok(clone(p)); },
  getBySKU: async (sku) => {
    const s = String(sku || '').trim().toUpperCase();
    const p = products.find((x) => x.isActive && (x.sku === s || x._id === sku || x.qrCodeValue === s));
    if (!p) return fail('Product not found', 404);
    await ensureQR([p]);
    return ok(clone(p));
  },
  create: (data) => {
    const d = toObj(data);
    const sku = String(d.sku || '').toUpperCase();
    if (!d.name || !sku) return fail('Name and SKU are required');
    if (products.some((p) => p.sku === sku)) return fail('SKU already exists');
    const p = {
      _id: newId('p'), name: d.name, sku, category: d.category || 'Loose Diamonds', brand: d.brand || '', model: d.model || '', unit: d.unit || 'pcs',
      purchasePrice: Number(d.purchasePrice) || 0, sellingPrice: Number(d.sellingPrice) || 0, minStockLevel: Number(d.minStockLevel) || 10,
      currentStock: Number(d.currentStock) || 0, trackingType: d.trackingType || 'quantity', description: d.description || '',
      imageUrl: '', qrCodeValue: `LIMELIGHT-${sku}`, qrCodeImage: '', isActive: true, warehouseStock: [], createdAt: new Date().toISOString(),
    };
    products.unshift(p);
    return ok(clone(p));
  },
  update: (id, data) => {
    const p = products.find((x) => x._id === id);
    if (!p) return fail('Product not found', 404);
    const d = toObj(data);
    delete d.image;
    ['purchasePrice', 'sellingPrice', 'minStockLevel', 'currentStock'].forEach((k) => { if (d[k] !== undefined && d[k] !== '') d[k] = Number(d[k]); });
    if (d.sku) d.sku = String(d.sku).toUpperCase();
    Object.assign(p, d);
    return ok(clone(p));
  },
  delete: (id) => { const p = products.find((x) => x._id === id); if (p) p.isActive = false; return ok(null, { message: 'Product deactivated' }); },
  generateQR: async (id) => {
    const p = products.find((x) => x._id === id);
    if (!p) return fail('Product not found', 404);
    p.qrCodeValue = `LIMELIGHT-${p.sku}`; p.qrCodeImage = '';
    await ensureQR([p]);
    return ok({ qrCodeValue: p.qrCodeValue, qrCodeImage: p.qrCodeImage });
  },
  getMovements: (id, params = {}) => respond(paginate(movements.filter((m) => m.product?._id === id), params)),
  getCategories: () => ok([...new Set(products.map((p) => p.category))]),
};

// ─── Stock ────────────────────────────────────────────────────────────────────
const byType = (type) => (params = {}) => respond(paginate(movements.filter((m) => m.type === type), params));

export const stockApi = {
  getMovements: (params = {}) => respond(paginate(params.type ? movements.filter((m) => m.type === params.type) : movements, params)),
  getIncoming: byType('incoming'),
  createIncoming: (d) => recordMovement('incoming', d),
  getOutgoing: byType('outgoing'),
  createOutgoing: (d) => recordMovement('outgoing', d),
  getTransfers: byType('transfer'),
  createTransfer: (d) => recordMovement('transfer', d),
  getDamaged: byType('damaged'),
  createDamaged: (d) => recordMovement('damaged', d),
  getAdjustments: (params = {}) => respond(paginate(params.status ? adjustments.filter((a) => a.status === params.status) : adjustments, params)),
  createAdjustment: (d) => {
    if (!d.productId || !d.warehouseId) return fail('Select product and warehouse');
    if (!Number(d.quantityDelta)) return fail('Quantity change cannot be zero');
    const a = { _id: newId('adj'), product: productRef(d.productId), warehouse: whRef(d.warehouseId), quantityDelta: Number(d.quantityDelta), reason: d.reason || '—', requestedBy: userRef(currentUser()._id), status: 'pending', createdAt: new Date().toISOString() };
    adjustments.unshift(a);
    notify('pending_approval', 'Adjustment awaiting approval', `${a.requestedBy.name} requested ${a.quantityDelta > 0 ? '+' : ''}${a.quantityDelta} on ${a.product.name}.`, 'high');
    return ok(clone(a), { message: 'Adjustment submitted for approval' });
  },
  approveAdjustment: (id, body = {}) => {
    const a = adjustments.find((x) => x._id === id);
    if (!a) return fail('Adjustment not found', 404);
    if (a.status !== 'pending') return fail('Adjustment already processed');
    Object.assign(a, { status: 'approved', approvedBy: userRef(currentUser()._id), approvedAt: new Date().toISOString(), comment: body.comment });
    adjustStock(a.product._id, a.warehouse._id, a.quantityDelta);
    movements.unshift(buildMovement({ type: 'adjustment', productId: a.product._id, quantity: Math.abs(a.quantityDelta), toWarehouseId: a.warehouse._id, performedById: currentUser()._id, reason: a.reason }));
    return ok(clone(a));
  },
  rejectAdjustment: (id, body = {}) => {
    const a = adjustments.find((x) => x._id === id);
    if (!a) return fail('Adjustment not found', 404);
    Object.assign(a, { status: 'rejected', approvedBy: userRef(currentUser()._id), approvedAt: new Date().toISOString(), comment: body.comment });
    return ok(clone(a));
  },
};

// ─── Warehouses ───────────────────────────────────────────────────────────────
export const warehousesApi = {
  getAll: () => ok(warehouses.filter((w) => w.isActive).map(warehouseStats)),
  getById: (id) => { const w = warehouses.find((x) => x._id === id); return w ? ok(warehouseStats(w)) : fail('Warehouse not found', 404); },
  create: (d) => {
    const w = { _id: newId('wh'), code: `WH-${warehouses.length + 1}`, capacity: 1000, ...d, capacity: Number(d.capacity) || 1000, isActive: true, createdAt: new Date().toISOString() };
    warehouses.push(w);
    return ok(clone(w));
  },
  update: (id, d) => { const w = warehouses.find((x) => x._id === id); if (!w) return fail('Warehouse not found', 404); Object.assign(w, d, { capacity: Number(d.capacity) || w.capacity }); return ok(clone(w)); },
  delete: (id) => { const w = warehouses.find((x) => x._id === id); if (w) w.isActive = false; return ok(null, { message: 'Warehouse deactivated' }); },
};

// ─── Locations ────────────────────────────────────────────────────────────────
const locations = [];
export const locationsApi = {
  getAll: () => ok(clone(locations)),
  create: (d) => { const l = { _id: newId('loc'), ...d }; locations.push(l); return ok(l); },
  update: (id, d) => { const l = locations.find((x) => x._id === id); if (l) Object.assign(l, d); return ok(clone(l)); },
  delete: (id) => { const i = locations.findIndex((x) => x._id === id); if (i >= 0) locations.splice(i, 1); return ok(null); },
};

// ─── Suppliers & Customers ────────────────────────────────────────────────────
const partyApi = (list, prefix, label) => ({
  getAll: (params = {}) => {
    let l = list.filter((x) => x.isActive);
    if (params.search) { const s = params.search.toLowerCase(); l = l.filter((x) => x.name.toLowerCase().includes(s)); }
    return respond(paginate(l, params));
  },
  getById: (id) => { const x = list.find((p) => p._id === id); return x ? ok(clone(x)) : fail(`${label} not found`, 404); },
  create: (d) => { const x = { _id: newId(prefix), ...d, isActive: true, outstandingBalance: 0, createdAt: new Date().toISOString() }; list.unshift(x); return ok(clone(x)); },
  update: (id, d) => { const x = list.find((p) => p._id === id); if (!x) return fail(`${label} not found`, 404); Object.assign(x, d); return ok(clone(x)); },
  delete: (id) => { const x = list.find((p) => p._id === id); if (x) x.isActive = false; return ok(null, { message: `${label} removed` }); },
});

export const suppliersApi = partyApi(suppliers, 's', 'Supplier');
export const customersApi = partyApi(customers, 'c', 'Customer');

// ─── Returns ─────────────────────────────────────────────────────────────────
export const returnsApi = {
  getAll: (params = {}) => respond(paginate(movements.filter((m) => m.type === 'return'), params)),
  create: (d) => recordMovement('return', d),
};

// ─── Audits ───────────────────────────────────────────────────────────────────
export const auditsApi = {
  getAll: (params = {}) => respond(paginate(audits, params)),
  start: (d) => {
    if (!d.warehouseId) return fail('Select a warehouse');
    const items = products.filter((p) => p.isActive && p.warehouseStock.some((w) => w.warehouse._id === d.warehouseId))
      .map((p) => ({ product: productRef(p._id), expectedQty: p.warehouseStock.find((w) => w.warehouse._id === d.warehouseId).quantity }));
    const a = { _id: newId('aud'), auditName: d.auditName || `Audit – ${whRef(d.warehouseId)?.name}`, warehouse: whRef(d.warehouseId), startedBy: userRef(currentUser()._id), startedAt: new Date().toISOString(), status: 'in_progress', notes: d.notes, items };
    audits.unshift(a);
    return ok(clone(a));
  },
  updateItem: (id, productId, d) => {
    const a = audits.find((x) => x._id === id);
    const it = a?.items.find((i) => i.product?._id === productId);
    if (it) { it.countedQty = Number(d.actualQty ?? d.countedQty); it.discrepancy = it.countedQty - it.expectedQty; }
    return ok(clone(a));
  },
  complete: (id) => {
    const a = audits.find((x) => x._id === id);
    if (!a) return fail('Audit not found', 404);
    a.items.forEach((i) => { if (i.countedQty === undefined) { i.countedQty = i.expectedQty; i.discrepancy = 0; } });
    Object.assign(a, { status: 'completed', completedAt: new Date().toISOString(), completedBy: userRef(currentUser()._id) });
    return ok(clone(a));
  },
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: () => {
    const live = products.filter((p) => p.isActive);
    const today = dateStr(new Date());
    const todays = movements.filter((m) => dateStr(m.createdAt) === today);
    const sum = (arr) => arr.reduce((s, m) => s + m.quantity, 0);
    const movementTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = dateStr(Date.now() - i * 86400000);
      ['incoming', 'outgoing'].forEach((type) => {
        const real = sum(movements.filter((m) => m.type === type && dateStr(m.createdAt) === d));
        movementTrend.push({ _id: { date: d, type }, total: real || (type === 'incoming' ? 6 + ((i * 7) % 13) : 4 + ((i * 5) % 9)) });
      });
    }
    const cats = {};
    live.forEach((p) => { cats[p.category] = cats[p.category] || { _id: p.category, total: 0, count: 0 }; cats[p.category].total += p.currentStock; cats[p.category].count++; });
    return ok({
      kpis: {
        totalProducts: live.length,
        totalStock: live.reduce((s, p) => s + p.currentStock, 0),
        todayIncoming: sum(todays.filter((m) => m.type === 'incoming')),
        todayOutgoing: sum(todays.filter((m) => m.type === 'outgoing')),
        lowStockItems: live.filter((p) => p.currentStock <= p.minStockLevel).length,
        damagedItems: sum(movements.filter((m) => m.type === 'damaged')),
        pendingApprovals: adjustments.filter((a) => a.status === 'pending').length,
        activeWarehouses: warehouses.filter((w) => w.isActive).length,
      },
      charts: {
        movementTrend,
        warehouseStock: warehouses.filter((w) => w.isActive).map((w) => ({ _id: w._id, name: w.name, total: warehouseStats(w).totalStock })),
        categoryStock: Object.values(cats).sort((a, b) => b.total - a.total),
      },
    });
  },
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportsApi = {
  get: (type, params) => ok(buildReport(type, params), { type }),
  exportCSV: (type, params) => new Promise((resolve) => setTimeout(() => resolve({ data: toCSV(buildReport(type, params)) }), LATENCY)),
};

// ─── Attendance ───────────────────────────────────────────────────────────────
const todayKey = () => dateStr(new Date());
const populateAtt = (r) => ({ ...clone(r), employee: userRef(r.employee) });

export const attendanceApi = {
  punchIn: (d = {}) => {
    const me = currentUser();
    if (attendance.some((r) => r.employee === me._id && r.date === todayKey())) return fail('Already punched in today');
    const t = new Date();
    const late = t.getHours() > 10 || (t.getHours() === 10 && t.getMinutes() > 15);
    const r = { _id: newId('att'), employee: me._id, date: todayKey(), punchInTime: t.toISOString(), punchInLocation: { lat: d.lat, lng: d.lng, address: d.address }, status: late ? 'late' : 'present', isLate: late, lateByMinutes: late ? 20 : 0, totalHours: 0, shiftStandardHours: 8 };
    attendance.push(r);
    return ok(populateAtt(r), { message: late ? 'Punched in (marked late)' : 'Punched in successfully!' });
  },
  punchOut: (d = {}) => {
    const me = currentUser();
    const r = attendance.find((x) => x.employee === me._id && x.date === todayKey());
    if (!r) return fail('No punch-in found for today');
    if (r.punchOutTime) return fail('Already punched out today');
    r.punchOutTime = new Date().toISOString();
    r.punchOutLocation = { lat: d.lat, lng: d.lng, address: d.address };
    r.totalHours = Math.round(((new Date(r.punchOutTime) - new Date(r.punchInTime)) / 3600000) * 100) / 100;
    r.shortfallHours = Math.max(0, Math.round((8 - r.totalHours) * 100) / 100);
    r.overtimeHours = Math.max(0, Math.round((r.totalHours - 8) * 100) / 100);
    return ok(populateAtt(r), { message: 'Punched out successfully' });
  },
  getMyAttendance: (params = {}) => {
    const me = currentUser();
    let recs = attendance.filter((r) => r.employee === me._id);
    if (params.month && params.year) { const pre = `${params.year}-${String(params.month).padStart(2, '0')}`; recs = recs.filter((r) => r.date.startsWith(pre)); }
    recs = [...recs].sort((a, b) => b.date.localeCompare(a.date));
    const r2 = (n) => parseFloat(n.toFixed(2));
    const summary = {
      present: recs.filter((r) => ['present', 'late'].includes(r.status)).length,
      late: recs.filter((r) => r.status === 'late').length,
      absent: recs.filter((r) => r.status === 'absent').length,
      halfDay: recs.filter((r) => r.status === 'half_day').length,
      paidLeave: recs.filter((r) => r.status === 'leave' && r.leaveType === 'paid').length,
      unpaidLeave: recs.filter((r) => r.status === 'leave' && r.leaveType !== 'paid').length,
      totalHours: r2(recs.reduce((s, r) => s + (r.totalHours || 0), 0)),
      totalShortfallHours: r2(recs.reduce((s, r) => s + (r.shortfallHours || 0), 0)),
      totalOvertimeHours: r2(recs.reduce((s, r) => s + (r.overtimeHours || 0), 0)),
    };
    return ok(recs.map(populateAtt), { summary });
  },
  getTeamAttendance: (params = {}) => {
    const date = params.date || todayKey();
    const data = users.filter((u) => u.isActive).map((u) => {
      const rec = attendance.find((r) => r.employee === u._id && r.date === date);
      return { employee: { _id: u._id, name: u.name, designation: u.designation, role: u.role }, attendance: rec ? clone(rec) : null, status: rec ? rec.status : 'absent' };
    });
    return ok(data, { date });
  },
  markManual: (d = {}) => {
    const date = d.date || todayKey();
    let r = attendance.find((x) => x.employee === d.employeeId && x.date === date);
    if (!r) { r = { _id: newId('att'), employee: d.employeeId, date, totalHours: 0 }; attendance.push(r); }
    Object.assign(r, { status: d.status || 'present', notes: d.notes, markedManuallyBy: currentUser()._id });
    return ok(populateAtt(r));
  },
};

// ─── Salary ───────────────────────────────────────────────────────────────────
const sortSlips = (l) => [...l].sort((a, b) => (b.year - a.year) || (b.month - a.month) || a.employee.name.localeCompare(b.employee.name));

export const salaryApi = {
  getAll: (params = {}) => {
    let l = salarySlips;
    if (params.month) l = l.filter((s) => s.month === Number(params.month));
    if (params.year) l = l.filter((s) => s.year === Number(params.year));
    return ok(clone(sortSlips(l)));
  },
  getMine: () => ok(clone(sortSlips(salarySlips.filter((s) => s.employee._id === currentUser()._id)))),
  generate: (d = {}) => {
    const u = users.find((x) => x._id === d.employeeId);
    if (!u) return fail('Employee not found', 404);
    const month = Number(d.month), year = Number(d.year);
    if (salarySlips.some((s) => s.employee._id === u._id && s.month === month && s.year === year)) return fail('Slip already generated for this period');
    const slip = computeSlip(u, month, year, Number(d.bonus) || 0, d.overtime ?? null, currentUser()._id);
    salarySlips.push(slip);
    return ok(clone(slip));
  },
  bulkGenerate: (d = {}) => {
    const month = Number(d.month), year = Number(d.year);
    const results = users.filter((u) => u.isActive).map((u) => {
      if (salarySlips.some((s) => s.employee._id === u._id && s.month === month && s.year === year)) return { employee: u.name, status: 'skipped' };
      salarySlips.push(computeSlip(u, month, year, 0, null, currentUser()._id));
      return { employee: u.name, status: 'generated' };
    });
    return ok(results);
  },
  markPaid: (id) => {
    const s = salarySlips.find((x) => x._id === id);
    if (!s) return fail('Slip not found', 404);
    Object.assign(s, { status: 'paid', paidAt: new Date().toISOString() });
    return ok(clone(s));
  },
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (params = {}) => {
    const unreadOnly = params.unreadOnly === true || params.unreadOnly === 'true';
    const l = unreadOnly ? notifications.filter((n) => !n.isRead) : notifications;
    return ok(clone(l), { unreadCount: notifications.filter((n) => !n.isRead).length });
  },
  markRead: (id) => { const n = notifications.find((x) => x._id === id); if (n) Object.assign(n, { isRead: true, readAt: new Date().toISOString() }); return ok(clone(n)); },
  markAllRead: () => { notifications.forEach((n) => { n.isRead = true; }); return ok(null, { message: 'All notifications marked as read' }); },
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params = {}) => {
    let l = users;
    if (params.isActive === 'true') l = l.filter((u) => u.isActive);
    if (params.role) l = l.filter((u) => u.role === params.role);
    return respond(paginate(l, { ...params, limit: params.limit || l.length }));
  },
  getById: (id) => { const u = users.find((x) => x._id === id); return u ? ok(clone(u)) : fail('User not found', 404); },
  create: (d = {}) => {
    if (users.some((u) => u.email.toLowerCase() === String(d.email).toLowerCase())) return fail('Email already registered');
    const { password, ...rest } = d;
    const u = { _id: newId('u'), ...rest, assignedWarehouse: d.assignedWarehouse ? whRef(d.assignedWarehouse) : null, isActive: true, createdAt: new Date().toISOString() };
    users.push(u);
    return ok(clone(u));
  },
  update: (id, d = {}) => {
    const u = users.find((x) => x._id === id);
    if (!u) return fail('User not found', 404);
    Object.assign(u, d, { assignedWarehouse: d.assignedWarehouse ? whRef(d.assignedWarehouse) : u.assignedWarehouse });
    return ok(clone(u));
  },
  toggleActive: (id) => { const u = users.find((x) => x._id === id); if (u) u.isActive = !u.isActive; return ok(clone(u)); },
};

// ─── Activity Log ─────────────────────────────────────────────────────────────
export const activityApi = {
  getAll: (params = {}) => respond(paginate(movements.slice(0, 20).map((m) => ({ _id: m._id, user: m.performedBy, action: 'CREATE', module: 'StockMovement', description: `${m.type} · ${m.quantity} × ${m.product?.name}`, createdAt: m.createdAt })), params)),
};

// ─── Dispatch Goals & Timeline ────────────────────────────────────────────────
export const goalsApi = {
  getAll: (params = {}) => {
    const scope = visibleGoals();
    let l = scope;
    if (params.status && params.status !== 'all') l = l.filter((g) => g.status === params.status);
    if (params.priority && params.priority !== 'all') l = l.filter((g) => g.priority === params.priority);
    if (params.warehouse && params.warehouse !== 'all') l = l.filter((g) => g.warehouse?._id === params.warehouse);
    if (params.workerId) l = l.filter((g) => g.assignedWorkers.some((w) => w._id === params.workerId));
    if (params.search) {
      const s = params.search.toLowerCase();
      l = l.filter((g) => [g.title, g.product?.name, g.product?.sku, g.customer?.name, g.warehouse?.name, g.trackingNumber].some((v) => v?.toLowerCase().includes(s)));
    }
    let enriched = [...l].sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).map(enrichGoal);
    if (params.urgentOnly === 'true' || params.urgentOnly === true) enriched = enriched.filter((g) => g.isUrgentAlert);
    const all = scope.map(enrichGoal);
    const count = (st) => all.filter((g) => g.status === st).length;
    const stats = {
      total: all.length, pending: count('pending'), ready_to_dispatch: count('ready_to_dispatch'), dispatched: count('dispatched'),
      delivered: count('delivered'), cancelled: count('cancelled'),
      urgentAlerts: all.filter((g) => g.isUrgentAlert).length, overdue: all.filter((g) => g.isOverdue).length, dueSoon: all.filter((g) => g.isDueSoon).length,
    };
    return ok(enriched, { stats });
  },
  getAlerts: () => {
    const alerts = visibleGoals().filter((g) => ['pending', 'ready_to_dispatch'].includes(g.status)).map(enrichGoal).filter((g) => g.isUrgentAlert);
    return ok(alerts, { count: alerts.length });
  },
  getById: (id) => { const g = goals.find((x) => x._id === id); return g ? ok(enrichGoal(g)) : fail('Goal not found', 404); },
  create: (d = {}) => {
    if (!d.productId || !d.customerId || !d.warehouseId) return fail('Product, customer and warehouse are required');
    const me = currentUser();
    const g = {
      _id: newId('g'), title: d.title || 'Dispatch goal', quantity: Number(d.quantity) || 1, priority: d.priority || 'normal', status: 'pending',
      deadline: d.deadline || new Date(Date.now() + 48 * 3600000).toISOString(),
      product: productRef(d.productId), customer: cRef(d.customerId), warehouse: whRef(d.warehouseId),
      assignedWorkers: (d.assignedWorkerIds || []).map(userRef).filter(Boolean), assignedBy: userRef(me._id), notes: d.notes || '',
      courierName: '', trackingNumber: '',
      statusTimeline: [{ _id: newId('tl'), status: 'pending', changedBy: userRef(me._id), timestamp: new Date().toISOString(), note: 'Goal created' }],
      createdAt: new Date().toISOString(),
    };
    goals.unshift(g);
    notify('goal_assigned', 'New dispatch goal assigned', `${g.quantity} × ${g.product?.name} for ${g.customer?.name}.`);
    return ok(enrichGoal(g), { message: 'Goal created' });
  },
  updateStatus: (id, d = {}) => {
    const g = goals.find((x) => x._id === id);
    if (!g) return fail('Goal not found', 404);
    if (!d.status) return fail('Status is required');
    if (d.status === 'dispatched' && g.status !== 'dispatched') {
      const p = products.find((x) => x._id === g.product?._id);
      if (p) { adjustStock(p._id, g.warehouse?._id, -g.quantity); movements.unshift(buildMovement({ type: 'outgoing', productId: p._id, quantity: g.quantity, fromWarehouseId: g.warehouse?._id, customerId: g.customer?._id, performedById: currentUser()._id, referenceNo: `GOAL-${g._id.slice(-4).toUpperCase()}` })); }
    }
    g.status = d.status;
    if (d.courierName) g.courierName = d.courierName;
    if (d.trackingNumber) g.trackingNumber = d.trackingNumber;
    g.statusTimeline.push({ _id: newId('tl'), status: d.status, changedBy: userRef(currentUser()._id), timestamp: new Date().toISOString(), note: d.note || '' });
    return ok(enrichGoal(g), { message: 'Status updated' });
  },
  update: (id, d = {}) => { const g = goals.find((x) => x._id === id); if (!g) return fail('Goal not found', 404); Object.assign(g, d); return ok(enrichGoal(g)); },
  delete: (id) => { const i = goals.findIndex((x) => x._id === id); if (i >= 0) goals.splice(i, 1); return ok(null, { message: 'Goal deleted successfully' }); },
};

export default {};
