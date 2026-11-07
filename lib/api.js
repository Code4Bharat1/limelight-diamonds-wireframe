// ─────────────────────────────────────────────────────────────────────────────
// MOCK API — Limelight Diamonds Warehouse & Store ERP Platform.
// Endpoints wired to in-memory mockDb with full business logic.
// ─────────────────────────────────────────────────────────────────────────────

import {
  warehouses,
  stores,
  users,
  suppliers,
  customers,
  products,
  movements,
  adjustments,
  audits,
  storeRequests,
  dispatches,
  storeConsumptions,
  damageClaims,
  storeReturns,
  posTerminals,
  posBOMMappings,
  posSalesFeed,
  activityLogs,
  notifications,
  newId,
  dateStr,
  buildMovement,
  productRef,
  userRef,
  whRef,
  sRef,
  cRef,
  logActivity,
} from './mockDb';

const LATENCY = 150;

const respond = (body) => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true, ...body } }), LATENCY));
const ok = (data, extra = {}) => {
  // If data is a paginated wrapper ({ data: [...], total, page, pages }), unwrap it so res.data.data is the array
  if (data && typeof data === 'object' && Array.isArray(data.data) && 'total' in data) {
    return respond({ ...data, ...extra });
  }
  return respond({ data, ...extra });
};
const fail = (message, status = 400) =>
  new Promise((_, reject) =>
    setTimeout(() => reject({ message, response: { status, data: { success: false, message } } }), LATENCY)
  );

const clone = (x) => JSON.parse(JSON.stringify(x));
const toObj = (data) =>
  typeof FormData !== 'undefined' && data instanceof FormData ? Object.fromEntries(data.entries()) : { ...(data || {}) };

const paginate = (list, params = {}) => {
  const limit = Number(params.limit) || list.length || 1;
  const page = Number(params.page) || 1;
  return {
    data: clone(list.slice((page - 1) * limit, page * limit)),
    total: list.length,
    page,
    pages: Math.max(1, Math.ceil(list.length / limit)),
  };
};

function currentUser() {
  if (typeof window === 'undefined') return users[0];
  try {
    const u = JSON.parse(localStorage.getItem('de_user') || 'null');
    return users.find((x) => x._id === u?._id) || users[0];
  } catch {
    return users[0];
  }
}

async function ensureQR(list) {
  const pending = list.filter((p) => p.qrCodeValue && !p.qrCodeImage);
  if (!pending.length || typeof window === 'undefined') return;
  try {
    const QR = (await import('qrcode')).default;
    await Promise.all(
      pending.map(async (p) => {
        p.qrCodeImage = await QR.toDataURL(p.qrCodeValue, {
          width: 240,
          margin: 1,
          color: { dark: '#1b3a1a', light: '#ffffff' },
        });
      })
    );
  } catch {}
}

function adjustStock(productId, warehouseId, delta, storeId = null) {
  const p = products.find((x) => x._id === productId);
  if (!p) return;
  p.currentStock = Math.max(0, p.currentStock + delta);

  if (storeId) {
    let ss = p.storeStock.find((s) => s.store._id === storeId);
    if (!ss) {
      const st = stores.find((x) => x._id === storeId);
      ss = { store: { _id: storeId, name: st?.name, code: st?.code, city: st?.city }, quantity: 0 };
      p.storeStock.push(ss);
    }
    ss.quantity = Math.max(0, ss.quantity + delta);
    p.storeTotalStock = p.storeStock.reduce((acc, curr) => acc + curr.quantity, 0);
  } else if (warehouseId) {
    let ws = p.warehouseStock.find((w) => w.warehouse._id === warehouseId);
    if (!ws) {
      ws = { warehouse: { _id: warehouseId, name: whRef(warehouseId)?.name }, quantity: 0 };
      p.warehouseStock.push(ws);
    }
    ws.quantity = Math.max(0, ws.quantity + delta);
    p.warehouseTotalStock = p.warehouseStock.reduce((acc, curr) => acc + curr.quantity, 0);
  }
}

function notify(type, title, message, priority = 'medium') {
  notifications.unshift({
    _id: newId('n'),
    type,
    title,
    message,
    priority,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
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
    const available = fromId ? ws?.quantity || 0 : p.warehouseTotalStock;
    if (quantity > available) return fail(`Insufficient stock in selected warehouse. Available: ${available} ${p.unit}`);
    if (type === 'transfer' && d.fromWarehouseId === d.toWarehouseId) return fail('Source and destination warehouses must differ');
  }

  const isIn = ['incoming', 'return'].includes(type);
  const mv = buildMovement({
    type,
    productId: d.productId,
    quantity,
    fromWarehouseId: type === 'transfer' ? d.fromWarehouseId : isIn ? null : d.warehouseId,
    toWarehouseId: type === 'transfer' ? d.toWarehouseId : isIn ? d.warehouseId : null,
    storeId: d.storeId,
    supplierId: d.supplierId,
    customerId: d.customerId,
    performedById: me._id,
    reason: d.reason,
    notes: d.notes,
    referenceNo: d.referenceNo,
    unitPrice: d.unitPrice,
    disposition: d.disposition,
    source: d.source,
  });
  movements.unshift(mv);

  if (type === 'transfer') {
    adjustStock(d.productId, d.fromWarehouseId, -quantity);
    adjustStock(d.productId, d.toWarehouseId, quantity);
  } else if (type === 'return') {
    if (d.disposition !== 'write_off') adjustStock(d.productId, d.warehouseId, quantity);
  } else {
    adjustStock(d.productId, d.warehouseId, isIn ? quantity : -quantity, d.storeId);
  }

  logActivity(
    `STOCK_${type.toUpperCase()}`,
    `${type.toUpperCase()} recorded: ${quantity} × ${p.name} (${mv.referenceNo || 'Direct Entry'})`,
    'StockMovement',
    mv._id,
    me
  );

  if (p.currentStock <= p.minStockLevel) {
    notify('low_stock', `Low stock: ${p.name}`, `Only ${p.currentStock} ${p.unit} remaining (min ${p.minStockLevel}).`, 'high');
  }
  return ok(clone(mv), { message: 'Recorded successfully' });
}

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authApi = {
  login: ({ email, password } = {}) => {
    const targetEmail = String(email || '').trim().toLowerCase();
    const u = users.find((x) => x.email.toLowerCase() === targetEmail);
    if (!u || !password) return fail('Invalid credentials. Select one of the quick demo accounts.', 401);
    if (!u.isActive) return fail('Account is inactive. Contact Super Admin.', 403);
    const token = `tok_lld_${u._id}_${Date.now()}`;
    logActivity('USER_LOGIN', `User ${u.name} logged in as ${u.role}`, 'User', u._id, u);
    return ok({ token, ...clone(u) });
  },
  getMe: () => ok(clone(currentUser())),
  updateProfile: (data) => {
    const me = currentUser();
    Object.assign(me, data);
    return ok(clone(me));
  },
  changePassword: () => ok({ message: 'Password updated successfully' }),
};

// ─── Dashboard API ───────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: () => {
    const live = products.filter((p) => p.isActive);
    const today = dateStr(new Date());
    const todays = movements.filter((m) => dateStr(m.createdAt) === today);
    const sum = (arr) => arr.reduce((s, m) => s + m.quantity, 0);

    // 7-day movement trend
    const movementTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = dateStr(Date.now() - i * 86400000);
      ['incoming', 'outgoing'].forEach((type) => {
        const real = sum(movements.filter((m) => m.type === type && dateStr(m.createdAt) === d));
        movementTrend.push({
          _id: { date: d, type },
          total: real || (type === 'incoming' ? 18 + ((i * 7) % 25) : 14 + ((i * 9) % 20)),
        });
      });
    }

    // Category stock distribution
    const cats = {};
    live.forEach((p) => {
      cats[p.category] = cats[p.category] || { _id: p.category, total: 0, count: 0 };
      cats[p.category].total += p.currentStock;
      cats[p.category].count++;
    });

    // Outgoing broken down by destination store
    const outgoingByStore = stores.map((s) => {
      const outQty = sum(movements.filter((m) => m.type === 'outgoing' && m.store?._id === s._id));
      return {
        storeId: s._id,
        storeName: s.name,
        code: s.code,
        city: s.city,
        totalDispatched: outQty || 20 + Math.floor(Math.random() * 30),
      };
    });

    // Damaged breakdown by source
    const damagedBySource = {
      vendor: damageClaims.filter((c) => c.source === 'vendor').reduce((s, c) => s + c.quantity, 0),
      warehouse: damageClaims.filter((c) => c.source === 'warehouse').reduce((s, c) => s + c.quantity, 0),
      transit: damageClaims.filter((c) => c.source === 'transit').reduce((s, c) => s + c.quantity, 0),
      store: damageClaims.filter((c) => c.source === 'store').reduce((s, c) => s + c.quantity, 0),
    };

    const pendingAdjustments = adjustments.filter((a) => a.status === 'pending').length;
    const pendingDamageClaims = damageClaims.filter((c) => c.status === 'pending_approval').length;
    const pendingStoreRequests = storeRequests.filter((r) => r.status === 'pending').length;
    const pendingStoreReturns = storeReturns.filter((r) => r.status === 'pending_inspection').length;
    const totalPendingApprovals = pendingAdjustments + pendingDamageClaims + pendingStoreRequests + pendingStoreReturns;

    const totalValuation = live.reduce((s, p) => s + p.currentStock * p.purchasePrice, 0);

    return ok({
      kpis: {
        totalSKUs: live.length,
        totalProducts: live.length,
        totalStock: live.reduce((s, p) => s + p.currentStock, 0),
        totalValuation,
        todayIncoming: sum(todays.filter((m) => m.type === 'incoming')) || 190,
        todayOutgoing: sum(todays.filter((m) => m.type === 'outgoing')) || 56,
        lowStockItems: live.filter((p) => p.currentStock <= p.minStockLevel).length,
        damagedItems: damageClaims.reduce((s, c) => s + c.quantity, 0),
        damagedBySource,
        pendingApprovals: totalPendingApprovals,
        pendingBreakdown: {
          adjustments: pendingAdjustments,
          damageClaims: pendingDamageClaims,
          storeRequests: pendingStoreRequests,
          storeReturns: pendingStoreReturns,
        },
        activeWarehouses: warehouses.filter((w) => w.isActive).length,
        activeStores: stores.filter((s) => s.isActive).length,
        outgoingByStore,
      },
      charts: {
        movementTrend,
        warehouseStock: warehouses
          .filter((w) => w.isActive)
          .map((w) => ({
            _id: w._id,
            name: w.name.split('–')[0]?.replace(/\(.*\)/, '').trim(),
            total: products.reduce(
              (acc, p) => acc + (p.warehouseStock.find((x) => x.warehouse._id === w._id)?.quantity || 0),
              0
            ),
          })),
        storeStock: stores
          .filter((s) => s.isActive)
          .map((s) => ({
            _id: s._id,
            name: s.city + ' (' + s.code + ')',
            total: products.reduce(
              (acc, p) => acc + (p.storeStock.find((x) => x.store._id === s._id)?.quantity || 0),
              0
            ),
          })),
        categoryStock: Object.values(cats).sort((a, b) => b.total - a.total),
      },
    });
  },
};

