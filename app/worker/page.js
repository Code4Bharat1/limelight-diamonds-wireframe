'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, RotateCcw,
  Clock, Package, AlertTriangle, ChevronRight, Zap, Target, Flame,
  Truck, CheckCircle2, Building, Send, FileText, CheckCircle, Store,
  Boxes, Shield
} from 'lucide-react';
import { stockApi, goalsApi, storesApi } from '@/lib/api';
import { formatDateTime, formatDate } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import useAuthStore from '@/lib/authStore';
import useLanguageStore from '@/lib/languageStore';

export default function WorkerHomePage() {
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  const [movements, setMovements] = useState([]);
  const [assignedGoals, setAssignedGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Quick Dispatch Modal for Courier info
  const [dispatchModal, setDispatchModal] = useState({
    isOpen: false,
    goal: null,
    courierName: 'Sequel Secure Logistics',
    trackingNumber: '',
  });

  const actionCards = [
    { label: 'QR Scan Operations', icon: QrCode, color: 'bg-emerald-50 text-emerald-800 border-emerald-200', href: '/worker/scan' },
    { label: 'Dispatch Picking Tasks', icon: Target, color: 'bg-indigo-50 text-indigo-700 border-indigo-200', href: '/goals' },
    { label: 'Inward Goods Verification', icon: ArrowDownToLine, color: 'bg-teal-50 text-teal-700 border-teal-200', href: '/worker/scan?action=incoming' },
    { label: 'Stock Audits & Count', icon: Boxes, color: 'bg-purple-50 text-purple-700 border-purple-200', href: '/audits' },
    { label: 'Inter-Unit Transfers', icon: ArrowLeftRight, color: 'bg-blue-50 text-blue-700 border-blue-200', href: '/worker/scan?action=transfer' },
    { label: 'Report Damaged Material', icon: AlertTriangle, color: 'bg-red-50 text-red-700 border-red-200', href: '/stock/damaged' },
  ];

  const fetchData = async (isSilent = false) => {
    try {
      const [movRes, goalsRes] = await Promise.all([
        stockApi.getMovements({ limit: 6 }),
        goalsApi.getAll({ limit: 10 }),
      ]);
      setMovements(movRes.data.data || []);

      const activeGoals = (goalsRes.data.data || []).filter(
        (g) => g.status === 'pending' || g.status === 'ready_to_dispatch'
      );
      setAssignedGoals(activeGoals);
    } catch (err) {
      console.error('Worker home fetch error:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickStatusUpdate = async (goalId, newStatus, courier = '', tracking = '') => {
    setActionLoadingId(goalId);
    try {
      await goalsApi.updateStatus(goalId, {
        status: newStatus,
        courierName: courier,
        trackingNumber: tracking,
        note: `Packed and processed by warehouse staff ${user?.name}`,
      });
      await fetchData(true);
    } catch {
      alert('Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!dispatchModal.goal) return;
    await handleQuickStatusUpdate(
      dispatchModal.goal._id,
      'dispatched',
      dispatchModal.courierName,
      dispatchModal.trackingNumber || `SEQL-${Math.floor(10000 + Math.random() * 90000)}`
    );
    setDispatchModal({ isOpen: false, goal: null, courierName: '', trackingNumber: '' });
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-md mx-auto space-y-5 animate-fade-in pb-16">
      {/* Worker Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs">{greeting} 👋</p>
          <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
          <p className="text-xs text-gray-400 capitalize">
            {user?.designation || 'Warehouse Staff'} · {user?.assignedWarehouse?.name || 'Central WH (BKC)'}
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-base">
          {user?.name?.charAt(0) || 'W'}
        </div>
      </div>

      {/* Primary Action Button: Launch Scanner */}
      <Link
        href="/worker/scan"
        className="block p-5 bg-gradient-to-r from-brand-800 to-teal-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-base">Scan QR & Barcode</div>
              <div className="text-white/80 text-xs">Pick, pack, receive or verify items</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/70" />
        </div>
      </Link>

      {/* Quick Action Operations Grid */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Warehouse Operations
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {actionCards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all hover:shadow-sm ${c.color}`}
            >
              <c.icon className="w-4 h-4 shrink-0" />
              <span className="font-bold text-xs truncate">{c.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Assigned Pick & Pack Dispatches */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
            <Target className="w-4 h-4 text-brand-700" />
            <span>Assigned Picking Tasks ({assignedGoals.length})</span>
          </h2>
          <Link href="/goals" className="text-xs text-brand-700 font-semibold hover:underline">
            View All
          </Link>
        </div>

        {assignedGoals.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-2xl text-center text-xs text-gray-400">
            No pending dispatch tasks currently assigned.
          </div>
        ) : (
          assignedGoals.map((g) => (
            <div
              key={g._id}
              className="p-4 rounded-2xl border-2 bg-white border-gray-200 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-brand-700 font-bold bg-brand-50 px-1.5 py-0.2 rounded">
                      {g.dispatchNo || 'DSP'}
                    </span>
                    <span className="font-bold text-xs text-gray-900">{g.title}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <Store className="w-3 h-3 text-teal-600" />
                    <span>To: <strong>{g.store?.name || g.customer?.name}</strong></span>
                  </div>
                </div>
                <StatusBadge status={g.status} />
              </div>

              {/* Items in Consignment */}
              <div className="bg-gray-50 p-2 rounded-xl text-xs space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Items to Pick:</span>
                {(g.items?.length ? g.items : [{ product: g.product, requestedQty: g.quantity }]).map((it, idx) => (
                  <div key={idx} className="flex justify-between font-semibold text-gray-800">
                    <span className="truncate pr-2">{it.product?.name}</span>
                    <span className="font-bold text-brand-700">{it.dispatchedQty || it.requestedQty} {it.product?.unit || 'pcs'}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {g.status === 'pending' && (
                  <button
                    onClick={() => handleQuickStatusUpdate(g._id, 'ready_to_dispatch')}
                    disabled={actionLoadingId === g._id}
                    className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{actionLoadingId === g._id ? 'Updating...' : 'Mark Packed & Ready'}</span>
                  </button>
                )}

                {g.status === 'ready_to_dispatch' && (
                  <button
                    onClick={() => setDispatchModal({ isOpen: true, goal: g, courierName: 'Sequel Secure Logistics', trackingNumber: '' })}
                    className="btn-primary w-full text-xs py-2 bg-indigo-700 hover:bg-indigo-800 flex items-center justify-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Hand Over to Courier</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Courier Handover Modal */}
      <Modal
        isOpen={dispatchModal.isOpen}
        onClose={() => setDispatchModal({ isOpen: false, goal: null, courierName: '', trackingNumber: '' })}
        title="Confirm Courier Handover"
        size="sm"
      >
        <form onSubmit={handleDispatchSubmit} className="p-5 space-y-3 text-xs">
          <div className="form-group">
            <label className="label text-xs">Carrier Partner</label>
            <input
              className="input text-xs"
              value={dispatchModal.courierName}
              onChange={(e) => setDispatchModal({ ...dispatchModal, courierName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="label text-xs">Courier Docket / Tracking No.</label>
            <input
              className="input text-xs font-mono"
              placeholder="e.g. SEQL-89102"
              value={dispatchModal.trackingNumber}
              onChange={(e) => setDispatchModal({ ...dispatchModal, trackingNumber: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              className="btn-secondary flex-1 text-xs"
              onClick={() => setDispatchModal({ isOpen: false, goal: null, courierName: '', trackingNumber: '' })}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 text-xs">
              Confirm Shipped
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
