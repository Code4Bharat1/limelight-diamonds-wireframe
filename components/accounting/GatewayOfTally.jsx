'use client';
import React, { useState, useEffect } from 'react';
import {
  Building2, Calendar, FileText, BarChart3, Receipt,
  BookOpen, Calculator, Landmark, ShieldCheck, ArrowRight,
  TrendingUp, TrendingDown, Layers, Boxes
} from 'lucide-react';
import useAccountingStore from '../../lib/accountingStore';

const MENU_ITEMS = [
  { section: 'MASTERS' },
  { key: 'A', id: 'accounts-info', label: 'Accounts Info (Ledgers & Groups)', hotkey: 'A', icon: BookOpen },
  { key: 'I', id: 'stock-summary', label: 'Inventory Info (Stock Items)', hotkey: 'I', icon: Boxes },

  { section: 'TRANSACTIONS' },
  { key: 'V', id: 'vouchers', label: 'Accounting Vouchers (F4 - F9)', hotkey: 'V', icon: Receipt },
  { key: 'D', id: 'day-book', label: 'Day Book (Daily Vouchers)', hotkey: 'D', icon: FileText },

  { section: 'UTILITIES' },
  { key: 'N', id: 'ledger-view', label: 'Banking & Cash/Bank Accounts', hotkey: 'N', icon: Landmark },
  { key: 'G', id: 'gst-reports', label: 'GST Reports (GSTR-1 / GSTR-3B)', hotkey: 'G', icon: ShieldCheck },

  { section: 'REPORTS' },
  { key: 'B', id: 'balance-sheet', label: 'Balance Sheet', hotkey: 'B', icon: BarChart3 },
  { key: 'P', id: 'pnl', label: 'Profit & Loss A/c', hotkey: 'P', icon: TrendingUp },
  { key: 'S', id: 'stock-summary', label: 'Stock Summary', hotkey: 'S', icon: Boxes },
  { key: 'R', id: 'ratio-analysis', label: 'Ratio Analysis', hotkey: 'R', icon: Calculator },
  { key: 'T', id: 'trial-balance', label: 'Trial Balance', hotkey: 'T', icon: Layers },
];

