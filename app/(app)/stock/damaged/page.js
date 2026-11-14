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

const COMMON_REJECTION_REASONS = [
  'Normal wear & tear — not a manufacturing defect',
  'Damage attributed to mishandling at retail showroom',
  'Insufficient photo/evidence provided for claim',
  'Claim filed past allowable vendor return window',
  'Repaired internally & restored to active inventory',
  'Discrepancy in SKU or received count',
];

export default function DamagedPage() {
  const { user } = useAuthStore();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'approved', 'rejected', 'vendor', 'transit', 'store', 'warehouse'
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [claimToReject, setClaimToReject] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectNoteError, setRejectNoteError] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await damageApi.getAll({
        source: ['vendor', 'transit', 'store', 'warehouse'].includes(activeTab) ? activeTab : undefined,
        status: activeTab === 'pending' ? 'pending_approval' : activeTab === 'approved' ? 'approved' : activeTab === 'rejected' ? 'rejected' : undefined,
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

  const handleOpenReject = (claim) => {
    setClaimToReject(claim);
    setRejectNote('');
    setRejectNoteError('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    if (e) e.preventDefault();
    if (!rejectNote.trim()) {
      setRejectNoteError('Please enter a note message explaining the reason for rejection.');
      return;
    }
    setRejecting(true);
    try {
      await damageApi.reject(claimToReject._id, { comment: rejectNote.trim() });
      toast('Damage claim rejected and note recorded', 'info');
      setRejectModalOpen(false);
      setClaimToReject(null);
      setRejectNote('');
      fetchClaims();
    } catch {
      toast('Failed to reject claim', 'error');
    } finally {
      setRejecting(false);
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
          { id: 'rejected', label: 'Rejected' },
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
                    {c.status === 'rejected' && (c.rejectionReason || c.notes) && (
                      <div className="mt-1.5 p-1.5 bg-red-50/90 rounded-lg border border-red-200 text-[10px] text-red-800 max-w-xs">
                        <div className="flex items-center gap-1 font-bold text-red-900">
                          <FileText className="w-3 h-3 text-red-500 shrink-0" />
                          <span>Rejection Note:</span>
                        </div>
                        <div className="mt-0.5 text-red-700 italic">
                          {c.rejectionReason || (c.notes.includes('Rejected:') ? c.notes.split('Rejected:').pop().trim() : c.notes)}
                        </div>
                      </div>
                    )}
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
                          onClick={() => handleOpenReject(c)}
                          className="btn-danger btn-sm py-1 px-2 text-xs flex items-center gap-1"
                          title="Reject Damaged Stock (Requires Note)"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    ) : c.status === 'approved' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Approved
                        </span>
                        <button
                          onClick={() => setSelectedClaim(c)}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : c.status === 'rejected' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Rejected
                        </span>
                        <button
                          onClick={() => setSelectedClaim(c)}
                          className="text-gray-400 hover:text-red-700 p-1 rounded hover:bg-red-50"
                          title="View Rejection Details & Note"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedClaim(c)}
                        className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Report Damaged Stock Modal */}
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

      {/* Rejection Note Message Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          if (!rejecting) {
            setRejectModalOpen(false);
            setClaimToReject(null);
            setRejectNote('');
            setRejectNoteError('');
          }
        }}
        title="Reject Damaged Stock Claim"
        size="md"
      >
        {claimToReject && (
          <form onSubmit={handleConfirmReject} className="p-6 space-y-4 text-xs">
            {/* Warning / Summary Banner */}
            <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-red-950 text-xs">{claimToReject.claimNumber}</span>
                  <span className="badge bg-red-100 text-red-800 capitalize text-[10px]">{claimToReject.source}</span>
                </div>
                <div className="font-semibold text-gray-800">
                  {claimToReject.product?.name} <span className="font-mono text-gray-500 font-normal">({claimToReject.product?.sku})</span>
                </div>
                <div className="text-[11px] text-gray-600">
                  Quantity: <span className="font-bold text-red-600">{claimToReject.quantity} {claimToReject.product?.unit || 'pcs'}</span>
                  {claimToReject.defectType && <span> • Defect: <span className="font-medium text-gray-800">{claimToReject.defectType}</span></span>}
                </div>
              </div>
            </div>

            {/* Note Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="label text-xs font-bold text-gray-800">
                  Rejection Note Message <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-gray-400">Required</span>
              </div>

              {/* Quick Select Preset Reasons */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1.5 font-medium">Quick Select Reason:</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_REJECTION_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => {
                        setRejectNote(reason);
                        setRejectNoteError('');
                      }}
                      className="px-2 py-1 rounded-lg border border-gray-200 bg-gray-50 text-[10px] text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors text-left"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className={`input min-h-[90px] resize-none text-xs w-full ${rejectNoteError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder="Enter a message/note explaining why this damage claim is rejected..."
                value={rejectNote}
                onChange={(e) => {
                  setRejectNote(e.target.value);
                  if (rejectNoteError) setRejectNoteError('');
                }}
                rows={3}
                autoFocus
              />

              {rejectNoteError && (
                <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {rejectNoteError}
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
                  setClaimToReject(null);
                  setRejectNote('');
                  setRejectNoteError('');
                }}
                disabled={rejecting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-danger flex-1 text-xs flex items-center justify-center gap-1.5"
                disabled={rejecting || !rejectNote.trim()}
              >
                {rejecting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Reject Claim with Note</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Claim Details Modal */}
      <Modal
        isOpen={!!selectedClaim}
        onClose={() => setSelectedClaim(null)}
        title={`Damage Claim Details — ${selectedClaim?.claimNumber}`}
        size="md"
      >
        {selectedClaim && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <div className="font-semibold text-sm text-gray-900">{selectedClaim.product?.name}</div>
                <div className="font-mono text-[11px] text-brand-700">{selectedClaim.product?.sku}</div>
              </div>
              <StatusBadge status={selectedClaim.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div>
                <span className="text-gray-400 block text-[10px]">Source / Origin</span>
                <span className="font-semibold capitalize text-gray-800">{selectedClaim.source}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Party / Supplier / Courier</span>
                <span className="font-semibold text-gray-800">
                  {selectedClaim.supplier?.name || selectedClaim.store?.name || selectedClaim.courierName || 'Central Warehouse'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Quantity</span>
                <span className="font-bold text-red-600">{selectedClaim.quantity} {selectedClaim.product?.unit || 'pcs'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Disposition</span>
                <span className="font-semibold capitalize text-purple-700">{selectedClaim.disposition?.replace(/_/g, ' ') || 'Pending'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-gray-700 block">Defect Classification</span>
              <p className="text-gray-800 bg-white p-2.5 rounded-lg border border-gray-200">{selectedClaim.defectType}</p>
            </div>

            {selectedClaim.reason && (
              <div className="space-y-1">
                <span className="font-bold text-gray-700 block">Findings & Inspection Report</span>
                <p className="text-gray-600 bg-white p-2.5 rounded-lg border border-gray-200 whitespace-pre-wrap">{selectedClaim.reason}</p>
              </div>
            )}

            {selectedClaim.status === 'rejected' && (selectedClaim.rejectionReason || selectedClaim.notes) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-red-900 font-bold text-xs">
                  <X className="w-3.5 h-3.5 text-red-600" />
                  <span>Rejection Note Message</span>
                </div>
                <p className="text-red-800 italic bg-white/90 p-2.5 rounded border border-red-100 whitespace-pre-wrap">
                  {selectedClaim.rejectionReason || (selectedClaim.notes.includes('Rejected:') ? selectedClaim.notes.split('Rejected:').pop().trim() : selectedClaim.notes)}
                </p>
                {selectedClaim.rejectedBy && (
                  <p className="text-[10px] text-red-600">
                    Reviewed by {selectedClaim.rejectedBy.name || 'Manager'} {selectedClaim.rejectedAt ? `on ${formatDateTime(selectedClaim.rejectedAt)}` : ''}
                  </p>
                )}
              </div>
            )}

            {selectedClaim.notes && selectedClaim.status !== 'rejected' && (
              <div className="space-y-1">
                <span className="font-bold text-gray-700 block">Notes & Activity Log</span>
                <p className="text-gray-600 bg-white p-2.5 rounded-lg border border-gray-200 whitespace-pre-wrap">{selectedClaim.notes}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                className="btn-secondary text-xs px-4"
                onClick={() => setSelectedClaim(null)}
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
