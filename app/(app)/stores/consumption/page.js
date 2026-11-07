'use client';
import { useState, useEffect } from 'react';
import {
  ShoppingBag, Plus, Calendar, Store, Package, CheckCircle,
  Clock, Laptop, Tag, ArrowUpFromLine
} from 'lucide-react';
import { storesApi, productsApi } from '../../../../lib/api';
import Modal from '../../../../components/ui/Modal';
import { toast } from '../../../../components/ui/Toast';
import { formatDateTime, formatDate } from '../../../../lib/utils';
import useAuthStore from '../../../../lib/authStore';

function ConsumptionForm({ stores = [], products = [], onSave, onClose }) {
  const { user } = useAuthStore();
  const [storeId, setStoreId] = useState(user?.assignedStore?._id || stores[0]?._id || '');
  const [purpose, setPurpose] = useState('POS Billing');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { productId: products[0]?._id || '', quantity: 5, purpose: 'Solitaire Ring Sales' },
  ]);
  const [saving, setSaving] = useState(false);

  const addItemRow = () => {
    setItems((prev) => [...prev, { productId: products[0]?._id || '', quantity: 5, purpose: 'Daily Showroom Usage' }]);
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
      await storesApi.logConsumption({
        storeId,
        purpose,
        notes,
        items,
      });
      toast('Store packaging consumption logged and deducted from store stock!', 'success');
      onSave();
    } catch {
      toast('Failed to record consumption', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label text-xs">Showroom Store *</label>
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
          <label className="label text-xs">Primary Purpose</label>
          <select
            className="input select text-sm"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          >
            <option value="POS Billing">Customer POS Diamond Billing</option>
            <option value="Showroom Display Refresh">Showroom Showcase Refresh</option>
            <option value="VIP Customer Gifting">VIP Client Gifting Hamper</option>
            <option value="Store Counter Maintenance">Store Counter Maintenance</option>
          </select>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <label className="label text-xs font-bold text-gray-800 mb-0">
            Consumed Packaging & Items
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
                    <option key={p._id} value={p._id}>
                      {p.sku} — {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
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
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="label text-xs">Remarks / Invoice Bill Reference</label>
        <input
          className="input text-sm"
          placeholder="e.g. Sales bills BILL-9021 to 9026"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <button type="button" className="btn-secondary flex-1 text-xs" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1 text-xs" disabled={saving}>
          {saving ? 'Deducting...' : 'Confirm & Deduct Stock'}
        </button>
      </div>
    </form>
  );
}

export default function StoreConsumptionPage() {
  const [consumptions, setConsumptions] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStore, setFilterStore] = useState('all');

  const fetchConsumptions = async () => {
    setLoading(true);
    try {
      const [conRes, stRes, prodRes] = await Promise.all([
        storesApi.getConsumptions({ storeId: filterStore === 'all' ? undefined : filterStore }),
        storesApi.getAll(),
        productsApi.getAll({ limit: 100 }),
      ]);
      setConsumptions(conRes.data.data || []);
      setStores(stRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchConsumptions();
  }, [filterStore]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Store Daily Packaging Consumption</h1>
          <p className="text-gray-500 text-xs">
            Log of packaging, boxes and gifts consumed during diamond sales & POS billing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input select text-xs py-1.5"
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
          >
            <option value="all">All Stores</option>
            {stores.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary btn-sm flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Log Consumption
          </button>
        </div>
      </div>

      {/* Consumption Table */}
      <div className="table-wrapper card p-0">
        <table className="table text-xs">
          <thead>
            <tr>
              <th>Date</th>
              <th>Showroom Store</th>
              <th>Consumed Items Breakdown</th>
              <th>Total Units</th>
              <th>Source / Sync</th>
              <th>Logged By</th>
              <th>Notes / Reference</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : consumptions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  <ShoppingBag className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  No consumption records logged for this period.
                </td>
              </tr>
            ) : (
              consumptions.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50/80">
                  <td className="text-gray-600 font-medium">{c.date || formatDate(c.createdAt)}</td>
                  <td>
                    <div className="font-semibold text-gray-900">{c.store?.name}</div>
                    <div className="text-[10px] text-gray-400">{c.store?.code}</div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      {c.items?.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900">{it.quantity}×</span>
                          <span className="text-gray-700">{it.product?.name}</span>
                          <span className="text-[10px] text-gray-400">({it.purpose})</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="font-bold text-gray-900">
                    {c.items?.reduce((s, i) => s + (i.quantity || 0), 0)} units
                  </td>
                  <td>
                    {c.posSyncRef ? (
                      <span className="badge bg-teal-50 text-teal-800 border border-teal-200 text-[10px] flex items-center gap-1">
                        <Laptop className="w-3 h-3" /> Auto POS Sync
                      </span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-600 text-[10px]">
                        Manual Store Entry
                      </span>
                    )}
                  </td>
                  <td className="text-gray-600">{c.loggedBy?.name || 'Store Staff'}</td>
                  <td className="text-gray-500 text-[11px] max-w-xs truncate">{c.notes || 'Routine sales use'}</td>
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
        title="Log Showroom Packaging Consumption"
        size="lg"
      >
        <ConsumptionForm
          stores={stores}
          products={products}
          onSave={() => {
            setModalOpen(false);
            fetchConsumptions();
          }}
          onClose={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