export default function GatewayOfTally() {
  const {
    companyName,
    financialYear,
    currentDate,
    vouchers,
    theme,
    setView,
    getBalanceSheetData,
    getProfitAndLossData,
  } = useAccountingStore();

  const [selectedIndex, setSelectedIndex] = useState(1); // Default on first actionable item

  const actionableItems = MENU_ITEMS.filter((item) => !item.section);

  const lastVoucher = vouchers[0];
  const bsData = getBalanceSheetData();
  const pnlData = getProfitAndLossData();

  // Keyboard navigation for menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if active element is an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % actionableItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + actionableItems.length) % actionableItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = actionableItems[selectedIndex];
        if (selected) setView(selected.id);
      } else {
        // Hotkey match
        const hotkey = e.key.toUpperCase();
        const match = actionableItems.find((item) => item.hotkey === hotkey);
        if (match) {
          e.preventDefault();
          setView(match.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, actionableItems, setView]);

  const getContainerBg = () => {
    if (theme === 'tally-erp9') return 'bg-[#f4efe0] text-[#1c382c]';
    if (theme === 'modern-saas') return 'bg-slate-950 text-slate-100';
    // tally-prime
    return 'bg-[#f0f4f8] text-[#0f2c4a]';
  };

  const getMenuBoxStyle = () => {
    if (theme === 'tally-erp9') {
      return 'bg-[#f8f5d7] border-2 border-[#2a4d3e] shadow-[4px_4px_0px_#2a4d3e]';
    }
    if (theme === 'modern-saas') {
      return 'bg-slate-900 border border-slate-800 shadow-xl shadow-cyan-950/20';
    }
    // tally-prime
    return 'bg-white border-2 border-[#0f4c81] shadow-[4px_4px_0px_#0f4c81]';
  };

  const getMenuHeaderStyle = () => {
    if (theme === 'tally-erp9') return 'bg-[#2a4d3e] text-[#f8f5d7] font-bold';
    if (theme === 'modern-saas') return 'bg-slate-800 text-cyan-400 font-bold border-b border-slate-700';
    // tally-prime
    return 'bg-[#0f4c81] text-white font-bold';
  };

  const getHighlightStyle = (isActive) => {
    if (!isActive) return 'hover:bg-black/5 text-inherit';
    if (theme === 'tally-erp9') return 'bg-[#2a4d3e] text-[#f8f5d7] font-bold';
    if (theme === 'modern-saas') return 'bg-cyan-500 text-slate-950 font-bold';
    // tally-prime
    return 'bg-[#0f4c81] text-white font-bold';
  };

  return (
    <div className={`flex-1 p-4 md:p-6 flex flex-col items-center justify-start overflow-y-auto ${getContainerBg()}`}>
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto">
        
        {/* Left Pane: Company Status & Realtime Financial Highlights */}
        <div className="lg:col-span-6 space-y-4">
          {/* Company & Period Card */}
          <div className={`p-4 rounded-lg font-mono text-xs border ${getMenuBoxStyle()}`}>
            <div className={`px-3 py-1.5 -mx-4 -mt-4 rounded-t-sm mb-3 flex items-center justify-between text-xs ${getMenuHeaderStyle()}`}>
              <span>CURRENT COMPANY STATUS</span>
              <span className="text-[10px] opacity-80">Online Multi-User</span>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-black/10">
              <div>
                <div className="text-[10px] opacity-60 uppercase font-semibold">Current Period</div>
                <div className="font-bold text-sm mt-0.5">{financialYear}</div>
              </div>
              <div>
                <div className="text-[10px] opacity-60 uppercase font-semibold">Current Date</div>
                <div className="font-bold text-sm mt-0.5">
                  {new Date(currentDate).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 space-y-2">
              <div>
                <div className="text-[10px] opacity-60 uppercase font-semibold">Name of Company</div>
                <div className="font-black text-base text-amber-600 dark:text-amber-400 mt-0.5">
                  {companyName}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="opacity-75">Date of Last Voucher Entry:</span>
                <span className="font-bold font-mono">
                  {lastVoucher ? new Date(lastVoucher.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="opacity-75">Total Vouchers in Ledger:</span>
                <span className="font-bold font-mono bg-black/10 px-2 py-0.5 rounded">
                  {vouchers.length} Transactions
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Tally Accounting Snapshot */}
          <div className={`p-4 rounded-lg font-mono text-xs border ${getMenuBoxStyle()}`}>
            <div className={`px-3 py-1.5 -mx-4 -mt-4 rounded-t-sm mb-3 flex items-center justify-between text-xs ${getMenuHeaderStyle()}`}>
              <span>EXECUTIVE FINANCIAL SNAPSHOT</span>
              <span className="text-[10px] text-amber-300">Live Auto-Sync</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="opacity-75">Total Turnover (Sales):</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{pnlData.totalSales.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-75">Gross Profit c/d:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  ₹{pnlData.grossProfit.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-75">Net Profit:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  ₹{pnlData.netProfit.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="h-px bg-black/10 my-1" />
              <div className="flex items-center justify-between">
                <span className="opacity-75">Bank & Cash Balance:</span>
                <span className="font-bold">
                  ₹{(bsData.assets.bank.balance + bsData.assets.cash.balance).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-75">Sundry Debtors (Receivables):</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  ₹{bsData.assets.debtors.balance.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-75">Sundry Creditors (Payables):</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  ₹{bsData.liabilities.creditors.balance.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-75">Closing Stock Valuation:</span>
                <span className="font-bold text-purple-700 dark:text-purple-400">
                  ₹{bsData.assets.closingStock.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Authentic Gateway of Tally Menu */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <div className={`w-full rounded-lg overflow-hidden font-mono text-sm border ${getMenuBoxStyle()}`}>
            {/* Header */}
            <div className={`px-4 py-2.5 text-center tracking-wider text-sm ${getMenuHeaderStyle()}`}>
              GATEWAY OF TALLY
            </div>

            {/* Menu List */}
            <div className="p-3 space-y-0.5">
              {MENU_ITEMS.map((item, idx) => {
                if (item.section) {
                  return (
                    <div
                      key={`sec_${item.section}`}
                      className="px-3 pt-3 pb-1 text-[11px] font-black opacity-50 uppercase tracking-wider"
                    >
                      {item.section}
                    </div>
                  );
                }

                const actionIdx = actionableItems.findIndex((a) => a.id === item.id && a.hotkey === item.hotkey);
                const isSelected = actionIdx === selectedIndex;
                const Icon = item.icon;

                // Split label to highlight hotkey letter
                const hotkeyIndex = item.label.indexOf(item.hotkey);
                const before = hotkeyIndex >= 0 ? item.label.substring(0, hotkeyIndex) : '';
                const after = hotkeyIndex >= 0 ? item.label.substring(hotkeyIndex + 1) : item.label;

                return (
                  <button
                    key={`${item.id}_${item.hotkey}`}
                    onClick={() => setView(item.id)}
                    onMouseEnter={() => setSelectedIndex(actionIdx)}
                    className={`w-full px-3 py-1.5 rounded flex items-center justify-between transition-colors text-left text-xs sm:text-sm ${getHighlightStyle(
                      isSelected
                    )}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {Icon && <Icon className="w-4 h-4 opacity-75 shrink-0" />}
                      <span className="truncate">
                        {before}
                        <span className="underline font-black text-amber-500 dark:text-amber-300">
                          {item.hotkey}
                        </span>
                        {after}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-60 text-[11px] shrink-0 font-mono">
                      <span>[{item.hotkey}]</span>
                      {isSelected && <ArrowRight className="w-3.5 h-3.5 animate-pulse" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Menu Footer */}
            <div className="px-4 py-2 border-t border-black/10 bg-black/5 flex items-center justify-between text-[11px] opacity-75 font-mono">
              <span>Use ↑ ↓ arrow keys or press Hotkey</span>
              <span>[Esc] to Quit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
