'use client';
import React from 'react';
import {
  Building2, Calendar, Clock, Palette, ArrowLeft,
  HelpCircle, Settings, FileText, ChevronRight, ShieldCheck, Sparkles
} from 'lucide-react';
import useAccountingStore from '../../lib/accountingStore';
import useAuthStore from '../../lib/authStore';

export default function TallyHeader({ onOpenFeatures, onOpenLedgerModal }) {
  const {
    companyName,
    financialYear,
    currentDate,
    theme,
    setTheme,
    currentView,
    goBack,
    isDetailedView,
    toggleDetailedView,
    setView,
  } = useAccountingStore();

  const { user } = useAuthStore();

  const viewTitles = {
    gateway: 'Gateway of Tally',
    vouchers: 'Accounting Voucher Creation',
    'balance-sheet': 'Balance Sheet',
    pnl: 'Profit & Loss A/c',
    'trial-balance': 'Trial Balance',
    'day-book': 'Day Book',
    'ledger-view': 'Ledger Account Statement',
    'stock-summary': 'Stock Summary',
    'gst-reports': 'GST Portal Reports (GSTR-1 / 3B)',
    'ratio-analysis': 'Ratio Analysis',
    'accounts-info': 'Masters & Chart of Accounts',
  };

  const getThemeStyles = () => {
    if (theme === 'tally-erp9') {
      return 'bg-[#2a4d3e] text-[#f8f5d7] border-b-2 border-[#1c382c]';
    }
    if (theme === 'modern-saas') {
      return 'bg-slate-900 text-white border-b border-slate-800';
    }
    // tally-prime
    return 'bg-[#0f4c81] text-white border-b-2 border-[#09355c]';
  };

  return (
    <div className={`transition-colors duration-200 ${getThemeStyles()}`}>
      {/* Top Banner with Tally Identity & Tools */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Tally Logo & Mode */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-black tracking-wider uppercase">
            <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-extrabold text-[11px] shadow-sm">
              {theme === 'tally-erp9' ? 'Tally.ERP 9' : theme === 'modern-saas' ? 'ERP CLOUD' : 'TallyPrime'}
            </span>
            <span className="hidden sm:inline opacity-90 font-mono">v4.1 GOLD (Enterprise)</span>
          </div>

          <div className="h-4 w-px bg-white/20 hidden md:block" />

          {/* Company Details */}
          <div className="flex items-center gap-1.5 font-medium">
            <Building2 className="w-3.5 h-3.5 opacity-75" />
            <span className="font-bold">{companyName}</span>
          </div>
        </div>

        {/* Center: Period & Date */}
        <div className="hidden lg:flex items-center gap-4 bg-black/20 px-3 py-1 rounded font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-amber-300" />
            <span>Period: <strong>{financialYear}</strong></span>
          </div>
          <span className="opacity-40">|</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-emerald-300" />
            <span>Date: <strong>{new Date(currentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
          </div>
        </div>

        {/* Right: Theme Selector & Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Quick theme switcher */}
          <div className="flex items-center bg-black/25 rounded p-0.5">
            <button
              onClick={() => setTheme('tally-prime')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                theme === 'tally-prime' ? 'bg-white text-[#0f4c81] shadow' : 'hover:bg-white/10'
              }`}
              title="TallyPrime Azure Theme"
            >
              Prime
            </button>
            <button
              onClick={() => setTheme('tally-erp9')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                theme === 'tally-erp9' ? 'bg-[#f8f5d7] text-[#2a4d3e] shadow' : 'hover:bg-white/10'
              }`}
              title="Classic Tally.ERP 9 Retro Theme"
            >
              ERP 9
            </button>
            <button
              onClick={() => setTheme('modern-saas')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                theme === 'modern-saas' ? 'bg-cyan-400 text-slate-900 shadow' : 'hover:bg-white/10'
              }`}
              title="Clean SaaS Wireframe Theme"
            >
              Modern
            </button>
          </div>

          {/* Master creation Alt+C */}
          <button
            onClick={onOpenLedgerModal}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shadow-sm transition-transform active:scale-95"
            title="Create New Ledger (Alt+C)"
          >
            <span>Alt+C</span>
            <span className="hidden md:inline">New Ledger</span>
          </button>

          {/* Role pill */}
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-[11px]">
            <ShieldCheck className="w-3 h-3 text-emerald-300" />
            <span className="capitalize font-semibold">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Sub-bar / Breadcrumb / Screen Title */}
      <div className="px-4 py-1.5 bg-black/15 flex items-center justify-between border-t border-white/10 text-xs">
        <div className="flex items-center gap-2 font-mono">
          {currentView !== 'gateway' ? (
            <button
              onClick={goBack}
              className="flex items-center gap-1 hover:text-amber-300 font-bold px-1.5 py-0.5 rounded bg-black/20"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Esc : Back</span>
            </button>
          ) : (
            <span className="font-bold text-amber-300">★ GATEWAY</span>
          )}

          <ChevronRight className="w-3 h-3 opacity-40" />
          <span className="font-bold uppercase tracking-wide text-sm text-yellow-200">
            {viewTitles[currentView] || currentView}
          </span>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2">
          {['balance-sheet', 'pnl', 'trial-balance', 'stock-summary'].includes(currentView) && (
            <button
              onClick={toggleDetailedView}
              className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded border ${
                isDetailedView
                  ? 'bg-amber-400 text-slate-900 border-amber-300'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              Alt+F1 : {isDetailedView ? 'Detailed' : 'Condensed'}
            </button>
          )}

          <button
            onClick={() => onOpenFeatures('f11')}
            className="hidden sm:inline px-2 py-0.5 text-[11px] font-mono rounded bg-white/10 hover:bg-white/20"
          >
            F11 : Features
          </button>
          <button
            onClick={() => onOpenFeatures('f12')}
            className="hidden sm:inline px-2 py-0.5 text-[11px] font-mono rounded bg-white/10 hover:bg-white/20"
          >
            F12 : Configure
          </button>
        </div>
      </div>
    </div>
  );
}
