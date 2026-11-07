'use client';
import { useState, useEffect } from 'react';
import {
  Target, Plus, Clock, AlertTriangle, CheckCircle, Package,
  Truck, CheckCircle2, ChevronRight, RefreshCw, Search,
  Building, User, Flame, MessageSquare, History, Trash2,
  Store, Check, Layers, AlertCircle
} from 'lucide-react';
import { goalsApi, warehousesApi, storesApi } from '../../../lib/api';
import useAuthStore from '../../../lib/authStore';
import AssignGoalModal from '../../../components/goals/AssignGoalModal';
import StatusBadge from '../../../components/ui/StatusBadge';
import Modal from '../../../components/ui/Modal';
import { formatDateTime, cn } from '../../../lib/utils';
import { toast } from '../../../components/ui/Toast';

export default function GoalsTimelinePage() {
  const { user } = useAuthStore();
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState({});
  const [warehouses, setWarehouses] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Status Action Modal State (Dispatch Confirmation)
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    goal: null,
    targetStatus: '',
    note: '',
    courierName: '',
    trackingNumber: '',
    vehicleNo: '',
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Store Delivery Confirmation Modal (Feature 12)
  const [storeConfirmModal, setStoreConfirmModal] = useState({
    isOpen: false,
    goal: null,
    discrepancyNotes: '',
    verifiedItems: [],
  });

  // Selected Timeline Details Modal
  const [viewHistoryGoal, setViewHistoryGoal] = useState(null);

  const fetchGoals = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = {};
      if (activeTab === 'urgent') params.urgentOnly = 'true';
      else if (activeTab !== 'all') params.status = activeTab;
      if (selectedWarehouse !== 'all') params.warehouse = selectedWarehouse;
      if (search) params.search = search;

      const [res, whRes, stRes] = await Promise.all([
        goalsApi.getAll(params),
        warehousesApi.getAll(),
        storesApi.getAll(),
      ]);
      setGoals(res.data.data || []);
      if (res.data.stats) setStats(res.data.stats);
      setWarehouses(whRes.data.data || []);
      setStores(stRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch dispatches:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [activeTab, selectedWarehouse, search]);

  const openStatusAction = (goal, targetStatus) => {
    setStatusModal({
      isOpen: true,
      goal,
      targetStatus,
      note: '',
      courierName: goal.courierName || 'Sequel Secure Logistics',
      trackingNumber: goal.trackingNumber || `SEQL-${Math.floor(10000 + Math.random() * 90000)}`,
      vehicleNo: goal.vehicleNo || 'MH-02-EE-8812',
    });
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusModal.goal || !statusModal.targetStatus) return;

    setUpdatingStatus(true);
    try {
      await goalsApi.updateStatus(statusModal.goal._id, {
        status: statusModal.targetStatus,
        note: statusModal.note,
        courierName: statusModal.courierName,
        trackingNumber: statusModal.trackingNumber,
        vehicleNo: statusModal.vehicleNo,
      });

      toast(`Dispatch status updated to ${statusModal.targetStatus.replace(/_/g, ' ')}!`, 'success');
      setStatusModal({ isOpen: false, goal: null, targetStatus: '', note: '', courierName: '', trackingNumber: '', vehicleNo: '' });
      fetchGoals(true);
    } catch {
      toast('Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openStoreConfirmation = (goal) => {
    setStoreConfirmModal({
      isOpen: true,
      goal,
      discrepancyNotes: '',
      verifiedItems: (goal.items || []).map((it) => ({
        product: it.product,
        receivedQty: it.dispatchedQty || it.requestedQty,
        transitDamagedQty: 0,
      })),
    });
  };

  const handleStoreConfirmSubmit = async (e) => {
    e.preventDefault();
    try {
      await storesApi.confirmStoreDelivery(storeConfirmModal.goal._id, {
        verifiedItems: storeConfirmModal.verifiedItems,
        discrepancyNotes: storeConfirmModal.discrepancyNotes,
      });
      toast('Store receipt verified! Stock added to store inventory.', 'success');
      setStoreConfirmModal({ isOpen: false, goal: null, discrepancyNotes: '', verifiedItems: [] });
      fetchGoals(true);
    } catch {
      toast('Failed to confirm delivery', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Stock Transfer & Dispatch Management</h1>
          <p className="text-gray-500 text-xs">
            Multi-SKU showroom replenishments, scheduled courier consignments & store receipt confirmation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="btn-primary btn-sm flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Create Dispatch Request
          </button>
          <button
            onClick={() => fetchGoals(true)}
            className="btn-secondary btn-sm flex items-center gap-1 text-xs"
            disabled={refreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'All Dispatches', count: stats.total || goals.length, tab: 'all' },
          { label: 'Pending Picking', count: stats.pending || 0, tab: 'pending' },
          { label: 'Ready / Packed', count: stats.ready_to_dispatch || 0, tab: 'ready_to_dispatch' },
          { label: 'Dispatched / In Transit', count: stats.dispatched || 0, tab: 'dispatched' },
          { label: 'Store Confirmed', count: stats.delivered || 0, tab: 'delivered' },
        ].map((s) => (
          <button
            key={s.tab}
            onClick={() => setActiveTab(s.tab)}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTab === s.tab
                ? 'bg-brand-50 border-brand-700 text-brand-900 shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="text-lg font-bold">{s.count}</div>
            <div className="text-[11px] font-semibold">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 text-xs"
            placeholder="Search dispatch number, store or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            className="input select text-xs py-1.5"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
          >
            <option value="all">All Origin Warehouses</option>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dispatches List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-36" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="empty-state py-16">
          <Target className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <h3 className="font-bold text-gray-800 text-sm">No dispatches found</h3>
          <p className="text-gray-400 text-xs mb-3">Create a new dispatch consignment to start tracking</p>
          <button className="btn-primary btn-sm" onClick={() => setIsAssignModalOpen(true)}>
            + Create Dispatch
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((g) => {
            const isStore = g.destinationType === 'store' || g.store;
            const destName = isStore ? g.store?.name : g.customer?.name;
            const isDelivered = g.status === 'delivered';
            const isShipped = ['dispatched', 'in_transit'].includes(g.status);

            return (
              <div key={g._id} className="card hover:shadow-card transition-shadow p-5 space-y-4">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                      {g.dispatchNo || 'DSP-ORD'}
                    </span>
                    <h3 className="font-bold text-sm text-gray-900">{g.title}</h3>
                    {g.priority === 'urgent' && (
                      <span className="badge bg-red-100 text-red-700 text-[10px] font-bold">
                        Urgent Express
                      </span>
                    )}
                    {g.isPartialDispatch && (
                      <span className="badge bg-orange-100 text-orange-800 text-[10px] font-bold">
                        Partial Dispatch
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={g.status} />
                    <button
                      onClick={() => setViewHistoryGoal(g)}
                      className="btn-ghost btn-sm p-1.5 min-h-0 text-gray-400 hover:text-brand-700"
                      title="View Timeline Audit Trail"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Routing & Consignment Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl text-xs border border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Origin Warehouse</span>
                    <div className="font-semibold text-gray-800 mt-0.5">{g.warehouse?.name}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Destination</span>
                    <div className="font-semibold text-teal-800 mt-0.5 flex items-center gap-1">
                      {isStore ? <Store className="w-3.5 h-3.5 text-teal-600" /> : <Building className="w-3.5 h-3.5" />}
                      <span>{destName}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Carrier & Tracking</span>
                    <div className="font-semibold text-gray-800 mt-0.5">
                      {g.courierName ? `${g.courierName} (${g.trackingNumber || 'Assigned'})` : 'Awaiting Carrier'}
                    </div>
                  </div>
                </div>

                {/* Multi-SKU Items Breakdown (Feature 2) */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-gray-500 uppercase">
                    Consignment Items ({g.items?.length || 1} SKUs):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {(g.items?.length ? g.items : [{ product: g.product, requestedQty: g.quantity }]).map((it, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-white border border-gray-200 flex items-center justify-between text-xs">
                        <div className="truncate pr-2">
                          <div className="font-semibold text-gray-800 truncate">{it.product?.name}</div>
                          <span className="font-mono text-[10px] text-gray-400">{it.product?.sku}</span>
                        </div>
                        <span className="font-bold text-brand-700 shrink-0">
                          {it.dispatchedQty || it.requestedQty} {it.product?.unit || 'pcs'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action Bar & Lifecycle Stage Buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs">
                  <div className="text-gray-500 flex items-center gap-3">
                    <span>Scheduled: <strong>{formatDateTime(g.scheduledDispatchDate)}</strong></span>
                    <span>•</span>
                    <span>Expected Delivery: <strong>{formatDateTime(g.expectedDeliveryDate)}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    {g.status === 'pending' && (
                      <button
                        onClick={() => openStatusAction(g, 'ready_to_dispatch')}
                        className="btn-secondary btn-sm text-xs py-1 px-3"
                      >
                        Mark Packed & Ready
                      </button>
                    )}

                    {g.status === 'ready_to_dispatch' && (
                      <button
                        onClick={() => openStatusAction(g, 'dispatched')}
                        className="btn-primary btn-sm text-xs py-1 px-3 flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" /> Dispatch with Carrier
                      </button>
                    )}

                    {isShipped && isStore && (
                      <button
                        onClick={() => openStoreConfirmation(g)}
                        className="btn-success btn-sm text-xs py-1 px-3 flex items-center gap-1 font-bold shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Confirm Store Delivery
                      </button>
                    )}

                    {isDelivered && (
                      <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-4 h-4" /> Store Verified & Restocked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Dispatch Modal */}
      <AssignGoalModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={() => {
          toast('Dispatch order registered successfully!', 'success');
          fetchGoals(true);
        }}
      />

      {/* Dispatch Confirmation Modal (Courier Details) */}
      <Modal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        title={`Update Dispatch Status: ${statusModal.targetStatus.replace(/_/g, ' ').toUpperCase()}`}
        size="md"
      >
        <form onSubmit={handleStatusSubmit} className="p-6 space-y-4 text-xs">
          {statusModal.targetStatus === 'dispatched' && (
            <div className="space-y-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-700" />
                <span>Logistics Partner & Tracking Information</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label text-xs">Courier Name</label>
                  <input
                    className="input text-xs bg-white"
                    value={statusModal.courierName}
                    onChange={(e) => setStatusModal({ ...statusModal, courierName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label text-xs">Tracking / Waybill No.</label>
                  <input
                    className="input text-xs font-mono bg-white font-bold"
                    value={statusModal.trackingNumber}
                    onChange={(e) => setStatusModal({ ...statusModal, trackingNumber: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="label text-xs">Vehicle / Gate Pass No.</label>
                <input
                  className="input text-xs bg-white"
                  value={statusModal.vehicleNo}
                  onChange={(e) => setStatusModal({ ...statusModal, vehicleNo: e.target.value })}
                  placeholder="e.g. MH-02-EE-8812"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="label text-xs">Internal Progress Note</label>
            <textarea
              className="input h-16 resize-none text-xs"
              value={statusModal.note}
              onChange={(e) => setStatusModal({ ...statusModal, note: e.target.value })}
              placeholder="e.g. Handed over to courier driver at BKC dispatch gate."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary flex-1 text-xs"
              onClick={() => setStatusModal({ ...statusModal, isOpen: false })}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 text-xs" disabled={updatingStatus}>
              {updatingStatus ? 'Updating...' : 'Confirm Status Update'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Store Receiving & Quantity Verification Modal (Feature 12) */}
      <Modal
        isOpen={storeConfirmModal.isOpen}
        onClose={() => setStoreConfirmModal({ ...storeConfirmModal, isOpen: false })}
        title={`Store Receipt Verification: ${storeConfirmModal.goal?.dispatchNo}`}
        size="lg"
      >
        <form onSubmit={handleStoreConfirmSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
            <div className="font-bold text-teal-900 text-sm">
              Receiving Destination: {storeConfirmModal.goal?.store?.name}
            </div>
            <p className="text-[11px] text-teal-700 mt-0.5">
              Please inspect outer cartons. Verify the received piece count against dispatched quantities.
            </p>
          </div>

          <div className="table-wrapper border rounded-xl overflow-hidden">
            <table className="table text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th>Product SKU</th>
                  <th>Dispatched Qty</th>
                  <th>Verified Received Qty</th>
                  <th>Transit Damaged / Missing Qty</th>
                </tr>
              </thead>
              <tbody>
                {storeConfirmModal.verifiedItems?.map((it, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="font-bold text-gray-900">{it.product?.name}</div>
                      <span className="font-mono text-[10px] text-brand-700">{it.product?.sku}</span>
                    </td>
                    <td className="font-bold text-gray-700">{it.receivedQty}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="input text-xs w-24 text-center font-bold bg-white"
                        value={it.receivedQty}
                        onChange={(e) => {
                          const copy = [...storeConfirmModal.verifiedItems];
                          copy[idx].receivedQty = Number(e.target.value);
                          setStoreConfirmModal({ ...storeConfirmModal, verifiedItems: copy });
                        }}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="input text-xs w-24 text-center font-bold bg-white text-red-600"
                        value={it.transitDamagedQty}
                        onChange={(e) => {
                          const copy = [...storeConfirmModal.verifiedItems];
                          copy[idx].transitDamagedQty = Number(e.target.value);
                          setStoreConfirmModal({ ...storeConfirmModal, verifiedItems: copy });
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-group">
            <label className="label text-xs">Store Verification Remarks</label>
            <textarea
              className="input h-16 resize-none text-xs"
              placeholder="All boxes accounted for in good order."
              value={storeConfirmModal.discrepancyNotes}
              onChange={(e) => setStoreConfirmModal({ ...storeConfirmModal, discrepancyNotes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary flex-1 text-xs"
              onClick={() => setStoreConfirmModal({ ...storeConfirmModal, isOpen: false })}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 text-xs bg-emerald-700 hover:bg-emerald-800">
              Confirm Receipt & Credit Store Inventory
            </button>
          </div>
        </form>
      </Modal>

      {/* Timeline Audit History Modal */}
      <Modal
        isOpen={!!viewHistoryGoal}
        onClose={() => setViewHistoryGoal(null)}
        title={`Consignment Timeline: ${viewHistoryGoal?.dispatchNo}`}
        size="md"
      >
        {viewHistoryGoal && (
          <div className="p-6 space-y-4 text-xs">
            <div className="space-y-3">
              {viewHistoryGoal.statusTimeline?.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 relative pb-4 border-l-2 border-brand-200 ml-2 pl-4">
                  <div className="w-3 h-3 rounded-full bg-brand-700 absolute -left-[7px] top-1" />
                  <div>
                    <div className="font-bold text-gray-900 capitalize">
                      {step.status.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-gray-500">{step.note}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {formatDateTime(step.timestamp)} · by {step.changedBy?.name || 'Operations'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
