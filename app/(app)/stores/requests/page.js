'use client';
import { useState, useEffect } from 'react';
import {
  Send, Plus, Clock, CheckCircle, AlertTriangle, Store,
  Package, ChevronRight, Check, X, Filter, Warehouse
} from 'lucide-react';
import { storesApi, productsApi, warehousesApi } from '../../../../lib/api';
import Modal from '../../../../components/ui/Modal';
import StatusBadge from '../../../../components/ui/StatusBadge';
import { toast } from '../../../../components/ui/Toast';
import { formatDateTime, cn } from '../../../../lib/utils';
import useAuthStore from '../../../../lib/authStore';

function RequestForm({ stores = [], warehouses = [], products = [], onSave, onClose }) {
  const { user } = useAuthStore();
  const [storeId, setStoreId] = useState(user?.assignedStore?._id || stores[0]?._id || '');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?._id || 'wh_1');
  const [priority, setPriority] = useState('normal');
  const [requiredByDate, setRequiredByDate] = useState(() => {
    const d = new Date(Date.now() + 48 * 3600000);
    return d.toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { productId: products[0]?._id || '', quantity: 20 },
  ]);
  const [saving, setSaving] = useState(false);

  const addItemRow = () => {
    setItems((prev) => [...prev, { productId: products[0]?._id || '', quantity: 10 }]);
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
    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label text-xs">Requesting Showroom Store *</label>
          <select
            className="input select text-sm"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            required
          >
            {stores.map((s) => (
              <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label text-xs">Fulfillment Warehouse *</label>
          <select
            className="input select text-sm"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            required
          >
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label text-xs">Urgency Priority</label>
          <select
            className="input select text-sm"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="normal">Normal Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent (Stockout imminent)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="label text-xs">Needed By Date & Time *</label>
          <input
            type="datetime-local"
            className="input text-sm"
            value={requiredByDate}
            onChange={(e) => setRequiredByDate(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
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
            <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
              <div className="flex-1">
                <select
                  className="input select text-xs bg-white"
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
              <div className="w-28">
                <input
                  type="number"
                  min="1"
                  className="input text-xs bg-white text-center font-bold"
                  placeholder="Qty"
                  value={it.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  required
                />
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

      <div className="form-group">
        <label className="label text-xs">Showroom Justification / Notes</label>
        <textarea
          className="input h-16 resize-none text-sm"
          placeholder="e.g. Festival weekend showcase setup; high box consumption expected."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <button type="button" className="btn-secondary flex-1 text-xs" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1 text-xs" disabled={saving}>
          {saving ? 'Submitting...' : 'Submit Stock Request'}
        </button>
      </div>
    </form>
  );
}

export default function StoreRequestsPage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [stores, setStores] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reqRes, stRes, whRes, prodRes] = await Promise.all([
        storesApi.getRequests({ status: filterStatus }),
        storesApi.getAll(),
        warehousesApi.getAll(),
        productsApi.getAll({ limit: 100 }),
      ]);
      setRequests(reqRes.data.data || []);
      setStores(stRes.data.data || []);
      setWarehouses(whRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [filterStatus]);

  const handleApprove = async (id) => {
    try {
      await storesApi.updateRequestStatus(id, { status: 'approved', notes: 'Approved for packing' });
      toast('Request approved! Transferred to dispatch staging.', 'success');
      fetchAll();
    } catch {
      toast('Failed to approve request', 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      await storesApi.updateRequestStatus(id, { status: 'rejected', notes: 'Capacity or stock constraint' });
      toast('Request rejected', 'info');
      fetchAll();
    } catch {}
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
              <th>Target Warehouse</th>
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
                  <td className="text-gray-600">{r.destinationWarehouse?.name}</td>
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
                          onClick={() => handleApprove(r._id)}
                          className="btn-success btn-sm py-1 px-2 text-xs flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(r._id)}
                          className="btn-danger btn-sm py-1 px-2 text-xs flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    ) : r.status === 'approved' ? (
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> In Dispatch Queue
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400 capitalize">{r.status}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
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
    </div>
  );
}

