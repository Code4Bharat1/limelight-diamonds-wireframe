'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Plus, ClipboardList, CheckCircle, Clock, AlertTriangle,
  Boxes, Check, X, FileText, ChevronRight
} from 'lucide-react';
import { auditsApi, warehousesApi } from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import { formatDateTime } from '../../../lib/utils';

function StartAuditForm({ onSave, onClose }) {
  const [form, setForm] = useState({ warehouseId: '', auditName: '', floor: 'Ground Floor', notes: '' });
  const [warehouses, setWarehouses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    warehousesApi.getAll().then((r) => {
      setWarehouses(r.data.data || []);
      if (r.data.data?.length) {
        setForm((f) => ({ ...f, warehouseId: r.data.data[0]._id }));
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await auditsApi.start({ ...form });
      toast('Physical stock audit initialized! Count sheet generated.', 'success');
      onSave();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed', 'error');
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="form-group">
        <label className="label text-xs">Audit Title *</label>
        <input
          className="input text-sm"
          value={form.auditName}
          onChange={(e) => setForm({ ...form, auditName: e.target.value })}
          placeholder="e.g. Q2 Central Warehouse Packaging Physical Count"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="label text-xs">Target Warehouse Facility *</label>
          <select
            className="input select text-sm"
            value={form.warehouseId}
            onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
            required
          >
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="label text-xs">Audited Floor / Area</label>
          <input
            className="input text-sm"
            value={form.floor}
            onChange={(e) => setForm({ ...form, floor: e.target.value })}
            placeholder="Ground Floor & Mezzanine"
          />
        </div>
      </div>
      <div className="form-group">
        <label className="label text-xs">Audit Instructions / Notes</label>
        <textarea
          className="input h-16 resize-none text-sm"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Count sealed master cartons and open bin boxes separately."
        />
      </div>
      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <button type="button" className="btn-secondary flex-1 text-xs" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1 text-xs" disabled={saving}>
          {saving ? 'Generating Count Sheet...' : 'Start Audit & Generate Count Sheet'}
        </button>
      </div>
    </form>
  );
}

// Item-by-item Count Sheet Screen (Feature 9)
function AuditCountSheetModal({ audit, onSave, onClose }) {
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (audit?.items) {
      setItems(
        audit.items.map((it) => ({
          productId: it.product._id,
          name: it.product.name,
          sku: it.product.sku,
          unit: it.product.unit,
          storageLocation: it.product.storageLocation,
          expectedQty: it.expectedQty,
          countedQty: it.countedQty !== null && it.countedQty !== undefined ? it.countedQty : '',
          discrepancy: it.discrepancy ?? 0,
          notes: it.notes || '',
        }))
      );
    }
  }, [audit]);

  const handleQtyChange = (idx, value) => {
    const copy = [...items];
    const val = value === '' ? '' : Number(value);
    copy[idx].countedQty = val;
    copy[idx].discrepancy = val !== '' ? val - copy[idx].expectedQty : null;
    setItems(copy);
  };

  const handleNotesChange = (idx, value) => {
    const copy = [...items];
    copy[idx].notes = value;
    setItems(copy);
  };

  const handleSaveProgress = async () => {
    setSaving(true);
    try {
      await auditsApi.updateCount(audit._id, items);
      toast('Count sheet progress saved!', 'success');
      onSave();
    } catch {
      toast('Failed to save count sheet', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteAndReconcile = async () => {
    if (!confirm('Complete this audit and reconcile all discrepancies into inventory adjustments?')) return;
    setCompleting(true);
    try {
      await auditsApi.updateCount(audit._id, items);
      await auditsApi.complete(audit._id, { reconcile: true });
      toast('Audit completed! System inventory successfully reconciled.', 'success');
      onSave();
      onClose();
    } catch {
      toast('Failed to complete audit', 'error');
    } finally {
      setCompleting(false);
    }
  };

  const countedCount = items.filter((i) => i.countedQty !== '').length;
  const discrepancyCount = items.filter((i) => i.discrepancy !== null && i.discrepancy !== 0).length;

  return (
    <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <div>
          <h3 className="font-bold text-sm text-gray-900">{audit.auditName}</h3>
          <div className="text-xs text-gray-500">{audit.warehouse?.name} · {audit.floor || 'All Floors'}</div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="badge bg-blue-100 text-blue-800 font-bold">
            {countedCount} / {items.length} Counted
          </span>
          {discrepancyCount > 0 && (
            <span className="badge bg-amber-100 text-amber-800 font-bold">
              {discrepancyCount} Discrepancies
            </span>
          )}
        </div>
      </div>

      {/* Item-by-Item Entry Table */}
      <div className="table-wrapper border rounded-xl overflow-hidden">
        <table className="table text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th>SKU / Product</th>
              <th>Bin Location</th>
              <th className="text-center">System Expected</th>
              <th className="text-center">Physical Count</th>
              <th className="text-center">Variance (Delta)</th>
              <th>Auditor Remarks</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              const diff = it.discrepancy;
              const hasCount = it.countedQty !== '';
              return (
                <tr key={it.productId} className={hasCount && diff !== 0 ? 'bg-amber-50/50' : ''}>
                  <td>
                    <div className="font-bold text-gray-900">{it.name}</div>
                    <span className="font-mono text-[10px] text-brand-700 bg-brand-50 px-1 rounded">
                      {it.sku}
                    </span>
                  </td>

                  <td className="text-gray-500 font-mono text-[11px]">
                    {it.storageLocation || 'Zone A'}
                  </td>

                  <td className="text-center font-bold text-gray-700">
                    {it.expectedQty} <span className="text-[10px] text-gray-400 font-normal">{it.unit}</span>
                  </td>

                  <td className="text-center">
                    <input
                      type="number"
                      min="0"
                      className="input text-xs w-24 text-center font-bold bg-white mx-auto border-brand-300 focus:border-brand-700"
                      placeholder="Count..."
                      value={it.countedQty}
                      onChange={(e) => handleQtyChange(idx, e.target.value)}
                    />
                  </td>

                  <td className="text-center font-mono font-bold">
                    {!hasCount ? (
                      <span className="text-gray-400">—</span>
                    ) : diff === 0 ? (
                      <span className="text-emerald-600 font-bold">0 (Exact)</span>
                    ) : (
                      <span className={diff < 0 ? 'text-red-600' : 'text-emerald-700'}>
                        {diff > 0 ? `+${diff}` : diff} {it.unit}
                      </span>
                    )}
                  </td>

                  <td>
                    <input
                      className="input text-xs bg-white py-1"
                      placeholder="e.g. Scratched boxes, misallocated"
                      value={it.notes}
                      onChange={(e) => handleNotesChange(idx, e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSaveProgress}
          disabled={saving}
          className="btn-secondary w-full sm:w-auto text-xs"
        >
          {saving ? 'Saving...' : 'Save Draft Progress'}
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button type="button" className="btn-secondary text-xs flex-1 sm:flex-none" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            onClick={handleCompleteAndReconcile}
            disabled={completing}
            className="btn-primary text-xs flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-800 flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{completing ? 'Reconciling...' : 'Submit & Reconcile Audit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuditsPage() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startModal, setStartModal] = useState(false);
  const [countSheetAudit, setCountSheetAudit] = useState(null);

  const fetchAudits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditsApi.getAll();
      setAudits(res.data.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Physical Inventory Audits</h1>
          <p className="text-gray-500 text-xs">
            Item-by-item count sheets, real-time variance calculation & automatic stock reconciliation
          </p>
        </div>
        <button
          className="btn-primary btn-sm flex items-center gap-1.5 text-xs"
          onClick={() => setStartModal(true)}
        >
          <Plus className="w-3.5 h-3.5" /> Start New Audit
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-28" />
          ))}
        </div>
      ) : audits.length === 0 ? (
        <div className="empty-state py-16">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <h3 className="text-gray-700 font-bold text-sm">No audits conducted yet</h3>
          <p className="text-gray-400 text-xs mb-3">Start a physical count audit to generate count sheets</p>
          <button className="btn-primary btn-sm" onClick={() => setStartModal(true)}>
            Start First Audit
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {audits.map((a) => {
            const counted = a.items?.filter((i) => i.countedQty !== null && i.countedQty !== undefined).length || 0;
            const discrepancies = a.items?.filter((i) => i.discrepancy && i.discrepancy !== 0).length || 0;

            return (
              <div key={a._id} className="card hover:shadow-card transition-shadow p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{a.auditName}</h3>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>{a.warehouse?.name}</span>
                        <span>•</span>
                        <span>{a.floor || 'All Floors'}</span>
                        <span>•</span>
                        <span>Started: {formatDateTime(a.startedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    <button
                      onClick={() => setCountSheetAudit(a)}
                      className="btn-primary btn-sm py-1.5 px-3 text-xs flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{a.status === 'completed' ? 'View Count Sheet' : 'Open Count Sheet'}</span>
                    </button>
                  </div>
                </div>

                {/* Audit Metrics */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100 text-center text-xs">
                  <div className="bg-gray-50 p-2 rounded-xl">
                    <div className="font-bold text-gray-900">{counted} / {a.items?.length || 0}</div>
                    <div className="text-[10px] text-gray-400">SKUs Counted</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-xl">
                    <div className={`font-bold ${discrepancies > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {discrepancies}
                    </div>
                    <div className="text-[10px] text-gray-400">Variances Detected</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-xl">
                    <div className="font-bold text-gray-800">{a.startedBy?.name || 'Staff'}</div>
                    <div className="text-[10px] text-gray-400">Auditor in Charge</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Start Audit Modal */}
      <Modal
        isOpen={startModal}
        onClose={() => setStartModal(false)}
        title="Start Physical Stock Count Audit"
        size="md"
      >
        <StartAuditForm
          onSave={() => {
            setStartModal(false);
            fetchAudits();
          }}
          onClose={() => setStartModal(false)}
        />
      </Modal>

      {/* Count Sheet Modal */}
      <Modal
        isOpen={!!countSheetAudit}
        onClose={() => setCountSheetAudit(null)}
        title="Physical Inventory Count Sheet"
        size="xl"
      >
        {countSheetAudit && (
          <AuditCountSheetModal
            audit={countSheetAudit}
            onSave={() => {
              fetchAudits();
              const updated = audits.find((x) => x._id === countSheetAudit._id);
              if (updated) setCountSheetAudit(updated);
            }}
            onClose={() => setCountSheetAudit(null)}
          />
        )}
      </Modal>
    </div>
  );
}
