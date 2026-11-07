'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Truck, UserCheck, Edit2, Trash2, Eye, MapPin, Phone,
  Mail, Package, AlertTriangle, Clock, CheckCircle, ShieldCheck
} from 'lucide-react';
import { suppliersApi, customersApi, productsApi } from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { formatCurrency, formatDateTime, cn } from '../../../lib/utils';

function SupplierProfileModal({ supplierId, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supplierId) return;
    suppliersApi.getById(supplierId).then((res) => {
      setDetails(res.data.data);
      setLoading(false);
    });
  }, [supplierId]);

  if (loading) return <div className="p-8 text-center text-xs text-gray-400">Loading vendor profile...</div>;
  if (!details) return null;

  return (
    <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto text-xs">
      {/* Header Profile */}
      <div className="flex items-start justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-base shrink-0">
            {details.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-sm text-gray-900">{details.name}</div>
            <div className="font-mono text-[10px] text-brand-700 font-bold">{details.code}</div>
            <div className="text-gray-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span>{details.address} · {details.city}</span>
            </div>
            <div className="text-gray-500 flex items-center gap-2 mt-0.5">
              <span>Contact: <strong>{details.contactPerson}</strong> ({details.phone})</span>
              <span>•</span>
              <span className="font-mono">GSTIN: {details.gstin}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            {details.rating} ★ Rating
          </span>
          <div className="text-[10px] text-gray-400 mt-1">Lead time: ~{details.leadTimeDays || 4} days</div>
        </div>
      </div>

      {/* Mapped SKUs / Products (Feature 3 in Vendor Management) */}
      <div className="space-y-2">
        <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
          <Package className="w-4 h-4 text-brand-700" />
          <span>Mapped Products Supplied ({details.mappedProducts?.length || 0})</span>
        </h3>
        <div className="table-wrapper border rounded-xl overflow-hidden">
          <table className="table text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th>SKU</th>
                <th>Product Description</th>
                <th>Category</th>
                <th>Contract Supply Cost</th>
                <th>Current Stock</th>
              </tr>
            </thead>
            <tbody>
              {details.mappedProducts?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-400">
                    No products explicitly mapped yet.
                  </td>
                </tr>
              ) : (
                details.mappedProducts?.map((p) => (
                  <tr key={p._id}>
                    <td className="font-mono text-brand-700 font-bold">{p.sku}</td>
                    <td className="font-semibold text-gray-900">{p.name}</td>
                    <td>{p.category}</td>
                    <td className="font-bold text-gray-800">{formatCurrency(p.purchasePrice)}</td>
                    <td>{p.currentStock} {p.unit}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Inward Purchase History (Feature 4 in Vendor Management) */}
      <div className="space-y-2">
        <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-teal-700" />
          <span>Past Inward Receipts & Delivery History</span>
        </h3>
        <div className="table-wrapper border rounded-xl overflow-hidden">
          <table className="table text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th>Date</th>
                <th>PO / Reference</th>
                <th>Product SKU</th>
                <th>Quantity Received</th>
                <th>Receiving Warehouse</th>
                <th>QC Status</th>
              </tr>
            </thead>
            <tbody>
              {details.inwardLogs?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-400">
                    No inward shipments recorded from this vendor yet.
                  </td>
                </tr>
              ) : (
                details.inwardLogs?.map((m) => (
                  <tr key={m._id}>
                    <td className="text-gray-500">{formatDateTime(m.createdAt)}</td>
                    <td className="font-mono font-bold text-gray-900">{m.referenceNo || 'PO-DIRECT'}</td>
                    <td>{m.product?.name} ({m.product?.sku})</td>
                    <td className="font-bold text-emerald-700">+{m.quantity} {m.product?.unit}</td>
                    <td>{m.toWarehouse?.name}</td>
                    <td>
                      <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px]">
                        ✓ Accepted
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Quality Tracking & Defect Claims (Feature 6 in Vendor Management) */}
      <div className="space-y-2">
        <h3 className="font-bold text-xs text-red-700 uppercase tracking-wide flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>Defect & Damage Claims Linked to Vendor ({details.defects?.length || 0})</span>
        </h3>
        <div className="table-wrapper border rounded-xl overflow-hidden">
          <table className="table text-xs">
            <thead className="bg-red-50/50">
              <tr>
                <th>Claim No.</th>
                <th>Date</th>
                <th>Defective SKU</th>
                <th>Quantity</th>
                <th>Defect Reason</th>
                <th>Claim Status</th>
              </tr>
            </thead>
            <tbody>
              {details.defects?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-400">
                    Zero defect claims filed. Vendor quality track record is pristine!
                  </td>
                </tr>
              ) : (
                details.defects?.map((d) => (
                  <tr key={d._id}>
                    <td className="font-mono text-red-700 font-bold">{d.claimNumber}</td>
                    <td className="text-gray-500">{formatDateTime(d.createdAt)}</td>
                    <td className="font-medium text-gray-900">{d.product?.name}</td>
                    <td className="font-bold text-red-600">{d.quantity} {d.product?.unit}</td>
                    <td className="text-gray-600">{d.defectType || d.reason}</td>
                    <td>
                      <span className="badge bg-amber-50 text-amber-800 border border-amber-200 text-[10px]">
                        {d.vendorClaim?.claimStatus || d.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PartyForm({ type, party, onSave, onClose }) {
  const isSupplier = type === 'supplier';
  const [form, setForm] = useState({
    name: party?.name || '',
    contactPerson: party?.contactPerson || '',
    phone: party?.phone || '',
    email: party?.email || '',
    city: party?.city || '',
    address: party?.address || '',
    gstin: party?.gstin || '',
    leadTimeDays: party?.leadTimeDays || 4,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const api = isSupplier ? suppliersApi : customersApi;
    try {
      if (party) {
        await api.update(party._id, form);
        toast('Updated!', 'success');
      } else {
        await api.create(form);
        toast(`${isSupplier ? 'Vendor' : 'Client'} added!`, 'success');
      }
      onSave();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed', 'error');
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group col-span-2">
          <label className="label text-xs">{isSupplier ? 'Vendor / Manufacturer' : 'Customer'} Name *</label>
          <input
            className="input text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="label text-xs">Contact Person</label>
          <input
            className="input text-sm"
            value={form.contactPerson}
            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="label text-xs">Phone</label>
          <input
            className="input text-sm"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="label text-xs">Email</label>
          <input
            type="email"
            className="input text-sm"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="label text-xs">City</label>
          <input
            className="input text-sm"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </div>
        {isSupplier && (
          <div className="form-group">
            <label className="label text-xs">Standard Supply Lead Time (Days)</label>
            <input
              type="number"
              className="input text-sm"
              value={form.leadTimeDays}
              onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value })}
            />
          </div>
        )}
        <div className="form-group col-span-2">
          <label className="label text-xs">GSTIN</label>
          <input
            className="input uppercase text-sm font-mono"
            value={form.gstin}
            onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
          />
        </div>
        <div className="form-group col-span-2">
          <label className="label text-xs">Address</label>
          <textarea
            className="input h-16 resize-none text-sm"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
      </div>
      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <button type="button" className="btn-secondary flex-1 text-xs" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1 text-xs" disabled={saving}>
          {saving ? 'Saving...' : party ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  );
}

export default function SuppliersPage() {
  const [tab, setTab] = useState('supplier');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [viewSupplierId, setViewSupplierId] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isSupplier = tab === 'supplier';
  const api = isSupplier ? suppliersApi : customersApi;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.getAll();
      setItems(r.data.data || []);
    } catch {}
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(deleteTarget._id);
      toast('Deleted', 'success');
      setDeleteTarget(null);
      fetchItems();
    } catch {}
    setDeleting(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Vendors & Corporate Clients</h1>
          <p className="text-gray-500 text-xs">
            Packaging box makers, display fabricators, print suppliers & VIP corporate clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl text-xs">
            <button
              className={cn(
                'px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all',
                tab === 'supplier' ? 'bg-white text-brand-800 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              )}
              onClick={() => setTab('supplier')}
            >
              <Truck className="w-3.5 h-3.5" /> Vendors / Suppliers
            </button>
            <button
              className={cn(
                'px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all',
                tab === 'customer' ? 'bg-white text-brand-800 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              )}
              onClick={() => setTab('customer')}
            >
              <UserCheck className="w-3.5 h-3.5" /> Corporate Clients
            </button>
          </div>

          <button
            className="btn-primary btn-sm flex items-center gap-1.5 text-xs"
            onClick={() => {
              setEditTarget(null);
              setModal(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Add {isSupplier ? 'Vendor' : 'Client'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper card p-0">
        <table className="table text-xs">
          <thead>
            <tr>
              <th>{isSupplier ? 'Vendor' : 'Client'} Name</th>
              <th>Contact Details</th>
              <th>City / Location</th>
              <th>GSTIN</th>
              {isSupplier && <th>Lead Time</th>}
              {isSupplier && <th>Rating</th>}
              <th>Actions</th>
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
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No {isSupplier ? 'vendors' : 'clients'} registered yet.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50/80">
                  <td>
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-[10px] text-gray-400">{item.contactPerson}</div>
                  </td>
                  <td>
                    <div className="text-gray-800">{item.phone}</div>
                    <div className="text-[10px] text-gray-400">{item.email}</div>
                  </td>
                  <td className="text-gray-600">{item.city || '—'}</td>
                  <td className="font-mono text-[11px] text-gray-500">{item.gstin || '—'}</td>
                  {isSupplier && <td className="text-gray-700">{item.leadTimeDays || 4} days</td>}
                  {isSupplier && (
                    <td>
                      <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                        {item.rating || 4.8} ★
                      </span>
                    </td>
                  )}
                  <td>
                    <div className="flex items-center gap-1">
                      {isSupplier && (
                        <button
                          className="btn-ghost btn-icon p-1 min-h-0 text-brand-700 hover:bg-brand-50"
                          onClick={() => setViewSupplierId(item._id)}
                          title="View Vendor Performance Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        className="btn-ghost btn-icon p-1 min-h-0 text-gray-400 hover:text-blue-600"
                        onClick={() => {
                          setEditTarget(item);
                          setModal(true);
                        }}
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="btn-ghost btn-icon p-1 min-h-0 text-gray-400 hover:text-red-600"
                        onClick={() => setDeleteTarget(item)}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editTarget ? `Edit ${isSupplier ? 'Vendor' : 'Client'}` : `Add New ${isSupplier ? 'Vendor' : 'Client'}`}
        size="md"
      >
        <PartyForm
          type={tab}
          party={editTarget}
          onSave={() => {
            setModal(false);
            fetchItems();
          }}
          onClose={() => setModal(false)}
        />
      </Modal>

      {/* Vendor Profile Modal */}
      <Modal
        isOpen={!!viewSupplierId}
        onClose={() => setViewSupplierId(null)}
        title="Vendor Performance & Mapped SKUs Profile"
        size="lg"
      >
        <SupplierProfileModal
          supplierId={viewSupplierId}
          onClose={() => setViewSupplierId(null)}
        />
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${isSupplier ? 'Vendor' : 'Client'}`}
        message={`Delete "${deleteTarget?.name}"?`}
        loading={deleting}
      />
    </div>
  );
}
