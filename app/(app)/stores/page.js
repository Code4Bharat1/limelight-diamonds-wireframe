'use client';
import { useState, useEffect } from 'react';
import {
  Store, Plus, MapPin, Phone, Mail, Package, AlertTriangle,
  ArrowDownToLine, Clock, Send, Eye, CheckCircle, ExternalLink,
  ShoppingBag, Shield, Laptop
} from 'lucide-react';
import Link from 'next/link';
import { storesApi, productsApi } from '../../../lib/api';
import Modal from '../../../components/ui/Modal';
import { toast } from '../../../components/ui/Toast';
import { formatCurrency, cn } from '../../../lib/utils';
import useAuthStore from '../../../lib/authStore';

function StoreForm({ store, onSave, onClose }) {
  const [form, setForm] = useState({
    name: store?.name || '',
    code: store?.code || '',
    city: store?.city || '',
    address: store?.address || '',
    contactPerson: store?.contactPerson || '',
    phone: store?.phone || '',
    email: store?.email || '',
    capacity: store?.capacity || 2000,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (store) {
        await storesApi.update(store._id, form);
        toast('Store details updated', 'success');
      } else {
        await storesApi.create(form);
        toast('New retail store added', 'success');
      }
      onSave();
    } catch (err) {
      toast('Failed to save store', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group col-span-2">
          <label className="label text-xs">Store / Boutique Name *</label>
          <input
            className="input text-sm"
            placeholder="e.g. Limelight Flagship Showroom – Bandra"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="label text-xs">Store Code *</label>
          <input
            className="input text-sm uppercase font-mono"
            placeholder="STR-MUM-01"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            required
          />
        </div>
        <div className="form-group">
          <label className="label text-xs">City *</label>
          <input
            className="input text-sm"
            placeholder="Mumbai, Pune, Delhi..."
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
          />
        </div>
        <div className="form-group col-span-2">
          <label className="label text-xs">Full Address</label>
          <textarea
            className="input h-16 resize-none text-sm"
            placeholder="Street address, mall name, pincode"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="label text-xs">Store Manager</label>
          <input
            className="input text-sm"
            value={form.contactPerson}
            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="label text-xs">Contact Phone</label>
          <input
            className="input text-sm"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="form-group col-span-2">
          <label className="label text-xs">Email</label>
          <input
            type="email"
            className="input text-sm"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
      </div>
      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <button type="button" className="btn-secondary flex-1 text-xs" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1 text-xs" disabled={saving}>
          {saving ? 'Saving...' : store ? 'Update Store' : 'Register Store'}
        </button>
      </div>
    </form>
  );
}

export default function StoresPage() {
  const { user } = useAuthStore();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStore, setEditStore] = useState(null);
  const [selectedStoreStock, setSelectedStoreStock] = useState(null);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await storesApi.getAll();
      setStores(res.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const openStoreInventoryModal = async (s) => {
    try {
      const res = await storesApi.getById(s._id);
      setSelectedStoreStock(res.data.data);
    } catch {
      toast('Failed to load store inventory', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Store Management</h1>
          <p className="text-gray-500 text-xs">
            Showroom inventory tracking, store logins, replenishment requests & POS synchronization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/stores/requests" className="btn-secondary btn-sm flex items-center gap-1.5 text-xs">
            <Send className="w-3.5 h-3.5" /> Stock Requests
          </Link>
          <Link href="/stores/consumption" className="btn-secondary btn-sm flex items-center gap-1.5 text-xs">
            <ShoppingBag className="w-3.5 h-3.5" /> Daily Consumption
          </Link>
          <button
            onClick={() => {
              setEditStore(null);
              setModalOpen(true);
            }}
            className="btn-primary btn-sm flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Store
          </button>
        </div>
      </div>

      {/* Stores Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-56" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((s) => (
            <div key={s._id} className="card-hover flex flex-col justify-between p-5 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px]">
                      POS Online
                    </span>
                    <button
                      onClick={() => {
                        setEditStore(s);
                        setModalOpen(true);
                      }}
                      className="btn-ghost btn-icon p-1 min-h-0 text-gray-400 hover:text-gray-900"
                    >
                      <Plus className="w-3.5 h-3.5 rotate-45" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="font-mono text-[10px] text-brand-700 font-bold">{s.code}</div>
                  <h3 className="font-bold text-gray-900 text-sm mt-0.5 leading-snug">{s.name}</h3>
                  <div className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{s.city} · {s.address}</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-xl p-2.5 text-center text-xs">
                <div>
                  <div className="font-bold text-gray-900">{s.totalStock?.toLocaleString('en-IN') || 0}</div>
                  <div className="text-[10px] text-gray-400">Total Units</div>
                </div>
                <div>
                  <div className="font-bold text-amber-600">{s.lowStockCount || 0}</div>
                  <div className="text-[10px] text-gray-400">Low Stock</div>
                </div>
                <div>
                  <div className="font-bold text-blue-600">{s.pendingRequestsCount || 0}</div>
                  <div className="text-[10px] text-gray-400">Requests</div>
                </div>
              </div>

              {/* POS Sync Status */}
              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <Laptop className="w-3 h-3 text-teal-600" />
                  <span>Terminal: <strong>{s.posTerminalId}</strong></span>
                </span>
                <button
                  onClick={() => openStoreInventoryModal(s)}
                  className="text-brand-700 font-bold hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View Stock
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Store Stock Overview Modal */}
      <Modal
        isOpen={!!selectedStoreStock}
        onClose={() => setSelectedStoreStock(null)}
        title={`${selectedStoreStock?.name} — Live Store Stock`}
        size="lg"
      >
        {selectedStoreStock && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-teal-50 rounded-xl border border-teal-200">
              <div>
                <div className="text-xs text-teal-900 font-bold">Store POS Terminal: {selectedStoreStock.posTerminalId}</div>
                <div className="text-[11px] text-teal-700">Manager: {selectedStoreStock.contactPerson || 'Assigned Staff'} · {selectedStoreStock.phone}</div>
              </div>
              <Link href="/stores/requests" className="btn-primary btn-sm text-xs">
                + New Stock Request
              </Link>
            </div>

            <div className="table-wrapper max-h-96 overflow-y-auto">
              <table className="table text-xs">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product / Material</th>
                    <th>Category</th>
                    <th>Current Store Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStoreStock.stockItems?.map((item) => {
                    const isLow = item.quantity <= item.minThreshold;
                    return (
                      <tr key={item.product?._id}>
                        <td className="font-mono text-brand-700 font-bold">{item.product?.sku}</td>
                        <td className="font-semibold text-gray-900">{item.product?.name}</td>
                        <td className="text-gray-500">{item.product?.category}</td>
                        <td className="font-bold text-gray-900">
                          {item.quantity} {item.product?.unit}
                        </td>
                        <td>
                          {isLow ? (
                            <span className="badge bg-red-100 text-red-700 text-[10px]">
                              Reorder Needed
                            </span>
                          ) : (
                            <span className="badge bg-emerald-100 text-emerald-800 text-[10px]">
                              Adequate
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Store Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editStore ? `Edit Store: ${editStore.code}` : 'Register New Showroom Store'}
        size="md"
      >
        <StoreForm
          store={editStore}
          onSave={() => {
            setModalOpen(false);
            fetchStores();
          }}
          onClose={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

