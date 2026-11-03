'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert, ArrowLeft, Receipt, BookOpen, Layers,
  BarChart3, Landmark, FileText, CheckCircle2, Lock
} from 'lucide-react';
import useAuthStore from '../../../lib/authStore';
import useAccountingStore from '../../../lib/accountingStore';
import TallyHeader from '../../../components/accounting/TallyHeader';
import TallyButtonBar from '../../../components/accounting/TallyButtonBar';
import GatewayOfTally from '../../../components/accounting/GatewayOfTally';
import VoucherEntry from '../../../components/accounting/VoucherEntry';
import {
  BalanceSheetView,
  ProfitLossView,
  TrialBalanceView,
  DayBookView,
  LedgerReportView,
  StockSummaryView,
  GstReportView,
  RatioAnalysisView,
  AccountsInfoView,
} from '../../../components/accounting/FinancialStatements';
import LedgerMasterModal from '../../../components/accounting/LedgerMasterModal';
import TallyFeaturesModal from '../../../components/accounting/TallyFeaturesModal';

export default function AccountingPage() {
  const router = useRouter();
  const { user, isAccountingAllowed } = useAuthStore();
  const {
    currentView,
    setView,
    goBack,
    selectedVoucherType,
    theme,
  } = useAccountingStore();

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [featureModalMode, setFeatureModalMode] = useState(null); // 'date' | 'f11' | 'f12' | null

  // Global Keyboard Shortcuts for Tally Replica
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Avoid hotkeys if inside text input or textarea
      const targetTag = e.target.tagName;
      const isInputActive = ['INPUT', 'TEXTAREA'].includes(targetTag);

      // Escape key (always works for navigation back / cancel)
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isLedgerModalOpen) {
          setIsLedgerModalOpen(false);
        } else if (featureModalMode) {
          setFeatureModalMode(null);
        } else {
          goBack();
        }
        return;
      }

      // Alt+C for Master Creation
      if ((e.altKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setIsLedgerModalOpen(true);
        return;
      }

      if (isInputActive) return;

      // Function keys
      if (e.key === 'F2') {
        e.preventDefault();
        setFeatureModalMode('date');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setView('vouchers', { voucherType: 'Contra' });
      } else if (e.key === 'F5') {
        e.preventDefault();
        setView('vouchers', { voucherType: 'Payment' });
      } else if (e.key === 'F6') {
        e.preventDefault();
        setView('vouchers', { voucherType: 'Receipt' });
      } else if (e.key === 'F7') {
        e.preventDefault();
        setView('vouchers', { voucherType: 'Journal' });
      } else if (e.key === 'F8') {
        e.preventDefault();
        setView('vouchers', { voucherType: 'Sales' });
      } else if (e.key === 'F9') {
        e.preventDefault();
        setView('vouchers', { voucherType: 'Purchase' });
      } else if (e.key === 'F11') {
        e.preventDefault();
        setFeatureModalMode('f11');
      } else if (e.key === 'F12') {
        e.preventDefault();
        setFeatureModalMode('f12');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack, setView, isLedgerModalOpen, featureModalMode]);

  // Role Restriction Check
  const allowed = isAccountingAllowed();

  if (!allowed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-white border border-red-100 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
            <p className="text-sm text-gray-500 mt-1">
              The <strong>Tally Accounting & Financial Module</strong> is strictly confidential and reserved for <strong>Admin (Owner)</strong>, <strong>Manager</strong>, and <strong>Accountant</strong> roles.
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
            Current Logged-in Role: <span className="font-bold text-gray-900 capitalize">{user?.role?.replace('_', ' ') || 'Guest'}</span>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // Render current active view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'gateway':
        return <GatewayOfTally />;
      case 'vouchers':
        return <VoucherEntry />;
      case 'balance-sheet':
        return (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto font-mono text-xs">
            <div className="max-w-5xl mx-auto">
              <BalanceSheetView />
            </div>
          </div>
        );
      case 'pnl':
        return (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto font-mono text-xs">
            <div className="max-w-5xl mx-auto">
              <ProfitLossView />
            </div>
          </div>
        );
      case 'trial-balance':
        return (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto font-mono text-xs">
            <div className="max-w-5xl mx-auto">
              <TrialBalanceView />
            </div>
          </div>
        );
      case 'day-book':
        return (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto font-mono text-xs">
            <div className="max-w-5xl mx-auto">
              <DayBookView />
            </div>
          </div>
        );
      case 'ledger-view':
        return (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto font-mono text-xs">
            <div className="max-w-5xl mx-auto">
              <LedgerReportView />
            </div>
          </div>
        );
      case 'stock-summary':
        return (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto font-mono text-xs">
            <div className="max-w-5xl mx-auto">
              <StockSummaryView />
            </div>
          </div>
        );
      case 'gst-reports':
        return (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto font-mono text-xs">
            <div className="max-w-5xl mx-auto">
              <GstReportView />
            </div>
          </div>
        );
      case 'ratio-analysis':
        return (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto font-mono text-xs">
            <div className="max-w-5xl mx-auto">
              <RatioAnalysisView />
            </div>
          </div>
        );
      case 'accounts-info':
        return (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto font-mono text-xs">
            <div className="max-w-5xl mx-auto">
              <AccountsInfoView onOpenLedgerModal={() => setIsLedgerModalOpen(true)} />
            </div>
          </div>
        );
      default:
        return <GatewayOfTally />;
    }
  };

  const getContainerStyles = () => {
    if (theme === 'tally-erp9') {
      return 'bg-[#f4efe0] text-[#1c382c] border-[#2a4d3e]';
    }
    if (theme === 'modern-saas') {
      return 'bg-slate-950 text-slate-100 border-slate-800';
    }
    // tally-prime
    return 'bg-[#f0f4f8] text-[#0f2c4a] border-[#0f4c81]';
  };

  return (
    <div className={`flex flex-col min-h-[calc(100vh-100px)] rounded-xl overflow-hidden border-2 shadow-2xl transition-all duration-150 ${getContainerStyles()}`}>
      {/* Tally Header Toolbar */}
      <TallyHeader
        onOpenFeatures={(m) => setFeatureModalMode(m)}
        onOpenLedgerModal={() => setIsLedgerModalOpen(true)}
      />

      {/* Main Workspace Area (View + Button Bar) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Active Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderCurrentView()}
        </div>

        {/* Right Function Keys Bar */}
        <TallyButtonBar
          onOpenDateModal={() => setFeatureModalMode('date')}
          onOpenFeatures={(m) => setFeatureModalMode(m)}
          onOpenLedgerModal={() => setIsLedgerModalOpen(true)}
        />
      </div>

      {/* Modals */}
      <LedgerMasterModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
      />

      <TallyFeaturesModal
        mode={featureModalMode}
        isOpen={!!featureModalMode}
        onClose={() => setFeatureModalMode(null)}
      />
    </div>
  );
}
