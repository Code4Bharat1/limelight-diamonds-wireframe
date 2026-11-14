'use client';
import { useState, useEffect } from 'react';
import {
  Send, Plus, Clock, CheckCircle, AlertTriangle, Store,
  Package, ChevronRight, Check, X, Filter, Warehouse, User,
  UserCheck, Eye, FileText, CheckCircle2, Shield, Sparkles
} from 'lucide-react';
import { storesApi, productsApi, warehousesApi, usersApi } from '../../../../lib/api';
import Modal from '../../../../components/ui/Modal';
import StatusBadge from '../../../../components/ui/StatusBadge';
import { toast } from '../../../../components/ui/Toast';
import { formatDateTime, cn } from '../../../../lib/utils';
import useAuthStore from '../../../../lib/authStore';

function RequestForm({ stores = [], warehouses = [], products = [], onSave, onClose }) {
  const { user } = useAuthStore();
  const isStoreMgr = user?.role === 'store_manager' || !!user?.assignedStore;
  const initialStoreId = user?.assignedStore?._id || stores[0]?._id || 'str_1';

  const [storeId, setStoreId] = useState(initialStoreId);
  const [allowStoreChange, setAllowStoreChange] = useState(!isStoreMgr);
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?._id || 'wh_1');
  const [priority, setPriority] = useState('normal');
  const [selectedDatePreset, setSelectedDatePreset] = useState('48h');
  const [requiredByDate, setRequiredByDate] = useState(() => {
    const d = new Date(Date.now() + 48 * 3600000);
    return d.toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { productId: products[0]?._id || 'p_1', quantity: 20 },
  ]);
  const [saving, setSaving] = useState(false);

  const selectedStore = stores.find((s) => s._id === storeId) || user?.assignedStore;

  const handleDatePreset = (presetKey) => {
    setSelectedDatePreset(presetKey);
    let ms = 48 * 3600000;
    if (presetKey === 'tomorrow') ms = 24 * 3600000;
    if (presetKey === '48h') ms = 48 * 3600000;
    if (presetKey === 'weekend') ms = 72 * 3600000;
    const targetDate = new Date(Date.now() + ms);
    targetDate.setHours(12, 0, 0, 0);
    setRequiredByDate(targetDate.toISOString().slice(0, 16));
  };

  const handleApplyBundle = (bundleType) => {
    if (bundleType === 'rings_and_bags') {
      const ringBox = products.find((p) => p.sku === 'PKG-BX-RNG-01') || products[0];
      const carryBag = products.find((p) => p.sku === 'PKG-BAG-MD-02') || products[1];
      setItems([
        { productId: ringBox?._id || 'p_1', quantity: 30 },
        { productId: carryBag?._id || 'p_11', quantity: 20 },
      ]);
      setNotes((prev) => prev || 'Showroom ring box & customer carry bag replenishment');
    } else if (bundleType === 'full_kit') {
      const ringBox = products.find((p) => p.sku === 'PKG-BX-RNG-01') || products[0];
      const nckBox = products.find((p) => p.sku === 'PKG-BX-NCK-02') || products[1];
      const bag = products.find((p) => p.sku === 'PKG-BAG-MD-02') || products[2];
      const cloth = products.find((p) => p.sku === 'ACC-CLOTH-01') || products[3];
      setItems([
        { productId: ringBox?._id || 'p_1', quantity: 20 },
        { productId: nckBox?._id || 'p_2', quantity: 10 },
        { productId: bag?._id || 'p_11', quantity: 25 },
        { productId: cloth?._id || 'p_14', quantity: 25 },
      ]);
      setNotes((prev) => prev || 'Complete monthly counter restock bundle');
    }
  };

  const addItemRow = () => {
    const nextProd = products.find((p) => !items.some((it) => it.productId === p._id)) || products[0];
    setItems((prev) => [...prev, { productId: nextProd?._id || '', quantity: 10 }]);
  };

  const removeItemRow = (idx) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const adjustQty = (idx, delta) => {
    setItems((prev) => {
      const copy = [...prev];
      const cur = Number(copy[idx].quantity) || 1;
      copy[idx] = { ...copy[idx], quantity: Math.max(1, cur + delta) };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await storesApi.createRequest({
        storeId,
        warehouseId,
        items,
        priority,
        requiredByDate,
        notes,
      });
      toast('Store stock request submitted to Central Warehouse!', 'success');
      onSave();
    } catch {
      toast('Failed to submit request', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto text-xs">
      {/* ─── Store Manager Auto-Config Banner (Minimum Input) ─── */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-brand-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">
                {selectedStore?.name || 'Limelight Showroom - Bandra'}
              </span>
              <span className="badge bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                {selectedStore?.code || 'STR-MUM-01'}
              </span>
            </div>
            <div className="text-gray-500 text-[11px] flex items-center gap-2 mt-0.5">
              <span>Manager: <strong className="text-gray-700">{user?.name || 'Pooja Verma'}</strong></span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">Showroom Auto-Assigned</span>
            </div>
          </div>
        </div>

        {!allowStoreChange ? (
          <button
            type="button"
            onClick={() => setAllowStoreChange(true)}
            className="text-[11px] text-emerald-700 hover:text-emerald-900 underline font-semibold"
          >
            Change Showroom
          </button>
        ) : (
          <div className="w-48">
            <select
              className="input select text-xs bg-white py-1"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            >
              {stores.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Fulfillment Warehouse & Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="form-group">
          <label className="label text-xs font-bold text-gray-700">Fulfillment Warehouse Hub *</label>
          <select
            className="input select text-xs bg-white font-medium"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            required
          >
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>{w.name} ({w.city})</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label text-xs font-bold text-gray-700">Urgency Priority</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'normal', label: 'Normal', color: 'border-gray-200 hover:bg-gray-50', active: 'bg-gray-800 text-white border-gray-800' },
              { id: 'high', label: 'High', color: 'border-amber-200 bg-amber-50/50 text-amber-800 hover:bg-amber-100', active: 'bg-amber-600 text-white border-amber-600' },
              { id: 'urgent', label: 'Urgent', color: 'border-red-200 bg-red-50/50 text-red-800 hover:bg-red-100', active: 'bg-red-600 text-white border-red-600' },
            ].map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPriority(p.id)}
                className={cn(
                  'py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center',
                  priority === p.id ? p.active : p.color
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Needed By Date Presets (1-Click) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="label text-xs font-bold text-gray-700 mb-0">Needed By Schedule</label>
          <span className="text-[10px] text-gray-400">1-Tap Delivery Timelines</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {[
            { id: 'tomorrow', label: '⚡ Tomorrow 12 PM' },
            { id: '48h', label: '📅 Within 48 Hours' },
            { id: 'weekend', label: '📦 Weekend Restock' },
          ].map((preset) => (
            <button
              type="button"
              key={preset.id}
              onClick={() => handleDatePreset(preset.id)}
              className={cn(
                'py-1 px-2 rounded-lg text-[11px] font-semibold border transition-all',
                selectedDatePreset === preset.id
                  ? 'border-brand-600 bg-brand-50 text-brand-800 shadow-2xs'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
              )}
            >
              {preset.label}
            </button>
          ))}
          <input
            type="datetime-local"
            className="input text-[11px] py-1 bg-white"
            value={requiredByDate}
            onChange={(e) => {
              setRequiredByDate(e.target.value);
              setSelectedDatePreset('custom');
            }}
            required
          />
        </div>
      </div>

      {/* ─── Fast Restock Bundles (1-Click) ─── */}
      <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Quick Restock Bundles:
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleApplyBundle('rings_and_bags')}
            className="px-2 py-0.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 text-[10px] font-semibold text-gray-700"
          >
            + Solitaire Rings & Carry Bags Kit
          </button>
          <button
            type="button"
            onClick={() => handleApplyBundle('full_kit')}
            className="px-2 py-0.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 text-[10px] font-semibold text-gray-700"
          >
            + Full Showroom Counter Bundle
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2 pt-1 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <label className="label text-xs font-bold text-gray-800 mb-0">
            Requested SKUs & Quantities
          </label>
          <button
            type="button"
            onClick={addItemRow}
            className="text-xs text-brand-700 font-bold hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Another SKU
          </button>
        </div>

        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-gray-50/80 p-2.5 rounded-xl border border-gray-200">
              <div className="flex-1">
                <select
                  className="input select text-xs bg-white font-medium"
                  value={it.productId}
                  onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                  required
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.sku} — {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Stepper with +/- */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustQty(idx, -5)}
                  className="w-6 h-6 rounded-md bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-[10px]"
                >
                  -5
                </button>
                <input
                  type="number"
                  min="1"
                  className="w-16 h-7 input text-xs bg-white text-center font-bold py-0"
                  value={it.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => adjustQty(idx, 5)}
                  className="w-6 h-6 rounded-md bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-[10px]"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => adjustQty(idx, 20)}
                  className="px-1.5 h-6 rounded-md bg-white border border-gray-200 hover:bg-gray-50 text-[10px] font-semibold text-gray-600"
                >
                  +20
                </button>
              </div>

              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItemRow(idx)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Notes Chips */}
      <div className="space-y-1.5">
        <label className="label text-xs font-bold text-gray-700">Showroom Justification / Notes</label>
        <div className="flex flex-wrap gap-1.5 mb-1">
          {['Weekend footfall preparation', 'Bridal season counter restock', 'VIP client order fulfillment', 'Safety buffer restock'].map((tag, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setNotes((prev) => (prev ? `${prev} · ${tag}` : tag))}
              className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              + {tag}
            </button>
          ))}
        </div>
        <textarea
          className="input h-14 resize-none text-xs"
          placeholder="e.g. Festival weekend showcase setup; high box consumption expected."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <button type="button" className="btn-secondary flex-1 text-xs" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1 text-xs font-bold" disabled={saving}>
          {saving ? 'Submitting...' : 'Submit Stock Request'}
        </button>
      </div>
    </form>
  );
}

const COMMON_STORE_REJECT_REASONS = [
  'Insufficient stock at central warehouse',
  'Store currently at maximum inventory capacity',
  'Duplicate replenishment request',
  'Seasonal packaging cutoff date passed',
  'Cancelled by showroom store manager',
];

export default function StoreRequestsPage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [stores, setStores] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Approval & Assignment Modal state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [requestToApprove, setRequestToApprove] = useState(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approving, setApproving] = useState(false);
  const [approvalError, setApprovalError] = useState('');

  // Rejection Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [requestToReject, setRequestToReject] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState('');

  // View Details Modal state
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reqRes, stRes, whRes, prodRes, usersRes] = await Promise.all([
        storesApi.getRequests({ status: filterStatus }),
        storesApi.getAll(),
        warehousesApi.getAll(),
        productsApi.getAll({ limit: 100 }),
        usersApi.getAll({ limit: 100 }),
      ]);
      setRequests(reqRes.data.data || []);
      setStores(stRes.data.data || []);
      setWarehouses(whRes.data.data || []);
      setProducts(prodRes.data.data || []);

      const allUsers = usersRes.data.data || [];
      const staffMembers = allUsers.filter((u) =>
        ['warehouse_staff', 'worker', 'warehouse_manager'].includes(u.role)
      );
      setWorkers(staffMembers.length > 0 ? staffMembers : allUsers);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [filterStatus]);

  const handleOpenApproveModal = (req) => {
    setRequestToApprove(req);
    const targetWhId = req.destinationWarehouse?._id || warehouses[0]?._id || 'wh_1';
    setSelectedWarehouseId(targetWhId);

    if (req.assignedWorker?._id) {
      setSelectedWorkerId(req.assignedWorker._id);
    } else {
      const whWorkers = workers.filter((w) => w.assignedWarehouse?._id === targetWhId);
      setSelectedWorkerId(whWorkers.length > 0 ? whWorkers[0]._id : (workers[0]?._id || ''));
    }

    setApprovalNotes('Approved for picking, packing & staging');
    setApprovalError('');
    setApproveModalOpen(true);
  };

  const handleConfirmApprove = async (e) => {
    if (e) e.preventDefault();
    if (!selectedWarehouseId) {
      setApprovalError('Please select a fulfillment warehouse.');
      return;
    }
    if (!selectedWorkerId) {
      setApprovalError('Please select a worker to assign this stock request.');
      return;
    }

    setApproving(true);
    try {
      await storesApi.updateRequestStatus(requestToApprove._id, {
        status: 'approved',
        warehouseId: selectedWarehouseId,
        workerId: selectedWorkerId,
        notes: approvalNotes.trim() || 'Approved for packing',
      });
      const workerObj = workers.find((w) => w._id === selectedWorkerId);
      const whObj = warehouses.find((w) => w._id === selectedWarehouseId);
      toast(`Stock request approved & assigned to ${workerObj?.name || 'Worker'} at ${whObj?.name || 'Warehouse'}!`, 'success');
      setApproveModalOpen(false);
      setRequestToApprove(null);
      fetchAll();
    } catch {
      toast('Failed to approve request', 'error');
    } finally {
      setApproving(false);
    }
  };

  const handleOpenRejectModal = (req) => {
    setRequestToReject(req);
    setRejectNotes('');
    setRejectError('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    if (e) e.preventDefault();
    if (!rejectNotes.trim()) {
      setRejectError('Please enter a note explaining why this request is being rejected.');
      return;
    }
    setRejecting(true);
    try {
      await storesApi.updateRequestStatus(requestToReject._id, {
        status: 'rejected',
        notes: `Rejected: ${rejectNotes.trim()}`,
      });
      toast('Request rejected and note recorded', 'info');
      setRejectModalOpen(false);
      setRequestToReject(null);
      fetchAll();
    } catch {
      toast('Failed to reject request', 'error');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Store Replenishment Requests</h1>
          <p className="text-gray-500 text-xs">
            Showroom store replenishment workflow from central warehouses
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary btn-sm flex items-center gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Create Stock Request
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['all', 'pending', 'approved', 'fulfilled', 'rejected'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              filterStatus === st
                ? 'bg-brand-700 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="table-wrapper card p-0">
        <table className="table text-xs">
          <thead>
            <tr>
              <th>Request No.</th>
              <th>Showroom Store</th>
              <th>Target Warehouse & Worker</th>
              <th>Requested Items</th>
              <th>Priority</th>
              <th>Required By</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  <Send className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  No store stock requests found.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50/80">
                  <td className="font-mono font-bold text-gray-900">{r.requestNumber}</td>
                  <td>
                    <div className="font-semibold text-gray-900">{r.store?.name}</div>
                    <div className="text-[10px] text-gray-400">Req by: {r.requestedBy?.name || 'Store Staff'}</div>
                  </td>
                  <td>
                    <div className="font-semibold text-gray-800">{r.destinationWarehouse?.name}</div>
                    {r.assignedWorker ? (
                      <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold">
                        <User className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Assigned: {r.assignedWorker.name}</span>
                      </div>
                    ) : r.status === 'approved' ? (
                      <span className="text-[10px] text-amber-600 font-medium">Pending worker assign</span>
                    ) : null}
                  </td>
                  <td>
                    <div className="font-bold text-gray-900">
                      {r.items?.reduce((s, i) => s + (i.requestedQty || 0), 0)} units
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {r.items?.map((it) => `${it.product?.name?.split(' ')[0]} (${it.requestedQty})`).join(', ')}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={r.priority} />
                  </td>
                  <td className="text-gray-500">{formatDateTime(r.requiredByDate)}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    {r.status === 'pending' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenApproveModal(r)}
                          className="btn-success btn-sm py-1 px-2.5 text-xs flex items-center gap-1 shadow-sm font-semibold"
                          title="Approve & Assign to Worker"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleOpenRejectModal(r)}
                          className="btn-danger btn-sm py-1 px-2 text-xs flex items-center gap-1"
                          title="Reject Request"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    ) : r.status === 'approved' ? (
                      <div className="flex items-center gap-2">
                        <div>
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> In Dispatch Queue
                          </span>
                          {r.assignedWorker && (
                            <div className="text-[10px] text-gray-500">
                              Worker: <span className="font-medium text-gray-700">{r.assignedWorker.name}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleOpenApproveModal(r)}
                          className="btn-ghost btn-sm p-1 text-gray-400 hover:text-brand-700"
                          title="Reassign Worker or Warehouse"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-500 capitalize">{r.status}</span>
                        <button
                          onClick={() => setSelectedRequest(r)}
                          className="btn-ghost btn-sm p-1 text-gray-400 hover:text-gray-700"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Submit New Stock Request Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Submit New Store Replenishment Request"
        size="lg"
      >
        <RequestForm
          stores={stores}
          warehouses={warehouses}
          products={products}
          onSave={() => {
            setModalOpen(false);
            fetchAll();
          }}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

      {/* Approve & Assign Worker Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => {
          if (!approving) {
            setApproveModalOpen(false);
            setRequestToApprove(null);
            setApprovalError('');
          }
        }}
        title="Approve & Assign Stock Request"
        size="lg"
      >
        {requestToApprove && (
          <form onSubmit={handleConfirmApprove} className="p-6 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
            {/* Request Summary Card */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-900 text-sm">{requestToApprove.requestNumber}</span>
                  <StatusBadge status={requestToApprove.priority} />
                </div>
                <span className="text-gray-500 text-[11px]">
                  Needed by: <strong className="text-gray-800">{formatDateTime(requestToApprove.requiredByDate)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-200/50">
                <div>
                  <span className="text-gray-500">Destination Store:</span>{' '}
                  <span className="font-bold text-gray-900">{requestToApprove.store?.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Requested Units:</span>{' '}
                  <span className="font-bold text-brand-800">
                    {requestToApprove.items?.reduce((s, i) => s + (i.requestedQty || 0), 0)} units
                  </span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {requestToApprove.items?.map((it, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-white border border-emerald-200 rounded-md text-[10px] text-gray-700 font-medium">
                    {it.product?.name || 'SKU'} × <strong className="text-brand-900">{it.requestedQty}</strong>
                  </span>
                ))}
              </div>

              {requestToApprove.notes && (
                <div className="text-[10px] text-gray-600 bg-white/80 p-2 rounded border border-emerald-100 italic">
                  Showroom note: "{requestToApprove.notes}"
                </div>
              )}
            </div>

            {/* Section 1: Fulfillment Warehouse Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="label text-xs font-bold text-gray-800 mb-0 flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-brand-700" />
                  1. Fulfillment Warehouse Facility <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-gray-400">Warehouse responsible for dispatch</span>
              </div>
              <select
                className="input select text-xs font-medium bg-white"
                value={selectedWarehouseId}
                onChange={(e) => {
                  const whId = e.target.value;
                  setSelectedWarehouseId(whId);
                  // If current worker is not stationed here, auto-switch to a worker at this warehouse if one exists
                  const whWorkers = workers.filter((w) => w.assignedWarehouse?._id === whId);
                  if (whWorkers.length > 0 && !whWorkers.some((w) => w._id === selectedWorkerId)) {
                    setSelectedWorkerId(whWorkers[0]._id);
                  }
                  if (approvalError) setApprovalError('');
                }}
                required
              >
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.location || w.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Section 2: Worker Assignment */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="label text-xs font-bold text-gray-800 mb-0 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  2. Assigned Warehouse Worker <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-gray-500">
                  {workers.length} workers available
                </span>
              </div>

              {/* Dropdown selector */}
              <select
                className="input select text-xs font-semibold bg-white"
                value={selectedWorkerId}
                onChange={(e) => {
                  setSelectedWorkerId(e.target.value);
                  if (approvalError) setApprovalError('');
                }}
                required
              >
                <option value="" disabled>-- Select a Worker --</option>
                {workers.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} — {w.designation || 'Warehouse Staff'} {w.assignedWarehouse?.name ? `[${w.assignedWarehouse.name.split('–')[0]?.trim()}]` : ''}
                  </option>
                ))}
              </select>

              {/* Interactive Worker Cards Grid */}
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 font-medium">Or select worker from roster:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-gray-50 rounded-xl border border-gray-200">
                  {workers.map((w) => {
                    const isSelected = selectedWorkerId === w._id;
                    const isAtSelectedWh = w.assignedWarehouse?._id === selectedWarehouseId;
                    return (
                      <button
                        key={w._id}
                        type="button"
                        onClick={() => {
                          setSelectedWorkerId(w._id);
                          if (approvalError) setApprovalError('');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/80'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {w.name?.charAt(0) || 'W'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 truncate text-[11px]">{w.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">{w.designation || 'Warehouse Staff'}</div>
                          <div className="mt-1 flex items-center gap-1">
                            {isAtSelectedWh ? (
                              <span className="badge bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0 font-medium">
                                ✓ Stationed at this warehouse
                              </span>
                            ) : w.assignedWarehouse?.name ? (
                              <span className="badge bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0 truncate">
                                {w.assignedWarehouse.name.split('–')[0]?.trim()}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {approvalError && (
                <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {approvalError}
                </p>
              )}
            </div>

            {/* Section 3: Dispatch & Packing Notes */}
            <div className="form-group pt-2 border-t border-gray-100">
              <label className="label text-xs font-bold text-gray-800">
                Instructions / Notes for Worker
              </label>
              <textarea
                className="input h-16 resize-none text-xs"
                placeholder="e.g. Pack with moisture protection; stage for morning courier pickup..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                className="btn-secondary flex-1 text-xs"
                onClick={() => {
                  setApproveModalOpen(false);
                  setRequestToApprove(null);
                  setApprovalError('');
                }}
                disabled={approving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-success flex-1 text-xs flex items-center justify-center gap-1.5 font-semibold"
                disabled={approving || !selectedWorkerId || !selectedWarehouseId}
              >
                {approving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Approving & Assigning...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Assign to Worker</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Reject Request Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          if (!rejecting) {
            setRejectModalOpen(false);
            setRequestToReject(null);
            setRejectNotes('');
            setRejectError('');
          }
        }}
        title="Reject Store Stock Request"
        size="md"
      >
        {requestToReject && (
          <form onSubmit={handleConfirmReject} className="p-6 space-y-4 text-xs">
            {/* Summary */}
            <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-red-950 text-xs">{requestToReject.requestNumber}</span>
                <span className="text-gray-600 font-medium">({requestToReject.store?.name})</span>
              </div>
              <div className="text-[11px] text-gray-600">
                Requested: <strong className="text-gray-900">{requestToReject.items?.reduce((s, i) => s + (i.requestedQty || 0), 0)} units</strong>
              </div>
            </div>

            {/* Note Input */}
            <div className="space-y-2">
              <label className="label text-xs font-bold text-gray-800">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>

              {/* Quick Preset Reasons */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1.5 font-medium">Quick Select Reason:</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_STORE_REJECT_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => {
                        setRejectNotes(reason);
                        setRejectError('');
                      }}
                      className="px-2 py-1 rounded-lg border border-gray-200 bg-gray-50 text-[10px] text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors text-left"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className={`input min-h-[85px] resize-none text-xs w-full ${rejectError ? 'border-red-500' : ''}`}
                placeholder="Enter a reason explaining why this store request cannot be fulfilled..."
                value={rejectNotes}
                onChange={(e) => {
                  setRejectNotes(e.target.value);
                  if (rejectError) setRejectError('');
                }}
                rows={3}
                autoFocus
              />

              {rejectError && (
                <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {rejectError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                className="btn-secondary flex-1 text-xs"
                onClick={() => {
                  setRejectModalOpen(false);
                  setRequestToReject(null);
                  setRejectNotes('');
                  setRejectError('');
                }}
                disabled={rejecting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-danger flex-1 text-xs flex items-center justify-center gap-1.5"
                disabled={rejecting || !rejectNotes.trim()}
              >
                {rejecting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Request Details Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={`Store Replenishment Request — ${selectedRequest?.requestNumber}`}
        size="md"
      >
        {selectedRequest && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <div className="font-semibold text-sm text-gray-900">{selectedRequest.store?.name}</div>
                <div className="text-[11px] text-gray-500">Requested by {selectedRequest.requestedBy?.name || 'Store Staff'}</div>
              </div>
              <StatusBadge status={selectedRequest.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div>
                <span className="text-gray-400 block text-[10px]">Fulfillment Warehouse</span>
                <span className="font-semibold text-gray-800">{selectedRequest.destinationWarehouse?.name}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Assigned Worker</span>
                <span className="font-semibold text-emerald-700">
                  {selectedRequest.assignedWorker?.name || 'Not assigned yet'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Priority</span>
                <StatusBadge status={selectedRequest.priority} />
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Required By Date</span>
                <span className="font-medium text-gray-700">{formatDateTime(selectedRequest.requiredByDate)}</span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-1.5">
              <span className="font-bold text-gray-700 block">Requested Items</span>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="table text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th className="text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRequest.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="font-medium text-gray-900">{it.product?.name}</td>
                        <td className="font-mono text-[10px] text-gray-500">{it.product?.sku}</td>
                        <td className="text-right font-bold text-gray-900">{it.requestedQty} {it.product?.unit || 'pcs'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedRequest.notes && (
              <div className="space-y-1">
                <span className="font-bold text-gray-700 block">Notes & Activity Log</span>
                <p className="text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-200 whitespace-pre-wrap">
                  {selectedRequest.notes}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                className="btn-secondary text-xs px-4"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

