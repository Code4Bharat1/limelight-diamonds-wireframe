'use client';
import React, { useState } from 'react';
import { X, Calendar, Settings, Sliders, Check } from 'lucide-react';
import useAccountingStore from '../../lib/accountingStore';

export default function TallyFeaturesModal({ mode, isOpen, onClose }) {
  const {
    currentDate,
    setCurrentDate,
    financialYear,
    companyName,
    theme,
  } = useAccountingStore();

  const [dateInput, setDateInput] = useState(currentDate);
  const [maintainAccountsOnly, setMaintainAccountsOnly] = useState(false);
  const [enableBillwise, setEnableBillwise] = useState(true);
  const [enableGst, setEnableGst] = useState(true);
  const [enableInventory, setEnableInventory] = useState(true);
  const [showDrCr, setShowDrCr] = useState(true);

  if (!isOpen) return null;

  const handleSaveDate = (e) => {
    e.preventDefault();
    if (dateInput) setCurrentDate(dateInput);
    onClose();
  };

  const getCardStyle = () => {
    if (theme === 'tally-erp9') return 'bg-[#f8f5d7] border-2 border-[#2a4d3e] shadow-[4px_4px_0px_#2a4d3e] text-[#1c382c]';
    if (theme === 'modern-saas') return 'bg-slate-900 border border-slate-800 shadow-2xl text-slate-100';
    return 'bg-white border-2 border-[#0f4c81] shadow-[4px_4px_0px_#0f4c81] text-[#0f2c4a]';
  };

  const getHeaderBar = () => {
    if (theme === 'tally-erp9') return 'bg-[#2a4d3e] text-[#f8f5d7] font-bold';
    if (theme === 'modern-saas') return 'bg-slate-800 text-cyan-400 font-bold border-b border-slate-700';
    return 'bg-[#0f4c81] text-white font-bold';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-mono text-xs">
      <div className={`w-full max-w-md rounded-lg overflow-hidden ${getCardStyle()}`}>
        
        {/* Date Change Modal (F2) */}
        {mode === 'date' && (
          <div>
            <div className={`px-4 py-2.5 flex items-center justify-between ${getHeaderBar()}`}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-300" />
                <span className="text-sm font-bold uppercase">Change Voucher Date (F2)</span>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-black/20 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDate} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold opacity-75 mb-1">
                  Current Accounting Date
                </label>
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-black/20 bg-white dark:bg-slate-800 font-bold text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  autoFocus
                />
                <p className="text-[10px] opacity-60 mt-1">Financial Year: {financialYear}</p>
              </div>

              <div className="pt-3 border-t border-black/10 flex justify-between">
                <button type="button" onClick={onClose} className="px-4 py-1.5 rounded bg-black/10">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-1.5 rounded bg-amber-500 text-slate-950 font-black">
                  Set Date (Enter)
                </button>
              </div>
            </form>
          </div>
        )}

        {/* F11: Company Features */}
        {mode === 'f11' && (
          <div>
            <div className={`px-4 py-2.5 flex items-center justify-between ${getHeaderBar()}`}>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-300" />
                <span className="text-sm font-bold uppercase">Company Features (F11)</span>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-black/20 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                Accounting & Inventory Features for {companyName}
              </div>

              <label className="flex items-center justify-between p-2 rounded hover:bg-black/5 cursor-pointer">
                <span>Maintain Accounts with Inventory</span>
                <input
                  type="checkbox"
                  checked={enableInventory}
                  onChange={(e) => setEnableInventory(e.target.checked)}
                  className="rounded text-amber-600"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded hover:bg-black/5 cursor-pointer">
                <span>Enable Bill-wise (Outstanding) Details</span>
                <input
                  type="checkbox"
                  checked={enableBillwise}
                  onChange={(e) => setEnableBillwise(e.target.checked)}
                  className="rounded text-amber-600"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded hover:bg-black/5 cursor-pointer">
                <span>Enable Goods and Services Tax (GST)</span>
                <input
                  type="checkbox"
                  checked={enableGst}
                  onChange={(e) => setEnableGst(e.target.checked)}
                  className="rounded text-amber-600"
                />
              </label>

              <div className="pt-3 border-t border-black/10 flex justify-end">
                <button onClick={onClose} className="px-6 py-1.5 rounded bg-amber-500 text-slate-950 font-black">
                  Accept (Enter)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* F12: Configure */}
        {mode === 'f12' && (
          <div>
            <div className={`px-4 py-2.5 flex items-center justify-between ${getHeaderBar()}`}>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-300" />
                <span className="text-sm font-bold uppercase">Voucher Configuration (F12)</span>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-black/20 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <label className="flex items-center justify-between p-2 rounded hover:bg-black/5 cursor-pointer">
                <span>Use Cr/Dr instead of To/By during entry</span>
                <input
                  type="checkbox"
                  checked={showDrCr}
                  onChange={(e) => setShowDrCr(e.target.checked)}
                  className="rounded text-amber-600"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded hover:bg-black/5 cursor-pointer">
                <span>Warn on Negative Cash / Ledger Balance</span>
                <input type="checkbox" defaultChecked className="rounded text-amber-600" />
              </label>

              <label className="flex items-center justify-between p-2 rounded hover:bg-black/5 cursor-pointer">
                <span>Provide Narration for each Ledger in Voucher</span>
                <input type="checkbox" defaultChecked className="rounded text-amber-600" />
              </label>

              <div className="pt-3 border-t border-black/10 flex justify-end">
                <button onClick={onClose} className="px-6 py-1.5 rounded bg-amber-500 text-slate-950 font-black">
                  Accept (Enter)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
