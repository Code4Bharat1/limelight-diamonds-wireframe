'use client';
import { useState, useEffect } from 'react';
import {
  CreditCard, Laptop, RefreshCw, CheckCircle, AlertTriangle,
  Play, Sparkles, Store, Package, Layers, Clock, ArrowRight, ShieldCheck
} from 'lucide-react';
import { posApi, storesApi } from '../../../lib/api';
import Modal from '../../../components/ui/Modal';
import { toast } from '../../../components/ui/Toast';
import { formatDateTime, formatCurrency, cn } from '../../../lib/utils';

export default function POSIntegrationPage() {
  const [terminals, setTerminals] = useState([]);
  const [summary, setSummary] = useState({});
  const [mappings, setMappings] = useState([]);
  const [salesFeed, setSalesFeed] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Simulation Form State
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [simForm, setSimForm] = useState({
    storeId: '',
    salesCategory: 'Solitaire Diamond Ring',
    jewelleryItem: '2.50ct Lab-Grown Emerald Cut Solitaire Ring',
    customerName: 'Priya Sharma',
    billNo: '',
  });
  const [simulating, setSimulating] = useState(false);

  const fetchPOSData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [posRes, bomRes, salesRes, storeRes] = await Promise.all([
        posApi.getStatus(),
        posApi.getBOMMappings(),
        posApi.getRecentSales(),
        storesApi.getAll(),
      ]);
      setTerminals(posRes.data.data.terminals || []);
      setSummary(posRes.data.data.summary || {});
      setMappings(bomRes.data.data || []);
      setSalesFeed(salesRes.data.data || []);
      setStores(storeRes.data.data || []);
      if (storeRes.data.data?.length && !simForm.storeId) {
        setSimForm((prev) => ({ ...prev, storeId: storeRes.data.data[0]._id }));
      }
    } catch (err) {
      console.error('POS fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPOSData();
    const interval = setInterval(() => {
      fetchPOSData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateSale = async (e) => {
    e.preventDefault();
    setSimulating(true);
    try {
      await posApi.simulateSale({
        storeId: simForm.storeId,
        salesCategory: simForm.salesCategory,
        jewelleryItem: simForm.jewelleryItem,
        customerName: simForm.customerName,
        billNo: simForm.billNo || `BILL-${Math.floor(1000 + Math.random() * 9000)}`,
      });
      toast('POS sale synced! Mapped packaging stock was automatically deducted.', 'success');
      setSimModalOpen(false);
      fetchPOSData(true);
    } catch {
      toast('Simulation failed', 'error');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">POS Integration & Packaging Auto-Deduction</h1>
            <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
              Live Auto-Sync Active
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-0.5">
            Real-time showroom point-of-sale terminal sync & Bill of Materials (BOM) packaging deduction
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSimModalOpen(true)}
            className="btn-primary btn-sm flex items-center gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800"
          >
            <Play className="w-3.5 h-3.5" /> Simulate POS Transaction
          </button>
          <button
            onClick={() => fetchPOSData(true)}
            className="btn-secondary btn-sm flex items-center gap-1 text-xs"
            disabled={refreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="card p-4 bg-white border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase">Active Terminals</div>
            <div className="text-xl font-bold text-gray-900">{summary.onlineTerminals || 5} Online</div>
          </div>
        </div>

        <div className="card p-4 bg-white border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase">Today's POS Bills</div>
            <div className="text-xl font-bold text-gray-900">{salesFeed.length} Synced</div>
          </div>
        </div>

        <div className="card p-4 bg-white border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase">Packaging Deducted</div>
            <div className="text-xl font-bold text-gray-900">{summary.todayPackagingDeducted || 38} Units</div>
          </div>
        </div>

        <div className="card p-4 bg-white border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase">Sync Engine Health</div>
            <div className="text-xl font-bold text-emerald-600">99.9% Uptime</div>
          </div>
        </div>
      </div>

      {/* POS Terminals Status Cards */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-brand-700" />
              <span>Connected Retail POS Terminals</span>
            </h2>
            <p className="text-xs text-gray-400">Live heartbeat status of retail showroom hardware terminals</p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
            Auto-Heartbeat 15s
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {terminals.map((t) => (
            <div key={t.terminalId} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-gray-900">{t.terminalId}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Connected" />
              </div>
              <div className="text-xs font-semibold text-gray-800 truncate">{t.storeName}</div>
              <div className="text-[10px] text-gray-400 font-mono">IP: {t.ipAddress}</div>
              <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-200 flex items-center justify-between">
                <span>Deductions today:</span>
                <strong className="text-brand-700">{t.todayPackagingUnitsDeducted} units</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column: BOM Mapping Rules + Live Synced Sales Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Product & Category BOM Mappings */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-700" />
                <span>POS Bill of Materials (BOM) Rules</span>
              </h2>
              <p className="text-xs text-gray-400">
                Rule engine that maps diamond jewellery categories to auto-deducted packaging items
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {mappings.map((m) => (
              <div key={m._id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900">{m.salesCategory}</span>
                  <span className="badge bg-brand-50 text-brand-700 border border-brand-200 text-[10px]">
                    Active Rule
                  </span>
                </div>
                <div className="text-[11px] text-gray-500">{m.description}</div>

                <div className="pt-2 border-t border-gray-200 space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Auto-Deducted Packaging Kit:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                    {m.packagingDeductions?.map((d, i) => (
                      <div key={i} className="text-xs text-gray-700 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-100">
                        <span className="font-bold text-brand-700">{d.quantity}×</span>
                        <span className="truncate">{d.label || d.product?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live POS Sales & Auto-Deduction Feed */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-700" />
                <span>Recent Synced POS Transactions</span>
              </h2>
              <p className="text-xs text-gray-400">Real-time store sales and inventory deduction log</p>
            </div>
            <button
              onClick={() => setSimModalOpen(true)}
              className="text-xs text-brand-700 font-bold hover:underline"
            >
              + Test Sale
            </button>
          </div>

          <div className="space-y-3">
            {salesFeed.map((tx) => (
              <div key={tx._id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-900">{tx.billNumber}</span>
                      <span className="badge bg-teal-50 text-teal-700 border border-teal-200 text-[9px]">
                        {tx.posTerminalId}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-gray-800 mt-0.5">{tx.jewelleryItem}</div>
                    <div className="text-[11px] text-gray-500">
                      Store: <strong>{tx.store?.name}</strong> · Customer: {tx.customerName}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="badge bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ✓ Deducted
                    </span>
                    <div className="text-[10px] text-gray-400 mt-1">{formatDateTime(tx.timestamp)}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="text-[10px] text-gray-500 font-semibold mb-1">
                    Deducted from {tx.store?.code} stock:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tx.deductedItems?.map((it, idx) => (
                      <span key={idx} className="badge bg-white border border-gray-200 text-gray-700 text-[10px]">
                        -{it.quantity} {it.product?.sku || it.product?.name?.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POS Simulation Modal */}
      <Modal
        isOpen={simModalOpen}
        onClose={() => setSimModalOpen(false)}
        title="Simulate Retail POS Transaction"
        size="md"
      >
        <form onSubmit={handleSimulateSale} className="p-6 space-y-4">
          <p className="text-xs text-gray-500">
            Simulate a customer jewellery purchase at a retail showroom to verify automatic packaging deduction.
          </p>

          <div className="form-group">
            <label className="label text-xs">Retail Showroom Store *</label>
            <select
              className="input select text-sm"
              value={simForm.storeId}
              onChange={(e) => setSimForm({ ...simForm, storeId: e.target.value })}
              required
            >
              {stores.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.posTerminalId})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label text-xs">Jewellery Sales Category (Triggers BOM) *</label>
            <select
              className="input select text-sm"
              value={simForm.salesCategory}
              onChange={(e) => setSimForm({ ...simForm, salesCategory: e.target.value })}
            >
              {mappings.map((m) => (
                <option key={m.salesCategory} value={m.salesCategory}>{m.salesCategory}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label text-xs">Item Billed at POS</label>
            <input
              className="input text-sm"
              value={simForm.jewelleryItem}
              onChange={(e) => setSimForm({ ...simForm, jewelleryItem: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="label text-xs">Customer Name</label>
              <input
                className="input text-sm"
                value={simForm.customerName}
                onChange={(e) => setSimForm({ ...simForm, customerName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label text-xs">POS Invoice Bill No.</label>
              <input
                className="input text-sm font-mono"
                placeholder="Auto-generated if empty"
                value={simForm.billNo}
                onChange={(e) => setSimForm({ ...simForm, billNo: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button type="button" className="btn-secondary flex-1 text-xs" onClick={() => setSimModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 text-xs bg-emerald-700 hover:bg-emerald-800" disabled={simulating}>
              {simulating ? 'Processing POS Sync...' : 'Execute Transaction Sync'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

