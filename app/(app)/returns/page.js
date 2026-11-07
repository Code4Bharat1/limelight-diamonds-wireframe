'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw, Plus, Store, Check, X, CheckCircle, Package,
  AlertTriangle, Warehouse, UserCheck, Shield
} from 'lucide-react';
import { returnsApi, storesApi, warehousesApi, productsApi } from '../../../lib/api';
import Modal from '../../../components/ui/Modal';
import StatusBadge from '../../../components/ui/StatusBadge';
import { toast } from '../../../components/ui/Toast';
import { formatDateTime } from '../../../lib/utils';
import useAuthStore from '../../../lib/authStore';

function ReturnForm({ stores = [], warehouses = [], products = [], onSave, onClose }) {
  const { user } = useAuthStore();
  const [storeId, setStoreId] = useState(user?.assignedStore?._id || stores[0]?._id || '');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?._id || 'wh_1');
  const [reason, setReason] = useState('Surplus store inventory returned to central warehouse');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { productId: products[0]?._id || '', quantity: 5, condition: 'good' },
  ]);
  const [saving, setSaving] = useState(false);

  const addItemRow = () => {
    setItems((prev) => [...prev, { productId: products[0]?._id || '', quantity: 2, condition: 'good' }]);
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
      await returnsApi.create({
        storeId,
        warehouseId,
        reason,
        notes,
        items,
      });
      toast('Store return logged for central warehouse inspection!', 'success');
      onSave();
    } catch {
      toast('Failed to record return', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto text-xs">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label text-xs">Originating Retail Store *</label>
          <select
            className="input select text-xs"
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
          <label className="label text-xs">Destination Warehouse Hub *</label>
          <select
            className="input select text-xs"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            required
          >
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <label className="label text-xs font-bold text-gray-800 mb-0">
            Returned Items & Condition
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
            <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <div className="flex-1">
                <select
                  className="input select text-xs bg-white"
                  value={it.productId}
                  onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                  required
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.sku} — {p.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-20">
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
              <div className="w-32">
                <select
                  className="input select text-xs bg-white"
                  value={it.condition}
                  onChange={(e) => updateItem(idx, 'condition', e.target.value)}
                >
                  <option value="good">Good Condition</option>
                  <option value="defective">Defective / Damaged</option>
                  <option value="needs_refurbish">Needs Polish / Cleaning</option>
                </select>
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
        <label className="label text-xs">Return Reason *</label>
        <select
          className="input select text-xs"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option value="Surplus store inventory returned to central warehouse">Surplus store stock</option>
          <option value="Seasonal visual merchandising & display end">Seasonal VM display end</option>
          <option value="Damaged/defective packaging returned for vendor claim">Defective packaging for vendor claim</option>
          <option value="Customer return / exchange packaging">Customer exchange return</option>
        </select>
      </div>

      <div className="form-group">
        <label className="label text-xs">Courier / Dispatch Notes</label>
        <textarea
          className="input h-14 resize-none text-xs"
          placeholder="e.g. Returned via weekly store logistics van."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <button type="button" className="btn-secondary flex-1 text-xs" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1 text-xs" disabled={saving}>
          {saving ? 'Submitting...' : 'Register Return for Warehouse Inspection'}
        </button>
      </div>
    </form>
  );
}

export default function ReturnsPage() {
  const [returnsList, setReturnsList] = useState([]);
  const [stores, setStores] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const [retRes, stRes, whRes, prodRes] = await Promise.all([
        returnsApi.getAll(),
        storesApi.getAll(),
        warehousesApi.getAll(),
        productsApi.getAll({ limit: 100 }),
      ]);
      setReturnsList(retRes.data.data || []);
      setStores(stRes.data.data || []);
      setWarehouses(whRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const handleApproveRestock = async (id) => {
    try {
      await returnsApi.inspectAndApprove(id, {
        status: 'approved_restock',
        comment: 'Items inspected and restocked into central warehouse inventory',
      });
      toast('Return approved! Stock credited back to central warehouse.', 'success');
      fetchReturns();
    } catch {
      toast('Failed to approve return', 'error');
    }
  };

  const handleApproveDamage = async (id) => {
    try {
      await returnsApi.inspectAndApprove(id, {
        status: 'approved_damage',
        comment: 'Items confirmed defective; routed to damage claims',
      });
      toast('Items routed to damage write-off & vendor claims.', 'info');
      fetchReturns();
    } catch {
      toast('Failed to update', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Store & Customer Returns Management</h1>
          <p className="text-gray-500 text-xs">
            Return workflows from retail stores back to central warehouse with condition inspection & approval
          </p>
        </div>
        <button
          className="btn-primary btn-sm flex items-center gap-1.5 text-xs"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" /> Initiate Store Return
        </button>
      </div>

      {/* Returns Table */}
      <div className="table-wrapper card p-0">
        <table className="table text-xs">
          <thead>
            <tr>
              <th>Return No.</th>
              <th>Originating Store</th>
              <th>Receiving Warehouse</th>
              <th>Returned Items</th>
              <th>Condition</th>
              <th>Inspection Status</th>
              <th>Date</th>
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
            ) : returnsList.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  <RotateCcw className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  No returns registered yet.
                </td>
              </tr>
            ) : (
              returnsList.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50/80">
                  <td className="font-mono font-bold text-gray-900">{r.returnNumber}</td>
                  <td>
                    <div className="font-semibold text-gray-900">{r.store?.name}</div>
                    <div className="text-[10px] text-gray-400">{r.store?.code}</div>
                  </td>
                  <td className="text-gray-600">{r.warehouse?.name}</td>
                  <td>
                    <div className="space-y-0.5">
                      {r.items?.map((it, idx) => (
                        <div key={idx} className="font-medium text-gray-800">
                          {it.quantity}× {it.product?.name}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-gray-100 text-gray-700 text-[10px] capitalize">
                      {r.items?.[0]?.condition || 'good'}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="text-gray-400 text-[11px]">{formatDateTime(r.createdAt)}</td>
                  <td>
                    {r.status === 'pending_inspection' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApproveRestock(r._id)}
                          className="btn-success btn-sm py-1 px-2 text-xs flex items-center gap-1"
                          title="Approve for Warehouse Restock"
                        >
                          <Check className="w-3 h-3" /> Restock
                        </button>
                        <button
                          onClick={() => handleApproveDamage(r._id)}
                          className="btn-danger btn-sm py-1 px-2 text-xs flex items-center gap-1"
                          title="Mark Damaged"
                        >
                          <X className="w-3 h-3" /> To Damage
                        </button>
                      </div>
                    ) : (
                      <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Inspected
                      </span>
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
        title="Register Store Return to Central Warehouse"
        size="lg"
      >
        <ReturnForm
          stores={stores}
          warehouses={warehouses}
          products={products}
          onSave={() => {
            setModalOpen(false);
            fetchReturns();
          }}
          onClose={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
