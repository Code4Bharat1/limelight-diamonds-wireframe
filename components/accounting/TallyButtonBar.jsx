'use client';
import React from 'react';
import useAccountingStore from '../../lib/accountingStore';

export default function TallyButtonBar({ onOpenDateModal, onOpenFeatures, onOpenLedgerModal }) {
  const {
    currentView,
    setView,
    goBack,
    selectedVoucherType,
    toggleDetailedView,
    isDetailedView,
    theme,
  } = useAccountingStore();

  const handleVoucherClick = (type) => {
    setView('vouchers', { voucherType: type });
  };

  const getBarColors = () => {
    if (theme === 'tally-erp9') {
      return 'bg-[#213f32] text-[#f8f5d7] border-l-2 border-[#152a21]';
    }
    if (theme === 'modern-saas') {
      return 'bg-slate-900 text-slate-200 border-l border-slate-800';
    }
    // tally-prime
    return 'bg-[#0a3a63] text-white border-l-2 border-[#062642]';
  };

  const buttonStyle = (isActive = false, isAccent = false) => {
    if (theme === 'tally-erp9') {
      if (isActive) return 'bg-amber-400 text-slate-950 font-bold shadow';
      if (isAccent) return 'bg-[#3b6653] text-[#f8f5d7] hover:bg-[#477a64] font-semibold';
      return 'bg-[#2b4e3f] text-[#f8f5d7] hover:bg-[#38614f]';
    }
    if (theme === 'modern-saas') {
      if (isActive) return 'bg-cyan-500 text-slate-950 font-bold shadow';
      if (isAccent) return 'bg-slate-800 text-cyan-300 hover:bg-slate-700 font-semibold';
      return 'bg-slate-800/80 text-slate-300 hover:bg-slate-700';
    }
    // tally-prime
    if (isActive) return 'bg-amber-400 text-slate-950 font-bold shadow';
    if (isAccent) return 'bg-[#1a5587] text-white hover:bg-[#2067a3] font-semibold';
    return 'bg-[#104370] text-slate-100 hover:bg-[#165185]';
  };

  return (
    <div className={`w-full lg:w-48 p-2 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto font-mono text-xs select-none shrink-0 ${getBarColors()}`}>
      <div className="hidden lg:block text-[10px] uppercase font-bold text-amber-300/80 tracking-wider px-1 pb-1 border-b border-white/10">
        Tally Function Keys
      </div>

      {/* F1: Select Comp / Alt+F1 */}
      <button
        onClick={toggleDetailedView}
        className={`px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-all shrink-0 ${buttonStyle(false, true)}`}
        title="Toggle Detailed / Condensed View"
      >
        <span className="font-bold text-amber-300">F1</span>
        <span className="text-[11px]">{isDetailedView ? 'Detailed' : 'Condensed'}</span>
      </button>

      {/* F2: Date */}
      <button
        onClick={onOpenDateModal}
        className={`px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-all shrink-0 ${buttonStyle()}`}
        title="Change Voucher / Current Date"
      >
        <span className="font-bold text-amber-300">F2</span>
        <span className="text-[11px]">Date</span>
      </button>

      {/* Alt+F2: Period */}
      <button
        onClick={onOpenDateModal}
        className={`px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-all shrink-0 ${buttonStyle()}`}
        title="Change Accounting Financial Period"
      >
        <span className="font-bold text-amber-300">Alt+F2</span>
        <span className="text-[11px]">Period</span>
      </button>

      <div className="hidden lg:block h-px bg-white/10 my-0.5" />

      {/* F4: Contra */}
      <button
        onClick={() => handleVoucherClick('Contra')}
        className={`px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-all shrink-0 ${buttonStyle(
          currentView === 'vouchers' && selectedVoucherType === 'Contra'
        )}`}
      >
        <span className="font-bold text-amber-300">F4</span>
        <span className="text-[11px]">Contra</span>
      </button>

      {/* F5: Payment */}
      <button
        onClick={() => handleVoucherClick('Payment')}
        className={`px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-all shrink-0 ${buttonStyle(
          currentView === 'vouchers' && selectedVoucherType === 'Payment'
        )}`}
      >
        <span className="font-bold text-amber-300">F5</span>
        <span className="text-[11px]">Payment</span>
      </button>

      {/* F6: Receipt */}
      <button
        onClick={() => handleVoucherClick('Receipt')}
        className={`px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-all shrink-0 ${buttonStyle(
          currentView === 'vouchers' && selectedVoucherType === 'Receipt'
        )}`}
      >
        <span className="font-bold text-amber-300">F6</span>
        <span className="text-[11px]">Receipt</span>
      </button>

      {/* F7: Journal */}
      <button
        onClick={() => handleVoucherClick('Journal')}
        className={`px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-all shrink-0 ${buttonStyle(
          currentView === 'vouchers' && selectedVoucherType === 'Journal'
        )}`}
      >
        <span className="font-bold text-amber-300">F7</span>
        <span className="text-[11px]">Journal</span>
      </button>

      {/* F8: Sales */}
      <button
        onClick={() => handleVoucherClick('Sales')}
        className={`px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-all shrink-0 ${buttonStyle(
          currentView === 'vouchers' && selectedVoucherType === 'Sales'
        )}`}
      >
        <span className="font-bold text-amber-300">F8</span>
        <span className="text-[11px]">Sales</span>
      </button>

      {/* F9: Purchase */}
      <button
        onClick={() => handleVoucherClick('Purchase')}
        className={`px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-all shrink-0 ${buttonStyle(
          currentView === 'vouchers' && selectedVoucherType === 'Purchase'
        )}`}
      >
        <span className="font-bold text-amber-300">F9</span>
        <span className="text-[11px]">Purchase</span>
      </button>

      {/* Ctrl+F8: Credit Note */}
      <button
        onClick={() => handleVoucherClick('Credit Note')}
        className={`px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-all shrink-0 ${buttonStyle(
          currentView === 'vouchers' && selectedVoucherType === 'Credit Note'
        )}`}
      >
        <span className="font-bold text-amber-300 text-[10px]">^F8</span>
        <span className="text-[11px]">Credit Note</span>
      </button>

      {/* Ctrl+F9: Debit Note */}
      <button
        onClick={() => handleVoucherClick('Debit Note')}
        className={`px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-all shrink-0 ${buttonStyle(
          currentView === 'vouchers' && selectedVoucherType === 'Debit Note'
        )}`}
      >
        <span className="font-bold text-amber-300 text-[10px]">^F9</span>
        <span className="text-[11px]">Debit Note</span>
      </button>

      <div className="hidden lg:block h-px bg-white/10 my-0.5" />

      {/* F11: Features */}
      <button
        onClick={() => onOpenFeatures('f11')}
        className={`px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-all shrink-0 ${buttonStyle()}`}
      >
        <span className="font-bold text-amber-300">F11</span>
        <span className="text-[11px]">Features</span>
      </button>

      {/* F12: Configure */}
      <button
        onClick={() => onOpenFeatures('f12')}
        className={`px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-all shrink-0 ${buttonStyle()}`}
      >
        <span className="font-bold text-amber-300">F12</span>
        <span className="text-[11px]">Configure</span>
      </button>

      {/* Esc: Quit / Back */}
      <button
        onClick={goBack}
        className="px-2.5 py-1.5 rounded bg-red-800 hover:bg-red-700 text-white font-bold flex items-center justify-between text-left transition-all shrink-0 mt-auto"
      >
        <span className="text-yellow-300">Esc</span>
        <span className="text-[11px]">{currentView === 'gateway' ? 'Exit Tally' : 'Quit View'}</span>
      </button>
    </div>
  );
}
