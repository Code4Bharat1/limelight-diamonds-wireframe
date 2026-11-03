// ─────────────────────────────────────────────────────────────────────────────
// In-memory dummy database for the Limelight Diamonds wireframe.
// Everything lives in the browser; a full page reload resets to this seed.
// ─────────────────────────────────────────────────────────────────────────────

const now = Date.now();
const HOUR = 3600000;
const DAY = 24 * HOUR;

export const ago = (days, hours = 0) => new Date(now - days * DAY - hours * HOUR).toISOString();
export const ahead = (hours) => new Date(now + hours * HOUR).toISOString();
export const dateStr = (d) => new Date(d).toISOString().split('T')[0];

let seq = 1000;
export const newId = (prefix = 'id') => `${prefix}_${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ─── Warehouses ──────────────────────────────────────────────────────────────
export const warehouses = [
  { _id: 'wh_1', name: 'Mumbai Vault (BKC)', code: 'MUM-01', location: 'Mumbai', address: 'Bharat Diamond Bourse, BKC, Mumbai 400051', capacity: 5000, contactPhone: '022-40001111', notes: 'Primary high-security vault', isActive: true, createdAt: ago(400) },
  { _id: 'wh_2', name: 'Surat Cutting Unit', code: 'SUR-01', location: 'Surat', address: 'Varachha Road, Surat 395006', capacity: 3000, contactPhone: '0261-2550022', notes: 'Cutting, polishing and grading', isActive: true, createdAt: ago(380) },
  { _id: 'wh_3', name: 'Pune Showroom Store', code: 'PUN-01', location: 'Pune', address: 'FC Road, Shivajinagar, Pune 411005', capacity: 1500, contactPhone: '020-25530033', notes: 'Retail showroom back-store', isActive: true, createdAt: ago(300) },
];

// ─── Users ───────────────────────────────────────────────────────────────────
const wRef = (id) => {
  const w = warehouses.find((x) => x._id === id);
  return w ? { _id: w._id, name: w.name, location: w.location } : null;
};

export const users = [
  { _id: 'u_1', name: 'Vikram Shah', email: 'admin@limelightdiamonds.com', role: 'owner_admin', designation: 'Founder & CEO', phone: '9800000001', wh: 'wh_1', salaryStructure: { basic: 90000, hra: 36000, allowances: 15000, pfRate: 12, taxRate: 10 } },
  { _id: 'u_2', name: 'Neha Kapoor', email: 'manager@limelightdiamonds.com', role: 'manager', designation: 'Operations Manager', phone: '9800000002', wh: 'wh_1', salaryStructure: { basic: 60000, hra: 24000, allowances: 8000, pfRate: 12, taxRate: 8 } },
  { _id: 'u_3', name: 'Rohan Desai', email: 'rohan@limelightdiamonds.com', role: 'supervisor', designation: 'Vault Supervisor', phone: '9800000003', wh: 'wh_1', salaryStructure: { basic: 40000, hra: 16000, allowances: 5000, pfRate: 12, taxRate: 5 } },
  { _id: 'u_4', name: 'Priya Iyer', email: 'accountant@limelightdiamonds.com', role: 'accountant', designation: 'Senior Accountant', phone: '9800000004', wh: 'wh_1', salaryStructure: { basic: 45000, hra: 18000, allowances: 6000, pfRate: 12, taxRate: 5 } },
  { _id: 'u_5', name: 'Rahul Patil', email: 'worker@limelightdiamonds.com', role: 'worker', designation: 'Diamond Sorter', phone: '9800000005', wh: 'wh_2', salaryStructure: { basic: 24000, hra: 9600, allowances: 2500, pfRate: 12, taxRate: 0 } },
  { _id: 'u_6', name: 'Kavita Joshi', email: 'kavita@limelightdiamonds.com', role: 'worker', designation: 'Packing Specialist', phone: '9800000006', wh: 'wh_1', salaryStructure: { basic: 22000, hra: 8800, allowances: 2000, pfRate: 12, taxRate: 0 } },
  { _id: 'u_7', name: 'Arjun Nair', email: 'arjun@limelightdiamonds.com', role: 'supervisor', designation: 'Dispatch Supervisor', phone: '9800000007', wh: 'wh_3', salaryStructure: { basic: 36000, hra: 14400, allowances: 4500, pfRate: 12, taxRate: 5 } },
  { _id: 'u_8', name: 'Sneha Rao', email: 'sneha@limelightdiamonds.com', role: 'worker', designation: 'QC Gemologist', phone: '9800000008', wh: 'wh_2', salaryStructure: { basic: 28000, hra: 11200, allowances: 3000, pfRate: 12, taxRate: 0 } },
].map(({ wh, ...u }) => ({ ...u, assignedWarehouse: wRef(wh), isActive: true, createdAt: ago(200) }));

warehouses[0].manager = { _id: 'u_2', name: 'Neha Kapoor' };
warehouses[1].manager = { _id: 'u_3', name: 'Rohan Desai' };
warehouses[2].manager = { _id: 'u_7', name: 'Arjun Nair' };

export const userRef = (id) => {
  const u = users.find((x) => x._id === id);
  return u ? { _id: u._id, name: u.name, email: u.email, role: u.role, designation: u.designation, phone: u.phone } : null;
};

// ─── Products ────────────────────────────────────────────────────────────────
const productSeed = [
  ['Round Brilliant Solitaire 1.00ct VVS1 E', 'RB-100-VVS1E', 'Loose Diamonds', 'Limelight Natural', 'pcs', 385000, 465000, 5, 12, 'serial'],
  ['Princess Cut Diamond 0.50ct VS1 F', 'PC-050-VS1F', 'Loose Diamonds', 'Limelight Natural', 'pcs', 98000, 128000, 10, 28, 'serial'],
  ['Oval Lab-Grown Diamond 1.50ct VS2 G', 'OV-150-LG-G', 'Lab-Grown Diamonds', 'Limelight Lab', 'pcs', 72000, 99000, 8, 34, 'serial'],
  ['Emerald Cut Lab-Grown 2.00ct VVS2 F', 'EM-200-LG-F', 'Lab-Grown Diamonds', 'Limelight Lab', 'pcs', 115000, 152000, 6, 4, 'serial'],
  ['Classic Solitaire Engagement Ring 18K', 'RNG-SOL-18K', 'Engagement Rings', 'Limelight Bridal', 'pcs', 145000, 199000, 10, 22, 'serial'],
  ['Halo Diamond Engagement Ring Platinum', 'RNG-HALO-PT', 'Engagement Rings', 'Limelight Bridal', 'pcs', 210000, 289000, 6, 9, 'serial'],
  ['Diamond Tennis Necklace 5ct 18K White Gold', 'NCK-TEN-5CT', 'Necklaces', 'Limelight Fine', 'pcs', 520000, 690000, 3, 5, 'serial'],
  ['Pave Heart Pendant 0.30ct', 'PND-HRT-030', 'Pendants', 'Limelight Fine', 'pcs', 28000, 39500, 20, 46, 'quantity'],
  ['Diamond Stud Earrings 0.50ct pair', 'EAR-STD-050', 'Earrings', 'Limelight Fine', 'pair', 62000, 84000, 15, 31, 'quantity'],
  ['Diamond Hoop Earrings 14K Rose Gold', 'EAR-HOOP-14R', 'Earrings', 'Limelight Fine', 'pair', 48000, 66000, 12, 7, 'quantity'],
  ['Diamond Tennis Bracelet 3ct', 'BRC-TEN-3CT', 'Bracelets', 'Limelight Fine', 'pcs', 265000, 349000, 5, 11, 'serial'],
  ['Eternity Band 1ct 18K Yellow Gold', 'RNG-ETN-18Y', 'Wedding Bands', 'Limelight Bridal', 'pcs', 88000, 119000, 10, 18, 'serial'],
  ['Melee Diamonds Parcel 1.2-1.5mm (10ct)', 'MEL-12-15-10', 'Melee & Parcels', 'Limelight Natural', 'parcel', 145000, 182000, 4, 9, 'batch'],
  ['18K White Gold Solitaire Mount', 'MNT-SOL-18W', 'Gold Mounts', 'Limelight Studio', 'pcs', 18500, 26000, 25, 64, 'quantity'],
  ['Platinum Six-Prong Setting', 'MNT-6PR-PT', 'Gold Mounts', 'Limelight Studio', 'pcs', 24000, 33000, 15, 13, 'quantity'],
  ['Diamond Grading Certificate Kit', 'KIT-GRD-CRT', 'Packaging & Certs', 'Limelight Studio', 'pcs', 450, 900, 100, 240, 'quantity'],
  ['Velvet Ring Box (Emerald Green)', 'BOX-RNG-GRN', 'Packaging & Certs', 'Limelight Studio', 'pcs', 180, 350, 200, 520, 'quantity'],
  ['Cushion Cut Lab-Grown 3.00ct VS1 E', 'CU-300-LG-E', 'Lab-Grown Diamonds', 'Limelight Lab', 'pcs', 168000, 225000, 4, 2, 'serial'],
];

export const products = productSeed.map(([name, sku, category, brand, unit, purchasePrice, sellingPrice, minStockLevel, currentStock, trackingType], i) => {
  const split = [Math.ceil(currentStock * 0.5), Math.floor(currentStock * 0.3)];
  split.push(currentStock - split[0] - split[1]);
  return {
    _id: `p_${i + 1}`,
    name, sku, category, brand, unit, purchasePrice, sellingPrice, minStockLevel, currentStock, trackingType,
    model: sku.split('-').slice(0, 2).join('-'),
    description: `${name} — certified, hallmarked and inventory-tracked by Limelight Diamonds.`,
    imageUrl: '',
    qrCodeValue: i % 5 === 4 ? '' : `LIMELIGHT-${sku}`,
    qrCodeImage: '',
    isActive: true,
    warehouseStock: warehouses.map((w, wi) => ({ warehouse: { _id: w._id, name: w.name }, quantity: split[wi] })).filter((ws) => ws.quantity > 0),
    createdAt: ago(120 - i),
  };
});

export const productRef = (id) => {
  const p = products.find((x) => x._id === id);
  return p ? { _id: p._id, name: p.name, sku: p.sku, unit: p.unit, category: p.category, currentStock: p.currentStock, sellingPrice: p.sellingPrice, purchasePrice: p.purchasePrice } : null;
};

// ─── Parties ─────────────────────────────────────────────────────────────────
export const suppliers = [
  { name: 'Shree Gems Exports', contactPerson: 'Hitesh Mehta', phone: '9876543210', email: 'hitesh@shreegems.example', city: 'Surat', gstin: '24AAECS9010N1Z2', address: 'Mahidharpura, Surat 395003', totalPurchases: 4850000 },
  { name: 'Antwerp Rough Traders', contactPerson: 'Daan Peeters', phone: '9823456781', email: 'daan@antwerprough.example', city: 'Mumbai', gstin: '27AAACA1234M1Z5', address: 'Bharat Diamond Bourse, Mumbai 400051', totalPurchases: 12400000 },
  { name: 'GreenLab Diamonds Pvt Ltd', contactPerson: 'Ananya Gupta', phone: '9911223344', email: 'ananya@greenlab.example', city: 'Surat', gstin: '24AADCG1234L1ZP', address: 'Sachin GIDC, Surat 394230', totalPurchases: 3600000 },
  { name: 'Royal Gold Castings', contactPerson: 'Mukesh Soni', phone: '9845671230', email: 'mukesh@royalgold.example', city: 'Mumbai', gstin: '27AAACR0001Q1ZM', address: 'Zaveri Bazaar, Mumbai 400002', totalPurchases: 1950000 },
  { name: 'Premium Jewel Packaging', contactPerson: 'Farah Khan', phone: '9765432109', email: 'farah@jewelpack.example', city: 'Pune', gstin: '27AAACP0001R1Z7', address: 'Bhosari MIDC, Pune 411026', totalPurchases: 420000 },
].map((s, i) => ({ _id: `s_${i + 1}`, ...s, outstandingBalance: Math.round(s.totalPurchases * 0.08), isActive: true, createdAt: ago(250) }));

export const customers = [
  { name: 'Aurum Fine Jewellers', contactPerson: 'Karan Malhotra', phone: '9234567890', email: 'karan@aurumfine.example', city: 'Mumbai', gstin: '27AAACT0001G1Z1', address: 'Linking Road, Bandra, Mumbai 400050' },
  { name: 'Sparkle Bridal House', contactPerson: 'Ritu Sharma', phone: '9112233445', email: 'ritu@sparklebridal.example', city: 'Pune', gstin: '27AABCS0001H1Z3', address: 'MG Road, Camp, Pune 411001' },
  { name: 'Heritage Jewels', contactPerson: 'Suresh Pillai', phone: '9876512340', email: 'suresh@heritagejewels.example', city: 'Bangalore', gstin: '29AACCH0001N1ZK', address: 'Commercial Street, Bangalore 560001' },
  { name: 'Ms. Aditi Kulkarni (Retail)', contactPerson: 'Aditi Kulkarni', phone: '9922334455', email: 'aditi.k@example.com', city: 'Pune', gstin: '', address: 'Kothrud, Pune 411038' },
  { name: 'The Grand Palace Hotel Boutique', contactPerson: 'Neel Verma', phone: '9811223344', email: 'neel@grandpalace.example', city: 'Delhi', gstin: '07AAAGH0001Q1ZS', address: 'Connaught Place, Delhi 110001' },
  { name: 'Lumière Luxury Retail', contactPerson: 'Sanjana Reddy', phone: '9945678901', email: 'sanjana@lumiere.example', city: 'Hyderabad', gstin: '36AAACL0001L1ZR', address: 'Banjara Hills, Hyderabad 500034' },
].map((c, i) => ({ _id: `c_${i + 1}`, ...c, totalSales: 800000 + i * 650000, outstandingBalance: 50000 + i * 42000, isActive: true, createdAt: ago(220) }));

const sRef = (id) => { const s = suppliers.find((x) => x._id === id); return s ? { _id: s._id, name: s.name } : null; };
const cRef = (id) => { const c = customers.find((x) => x._id === id); return c ? { _id: c._id, name: c.name, contactPerson: c.contactPerson, phone: c.phone, city: c.city, email: c.email, address: c.address } : null; };
export const whRef = (id) => { const w = warehouses.find((x) => x._id === id); return w ? { _id: w._id, name: w.name, code: w.code, location: w.location, address: w.address } : null; };
export { sRef, cRef };

// ─── Stock movements ─────────────────────────────────────────────────────────
export function buildMovement({ type, productId, quantity, fromWarehouseId, toWarehouseId, supplierId, customerId, performedById, reason, notes, referenceNo, unitPrice, disposition, createdAt }) {
  const p = productRef(productId);
  const price = unitPrice ?? (type === 'incoming' ? p?.purchasePrice : p?.sellingPrice);
  return {
    _id: newId('mv'),
    type,
    product: p,
    quantity,
    fromWarehouse: fromWarehouseId ? whRef(fromWarehouseId) : null,
    toWarehouse: toWarehouseId ? whRef(toWarehouseId) : null,
    supplier: supplierId ? sRef(supplierId) : null,
    customer: customerId ? cRef(customerId) : null,
    performedBy: userRef(performedById),
    reason, notes, referenceNo, disposition,
    unitPrice: price,
    totalValue: price ? price * quantity : undefined,
    status: 'completed',
    createdAt: createdAt || new Date().toISOString(),
  };
}

const mvSeed = [
  ['incoming', 'p_3', 6, null, 'wh_2', 's_3', null, 'u_5', 0, 2, 'PO-2041'],
  ['outgoing', 'p_5', 2, 'wh_1', null, null, 'c_1', 'u_6', 0, 5, 'INV-8812'],
  ['incoming', 'p_14', 20, null, 'wh_1', 's_4', null, 'u_6', 0, 9, 'PO-2040'],
  ['transfer', 'p_2', 4, 'wh_2', 'wh_1', null, null, 'u_3', 1, 1, 'TRF-311'],
  ['outgoing', 'p_9', 3, 'wh_3', null, null, 'c_2', 'u_7', 1, 4, 'INV-8809'],
  ['damaged', 'p_17', 6, 'wh_1', null, null, null, 'u_6', 1, 7, ''],
  ['incoming', 'p_1', 3, null, 'wh_1', 's_2', null, 'u_3', 2, 3, 'PO-2038'],
  ['outgoing', 'p_7', 1, 'wh_1', null, null, 'c_5', 'u_2', 2, 6, 'INV-8801'],
  ['return', 'p_9', 1, null, 'wh_3', null, 'c_4', 'u_7', 2, 8, 'RET-104'],
  ['incoming', 'p_16', 100, null, 'wh_3', 's_5', null, 'u_7', 3, 2, 'PO-2035'],
  ['outgoing', 'p_8', 6, 'wh_3', null, null, 'c_2', 'u_7', 3, 5, 'INV-8795'],
  ['adjustment', 'p_13', 1, null, 'wh_2', null, null, 'u_3', 3, 7, 'ADJ-22'],
  ['transfer', 'p_6', 2, 'wh_1', 'wh_3', null, null, 'u_3', 4, 1, 'TRF-309'],
  ['incoming', 'p_12', 8, null, 'wh_2', 's_1', null, 'u_8', 4, 4, 'PO-2031'],
  ['outgoing', 'p_11', 1, 'wh_1', null, null, 'c_3', 'u_2', 4, 6, 'INV-8788'],
  ['damaged', 'p_8', 2, 'wh_2', null, null, null, 'u_8', 5, 3, ''],
  ['incoming', 'p_2', 10, null, 'wh_2', 's_1', null, 'u_5', 5, 5, 'PO-2028'],
  ['outgoing', 'p_3', 4, 'wh_2', null, null, 'c_6', 'u_5', 5, 8, 'INV-8780'],
  ['return', 'p_5', 1, null, 'wh_1', null, 'c_1', 'u_6', 6, 2, 'RET-101'],
  ['incoming', 'p_9', 12, null, 'wh_1', 's_1', null, 'u_6', 6, 6, 'PO-2025'],
  ['outgoing', 'p_14', 9, 'wh_1', null, null, 'c_3', 'u_6', 6, 9, 'INV-8774'],
  ['incoming', 'p_17', 200, null, 'wh_1', 's_5', null, 'u_6', 0, 1, 'PO-2042'],
  ['outgoing', 'p_2', 3, 'wh_1', null, null, 'c_6', 'u_2', 0, 3, 'INV-8814'],
];

const reasons = {
  damaged: ['Chipped girdle found during QC', 'Box hinge broken in transit'],
  return: ['Size exchange requested', 'Customer changed design preference'],
  adjustment: ['Weight re-verification after recut'],
};

export const movements = mvSeed.map(([type, productId, quantity, fromWarehouseId, toWarehouseId, supplierId, customerId, performedById, d, h, referenceNo], i) =>
  buildMovement({
    type, productId, quantity, fromWarehouseId, toWarehouseId, supplierId, customerId, performedById, referenceNo,
    reason: reasons[type]?.[i % reasons[type].length],
    disposition: type === 'damaged' ? (i % 2 ? 'write_off' : 'repair') : type === 'return' ? 'restock' : undefined,
    notes: type === 'transfer' ? 'Inter-branch movement for showroom display' : '',
    createdAt: ago(d, h),
  })
).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

// ─── Adjustments ─────────────────────────────────────────────────────────────
export const adjustments = [
  { _id: 'adj_1', product: productRef('p_13'), warehouse: whRef('wh_2'), quantityDelta: -1, reason: 'Parcel re-weighed after sorting – 0.4ct short', requestedBy: userRef('u_5'), status: 'pending', createdAt: ago(0, 3) },
  { _id: 'adj_2', product: productRef('p_17'), warehouse: whRef('wh_1'), quantityDelta: 15, reason: 'Unrecorded packaging delivery found in store', requestedBy: userRef('u_6'), status: 'pending', createdAt: ago(1, 2) },
  { _id: 'adj_3', product: productRef('p_10'), warehouse: whRef('wh_3'), quantityDelta: -2, reason: 'Display pieces sent for re-polish', requestedBy: userRef('u_7'), status: 'pending', createdAt: ago(1, 6) },
  { _id: 'adj_4', product: productRef('p_14'), warehouse: whRef('wh_1'), quantityDelta: 4, reason: 'Audit correction', requestedBy: userRef('u_3'), status: 'approved', approvedBy: userRef('u_1'), approvedAt: ago(3), comment: 'Approved', createdAt: ago(4) },
  { _id: 'adj_5', product: productRef('p_4'), warehouse: whRef('wh_2'), quantityDelta: -1, reason: 'Suspected mismatch', requestedBy: userRef('u_8'), status: 'rejected', approvedBy: userRef('u_2'), approvedAt: ago(5), comment: 'Recount matched system', createdAt: ago(6) },
];

// ─── Audits ──────────────────────────────────────────────────────────────────
export const audits = [
  {
    _id: 'aud_1', auditName: 'Monthly Vault Count – ' + new Date().toLocaleString('en-IN', { month: 'long' }), warehouse: whRef('wh_1'), startedBy: userRef('u_3'),
    startedAt: ago(0, 5), status: 'in_progress', notes: 'Full count of loose stones',
    items: ['p_1', 'p_2', 'p_5', 'p_6', 'p_7'].map((pid, i) => ({ product: productRef(pid), expectedQty: 10, countedQty: i < 3 ? (i === 1 ? 9 : 10) : undefined, discrepancy: i === 1 ? -1 : 0 })),
  },
  {
    _id: 'aud_2', auditName: 'Quarterly Surat Unit Audit', warehouse: whRef('wh_2'), startedBy: userRef('u_2'), completedBy: userRef('u_2'),
    startedAt: ago(12), completedAt: ago(11), status: 'completed', notes: '',
    items: ['p_3', 'p_4', 'p_13'].map((pid) => ({ product: productRef(pid), expectedQty: 8, countedQty: 8, discrepancy: 0 })),
  },
];

// ─── Notifications ───────────────────────────────────────────────────────────
export const notifications = [
  { type: 'low_stock', title: 'Low stock: Cushion Cut Lab-Grown 3.00ct', message: 'Only 2 pcs left (minimum 4). Please reorder from GreenLab Diamonds.', priority: 'high', isRead: false, createdAt: ago(0, 1) },
  { type: 'pending_approval', title: 'Adjustment awaiting approval', message: 'Rahul Patil requested -1 parcel on Melee Diamonds Parcel.', priority: 'high', isRead: false, createdAt: ago(0, 3) },
  { type: 'goal_assigned', title: 'New dispatch goal assigned', message: 'Deliver 2 × Halo Engagement Ring to Sparkle Bridal House.', priority: 'medium', isRead: false, createdAt: ago(0, 6) },
  { type: 'stock_movement', title: 'Incoming stock received', message: '6 × Oval Lab-Grown Diamond 1.50ct received at Surat Cutting Unit.', priority: 'low', isRead: false, createdAt: ago(0, 2) },
  { type: 'damaged', title: 'Damaged stock reported', message: '6 velvet ring boxes reported damaged at Mumbai Vault.', priority: 'medium', isRead: true, createdAt: ago(1, 7) },
  { type: 'salary', title: 'Salary slips generated', message: 'Salary slips for last month are ready to view.', priority: 'medium', isRead: true, createdAt: ago(3) },
  { type: 'attendance', title: 'Late arrivals today', message: '2 team members punched in after 10:15 AM.', priority: 'low', isRead: true, createdAt: ago(4) },
  { type: 'system', title: 'Welcome to Limelight Diamonds', message: 'This is a demo wireframe with sample data — explore freely!', priority: 'low', isRead: true, createdAt: ago(10) },
].map((n, i) => ({ _id: `n_${i + 1}`, ...n }));

// ─── Goals ───────────────────────────────────────────────────────────────────
const goalSeed = [
  ['Deliver bridal set to Sparkle Bridal House', 'p_6', 2, 'c_2', 'wh_1', ['u_5', 'u_6'], 'u_2', ahead(5), 'urgent', 'pending'],
  ['Tennis necklace for Grand Palace Boutique', 'p_7', 1, 'c_5', 'wh_1', ['u_6'], 'u_1', ahead(-6), 'high', 'pending'],
  ['Stud earrings restock – Aurum Fine Jewellers', 'p_9', 6, 'c_1', 'wh_3', ['u_5'], 'u_2', ahead(30), 'normal', 'ready_to_dispatch'],
  ['Lab-grown ovals for Lumière Luxury', 'p_3', 4, 'c_6', 'wh_2', ['u_5', 'u_8'], 'u_2', ahead(52), 'normal', 'pending'],
  ['Eternity bands – Heritage Jewels', 'p_12', 3, 'c_3', 'wh_2', ['u_8'], 'u_1', ahead(-30), 'high', 'dispatched'],
  ['Custom solitaire ring – Ms. Aditi Kulkarni', 'p_5', 1, 'c_4', 'wh_3', ['u_5'], 'u_7', ahead(-72), 'normal', 'delivered'],
];

export const goals = goalSeed.map(([title, productId, quantity, customerId, warehouseId, workerIds, byId, deadline, priority, status], i) => {
  const flow = ['pending', 'ready_to_dispatch', 'dispatched', 'delivered'];
  const steps = flow.slice(0, flow.indexOf(status) + 1);
  return {
    _id: `g_${i + 1}`, title, quantity, priority, status, deadline,
    product: productRef(productId), customer: cRef(customerId), warehouse: whRef(warehouseId),
    assignedWorkers: workerIds.map(userRef), assignedBy: userRef(byId),
    notes: 'Handle with insured courier; include grading certificate.',
    courierName: ['dispatched', 'delivered'].includes(status) ? 'BVC Logistics' : '',
    trackingNumber: ['dispatched', 'delivered'].includes(status) ? `BVC${48213 + i}` : '',
    statusTimeline: steps.map((s, si) => ({ _id: newId('tl'), status: s, changedBy: userRef(si === 0 ? byId : workerIds[0]), timestamp: ago(steps.length - si), note: si === 0 ? 'Goal created' : `Marked ${s.replace(/_/g, ' ')}` })),
    createdAt: ago(steps.length + 1),
  };
});

// ─── Attendance ──────────────────────────────────────────────────────────────
// Records for every user from the 1st of last month until yesterday. Today is left
// empty so the Punch In button can be tried live.
export const attendance = [];
(() => {
  const start = new Date(); start.setUTCMonth(start.getUTCMonth() - 1); start.setUTCDate(1);
  const today = dateStr(new Date());
  let k = 0;
  for (let d = new Date(start); dateStr(d) < today; d = new Date(d.getTime() + DAY)) {
    if (d.getUTCDay() === 0) continue; // Sunday off
    const ds = dateStr(d);
    users.forEach((u, ui) => {
      k++;
      const roll = (k * 7 + ui * 13) % 23;
      if (roll === 0) { attendance.push({ _id: newId('att'), employee: u._id, date: ds, status: 'absent', totalHours: 0 }); return; }
      if (roll === 5) { attendance.push({ _id: newId('att'), employee: u._id, date: ds, status: 'leave', leaveType: 'paid', isLeaveApproved: true, totalHours: 0 }); return; }
      const late = roll === 3 || roll === 11;
      const inT = new Date(`${ds}T${late ? '05:05' : '03:50'}:00Z`); // ~9:20 / 10:35 IST
      const hours = roll === 8 ? 4.5 : 8 + (roll % 3) * 0.5;
      const outT = new Date(inT.getTime() + hours * HOUR);
      attendance.push({
        _id: newId('att'), employee: u._id, date: ds, status: roll === 8 ? 'half_day' : late ? 'late' : 'present',
        isLate: late, lateByMinutes: late ? 35 : 0,
        punchInTime: inT.toISOString(), punchOutTime: outT.toISOString(),
        punchInLocation: { address: u.assignedWarehouse?.name || 'Office' }, punchOutLocation: { address: u.assignedWarehouse?.name || 'Office' },
        totalHours: hours, shortfallHours: Math.max(0, 8 - hours), overtimeHours: Math.max(0, hours - 8), shiftStandardHours: 8,
      });
    });
  }
  // Teammates (not the demo logins) already in today, so the team view looks alive
  ['u_3', 'u_6', 'u_7', 'u_8'].forEach((id, i) => {
    attendance.push({ _id: newId('att'), employee: id, date: today, status: i === 2 ? 'late' : 'present', isLate: i === 2, punchInTime: ago(0, 4 + i * 0.3), punchInLocation: { address: 'Mumbai Vault (BKC)' }, totalHours: 0 });
  });
})();

// ─── Salary slips ────────────────────────────────────────────────────────────
export function computeSlip(u, month, year, bonus = 0, overtimeOverride = null, generatedById = 'u_4') {
  const ss = u.salaryStructure || {};
  const workingDays = 26;
  const recs = attendance.filter((a) => a.employee === u._id && a.date.startsWith(`${year}-${String(month).padStart(2, '0')}`));
  const presentDays = recs.filter((r) => ['present', 'late'].includes(r.status)).length || 24;
  const halfDays = recs.filter((r) => r.status === 'half_day').length;
  const paidLeaveDays = recs.filter((r) => r.status === 'leave').length;
  const absentDays = recs.length ? recs.filter((r) => r.status === 'absent').length : 1;
  const unpaidLeaveDays = 0;
  const gross0 = (ss.basic || 0) + (ss.hra || 0) + (ss.allowances || 0);
  const dailyRate = Math.round(gross0 / workingDays);
  const hourlyRate = Math.round(dailyRate / 8);
  const actualHoursWorked = Math.round(recs.reduce((s, r) => s + (r.totalHours || 0), 0)) || presentDays * 8;
  const shortfallHours = Math.round(recs.reduce((s, r) => s + (r.shortfallHours || 0), 0) * 10) / 10;
  const overtimeHours = overtimeOverride ?? Math.round(recs.reduce((s, r) => s + (r.overtimeHours || 0), 0) * 10) / 10;
  const earnings = { basic: ss.basic || 0, hra: ss.hra || 0, allowances: ss.allowances || 0, bonus, overtime: Math.round(overtimeHours * hourlyRate * 1.5) };
  const unpaidLeaveDeduction = absentDays * dailyRate;
  const shiftShortfallDeduction = Math.round(shortfallHours * hourlyRate);
  const deductions = {
    pf: Math.round((ss.basic || 0) * (ss.pfRate || 12) / 100),
    tax: Math.round(gross0 * (ss.taxRate || 0) / 100),
    unpaidLeaveDeduction, shiftShortfallDeduction, leaveDeduction: unpaidLeaveDeduction, other: 0,
  };
  const grossEarnings = Object.values(earnings).reduce((a, b) => a + b, 0);
  const totalDeductions = deductions.pf + deductions.tax + unpaidLeaveDeduction + shiftShortfallDeduction;
  return {
    _id: newId('sl'),
    employee: { _id: u._id, name: u.name, designation: u.designation, role: u.role, email: u.email },
    month, year, payPeriod: `${new Date(year, month - 1).toLocaleString('en-IN', { month: 'long' })} ${year}`,
    workingDays, presentDays, halfDays, paidLeaveDays, unpaidLeaveDays, absentDays,
    standardHours: workingDays * 8, actualHoursWorked, shortfallHours, overtimeHours, hourlyRate, dailyRate,
    earnings, deductions, grossEarnings, totalDeductions, netPay: grossEarnings - totalDeductions,
    status: 'generated', generatedBy: userRef(generatedById), generatedAt: new Date().toISOString(),
  };
}

export const salarySlips = [];
(() => {
  const d = new Date();
  for (let back = 2; back >= 1; back--) {
    const m = new Date(d.getFullYear(), d.getMonth() - back, 1);
    users.forEach((u) => {
      const slip = computeSlip(u, m.getMonth() + 1, m.getFullYear(), back === 2 ? 0 : 2000);
      if (back === 2) { slip.status = 'paid'; slip.paidAt = ago(25); }
      slip.generatedAt = ago(back * 30 - 2);
      salarySlips.push(slip);
    });
  }
})();
