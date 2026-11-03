'use client';
import React, { useState } from 'react';
import { X, Save, Building2, Landmark, CheckCircle } from 'lucide-react';
import useAccountingStore from '../../lib/accountingStore';

export default function LedgerMasterModal({ isOpen, onClose }) {
  const { standardGroups, addLedger, theme } = useAccountingStore();

  const [name, setName] = useState('');
  const [group, setGroup] = useState('Sundry Debtors');
  const [type, setType] = useState('Dr');
  const [openingBalance, setOpeningBalance] = useState('');
  const [gstin, setGstin] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra (27)');
  const [bankAccNo, setBankAccNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    addLedger({
      name: name.trim(),
      group,
      type,
      openingBalance: Number(openingBalance) || 0,
      gstin: gstin.trim(),
      city: city.trim(),
      state,
      bankDetails: bankAccNo ? { accNo: bankAccNo, ifsc, branch: city } : undefined,
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setName('');
      setOpeningBalance('');
      setGstin('');
      setCity('');
      setBankAccNo('');
      setIfsc('');
      onClose();
    }, 600);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className={`w-full max-w-xl rounded-lg overflow-hidden font-mono text-xs ${getCardStyle()}`}>
        {/* Header */}
        <div className={`px-4 py-2.5 flex items-center justify-between ${getHeaderBar()}`}>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-300" />
            <span className="text-sm font-bold uppercase">
              Ledger Master Creation (Alt+C)
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-black/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {success && (
            <div className="bg-emerald-600 text-white p-2.5 rounded flex items-center gap-2 font-bold">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Ledger master created and saved to Chart of Accounts!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase font-bold opacity-75 mb-1">
                Name of Ledger *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Siemens Switchgear Pvt Ltd / Axis Bank Current"
                className="w-full px-3 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 font-bold text-xs outline-none focus:ring-1 focus:ring-amber-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold opacity-75 mb-1">
                Under (Parent Group) *
              </label>
              <select
                value={group}
                onChange={(e) => {
                  setGroup(e.target.value);
                  if (['Sundry Debtors', 'Bank Accounts', 'Cash-in-hand', 'Direct Expenses', 'Indirect Expenses', 'Fixed Assets'].includes(e.target.value)) {
                    setType('Dr');
                  } else {
                    setType('Cr');
                  }
                }}
                className="w-full px-3 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 font-bold text-xs outline-none focus:ring-1 focus:ring-amber-500"
              >
                {standardGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-[10px] uppercase font-bold opacity-75 mb-1">
                  Opening Balance
                </label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 font-bold text-xs outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold opacity-75 mb-1">
                  Dr / Cr
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 font-bold text-xs outline-none"
                >
                  <option value="Dr">Dr</option>
                  <option value="Cr">Cr</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold opacity-75 mb-1">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="27AAAAA0000A1Z5"
                className="w-full px-3 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 text-xs outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold opacity-75 mb-1">
                City / Location
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Pune / Mumbai"
                className="w-full px-3 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 text-xs outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Bank Fields if Bank Account */}
            {group === 'Bank Accounts' && (
              <>
                <div>
                  <label className="block text-[10px] uppercase font-bold opacity-75 mb-1">
                    Bank Account No.
                  </label>
                  <input
                    type="text"
                    value={bankAccNo}
                    onChange={(e) => setBankAccNo(e.target.value)}
                    placeholder="e.g. 502000889911"
                    className="w-full px-3 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold opacity-75 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    placeholder="e.g. HDFC0000123"
                    className="w-full px-3 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-black/10 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-black/10 hover:bg-black/20 font-bold"
            >
              [Esc] Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Accept (Enter)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