// ─── Products & SKU API ──────────────────────────────────────────────────────
export const productsApi = {
  getAll: async (params = {}) => {
    let list = products.filter((p) => p.isActive);
    if (params.search) {
      const q = String(params.search).toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (params.category && params.category !== 'all') {
      list = list.filter((p) => p.category === params.category);
    }
    if (params.lowStock === 'true' || params.lowStock === true) {
      list = list.filter((p) => p.currentStock <= p.minStockLevel);
    }
    await ensureQR(list);
    return ok(paginate(list, params));
  },

  getById: async (id) => {
    const p = products.find((x) => x._id === id);
    if (!p) return fail('Product not found', 404);
    await ensureQR([p]);
    return ok(clone(p));
  },

  getBySKU: async (sku) => {
    const p = products.find((x) => x.sku?.toUpperCase() === String(sku || '').toUpperCase());
    if (!p) return fail('Product not found', 404);
    await ensureQR([p]);
    return ok(clone(p));
  },

  create: async (data) => {
    const d = toObj(data);
    if (!d.name || !d.sku) return fail('Name and SKU are required');
    if (products.some((x) => x.sku.toUpperCase() === d.sku.toUpperCase())) {
      return fail('A product with this SKU already exists');
    }
    const suppliersMapped = Array.isArray(d.supplierIds)
      ? d.supplierIds.map(sRef).filter(Boolean)
      : d.supplierId
      ? [sRef(d.supplierId)].filter(Boolean)
      : [];

    const newProd = {
      _id: newId('p'),
      name: d.name,
      sku: d.sku.toUpperCase(),
      category: d.category || 'Packaging',
      brand: d.brand || 'Limelight Diamonds',
      unit: d.unit || 'pcs',
      purchasePrice: Number(d.purchasePrice) || 0,
      sellingPrice: Number(d.sellingPrice) || 0,
      minStockLevel: Number(d.minStockLevel) || 50,
      reorderQty: Number(d.reorderQty) || 100,
      description: d.description || '',
      storageLocation: d.storageLocation || 'Ground Floor · Zone A',
      suppliers: suppliersMapped,
      currentStock: 0,
      warehouseTotalStock: 0,
      storeTotalStock: 0,
      trackingType: d.trackingType || 'quantity',
      qrCodeValue: `LLD-SKU-${d.sku.toUpperCase()}`,
      qrCodeImage: '',
      isActive: true,
      warehouseStock: warehouses.map((w) => ({ warehouse: { _id: w._id, name: w.name }, quantity: 0 })),
      storeStock: stores.map((s) => ({ store: { _id: s._id, name: s.name, code: s.code, city: s.city }, quantity: 0 })),
      createdAt: new Date().toISOString(),
    };
    await ensureQR([newProd]);
    products.unshift(newProd);
    logActivity('PRODUCT_CREATED', `Created new SKU: ${newProd.sku} - ${newProd.name}`, 'Product', newProd._id, currentUser());
    return ok(clone(newProd));
  },

  update: async (id, data) => {
    const p = products.find((x) => x._id === id);
    if (!p) return fail('Product not found', 404);
    const d = toObj(data);
    Object.assign(p, {
      name: d.name ?? p.name,
      category: d.category ?? p.category,
      brand: d.brand ?? p.brand,
      unit: d.unit ?? p.unit,
      purchasePrice: d.purchasePrice !== undefined ? Number(d.purchasePrice) : p.purchasePrice,
      sellingPrice: d.sellingPrice !== undefined ? Number(d.sellingPrice) : p.sellingPrice,
      minStockLevel: d.minStockLevel !== undefined ? Number(d.minStockLevel) : p.minStockLevel,
      reorderQty: d.reorderQty !== undefined ? Number(d.reorderQty) : p.reorderQty,
      description: d.description ?? p.description,
      storageLocation: d.storageLocation ?? p.storageLocation,
      isActive: d.isActive !== undefined ? Boolean(d.isActive) : p.isActive,
    });
    if (d.supplierIds && Array.isArray(d.supplierIds)) {
      p.suppliers = d.supplierIds.map(sRef).filter(Boolean);
    }
    logActivity('PRODUCT_UPDATED', `Updated product details for ${p.sku}`, 'Product', p._id, currentUser());
    return ok(clone(p));
  },

  delete: async (id) => {
    const p = products.find((x) => x._id === id);
    if (!p) return fail('Product not found', 404);
    p.isActive = false;
    logActivity('PRODUCT_DEACTIVATED', `Deactivated product ${p.sku}`, 'Product', p._id, currentUser());
    return ok({ message: 'Product deactivated' });
  },

  getMovements: (id, params = {}) => {
    const list = movements.filter((m) => m.product?._id === id);
    return ok(paginate(list, params));
  },

  // SKU Auto-Generator helper
  generateSKU: (category = 'Packaging', name = '') => {
    const catPrefixes = {
      Packaging: 'PKG',
      'Display Items': 'DSP',
      'Gifts & Collateral': 'GFT',
      'Bags & Pouches': 'BAG',
      'Stationery & Consumables': 'STN',
      'Props & VM': 'PRP',
    };
    const prefix = catPrefixes[category] || 'SKU';
    const words = name.trim().split(/\s+/).slice(0, 2);
    const sub = words.map((w) => w.slice(0, 3).toUpperCase()).join('-') || 'ITM';
    const num = Math.floor(100 + Math.random() * 900);
    return ok({ sku: `${prefix}-${sub}-${num}` });
  },
};

// ─── Warehouses API (with Floor Management) ──────────────────────────────────
export const warehousesApi = {
  getAll: () => {
    const enriched = warehouses
      .filter((w) => w.isActive)
      .map((w) => {
        const totalStock = products.reduce(
          (acc, p) => acc + (p.warehouseStock.find((x) => x.warehouse._id === w._id)?.quantity || 0),
          0
        );
        const lowStockCount = products.filter((p) => {
          const q = p.warehouseStock.find((x) => x.warehouse._id === w._id)?.quantity || 0;
          return q <= Math.ceil(p.minStockLevel / 3);
        }).length;
        return {
          ...clone(w),
          totalStock,
          lowStockCount,
          capacityUsed: Math.min(100, Math.round((totalStock / (w.capacity || 1)) * 100)),
        };
      });
    return ok(enriched);
  },

  getById: (id) => {
    const w = warehouses.find((x) => x._id === id);
    if (!w) return fail('Warehouse not found', 404);
    return ok(clone(w));
  },

  create: (data) => {
    const w = {
      _id: newId('wh'),
      name: data.name,
      code: data.code || `WH-${warehouses.length + 1}`,
      location: data.location || '',
      address: data.address || '',
      capacity: Number(data.capacity) || 10000,
      contactPhone: data.contactPhone || '',
      notes: data.notes || '',
      isActive: true,
      floors: [
        {
          id: newId('fl'),
          name: 'Ground Floor',
          description: 'Main Storage & Dispatch',
          zones: [{ id: newId('zn'), name: 'Zone A', racks: ['R-01', 'R-02'] }],
        },
      ],
      createdAt: new Date().toISOString(),
    };
    warehouses.push(w);
    products.forEach((p) => p.warehouseStock.push({ warehouse: { _id: w._id, name: w.name }, quantity: 0 }));
    logActivity('WAREHOUSE_CREATED', `Added new warehouse facility: ${w.name}`, 'Warehouse', w._id, currentUser());
    return ok(clone(w));
  },

  update: (id, data) => {
    const w = warehouses.find((x) => x._id === id);
    if (!w) return fail('Warehouse not found', 404);
    Object.assign(w, data);
    return ok(clone(w));
  },

  delete: (id) => {
    const w = warehouses.find((x) => x._id === id);
    if (!w) return fail('Warehouse not found', 404);
    w.isActive = false;
    return ok({ message: 'Warehouse deactivated' });
  },

  // Floor management
  addFloor: (whId, floorData) => {
    const w = warehouses.find((x) => x._id === whId);
    if (!w) return fail('Warehouse not found', 404);
    const newFloor = {
      id: newId('fl'),
      name: floorData.name || 'New Floor',
      description: floorData.description || '',
      zones: floorData.zones || [{ id: newId('zn'), name: 'Zone A', racks: ['R-01'] }],
    };
    w.floors = w.floors || [];
    w.floors.push(newFloor);
    logActivity('FLOOR_ADDED', `Added ${newFloor.name} to warehouse ${w.name}`, 'Warehouse', w._id, currentUser());
    return ok(clone(w));
  },

  deleteFloor: (whId, floorId) => {
    const w = warehouses.find((x) => x._id === whId);
    if (!w) return fail('Warehouse not found', 404);
    w.floors = (w.floors || []).filter((f) => f.id !== floorId);
    return ok(clone(w));
  },
};

// ─── Store Management API (Complete Store Engine) ────────────────────────────
export const storesApi = {
  getAll: () => {
    const enriched = stores
      .filter((s) => s.isActive)
      .map((s) => {
        const totalStock = products.reduce(
          (acc, p) => acc + (p.storeStock.find((x) => x.store._id === s._id)?.quantity || 0),
          0
        );
        const lowStockCount = products.filter((p) => {
          const q = p.storeStock.find((x) => x.store._id === s._id)?.quantity || 0;
          return q <= 10;
        }).length;
        const pendingReqs = storeRequests.filter((r) => r.store?._id === s._id && r.status === 'pending').length;
        return {
          ...clone(s),
          totalStock,
          lowStockCount,
          pendingRequestsCount: pendingReqs,
          capacityUsed: Math.min(100, Math.round((totalStock / (s.capacity || 1)) * 100)),
        };
      });
    return ok(enriched);
  },

  getById: (id) => {
    const s = stores.find((x) => x._id === id);
    if (!s) return fail('Store not found', 404);
    const storeStock = products.map((p) => ({
      product: productRef(p._id),
      quantity: p.storeStock.find((x) => x.store._id === id)?.quantity || 0,
      minThreshold: Math.ceil(p.minStockLevel / 5),
    }));
    return ok({ ...clone(s), stockItems: storeStock });
  },

  create: (data) => {
    const s = {
      _id: newId('str'),
      name: data.name,
      code: data.code || `STR-${stores.length + 1}`,
      city: data.city || '',
      address: data.address || '',
      contactPerson: data.contactPerson || '',
      phone: data.phone || '',
      email: data.email || '',
      posTerminalId: `POS-${(data.city || 'STR').slice(0, 3).toUpperCase()}-01`,
      posSyncStatus: 'online',
      capacity: Number(data.capacity) || 2000,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    stores.push(s);
    products.forEach((p) =>
      p.storeStock.push({ store: { _id: s._id, name: s.name, code: s.code, city: s.city }, quantity: 0 })
    );
    logActivity('STORE_CREATED', `Registered retail store: ${s.name}`, 'Store', s._id, currentUser());
    return ok(clone(s));
  },

  update: (id, data) => {
    const s = stores.find((x) => x._id === id);
    if (!s) return fail('Store not found', 404);
    Object.assign(s, data);
    return ok(clone(s));
  },

  delete: (id) => {
    const s = stores.find((x) => x._id === id);
    if (!s) return fail('Store not found', 404);
    s.isActive = false;
    return ok({ message: 'Store deactivated' });
  },

  // Store Stock Requests
  getRequests: (params = {}) => {
    let list = storeRequests;
    if (params.storeId) list = list.filter((r) => r.store?._id === params.storeId);
    if (params.status && params.status !== 'all') list = list.filter((r) => r.status === params.status);
    return ok(paginate(list, params));
  },

  createRequest: (data) => {
    const me = currentUser();
    const store = stores.find((s) => s._id === data.storeId) || me.assignedStore || stores[0];
    const items = (data.items || []).map((i) => ({
      product: productRef(i.productId),
      requestedQty: Number(i.quantity) || 1,
      approvedQty: Number(i.quantity) || 1,
    }));
    const req = {
      _id: newId('sreq'),
      requestNumber: `SRQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      store: storeRef(store._id),
      destinationWarehouse: whRef(data.warehouseId || 'wh_1'),
      items,
      priority: data.priority || 'normal',
      requiredByDate: data.requiredByDate || ahead(48),
      status: 'pending',
      notes: data.notes || '',
      requestedBy: userRef(me._id),
      createdAt: new Date().toISOString(),
    };
    storeRequests.unshift(req);
    notify(
      'pending_approval',
      `New Store Request: ${store.name}`,
      `${me.name} requested ${items.reduce((s, i) => s + i.requestedQty, 0)} items (${req.requestNumber}).`,
      req.priority === 'urgent' ? 'high' : 'medium'
    );
    logActivity('STORE_REQUEST_CREATED', `Store request ${req.requestNumber} logged by ${me.name}`, 'StoreRequest', req._id, me);
    return ok(clone(req));
  },

  updateRequestStatus: (id, { status, approvedQty = null, notes = '' }) => {
    const req = storeRequests.find((r) => r._id === id);
    if (!req) return fail('Store request not found', 404);
    const me = currentUser();
    req.status = status;
    if (status === 'approved') req.approvedBy = userRef(me._id);
    if (notes) req.notes = (req.notes ? req.notes + ' | ' : '') + notes;

    logActivity('STORE_REQUEST_STATUS', `Request ${req.requestNumber} marked as ${status}`, 'StoreRequest', req._id, me);
    return ok(clone(req));
  },

  // Store Daily Consumption
  getConsumptions: (params = {}) => {
    let list = storeConsumptions;
    if (params.storeId) list = list.filter((c) => c.store?._id === params.storeId);
    return ok(paginate(list, params));
  },

  logConsumption: (data) => {
    const me = currentUser();
    const store = stores.find((s) => s._id === data.storeId) || me.assignedStore || stores[0];
    const items = (data.items || []).map((i) => {
      const p = productRef(i.productId);
      const qty = Number(i.quantity) || 1;
      adjustStock(i.productId, null, -qty, store._id);
      movements.unshift(
        buildMovement({
          type: 'consumption',
          productId: i.productId,
          quantity: qty,
          storeId: store._id,
          performedById: me._id,
          reason: i.purpose || data.purpose || 'Store Showroom Usage',
          notes: data.notes || '',
          referenceNo: `CON-${store.code}-${Math.floor(100 + Math.random() * 900)}`,
        })
      );
      return { product: p, quantity: qty, purpose: i.purpose || data.purpose || 'Daily Store Usage' };
    });

    const con = {
      _id: newId('con'),
      store: storeRef(store._id),
      date: dateStr(new Date()),
      items,
      posTransactionCount: data.posTransactionCount || 0,
      notes: data.notes || '',
      loggedBy: userRef(me._id),
      createdAt: new Date().toISOString(),
    };
    storeConsumptions.unshift(con);
    logActivity('STORE_CONSUMPTION_LOGGED', `Logged consumption of ${items.length} item types at ${store.name}`, 'Consumption', con._id, me);
    return ok(clone(con));
  },

  // Store Receiving Confirmation (Dual verification upon delivery)
  confirmStoreDelivery: (dispatchId, { verifiedItems = [], discrepancyNotes = '' }) => {
    const disp = dispatches.find((d) => d._id === dispatchId);
    if (!disp) return fail('Dispatch not found', 404);
    const me = currentUser();
    const store = disp.store;

    (verifiedItems.length ? verifiedItems : disp.items).forEach((item) => {
      const pId = item.product?._id || item.productId;
      const recQty = Number(item.receivedQty ?? item.dispatchedQty ?? item.requestedQty);
      if (pId && recQty > 0) {
        adjustStock(pId, null, recQty, store._id);
      }
      if (item.transitDamagedQty > 0) {
        damageClaims.unshift({
          _id: newId('dmg'),
          claimNumber: `CLM-TRN-${Math.floor(1000 + Math.random() * 9000)}`,
          product: productRef(pId),
          quantity: item.transitDamagedQty,
          source: 'transit',
          store: storeRef(store._id),
          warehouse: disp.warehouse,
          courierName: disp.courierName,
          trackingNumber: disp.trackingNumber,
          defectType: 'Damaged in Courier Transit',
          reason: discrepancyNotes || 'Boxes crushed upon store arrival',
          status: 'pending_approval',
          disposition: 'vendor_claim',
          reportedBy: userRef(me._id),
          createdAt: new Date().toISOString(),
        });
      }
    });

    disp.status = 'delivered';
    disp.actualDeliveredDate = new Date().toISOString();
    disp.storeConfirmation = {
      isConfirmed: true,
      confirmedBy: userRef(me._id),
      confirmedAt: new Date().toISOString(),
      verifiedItems,
      remarks: discrepancyNotes || 'Store receiving verified and confirmed.',
    };
    disp.statusTimeline.push({
      status: 'delivered',
      changedBy: userRef(me._id),
      timestamp: new Date().toISOString(),
      note: `Confirmed received by store manager ${me.name}`,
    });

    notify(
      'dispatch_delivered',
      `Dispatch Received at ${store.name}`,
      `Store receipt verified for ${disp.dispatchNo}. Stock added to store inventory.`,
      'medium'
    );
    logActivity('DISPATCH_RECEIVED', `Store confirmed receipt of dispatch ${disp.dispatchNo}`, 'Dispatch', disp._id, me);
    return ok(clone(disp));
  },
};

// ─── Dispatch & Transfer Management API (Enhanced Multi-SKU Goals) ───────────
export const goalsApi = {
  getAll: (params = {}) => {
    let list = dispatches;
    if (params.search) {
      const q = String(params.search).toLowerCase();
      list = list.filter((g) => g.title.toLowerCase().includes(q) || g.dispatchNo?.toLowerCase().includes(q));
    }
    if (params.status && params.status !== 'all') {
      list = list.filter((g) => g.status === params.status);
    }
    if (params.warehouse && params.warehouse !== 'all') {
      list = list.filter((g) => g.warehouse?._id === params.warehouse);
    }
    if (params.store && params.store !== 'all') {
      list = list.filter((g) => g.store?._id === params.store);
    }
    if (params.urgentOnly === 'true' || params.urgentOnly === true) {
      list = list.filter((g) => g.priority === 'urgent' || g.isOverdue);
    }

    const stats = {
      total: dispatches.length,
      pending: dispatches.filter((g) => g.status === 'pending').length,
      ready_to_dispatch: dispatches.filter((g) => g.status === 'ready_to_dispatch').length,
      dispatched: dispatches.filter((g) => g.status === 'dispatched' || g.status === 'in_transit').length,
      delivered: dispatches.filter((g) => g.status === 'delivered').length,
      urgentAlerts: dispatches.filter((g) => g.priority === 'urgent').length,
      overdue: 0,
      dueSoon: 1,
    };
    return ok(list, { stats });
  },

  getAlerts: () => {
    const count = dispatches.filter((g) => g.priority === 'urgent' && g.status !== 'delivered').length;
    return ok({ count });
  },

  create: (data) => {
    const me = currentUser();
    const destinationStore = data.storeId ? storeRef(data.storeId) : null;
    const destinationCustomer = data.customerId ? cRef(data.customerId) : null;
    const warehouse = whRef(data.warehouseId || 'wh_1');

    // Support both single product & multi-SKU items list
    let items = [];
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      items = data.items.map((it) => ({
        product: productRef(it.productId),
        requestedQty: Number(it.quantity) || 1,
        dispatchedQty: Number(it.dispatchedQty || it.quantity) || 1,
        receivedQty: null,
      }));
    } else if (data.productId) {
      items = [
        {
          product: productRef(data.productId),
          requestedQty: Number(data.quantity) || 1,
          dispatchedQty: Number(data.quantity) || 1,
          receivedQty: null,
        },
      ];
    }

    const newDispatch = {
      _id: newId('disp'),
      dispatchNo: `DSP-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: data.title || `Dispatch to ${destinationStore?.name || destinationCustomer?.name || 'Store'}`,
      destinationType: destinationStore ? 'store' : 'customer',
      store: destinationStore,
      customer: destinationCustomer,
      warehouse,
      items,
      priority: data.priority || 'normal',
      status: 'pending',
      scheduledDispatchDate: data.scheduledDispatchDate || ahead(6),
      expectedDeliveryDate: data.deadline || data.expectedDeliveryDate || ahead(24),
      courierName: data.courierName || '',
      trackingNumber: data.trackingNumber || '',
      vehicleNo: data.vehicleNo || '',
      driverName: data.driverName || '',
      assignedWorkers: (data.assignedWorkerIds || []).map(userRef).filter(Boolean),
      assignedBy: userRef(me._id),
      notes: data.notes || '',
      isPartialDispatch: Boolean(data.isPartialDispatch),
      statusTimeline: [
        { status: 'pending', changedBy: userRef(me._id), timestamp: new Date().toISOString(), note: 'Dispatch consignment registered' },
      ],
      createdAt: new Date().toISOString(),
    };

    dispatches.unshift(newDispatch);
    notify('dispatch_assigned', `New Dispatch: ${newDispatch.dispatchNo}`, newDispatch.title, newDispatch.priority === 'urgent' ? 'high' : 'medium');
    logActivity('DISPATCH_CREATED', `Created dispatch ${newDispatch.dispatchNo} (${items.length} SKUs)`, 'Dispatch', newDispatch._id, me);
    return ok(clone(newDispatch));
  },

  updateStatus: (id, { status, courierName, trackingNumber, vehicleNo, note = '', isPartial = false }) => {
    const g = dispatches.find((x) => x._id === id);
    if (!g) return fail('Dispatch not found', 404);
    const me = currentUser();
    g.status = status;
    if (courierName) g.courierName = courierName;
    if (trackingNumber) g.trackingNumber = trackingNumber;
    if (vehicleNo) g.vehicleNo = vehicleNo;

    // Deduct stock from warehouse when marked dispatched
    if (status === 'dispatched') {
      g.items.forEach((it) => {
        if (it.product?._id) {
          adjustStock(it.product._id, g.warehouse?._id, -(it.dispatchedQty || it.requestedQty));
          movements.unshift(
            buildMovement({
              type: 'outgoing',
              productId: it.product._id,
              quantity: it.dispatchedQty || it.requestedQty,
              fromWarehouseId: g.warehouse?._id,
              storeId: g.store?._id,
              customerId: g.customer?._id,
              performedById: me._id,
              referenceNo: g.dispatchNo,
              notes: `Dispatched via ${g.courierName || 'Courier'}`,
            })
          );
        }
      });
      notify('dispatch_sent', `Dispatch Sent: ${g.dispatchNo}`, `Shipped to ${g.store?.name || g.customer?.name}. Courier: ${g.courierName || 'Assigned'}`, 'medium');
    }

    g.statusTimeline.push({
      status,
      changedBy: userRef(me._id),
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${status.replace(/_/g, ' ')}`,
    });
    logActivity('DISPATCH_STATUS', `Dispatch ${g.dispatchNo} moved to ${status}`, 'Dispatch', g._id, me);
    return ok(clone(g));
  },

  delete: (id) => {
    const idx = dispatches.findIndex((x) => x._id === id);
    if (idx !== -1) dispatches.splice(idx, 1);
    return ok({ message: 'Dispatch removed' });
  },
};

// ─── Damage Claims & Quality API ─────────────────────────────────────────────
export const damageApi = {
  getAll: (params = {}) => {
    let list = damageClaims;
    if (params.source && params.source !== 'all') list = list.filter((c) => c.source === params.source);
    if (params.status && params.status !== 'all') list = list.filter((c) => c.status === params.status);
    return ok(paginate(list, params));
  },

  create: (data) => {
    const me = currentUser();
    const p = productRef(data.productId);
    const qty = Number(data.quantity) || 1;
    const claim = {
      _id: newId('dmg'),
      claimNumber: `CLM-${(data.source || 'WH').toUpperCase().slice(0, 3)}-2026-${Math.floor(100 + Math.random() * 900)}`,
      product: p,
      quantity: qty,
      source: data.source || 'warehouse', // 'vendor', 'warehouse', 'transit', 'store'
      warehouse: whRef(data.warehouseId || 'wh_1'),
      store: data.storeId ? storeRef(data.storeId) : null,
      supplier: data.supplierId ? sRef(data.supplierId) : null,
      courierName: data.courierName || '',
      trackingNumber: data.trackingNumber || '',
      defectType: data.defectType || data.reason || 'Defect',
      reason: data.reason || '',
      estimatedLossValue: qty * (p?.purchasePrice || 0),
      status: 'pending_approval',
      disposition: data.source === 'vendor' ? 'vendor_claim' : 'write_off',
      reportedBy: userRef(me._id),
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };

    if (claim.source === 'vendor' && claim.supplier) {
      claim.vendorClaim = {
        claimNumber: `VC-${claim.supplier.code || 'VND'}-${Math.floor(10 + Math.random() * 90)}`,
        claimDate: new Date().toISOString(),
        claimStatus: 'claim_filed',
      };
    }

    damageClaims.unshift(claim);
    notify('pending_approval', `New Damage Claim: ${claim.claimNumber}`, `${claim.quantity} × ${p?.name} reported damaged (${claim.source}).`, 'high');
    logActivity('DAMAGE_CLAIM_LOGGED', `Reported damage claim ${claim.claimNumber} (${claim.source})`, 'DamageClaim', claim._id, me);
    return ok(clone(claim));
  },

  approve: (id, { disposition = 'write_off', comment = '' }) => {
    const c = damageClaims.find((x) => x._id === id);
    if (!c) return fail('Claim not found', 404);
    const me = currentUser();
    c.status = 'approved';
    c.disposition = disposition;
    c.approvedBy = userRef(me._id);
    c.approvedAt = new Date().toISOString();
    c.notes = (c.notes ? c.notes + ' | ' : '') + (comment || 'Approved');

    // Deduct stock upon approval
    adjustStock(c.product._id, c.warehouse?._id, -c.quantity, c.store?._id);
    movements.unshift(
      buildMovement({
        type: 'damaged',
        productId: c.product._id,
        quantity: c.quantity,
        fromWarehouseId: c.warehouse?._id,
        storeId: c.store?._id,
        supplierId: c.supplier?._id,
        performedById: me._id,
        referenceNo: c.claimNumber,
        reason: c.reason,
        source: c.source,
        disposition,
      })
    );

    logActivity('DAMAGE_CLAIM_APPROVED', `Approved damage claim ${c.claimNumber} (${disposition})`, 'DamageClaim', c._id, me);
    return ok(clone(c));
  },

  reject: (id, { comment = '' }) => {
    const c = damageClaims.find((x) => x._id === id);
    if (!c) return fail('Claim not found', 404);
    const me = currentUser();
    c.status = 'rejected';
    c.notes = (c.notes ? c.notes + ' | ' : '') + `Rejected: ${comment}`;
    logActivity('DAMAGE_CLAIM_REJECTED', `Rejected damage claim ${c.claimNumber}`, 'DamageClaim', c._id, me);
    return ok(clone(c));
  },

  getVendorClaims: () => {
    const claims = damageClaims.filter((c) => c.source === 'vendor' || c.vendorClaim);
    return ok(claims);
  },
};

// ─── Returns Management API ──────────────────────────────────────────────────
export const returnsApi = {
  getAll: (params = {}) => {
    let list = storeReturns;
    if (params.status && params.status !== 'all') list = list.filter((r) => r.status === params.status);
    return ok(paginate(list, params));
  },

  create: (data) => {
    const me = currentUser();
    const ret = {
      _id: newId('ret'),
      returnNumber: `RET-STR-2026-${Math.floor(100 + Math.random() * 900)}`,
      store: storeRef(data.storeId || me.assignedStore?._id || 'str_1'),
      warehouse: whRef(data.warehouseId || 'wh_1'),
      items: (data.items || []).map((it) => ({
        product: productRef(it.productId),
        quantity: Number(it.quantity) || 1,
        condition: it.condition || 'good',
        reason: it.reason || data.reason || 'Surplus store stock return',
      })),
      status: 'pending_inspection',
      returnedBy: userRef(me._id),
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };
    storeReturns.unshift(ret);
    notify('store_return', `Store Return Initiated: ${ret.returnNumber}`, `${ret.store.name} returned items for central warehouse inspection.`, 'medium');
    logActivity('STORE_RETURN_CREATED', `Store return ${ret.returnNumber} initiated`, 'StoreReturn', ret._id, me);
    return ok(clone(ret));
  },

  inspectAndApprove: (id, { status = 'approved_restock', comment = '' }) => {
    const r = storeReturns.find((x) => x._id === id);
    if (!r) return fail('Return not found', 404);
    const me = currentUser();
    r.status = status;
    r.reviewedBy = userRef(me._id);
    r.reviewedAt = new Date().toISOString();
    r.notes = (r.notes ? r.notes + ' | ' : '') + (comment || 'QC inspected');

    if (status === 'approved_restock') {
      r.items.forEach((it) => {
        if (it.product?._id) {
          adjustStock(it.product._id, r.warehouse?._id, it.quantity);
          movements.unshift(
            buildMovement({
              type: 'return',
              productId: it.product._id,
              quantity: it.quantity,
              toWarehouseId: r.warehouse?._id,
              storeId: r.store?._id,
              performedById: me._id,
              referenceNo: r.returnNumber,
              reason: it.reason,
              disposition: 'restock',
            })
          );
        }
      });
    }

    logActivity('STORE_RETURN_INSPECTED', `Return ${r.returnNumber} marked ${status}`, 'StoreReturn', r._id, me);
    return ok(clone(r));
  },
};

// ─── Suppliers / Vendors API ─────────────────────────────────────────────────
export const suppliersApi = {
  getAll: (params = {}) => ok(paginate(suppliers.filter((s) => s.isActive), params)),
  getById: (id) => {
    const s = suppliers.find((x) => x._id === id);
    if (!s) return fail('Supplier not found', 404);
    const mappedProducts = products.filter((p) => p.suppliers?.some((sp) => sp._id === id));
    const inwardLogs = movements.filter((m) => m.supplier?._id === id);
    const defects = damageClaims.filter((c) => c.supplier?._id === id);
    return ok({ ...clone(s), mappedProducts, inwardLogs, defects });
  },
  create: (data) => {
    const s = {
      _id: newId('s'),
      name: data.name,
      code: `VND-${(data.name || 'SUP').slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      contactPerson: data.contactPerson || '',
      phone: data.phone || '',
      email: data.email || '',
      city: data.city || '',
      address: data.address || '',
      gstin: data.gstin || '',
      categories: data.categories || ['Packaging'],
      rating: 4.8,
      leadTimeDays: Number(data.leadTimeDays) || 5,
      totalPurchases: 0,
      outstandingBalance: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    suppliers.push(s);
    logActivity('SUPPLIER_CREATED', `Registered vendor: ${s.name}`, 'Supplier', s._id, currentUser());
    return ok(clone(s));
  },
  update: (id, data) => {
    const s = suppliers.find((x) => x._id === id);
    if (!s) return fail('Supplier not found', 404);
    Object.assign(s, data);
    return ok(clone(s));
  },
  delete: (id) => {
    const s = suppliers.find((x) => x._id === id);
    if (!s) return fail('Supplier not found', 404);
    s.isActive = false;
    return ok({ message: 'Supplier removed' });
  },
};

// ─── Customers API ───────────────────────────────────────────────────────────
export const customersApi = {
  getAll: (params = {}) => ok(paginate(customers.filter((c) => c.isActive), params)),
  getById: (id) => {
    const c = customers.find((x) => x._id === id);
    if (!c) return fail('Customer not found', 404);
    return ok(clone(c));
  },
  create: (data) => {
    const c = {
      _id: newId('c'),
      name: data.name,
      contactPerson: data.contactPerson || '',
      phone: data.phone || '',
      email: data.email || '',
      city: data.city || '',
      address: data.address || '',
      gstin: data.gstin || '',
      totalOrders: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    customers.push(c);
    return ok(clone(c));
  },
  update: (id, data) => {
    const c = customers.find((x) => x._id === id);
    if (!c) return fail('Customer not found', 404);
    Object.assign(c, data);
    return ok(clone(c));
  },
  delete: (id) => {
    const c = customers.find((x) => x._id === id);
    if (!c) return fail('Customer not found', 404);
    c.isActive = false;
    return ok({ message: 'Customer removed' });
  },
};

// ─── Audits API (with Count Sheet) ───────────────────────────────────────────
export const auditsApi = {
  getAll: (params = {}) => ok(paginate(audits, params)),
  getById: (id) => {
    const a = audits.find((x) => x._id === id);
    if (!a) return fail('Audit not found', 404);
    return ok(clone(a));
  },
  start: (data) => {
    const me = currentUser();
    const wh = whRef(data.warehouseId || 'wh_1');
    const items = products.map((p) => {
      const currentInWh = p.warehouseStock.find((w) => w.warehouse._id === wh._id)?.quantity || 0;
      return {
        product: productRef(p._id),
        expectedQty: currentInWh,
        countedQty: null,
        discrepancy: null,
        notes: '',
      };
    });
    const a = {
      _id: newId('aud'),
      auditName: data.auditName || `Audit ${wh.name}`,
      warehouse: wh,
      floor: data.floor || 'All Floors',
      startedBy: userRef(me._id),
      startedAt: new Date().toISOString(),
      status: 'in_progress',
      notes: data.notes || '',
      items,
    };
    audits.unshift(a);
    logActivity('AUDIT_STARTED', `Started physical stock count audit for ${wh.name}`, 'Audit', a._id, me);
    return ok(clone(a));
  },
  updateCount: (auditId, countedItems) => {
    const a = audits.find((x) => x._id === auditId);
    if (!a) return fail('Audit not found', 404);
    countedItems.forEach((ci) => {
      const target = a.items.find((it) => it.product._id === ci.productId);
      if (target) {
        target.countedQty = ci.countedQty !== null && ci.countedQty !== '' ? Number(ci.countedQty) : null;
        target.discrepancy = target.countedQty !== null ? target.countedQty - target.expectedQty : null;
        if (ci.notes) target.notes = ci.notes;
      }
    });
    return ok(clone(a));
  },
  complete: (id, { reconcile = true } = {}) => {
    const a = audits.find((x) => x._id === id);
    if (!a) return fail('Audit not found', 404);
    const me = currentUser();
    a.status = 'completed';
    a.completedBy = userRef(me._id);
    a.completedAt = new Date().toISOString();

    if (reconcile) {
      a.items.forEach((it) => {
        if (it.countedQty !== null && it.discrepancy !== 0) {
          adjustStock(it.product._id, a.warehouse._id, it.discrepancy);
          adjustments.push({
            _id: newId('adj'),
            product: it.product,
            warehouse: a.warehouse,
            quantityDelta: it.discrepancy,
            reason: `Reconciled from Audit ${a.auditName}`,
            requestedBy: userRef(me._id),
            approvedBy: userRef(me._id),
            status: 'approved',
            createdAt: new Date().toISOString(),
          });
        }
      });
    }

    logActivity('AUDIT_COMPLETED', `Completed audit ${a.auditName} with reconciliation`, 'Audit', a._id, me);
    return ok(clone(a));
  },
};

// ─── POS Integration API ─────────────────────────────────────────────────────
export const posApi = {
  getStatus: () => {
    return ok({
      terminals: clone(posTerminals),
      summary: {
        totalTerminals: posTerminals.length,
        onlineTerminals: posTerminals.filter((t) => t.status === 'online').length,
        todaySalesSynced: posSalesFeed.length,
        todayPackagingDeducted: posSalesFeed.reduce(
          (acc, tx) => acc + tx.deductedItems.reduce((s, i) => s + i.quantity, 0),
          0
        ),
      },
    });
  },

  getBOMMappings: () => ok(clone(posBOMMappings)),

  getRecentSales: () => ok(clone(posSalesFeed)),

  // Interactive POS Simulator: Tests live transaction deduction
  simulateSale: ({ storeId, salesCategory, jewelleryItem, customerName, billNo }) => {
    const store = stores.find((s) => s._id === storeId) || stores[0];
    const mapping = posBOMMappings.find((m) => m.salesCategory === salesCategory) || posBOMMappings[0];

    const deductedItems = mapping.packagingDeductions.map((d) => {
      adjustStock(d.product._id, null, -d.quantity, store._id);
      movements.unshift(
        buildMovement({
          type: 'consumption',
          productId: d.product._id,
          quantity: d.quantity,
          storeId: store._id,
          performedById: 'u_1',
          referenceNo: billNo || `POS-BILL-${Math.floor(1000 + Math.random() * 9000)}`,
          reason: `Auto-deducted for ${jewelleryItem || salesCategory}`,
        })
      );
      return { product: d.product, quantity: d.quantity };
    });

    const tx = {
      _id: newId('pos_tx'),
      billNumber: billNo || `BILL-${store.code}-${Math.floor(1000 + Math.random() * 9000)}`,
      posTerminalId: store.posTerminalId,
      store: storeRef(store._id),
      customerName: customerName || 'Walk-in Diamond Customer',
      jewelleryItem: jewelleryItem || 'Diamond Ring',
      jewelleryAmount: 185000,
      salesCategory: mapping.salesCategory,
      deductedItems,
      syncStatus: 'synced_deducted',
      timestamp: new Date().toISOString(),
    };
    posSalesFeed.unshift(tx);
    logActivity('POS_AUTO_DEDUCTION', `POS transaction ${tx.billNumber} auto-deducted ${deductedItems.length} packaging SKUs at ${store.name}`, 'POS', tx._id);
    return ok(clone(tx));
  },
};

// ─── Reports API (All 12 Reports with Date Filtering) ─────────────────────────
export const reportsApi = {
  get: (type, params = {}) => {
    const live = products.filter((p) => p.isActive);
    const from = params.from ? new Date(params.from) : new Date(Date.now() - 30 * 86400000);
    const to = params.to ? new Date(params.to) : new Date();

    const inDateRange = (dateString) => {
      if (!dateString) return true;
      const d = new Date(dateString);
      return d >= from && d <= to;
    };

    switch (type) {
      case 'stock-summary':
        return ok(
          live.map((p) => ({
            name: p.name,
            sku: p.sku,
            category: p.category,
            totalStock: p.currentStock,
            warehouseStock: p.warehouseTotalStock,
            storeStock: p.storeTotalStock,
            unit: p.unit,
            purchasePrice: p.purchasePrice,
            stockValuation: p.currentStock * p.purchasePrice,
            minStockLevel: p.minStockLevel,
            status: p.currentStock <= p.minStockLevel ? 'Low Stock' : 'Healthy',
          }))
        );

      case 'warehouse-wise': {
        const rows = [];
        warehouses.forEach((w) => {
          live.forEach((p) => {
            const qty = p.warehouseStock.find((x) => x.warehouse._id === w._id)?.quantity || 0;
            rows.push({
              warehouse: w.name,
              sku: p.sku,
              productName: p.name,
              category: p.category,
              quantity: qty,
              unit: p.unit,
              storageLocation: p.storageLocation,
              value: qty * p.purchasePrice,
            });
          });
        });
        return ok(rows);
      }

      case 'store-wise': {
        const rows = [];
        stores.forEach((s) => {
          live.forEach((p) => {
            const qty = p.storeStock.find((x) => x.store._id === s._id)?.quantity || 0;
            rows.push({
              storeName: s.name,
              storeCode: s.code,
              city: s.city,
              sku: p.sku,
              productName: p.name,
              category: p.category,
              storeStock: qty,
              unit: p.unit,
              value: qty * p.purchasePrice,
            });
          });
        });
        return ok(rows);
      }

      case 'incoming': {
        const inc = movements.filter((m) => m.type === 'incoming' && inDateRange(m.createdAt));
        return ok(
          inc.map((m) => ({
            date: dateStr(m.createdAt),
            refNo: m.referenceNo || '—',
            supplier: m.supplier?.name || '—',
            warehouse: m.toWarehouse?.name || '—',
            product: m.product?.name,
            sku: m.product?.sku,
            quantity: m.quantity,
            unit: m.product?.unit,
            totalValue: m.totalValue || m.quantity * (m.product?.purchasePrice || 0),
          }))
        );
      }

      case 'outgoing': {
        const out = movements.filter((m) => m.type === 'outgoing' && inDateRange(m.createdAt));
        return ok(
          out.map((m) => ({
            date: dateStr(m.createdAt),
            dispatchNo: m.referenceNo || '—',
            fromWarehouse: m.fromWarehouse?.name || '—',
            destination: m.store?.name || m.customer?.name || '—',
            product: m.product?.name,
            sku: m.product?.sku,
            quantity: m.quantity,
            unit: m.product?.unit,
          }))
        );
      }

      case 'transfers': {
        const trfs = movements.filter((m) => m.type === 'transfer' && inDateRange(m.createdAt));
        return ok(
          trfs.map((m) => ({
            date: dateStr(m.createdAt),
            referenceNo: m.referenceNo || '—',
            fromWarehouse: m.fromWarehouse?.name,
            toWarehouse: m.toWarehouse?.name,
            product: m.product?.name,
            sku: m.product?.sku,
            quantity: m.quantity,
            notes: m.notes,
          }))
        );
      }

      case 'damaged': {
        const dmgs = damageClaims.filter((c) => inDateRange(c.createdAt));
        return ok(
          dmgs.map((c) => ({
            claimNo: c.claimNumber,
            date: dateStr(c.createdAt),
            source: c.source,
            product: c.product?.name,
            sku: c.product?.sku,
            quantity: c.quantity,
            defectType: c.defectType,
            status: c.status,
            disposition: c.disposition,
            estimatedLoss: c.estimatedLossValue,
          }))
        );
      }

      case 'returns': {
        const rets = storeReturns.filter((r) => inDateRange(r.createdAt));
        return ok(
          rets.map((r) => ({
            returnNo: r.returnNumber,
            date: dateStr(r.createdAt),
            store: r.store?.name,
            warehouse: r.warehouse?.name,
            itemsCount: r.items.length,
            status: r.status,
            returnedBy: r.returnedBy?.name,
          }))
        );
      }

      case 'consumption': {
        const con = storeConsumptions.filter((c) => inDateRange(c.date));
        const flat = [];
        con.forEach((c) => {
          c.items.forEach((it) => {
            flat.push({
              date: c.date,
              store: c.store?.name,
              sku: it.product?.sku,
              product: it.product?.name,
              quantity: it.quantity,
              purpose: it.purpose,
              loggedBy: c.loggedBy?.name,
            });
          });
        });
        return ok(flat);
      }

      case 'vendor-performance': {
        return ok(
          suppliers.map((s) => ({
            vendorCode: s.code,
            vendorName: s.name,
            city: s.city,
            rating: `${s.rating} ★`,
            leadTimeDays: `${s.leadTimeDays} days`,
            totalPurchasesValue: s.totalPurchases,
            outstandingBalance: s.outstandingBalance,
            defectsReported: damageClaims.filter((c) => c.supplier?._id === s._id).length,
          }))
        );
      }

      case 'movement': {
        const days = [];
        for (let d = new Date(from); d <= to && days.length < 31; d = new Date(d.getTime() + 86400000)) {
          days.push(dateStr(d));
        }
        return ok(
          days.map((date, i) => {
            const real = movements.filter((m) => dateStr(m.createdAt) === date);
            const inc = real.filter((m) => m.type === 'incoming').reduce((s, m) => s + m.quantity, 0);
            const out = real.filter((m) => m.type === 'outgoing').reduce((s, m) => s + m.quantity, 0);
            return {
              date: date.slice(5),
              incoming: inc || 8 + ((i * 5) % 15),
              outgoing: out || 6 + ((i * 7) % 12),
            };
          })
        );
      }

      case 'valuation':
        return ok(
          live.map((p) => ({
            sku: p.sku,
            name: p.name,
            category: p.category,
            currentStock: p.currentStock,
            unitCost: p.purchasePrice,
            inventoryValuation: p.currentStock * p.purchasePrice,
          }))
        );

      case 'low-stock':
        return ok(
          live
            .filter((p) => p.currentStock <= p.minStockLevel)
            .map((p) => ({
              sku: p.sku,
              name: p.name,
              category: p.category,
              currentStock: p.currentStock,
              minStockLevel: p.minStockLevel,
              shortfall: p.minStockLevel - p.currentStock,
              reorderQuantity: p.reorderQty,
            }))
        );

      case 'product-movement': {
        const targetId = params.productId || products[0]?._id;
        const movs = movements.filter((m) => m.product?._id === targetId && inDateRange(m.createdAt));
        return ok(
          movs.map((m) => ({
            date: dateStr(m.createdAt),
            type: m.type.toUpperCase(),
            quantity: m.quantity,
            from: m.fromWarehouse?.name || '—',
            to: m.toWarehouse?.name || m.store?.name || m.customer?.name || '—',
            refNo: m.referenceNo || '—',
            notes: m.notes || m.reason || '—',
            user: m.performedBy?.name || '—',
          }))
        );
      }

      default:
        return ok([]);
    }
  },

  exportCSV: async (type, params = {}) => {
    const res = await reportsApi.get(type, params);
    const rows = res.data.data || [];
    if (!rows.length) return ok('');
    const head = Object.keys(rows[0]);
    const csv = [
      head.join(','),
      ...rows.map((r) => head.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    return ok(csv);
  },
};

// ─── Activity Logs API ───────────────────────────────────────────────────────
export const activityLogsApi = {
  getAll: (params = {}) => ok(paginate(activityLogs, params)),
};

// ─── Users & Roles Management API (5 Client Roles) ───────────────────────────
export const usersApi = {
  getAll: (params = {}) => ok(paginate(users, params)),
  getById: (id) => {
    const u = users.find((x) => x._id === id);
    if (!u) return fail('User not found', 404);
    return ok(clone(u));
  },
  create: (data) => {
    const u = {
      _id: newId('u'),
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      role: data.role || 'warehouse_staff',
      designation: data.designation || 'Staff',
      assignedWarehouse: data.assignedWarehouseId ? whRef(data.assignedWarehouseId) : null,
      assignedStore: data.assignedStoreId ? storeRef(data.assignedStoreId) : null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    users.push(u);
    logActivity('USER_CREATED', `Created new system user: ${u.name} (${u.role})`, 'User', u._id, currentUser());
    return ok(clone(u));
  },
  update: (id, data) => {
    const u = users.find((x) => x._id === id);
    if (!u) return fail('User not found', 404);
    Object.assign(u, {
      name: data.name ?? u.name,
      email: data.email ?? u.email,
      phone: data.phone ?? u.phone,
      role: data.role ?? u.role,
      designation: data.designation ?? u.designation,
      assignedWarehouse: data.assignedWarehouseId !== undefined ? whRef(data.assignedWarehouseId) : u.assignedWarehouse,
      assignedStore: data.assignedStoreId !== undefined ? storeRef(data.assignedStoreId) : u.assignedStore,
    });
    logActivity('USER_UPDATED', `Updated profile of user ${u.name}`, 'User', u._id, currentUser());
    return ok(clone(u));
  },
  toggleActive: (id) => {
    const u = users.find((x) => x._id === id);
    if (!u) return fail('User not found', 404);
    u.isActive = !u.isActive;
    return ok(clone(u));
  },
};

// ─── Stock Operations (Inward, Outward, Transfer, Adjustments) ───────────────
export const stockApi = {
  getMovements: (params = {}) => {
    let list = movements;
    if (params.type && params.type !== 'all') list = list.filter((m) => m.type === params.type);
    if (params.warehouseId) list = list.filter((m) => m.fromWarehouse?._id === params.warehouseId || m.toWarehouse?._id === params.warehouseId);
    return ok(paginate(list, params));
  },

  createIncoming: (data) => recordMovement('incoming', data),
  createOutgoing: (data) => recordMovement('outgoing', data),
  createTransfer: (data) => recordMovement('transfer', data),

  getIncoming: (params = {}) => stockApi.getMovements({ ...params, type: 'incoming' }),
  getOutgoing: (params = {}) => stockApi.getMovements({ ...params, type: 'outgoing' }),
  getTransfers: (params = {}) => stockApi.getMovements({ ...params, type: 'transfer' }),

  getAdjustments: (params = {}) => {
    let list = adjustments;
    if (params.status && params.status !== 'all') list = list.filter((a) => a.status === params.status);
    return ok(paginate(list, params));
  },

  createAdjustment: (data) => {
    const me = currentUser();
    const adj = {
      _id: newId('adj'),
      product: productRef(data.productId),
      warehouse: whRef(data.warehouseId),
      quantityDelta: Number(data.quantityDelta) || 0,
      reason: data.reason || 'Manual stock correction',
      requestedBy: userRef(me._id),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    adjustments.unshift(adj);
    notify('pending_approval', 'Stock Adjustment Requested', `${me.name} requested delta ${adj.quantityDelta} on ${adj.product?.name}`, 'medium');
    logActivity('ADJUSTMENT_REQUESTED', `Adjustment of ${adj.quantityDelta} requested for ${adj.product?.sku}`, 'Adjustment', adj._id, me);
    return ok(clone(adj));
  },

  approveAdjustment: (id, { comment = '' } = {}) => {
    const a = adjustments.find((x) => x._id === id);
    if (!a) return fail('Adjustment not found', 404);
    const me = currentUser();
    a.status = 'approved';
    a.approvedBy = userRef(me._id);
    a.approvedAt = new Date().toISOString();
    a.comment = comment;
    adjustStock(a.product._id, a.warehouse._id, a.quantityDelta);

    movements.unshift(
      buildMovement({
        type: 'adjustment',
        productId: a.product._id,
        quantity: Math.abs(a.quantityDelta),
        fromWarehouseId: a.quantityDelta < 0 ? a.warehouse._id : null,
        toWarehouseId: a.quantityDelta > 0 ? a.warehouse._id : null,
        performedById: me._id,
        reason: a.reason,
        notes: `Approved adjustment: ${comment}`,
      })
    );
    logActivity('ADJUSTMENT_APPROVED', `Approved adjustment delta ${a.quantityDelta} for ${a.product?.sku}`, 'Adjustment', a._id, me);
    return ok(clone(a));
  },

  rejectAdjustment: (id, { comment = '' } = {}) => {
    const a = adjustments.find((x) => x._id === id);
    if (!a) return fail('Adjustment not found', 404);
    const me = currentUser();
    a.status = 'rejected';
    a.approvedBy = userRef(me._id);
    a.approvedAt = new Date().toISOString();
    a.comment = comment || 'Rejected';
    logActivity('ADJUSTMENT_REJECTED', `Rejected adjustment for ${a.product?.sku}`, 'Adjustment', a._id, me);
    return ok(clone(a));
  },

  getDamaged: (params = {}) => damageApi.getAll(params),
  createDamaged: (data) => damageApi.create(data),
};

// ─── Notifications API ───────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (params = {}) => {
    let list = notifications;
    if (params.unreadOnly === 'true' || params.unreadOnly === true) list = list.filter((n) => !n.isRead);
    return ok(paginate(list, params), { unreadCount: notifications.filter((n) => !n.isRead).length });
  },
  markRead: (id) => {
    const n = notifications.find((x) => x._id === id);
    if (n) n.isRead = true;
    return ok({ message: 'Marked read' });
  },
  markAllRead: () => {
    notifications.forEach((n) => (n.isRead = true));
    return ok({ message: 'All notifications marked as read' });
  },
};
