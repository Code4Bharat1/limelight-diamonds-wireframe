'use client';
import { useState, useEffect } from 'react';
import {
  Package, TrendingUp, ArrowDownToLine, ArrowUpFromLine,
  AlertTriangle, Wrench, Warehouse, CheckCircle, XCircle,
  RefreshCw, Target, Send, Store, Shield, Boxes, Layers, ExternalLink,
  ChevronRight, Check
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { dashboardApi, stockApi, damageApi, storesApi } from '../../../lib/api';
import KPICard from '../../../components/ui/KPICard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { formatCurrency, formatDateTime } from '../../../lib/utils';
import useAuthStore from '../../../lib/authStore';

const TEAL_COLORS = ['#3f7d07', '#4f9a06', '#6cc414', '#8be235', '#a6dc5f', '#c9eb9b'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [pendingApprovalsTab, setPendingApprovalsTab] = useState('all');
  const [adjustments, setAdjustments] = useState([]);
  const [damageClaims, setDamageClaims] = useState([]);
  const [storeRequests, setStoreRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const [sumRes, movRes, adjRes, dmgRes, reqRes] = await Promise.all([
        dashboardApi.getSummary(),
        stockApi.getMovements({ limit: 6 }),
        stockApi.getAdjustments({ status: 'pending', limit: 6 }),
        damageApi.getAll({ status: 'pending_approval', limit: 6 }),
        storesApi.getRequests({ status: 'pending', limit: 6 }),
      ]);
      setSummary(sumRes.data.data);

      const toArr = (r) => {
        const d = r?.data?.data;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.data)) return d.data;
        if (Array.isArray(r?.data)) return r.data;
        return [];
      };

      setMovements(toArr(movRes));
      setAdjustments(toArr(adjRes));
      setDamageClaims(toArr(dmgRes));
      setStoreRequests(toArr(reqRes));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApproveAdjustment = async (id) => {
    try {
      await stockApi.approveAdjustment(id, { comment: 'Approved from dashboard' });
      setAdjustments((prev) => prev.filter((a) => a._id !== id));
      fetchData(true);
    } catch {}
  };

  const handleApproveDamage = async (id) => {
    try {
      await damageApi.approve(id, { disposition: 'vendor_claim', comment: 'Approved from dashboard' });
      setDamageClaims((prev) => prev.filter((c) => c._id !== id));
      fetchData(true);
    } catch {}
  };

  const handleApproveRequest = async (id) => {
    try {
      await storesApi.updateRequestStatus(id, { status: 'approved', notes: 'Approved from dashboard' });
      setStoreRequests((prev) => prev.filter((r) => r._id !== id));
      fetchData(true);
    } catch {}
  };

  // Build 7-day chart data from API trend
  const chartData = (() => {
    if (!summary?.charts?.movementTrend) return [];
    const grouped = {};
    summary.charts.movementTrend.forEach(({ _id, total }) => {
      if (!grouped[_id.date]) grouped[_id.date] = { date: _id.date, incoming: 0, outgoing: 0 };
      grouped[_id.date][_id.type] = total;
    });
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    }));
  })();

  const warehouseData = summary?.charts?.warehouseStock || [];
  const storeData = summary?.charts?.storeStock || [];
  const categoryData = summary?.charts?.categoryStock || [];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = summary?.kpis || {};

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">Executive Inventory Dashboard</h1>
            <span className="badge bg-brand-50 text-brand-700 border border-brand-200 text-xs">
              Live Real-Time
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-0.5">
            Limelight Diamonds · Central Warehouses & Showroom Network
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/stores/requests" className="btn-secondary btn-sm flex items-center gap-1.5 text-xs">
            <Send className="w-3.5 h-3.5 text-brand-700" /> Store Requests
          </Link>
          <Link href="/goals" className="btn-primary btn-sm flex items-center gap-1.5 text-xs">
            <Target className="w-3.5 h-3.5" /> New Dispatch
          </Link>
          <button
            onClick={() => fetchData(true)}
            className="btn-secondary btn-sm flex items-center gap-1"
            disabled={refreshing}
            title="Refresh metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Grid (Addressing Feature 1, 2, 3, 4, 5, 6, 7, 8) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard
          icon={Boxes}
          label="Total Active SKUs"
          value={kpis.totalSKUs?.toLocaleString('en-IN') || '18'}
          color="teal"
          subtext="Packaging, display & gifts"
        />
        <KPICard
          icon={Package}
          label="Total Stock Units"
          value={kpis.totalStock?.toLocaleString('en-IN')}
          color="blue"
          subtext={`Valuation: ${formatCurrency(kpis.totalValuation)}`}
        />
        <KPICard
          icon={ArrowDownToLine}
          label="Today's Incoming"
          value={kpis.todayIncoming?.toLocaleString('en-IN')}
          color="green"
          subtext="Vendor supplier shipments"
        />
        <KPICard
          icon={ArrowUpFromLine}
          label="Today's Outgoing"
          value={kpis.todayOutgoing?.toLocaleString('en-IN')}
          color="orange"
          subtext="Store & lounge dispatches"
        />
        <KPICard
          icon={AlertTriangle}
          label="Low Stock Alerts"
          value={kpis.lowStockItems}
          color="amber"
          subtext="Items below reorder point"
        />
        <KPICard
          icon={Wrench}
          label="Damaged Stock Items"
          value={kpis.damagedItems?.toLocaleString('en-IN')}
          color="red"
          subtext={`Vendor: ${kpis.damagedBySource?.vendor || 0} · Transit: ${kpis.damagedBySource?.transit || 0}`}
        />
        <KPICard
          icon={Shield}
          label="Pending Approvals"
          value={kpis.pendingApprovals}
          color="purple"
          subtext={`${kpis.pendingBreakdown?.adjustments || 0} adj · ${kpis.pendingBreakdown?.damageClaims || 0} claims · ${kpis.pendingBreakdown?.storeRequests || 0} reqs`}
        />
        <KPICard
          icon={Store}
          label="Active Retail Stores"
          value={kpis.activeStores || 5}
          color="indigo"
          subtext="5 POS terminals online"
        />
      </div>

      {/* 2-Column Section: 7-Day Movement Trend + Store Outgoing Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 7-Day Inward vs Outward Trend Chart */}
        <div className="card lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">7-Day Inventory Movement Trends</h2>
              <p className="text-xs text-gray-400">Inward bulk receipts vs outward retail dispatches</p>
            </div>
            <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-1 rounded-md">
              Daily Units
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3f7d07" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3f7d07" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="incoming" stroke="#3f7d07" strokeWidth={2} fillOpacity={1} fill="url(#incGrad)" name="Inward (Suppliers)" />
                <Area type="monotone" dataKey="outgoing" stroke="#ea580c" strokeWidth={2} fillOpacity={1} fill="url(#outGrad)" name="Outward (Stores)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Outgoing Breakdown by Store (Feature 5) */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Dispatches by Destination Store</h2>
              <p className="text-xs text-gray-400">Outward volume across retail locations</p>
            </div>
            <Link href="/stores" className="text-xs text-brand-700 font-semibold hover:underline">
              All Stores
            </Link>
          </div>

          <div className="space-y-3">
            {(kpis.outgoingByStore || []).map((s) => (
              <div key={s.storeId} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-gray-900 truncate">{s.storeName}</div>
                  <div className="text-[10px] text-gray-400">{s.city} · Code: {s.code}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-xs text-orange-600">{s.totalDispatched} units</span>
                  <div className="text-[10px] text-gray-400">shipped</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warehouses & Store Stock Distribution Overview (Feature 9 & 10) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouse Overview */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Warehouse className="w-4 h-4 text-brand-700" />
                <span>Central Warehouses Overview</span>
              </h2>
              <p className="text-xs text-gray-400">Bulk reserve units held in primary logistics hubs</p>
            </div>
            <Link href="/warehouses" className="text-xs text-brand-700 font-semibold hover:underline">
              Manage Floors →
            </Link>
          </div>

          <div className="space-y-3">
            {warehouseData.map((w) => (
              <div key={w._id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800">{w.name}</span>
                  <span className="font-bold text-brand-700">{w.total?.toLocaleString('en-IN')} units</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-700 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((w.total / 15000) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Store-wise Stock Overview */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-brand-700" />
                <span>Store-wise Live Stock Overview</span>
              </h2>
              <p className="text-xs text-gray-400">Packaging, bag & gift levels across retail boutiques</p>
            </div>
            <Link href="/stores" className="text-xs text-brand-700 font-semibold hover:underline">
              View Stores →
            </Link>
          </div>

          <div className="space-y-3">
            {storeData.map((s) => (
              <div key={s._id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800">{s.name}</span>
                  <span className="font-bold text-teal-700">{s.total?.toLocaleString('en-IN')} units on floor</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((s.total / 2500) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unified Pending Approvals Center (Feature 8) */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Pending Operational Approvals Queue</span>
              <span className="badge bg-purple-100 text-purple-800 text-xs">
                {(adjustments?.length || 0) + (damageClaims?.length || 0) + (storeRequests?.length || 0)} Pending
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Cross-functional queue: Stock adjustments, damage claims & store replenishment requests
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'requests', label: `Store Reqs (${storeRequests?.length || 0})` },
              { id: 'damages', label: `Damage Claims (${damageClaims?.length || 0})` },
              { id: 'adjustments', label: `Adjustments (${adjustments?.length || 0})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setPendingApprovalsTab(t.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  pendingApprovalsTab === t.id ? 'bg-white shadow-sm text-brand-800 font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Approvals Table */}
        <div className="table-wrapper">
          <table className="table text-xs">
            <thead>
              <tr>
                <th>Type</th>
                <th>Reference / Target</th>
                <th>Item / Reason</th>
                <th>Requested Qty</th>
                <th>Submitted By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Store Requests */}
              {(pendingApprovalsTab === 'all' || pendingApprovalsTab === 'requests') &&
                Array.isArray(storeRequests) &&
                storeRequests.map((req) => (
                  <tr key={req._id}>
                    <td>
                      <span className="badge bg-blue-50 text-blue-700 border border-blue-200">
                        Store Request
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-gray-900">{req.store?.name}</div>
                      <div className="text-[10px] text-gray-400">{req.requestNumber}</div>
                    </td>
                    <td>
                      <div className="text-gray-700">{req.items?.length || 0} SKU items requested</div>
                      <div className="text-[10px] text-gray-400 truncate max-w-xs">{req.notes || 'Routine restock'}</div>
                    </td>
                    <td className="font-bold text-gray-900">
                      {req.items?.reduce((s, i) => s + (i.requestedQty || 0), 0)} units
                    </td>
                    <td>
                      <div className="text-gray-700">{req.requestedBy?.name || 'Store Mgr'}</div>
                      <div className="text-[10px] text-gray-400">{formatDateTime(req.createdAt)}</div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleApproveRequest(req._id)}
                        className="btn-primary btn-sm py-1 px-2.5 text-xs flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Approve & Fulfill
                      </button>
                    </td>
                  </tr>
                ))}

              {/* Damage Claims */}
              {(pendingApprovalsTab === 'all' || pendingApprovalsTab === 'damages') &&
                Array.isArray(damageClaims) &&
                damageClaims.map((dmg) => (
                  <tr key={dmg._id}>
                    <td>
                      <span className="badge bg-red-50 text-red-700 border border-red-200">
                        Damage Claim ({dmg.source})
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-gray-900">{dmg.claimNumber}</div>
                      <div className="text-[10px] text-gray-400">{dmg.supplier?.name || dmg.store?.name || 'Central WH'}</div>
                    </td>
                    <td>
                      <div className="font-medium text-gray-900">{dmg.product?.name}</div>
                      <div className="text-[10px] text-red-600">{dmg.defectType || dmg.reason}</div>
                    </td>
                    <td className="font-bold text-red-600">
                      -{dmg.quantity} {dmg.product?.unit}
                    </td>
                    <td>
                      <div className="text-gray-700">{dmg.reportedBy?.name}</div>
                      <div className="text-[10px] text-gray-400">{formatDateTime(dmg.createdAt)}</div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleApproveDamage(dmg._id)}
                        className="btn-danger btn-sm py-1 px-2.5 text-xs flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Approve Write-off / Claim
                      </button>
                    </td>
                  </tr>
                ))}

              {/* Adjustments */}
              {(pendingApprovalsTab === 'all' || pendingApprovalsTab === 'adjustments') &&
                Array.isArray(adjustments) &&
                adjustments.map((adj) => (
                  <tr key={adj._id}>
                    <td>
                      <span className="badge bg-amber-50 text-amber-700 border border-amber-200">
                        Stock Adjustment
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-gray-900">{adj.warehouse?.name}</div>
                      <div className="text-[10px] text-gray-400">Inventory recount</div>
                    </td>
                    <td>
                      <div className="font-medium text-gray-900">{adj.product?.name}</div>
                      <div className="text-[10px] text-gray-500">{adj.reason}</div>
                    </td>
                    <td className={`font-bold ${adj.quantityDelta < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {adj.quantityDelta > 0 ? `+${adj.quantityDelta}` : adj.quantityDelta} {adj.product?.unit}
                    </td>
                    <td>
                      <div className="text-gray-700">{adj.requestedBy?.name}</div>
                      <div className="text-[10px] text-gray-400">{formatDateTime(adj.createdAt)}</div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleApproveAdjustment(adj._id)}
                        className="btn-success btn-sm py-1 px-2.5 text-xs flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Approve Correction
                      </button>
                    </td>
                  </tr>
                ))}

              {(adjustments?.length || 0) === 0 && (damageClaims?.length || 0) === 0 && (storeRequests?.length || 0) === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                    All operational queues are clear! No pending approvals.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
