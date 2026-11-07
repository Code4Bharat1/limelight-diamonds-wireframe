'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Plus, AlertTriangle, Shield, CheckCircle, Truck, Store,
  Warehouse, Check, X, Eye, FileText, ExternalLink
} from 'lucide-react';
import { damageApi, productsApi, warehousesApi, storesApi, suppliersApi } from '../../../../lib/api';
import { toast } from '../../../../components/ui/Toast';
import Modal from '../../../../components/ui/Modal';
import StatusBadge from '../../../../components/ui/StatusBadge';
import { formatDateTime, formatCurrency, cn } from '../../../../lib/utils';
import useAuthStore from '../../../../lib/authStore';

function DamagedForm({ onSave, onClose }) {
  const [form, setForm] = useState({
    productId: '',
    source: 'warehouse', // 'vendor', 'warehouse', 'transit', 'store'
    warehouseId: 'wh_1',
    storeId: '',
    supplierId: '',
    courierName: '',
    trackingNumber: '',
    quantity: 1,
    defectType: 'Manufacturing Hinge Defect',
    reason: '',
    notes: '',
  });

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stores, setStores] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      productsApi.getAll({ limit: 100 }),
      warehousesApi.getAll(),
      storesApi.getAll(),
      suppliersApi.getAll(),
    ]).then(([p, w, st, sup]) => {
      const prodList = p.data.data || [];
      const whList = w.data.data || [];
      const strList = st.data.data || [];
      const supList = sup.data.data || [];
      setProducts(prodList);
      setWarehouses(whList);
      setStores(strList);
      setSuppliers(supList);
      if (prodList.length) setForm((f) => ({ ...f, productId: prodList[0]._id }));
      if (strList.length) setForm((f) => ({ ...f, storeId: strList[0]._id }));
      if (supList.length) setForm((f) => ({ ...f, supplierId: supList[0]._id }));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await damageApi.create({
        ...form,
        quantity: Number(form.quantity),
      });
      toast('Damage report submitted for manager approval & claim processing!', 'success');
      onSave();
    } catch {
      toast('Failed to log damaged stock', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto text-xs">
      {/* Damage Source Selector (Feature 2 in Damage Management) */}
      <div className="form-group">
        <label className="label text-xs font-bold text-gray-800">Damage Origin / Source *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'vendor', label: 'Vendor Defect (Arrival)', icon: Truck },
            { id: 'warehouse', label: 'Warehouse Mishap', icon: Warehouse },
            { id: 'transit', label: 'Courier Transit', icon: Shield },
            { id: 'store', label: 'Store Showroom', icon: Store },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setForm({ ...form, source: s.id })}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                form.source === s.id
                  ? 'bg-red-50 border-red-500 text-red-900 font-bold shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <s.icon className="w-4 h-4 mx-auto mb-1 text-red-600" />
              <span className="text-[11px] block">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Product & Quantity */}
      <div className="grid grid-cols-3 gap-3">
        <div className="form-group col-span-2">
          <label className="label text-xs">Damaged Product SKU *</label>
          <select
            className="input select text-xs"
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
            required
          >
            {products.map((p) => (
              <option key={p._id} value={p._id}>{p.sku} — {p.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="label text-xs">Quantity *</label>
          <input
            type="number"
            min="1"
            className="input text-xs font-bold text-center"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Conditional Fields based on Source */}
      {form.source === 'vendor' && (
        <div className="form-group p-3 bg-red-50/50 rounded-xl border border-red-200 space-y-2">
          <label className="label text-xs font-bold text-red-900">Supplier / Vendor Partner *</label>
          <select
            className="input select text-xs bg-white"
            value={form.supplierId}
            onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            required
          >
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
            ))}
          </select>
          <p className="text-[10px] text-red-700">
            A supplier claim (VC) will be generated automatically for refund or replacement.
          </p>
        </div>
      )}

      {form.source === 'store' && (
        <div className="form-group p-3 bg-teal-50/50 rounded-xl border border-teal-200">
          <label className="label text-xs font-bold text-teal-900">Originating Retail Store *</label>
          <select
            className="input select text-xs bg-white"
            value={form.storeId}
            onChange={(e) => setForm({ ...form, storeId: e.target.value })}
            required
          >
            {stores.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {form.source === 'transit' && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-200">
          <div className="form-group">
            <label className="label text-xs font-bold text-blue-900">Courier Company</label>
            <input
              className="input text-xs bg-white"
              placeholder="e.g. BVC Express, Sequel"
              value={form.courierName}
              onChange={(e) => setForm({ ...form, courierName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="label text-xs font-bold text-blue-900">Tracking / Consignment No.</label>
            <input
              className="input text-xs bg-white font-mono"
              placeholder="Waybill tracking number"
              value={form.trackingNumber}
              onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
              required
            />
          </div>
        </div>
      )}

      {/* Defect Type & Description */}
      <div className="form-group">
        <label className="label text-xs">Defect Classification *</label>
        <input
          className="input text-xs"
          placeholder="e.g. Spring hinge broken, torn velvet liner, water damaged box"
          value={form.defectType}
          onChange={(e) => setForm({ ...form, defectType: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label className="label text-xs">Detailed Findings & Inspection Notes</label>
        <textarea
          className="input h-16 resize-none text-xs"
          placeholder="Detailed observation during inward QC or store receipt..."
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          required
        />
      </div>

      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <button type="button" className="btn-secondary flex-1 text-xs" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-danger flex-1 text-xs" disabled={saving}>
          {saving ? 'Submitting...' : 'Submit Damage Claim for Approval'}
        </button>
      </div>
    </form>
  );
}

export default function DamagedPage() {
  const { user } = useAuthStore();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'approved', 'vendor_claims', 'transit'

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await damageApi.getAll({
        source: ['vendor', 'transit', 'store', 'warehouse'].includes(activeTab) ? activeTab : undefined,
        status: activeTab === 'pending' ? 'pending_approval' : activeTab === 'approved' ? 'approved' : undefined,
      });
      setClaims(res.data.data || []);
    } catch {}
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleApproveClaim = async (id, disposition) => {
    try {
      await damageApi.approve(id, { disposition, comment: 'Approved by Operations Manager' });
      toast('Damage claim approved and processed!', 'success');
      fetchClaims();
    } catch {
      toast('Failed to approve', 'error');
    }
  };

  const handleRejectClaim = async (id) => {
    try {
      await damageApi.reject(id, { comment: 'Rejected after re-inspection' });
      toast('Claim rejected', 'info');
      fetchClaims();
    } catch {
      toast('Failed to reject', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Damaged Stock & Defect Claims Management</h1>
          <p className="text-gray-500 text-xs">
            Source-level tracking (Vendor, Warehouse, Transit, Store) with multi-tier approval workflows
          </p>
        </div>
        <button
          className="btn-danger btn-sm flex items-center gap-1.5 text-xs shadow-sm"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" /> Report Damaged Stock
        </button>
      </div>

      {/* Source & Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { id: 'all', label: 'All Records' },
          { id: 'pending', label: 'Pending Approval' },
          { id: 'approved', label: 'Approved & Settled' },
          { id: 'vendor', label: 'Vendor Claims' },
          { id: 'transit', label: 'Transit Damages' },
          { id: 'store', label: 'Store Damages' },
          { id: 'warehouse', label: 'Warehouse Mishaps' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Claims Table */}
      <div className="table-wrapper card p-0">
        <table className="table text-xs">
          <thead>
            <tr>
              <th>Claim Number</th>
              <th>Product SKU</th>
              <th>Source</th>
              <th>Party / Carrier</th>
              <th>Quantity</th>
              <th>Defect Details</th>
              <th>Status</th>
              <th>Disposition</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : claims.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">
                  <AlertTriangle className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  No damaged stock records found for this view.
                </td>
              </tr>
            ) : (
              claims.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50/80">
                  <td className="font-mono font-bold text-gray-900">{c.claimNumber}</td>
                  <td>
                    <div className="font-semibold text-gray-900">{c.product?.name}</div>
                    <span className="font-mono text-[10px] text-brand-700">{c.product?.sku}</span>
                  </td>
                  <td>
                    <span className="badge bg-gray-100 text-gray-800 capitalize text-[10px]">
                      {c.source}
                    </span>
                  </td>
                  <td>
                    <div className="text-gray-800 font-medium">
                      {c.supplier?.name || c.store?.name || c.courierName || 'Central WH'}
                    </div>
                    {c.trackingNumber && (
                      <div className="font-mono text-[10px] text-gray-400">{c.trackingNumber}</div>
                    )}
                  </td>
                  <td className="font-bold text-red-600">
                    {c.quantity} {c.product?.unit}
                  </td>
                  <td>
                    <div className="font-semibold text-gray-800">{c.defectType}</div>
                    <div className="text-[10px] text-gray-400 max-w-xs truncate">{c.reason}</div>
                  </td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td>
                    <span className="badge bg-purple-50 text-purple-800 text-[10px] capitalize">
                      {c.disposition?.replace(/_/g, ' ') || 'Pending'}
                    </span>
                  </td>
                  <td>
                    {c.status === 'pending_approval' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApproveClaim(c._id, c.source === 'vendor' ? 'vendor_claim' : 'write_off')}
                          className="btn-success btn-sm py-1 px-2 text-xs flex items-center gap-1"
                          title="Approve Write-off / Claim"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectClaim(c._id)}
                          className="btn-danger btn-sm py-1 px-2 text-xs flex items-center gap-1"
                          title="Reject"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Approved
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
        title="Report Damaged Stock / Defective Material"
        size="lg"
      >
        <DamagedForm
          onSave={() => {
            setModalOpen(false);
            fetchClaims();
          }}
          onClose={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
