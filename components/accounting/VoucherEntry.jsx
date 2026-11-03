'use client';
import React, { useState, useEffect } from 'react';
import {
  Receipt, Plus, Trash2, CheckCircle2, AlertCircle,
  HelpCircle, Calendar, Hash, ArrowLeft, Save, X
} from 'lucide-react';
import useAccountingStore from '../../lib/accountingStore';

const VOUCHER_TYPES = [
  { name: 'Payment', key: 'F5', color: 'bg-amber-600', description: 'Bank / Cash payment to supplier or expense' },
  { name: 'Receipt', key: 'F6', color: 'bg-emerald-600', description: 'Money received from customer or revenue' },
  { name: 'Contra', key: 'F4', color: 'bg-blue-600', description: 'Internal Cash to Bank or Bank to Bank transfer' },
  { name: 'Journal', key: 'F7', color: 'bg-purple-600', description: 'Adjustment, depreciation, provisions' },
  { name: 'Sales', key: 'F8', color: 'bg-teal-600', description: 'Sales invoice to customer with GST' },
  { name: 'Purchase', key: 'F9', color: 'bg-indigo-600', description: 'Inward purchase invoice from supplier with GST' },
  { name: 'Credit Note', key: '^F8', color: 'bg-rose-600', description: 'Sales return or discount to customer' },
  { name: 'Debit Note', key: '^F9', color: 'bg-orange-600', description: 'Purchase return or debit to supplier' },
];

export default function VoucherEntry() {
  const {
    ledgers,
    vouchers,
    addVoucher,
    selectedVoucherType,
    setView,
    currentDate,
    theme,
    goBack,
  } = useAccountingStore();

  const [type, setType] = useState(selectedVoucherType || 'Sales');
  const [voucherNo, setVoucherNo] = useState('');
  const [date, setDate] = useState(currentDate || new Date().toISOString().split('T')[0]);
  const [refNo, setRefNo] = useState('');
  const [narration, setNarration] = useState('');
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Default entries
  const [entries, setEntries] = useState([
    { id: '1', type: 'Dr', ledgerId: '', amount: '' },
    { id: '2', type: 'Cr', ledgerId: '', amount: '' },
  ]);

  // Set initial default ledger templates based on voucher type
  useEffect(() => {
    setType(selectedVoucherType || 'Sales');
    const prefix = (selectedVoucherType || 'Sales').substring(0, 3).toUpperCase();
    setVoucherNo(`${prefix}/25-26/${String(vouchers.length + 1).padStart(3, '0')}`);

    if (selectedVoucherType === 'Sales') {
      const debtor = ledgers.find((l) => l.group === 'Sundry Debtors');
      const sales = ledgers.find((l) => l.group === 'Sales Accounts');
      setEntries([
        { id: '1', type: 'Dr', ledgerId: debtor?.id || '', amount: 118000 },
        { id: '2', type: 'Cr', ledgerId: sales?.id || '', amount: 100000 },
        { id: '3', type: 'Cr', ledgerId: 'led_18', amount: 9000 }, // CGST
        { id: '4', type: 'Cr', ledgerId: 'led_19', amount: 9000 }, // SGST
      ]);
      setNarration('Being electrical goods supplied against customer work order');
    } else if (selectedVoucherType === 'Purchase') {
      const purchase = ledgers.find((l) => l.group === 'Purchase Accounts');
      const creditor = ledgers.find((l) => l.group === 'Sundry Creditors');
      setEntries([
        { id: '1', type: 'Dr', ledgerId: purchase?.id || '', amount: 100000 },
        { id: '2', type: 'Dr', ledgerId: 'led_21', amount: 9000 }, // Input CGST
        { id: '3', type: 'Dr', ledgerId: 'led_22', amount: 9000 }, // Input SGST
        { id: '4', type: 'Cr', ledgerId: creditor?.id || '', amount: 118000 },
      ]);
      setNarration('Being goods purchased with Tax Invoice from supplier');
    } else if (selectedVoucherType === 'Payment') {
      const creditor = ledgers.find((l) => l.group === 'Sundry Creditors');
      const bank = ledgers.find((l) => l.group === 'Bank Accounts');
      setEntries([
        { id: '1', type: 'Dr', ledgerId: creditor?.id || '', amount: 50000 },
        { id: '2', type: 'Cr', ledgerId: bank?.id || '', amount: 50000 },
      ]);
      setNarration('Being payment cleared through bank RTGS/Cheque');
    } else if (selectedVoucherType === 'Receipt') {
      const debtor = ledgers.find((l) => l.group === 'Sundry Debtors');
      const bank = ledgers.find((l) => l.group === 'Bank Accounts');
      setEntries([
        { id: '1', type: 'Dr', ledgerId: bank?.id || '', amount: 75000 },
        { id: '2', type: 'Cr', ledgerId: debtor?.id || '', amount: 75000 },
      ]);
      setNarration('Being advance/bill payment received via bank transfer');
    } else if (selectedVoucherType === 'Contra') {
      const bank = ledgers.find((l) => l.group === 'Bank Accounts');
      const cash = ledgers.find((l) => l.group === 'Cash-in-hand');
      setEntries([
        { id: '1', type: 'Dr', ledgerId: bank?.id || '', amount: 25000 },
        { id: '2', type: 'Cr', ledgerId: cash?.id || '', amount: 25000 },
      ]);
      setNarration('Being cash deposited into Bank current account');
    } else {
      setEntries([
        { id: '1', type: 'Dr', ledgerId: '', amount: '' },
        { id: '2', type: 'Cr', ledgerId: '', amount: '' },
      ]);
      setNarration('');
    }
  }, [selectedVoucherType, ledgers, vouchers.length]);

  // Calculations
  const totalDebit = entries.reduce(
    (sum, e) => sum + (e.type === 'Dr' ? Number(e.amount || 0) : 0),
    0
  );
  const totalCredit = entries.reduce(
    (sum, e) => sum + (e.type === 'Cr' ? Number(e.amount || 0) : 0),
    0
  );
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;
  const difference = Math.abs(totalDebit - totalCredit);

  // Add row
  const handleAddRow = () => {
    const defaultType = totalDebit > totalCredit ? 'Cr' : 'Dr';
    const autoAmount = difference > 0 ? difference : '';
    setEntries((prev) => [
      ...prev,
      { id: String(Date.now()), type: defaultType, ledgerId: '', amount: autoAmount },
    ]);
  };

  // Remove row
  const handleRemoveRow = (id) => {
    if (entries.length <= 2) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Update entry
  const handleUpdateEntry = (id, field, value) => {
    setEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Quick auto-add GST
  const handleAddGst = (rate = 18) => {
    const halfRate = rate / 2;
    const baseAmount = entries[0]?.amount ? Number(entries[0].amount) : 100000;
    const taxEach = (baseAmount * halfRate) / 100;

    if (type === 'Sales') {
      setEntries([
        { id: '1', type: 'Dr', ledgerId: entries[0]?.ledgerId || 'led_7', amount: baseAmount + taxEach * 2 },
        { id: '2', type: 'Cr', ledgerId: 'led_25', amount: baseAmount },
        { id: '3', type: 'Cr', ledgerId: 'led_18', amount: taxEach },
        { id: '4', type: 'Cr', ledgerId: 'led_19', amount: taxEach },
      ]);
    } else if (type === 'Purchase') {
      setEntries([
        { id: '1', type: 'Dr', ledgerId: 'led_27', amount: baseAmount },
        { id: '2', type: 'Dr', ledgerId: 'led_21', amount: taxEach },
        { id: '3', type: 'Dr', ledgerId: 'led_22', amount: taxEach },
        { id: '4', type: 'Cr', ledgerId: entries[3]?.ledgerId || 'led_13', amount: baseAmount + taxEach * 2 },
      ]);
    }
  };

  // Keyboard shortcut for saving (Ctrl+A or Enter on Accept)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (isBalanced) {
          setShowAcceptModal(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBalanced]);

  // Save Voucher
  const handleSave = () => {
    if (!isBalanced) return;

    const formattedEntries = entries
      .filter((e) => e.ledgerId && Number(e.amount) > 0)
      .map((e) => {
        const ledger = ledgers.find((l) => l.id === e.ledgerId);
        return {
          ledgerId: e.ledgerId,
          ledgerName: ledger?.name || 'Ledger',
          type: e.type,
          amount: Number(e.amount),
        };
      });

    const newVoucher = {
      voucherNo: voucherNo || `${type.substring(0, 3).toUpperCase()}/25-26/${String(vouchers.length + 1).padStart(3, '0')}`,
      type,
      date,
      refNo,
      narration: narration || `Being ${type} entry recorded on ${date}`,
      entries: formattedEntries,
      totalAmount: totalDebit,
    };

    addVoucher(newVoucher);
    setShowAcceptModal(false);
    setSaveSuccessMessage(`Voucher ${newVoucher.voucherNo} posted successfully to Ledger!`);

    setTimeout(() => {
      setSaveSuccessMessage('');
      setView('day-book');
    }, 1200);
  };

  const getContainerBg = () => {
    if (theme === 'tally-erp9') return 'bg-[#f4efe0] text-[#1c382c]';
    if (theme === 'modern-saas') return 'bg-slate-950 text-slate-100';
    return 'bg-[#f0f4f8] text-[#0f2c4a]';
  };

  const getCardStyle = () => {
    if (theme === 'tally-erp9') return 'bg-[#f8f5d7] border-2 border-[#2a4d3e] shadow-[4px_4px_0px_#2a4d3e]';
    if (theme === 'modern-saas') return 'bg-slate-900 border border-slate-800 shadow-xl shadow-cyan-950/20';
    return 'bg-white border-2 border-[#0f4c81] shadow-[4px_4px_0px_#0f4c81]';
  };

  const getHeaderBar = () => {
    if (theme === 'tally-erp9') return 'bg-[#2a4d3e] text-[#f8f5d7] font-bold';
    if (theme === 'modern-saas') return 'bg-slate-800 text-cyan-400 font-bold border-b border-slate-700';
    return 'bg-[#0f4c81] text-white font-bold';
  };

  return (
    <div className={`flex-1 p-4 md:p-6 overflow-y-auto font-mono text-xs ${getContainerBg()}`}>
      <div className="max-w-5xl mx-auto space-y-4">
        
        {/* Success Alert Banner */}
        {saveSuccessMessage && (
          <div className="bg-emerald-600 text-white p-3 rounded-lg flex items-center gap-2 font-bold shadow-lg animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* Voucher Type Ribbon */}
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-black/10 rounded-lg">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2 opacity-70">
            Voucher Type:
          </span>
          {VOUCHER_TYPES.map((vt) => (
            <button
              key={vt.name}
              onClick={() => setType(vt.name)}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                type === vt.name
                  ? 'bg-amber-400 text-slate-950 shadow scale-105'
                  : 'bg-white/80 dark:bg-slate-800 hover:bg-white text-inherit'
              }`}
            >
              <span className="text-[10px] opacity-70 mr-1">[{vt.key}]</span>
              <span>{vt.name}</span>
            </button>
          ))}
        </div>

        {/* Main Tally Voucher Creation Screen */}
        <div className={`rounded-lg overflow-hidden border ${getCardStyle()}`}>
          {/* Header Bar */}
          <div className={`px-4 py-2.5 flex items-center justify-between ${getHeaderBar()}`}>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-bold uppercase tracking-wide">
                Accounting Voucher Creation ({type})
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="bg-black/25 px-2 py-0.5 rounded text-amber-300">
                Limelight Diamonds
              </span>
            </div>
          </div>

          {/* Voucher Metadata Inputs */}
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border-b border-black/10 bg-black/5">
            <div>
              <label className="block text-[10px] uppercase font-bold opacity-75 mb-1">
                Voucher No.
              </label>
              <input
                type="text"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 font-bold text-xs focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold opacity-75 mb-1">
                Date (F2)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 font-bold text-xs focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold opacity-75 mb-1">
                Supplier/Customer Ref No.
              </label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="e.g. PO-8812 / INV-990"
                className="w-full px-2.5 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 font-medium text-xs focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => handleAddGst(18)}
                className="w-full py-1.5 px-3 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
              >
                ⚡ Auto GST (18%)
              </button>
            </div>
          </div>

          {/* Double Entry Table Grid */}
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-black/20 text-left font-bold opacity-75">
                  <th className="py-2 px-2 w-16 text-center">Dr / Cr</th>
                  <th className="py-2 px-3">Particulars (Account / Ledger)</th>
                  <th className="py-2 px-3 text-right w-36">Debit (₹)</th>
                  <th className="py-2 px-3 text-right w-36">Credit (₹)</th>
                  <th className="py-2 px-2 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {entries.map((entry, idx) => {
                  const selectedLedger = ledgers.find((l) => l.id === entry.ledgerId);

                  return (
                    <tr key={entry.id} className="hover:bg-black/5 transition-colors">
                      {/* Dr / Cr Selector */}
                      <td className="py-2 px-2 text-center">
                        <select
                          value={entry.type}
                          onChange={(e) => handleUpdateEntry(entry.id, 'type', e.target.value)}
                          className="px-1.5 py-1 rounded border border-black/20 bg-white dark:bg-slate-800 font-bold text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                        >
                          <option value="Dr">Dr (To)</option>
                          <option value="Cr">Cr (By)</option>
                        </select>
                      </td>

                      {/* Particulars (Ledger Picker) */}
                      <td className="py-2 px-3">
                        <select
                          value={entry.ledgerId}
                          onChange={(e) => handleUpdateEntry(entry.id, 'ledgerId', e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 font-semibold text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                        >
                          <option value="">-- Select Ledger Account (Alt+C to create) --</option>
                          {ledgers.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name} ({l.group}) — Bal: ₹{l.currentBalance?.toLocaleString('en-IN')} {l.type}
                            </option>
                          ))}
                        </select>
                        {selectedLedger && (
                          <div className="text-[10px] opacity-60 mt-0.5 flex items-center gap-2">
                            <span>Under: {selectedLedger.group}</span>
                            <span>• Current Bal: ₹{selectedLedger.currentBalance?.toLocaleString('en-IN')} {selectedLedger.type}</span>
                            {selectedLedger.gstin && <span>• GSTIN: {selectedLedger.gstin}</span>}
                          </div>
                        )}
                      </td>

                      {/* Debit Field */}
                      <td className="py-2 px-3 text-right">
                        {entry.type === 'Dr' ? (
                          <input
                            type="number"
                            value={entry.amount}
                            onChange={(e) => handleUpdateEntry(entry.id, 'amount', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 rounded border border-black/20 bg-white dark:bg-slate-800 font-bold text-right text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                        ) : (
                          <span className="opacity-30">—</span>
                        )}
                      </td>

                      {/* Credit Field */}
                      <td className="py-2 px-3 text-right">
                        {entry.type === 'Cr' ? (
                          <input
                            type="number"
                            value={entry.amount}
                            onChange={(e) => handleUpdateEntry(entry.id, 'amount', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 rounded border border-black/20 bg-white dark:bg-slate-800 font-bold text-right text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                        ) : (
                          <span className="opacity-30">—</span>
                        )}
                      </td>

                      {/* Remove Row */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(entry.id)}
                          disabled={entries.length <= 2}
                          className="text-red-500 hover:text-red-700 disabled:opacity-20 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Totals & Balance Checker */}
              <tfoot>
                <tr className="border-t-2 border-black/30 font-bold text-xs bg-black/5">
                  <td colSpan={2} className="py-2 px-3 text-right uppercase tracking-wider">
                    Total
                  </td>
                  <td className="py-2 px-3 text-right font-black text-sm">
                    ₹{totalDebit.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2 px-3 text-right font-black text-sm">
                    ₹{totalCredit.toLocaleString('en-IN')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>

            {/* Imbalance Warning / Balanced Cue */}
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 px-3 py-1 rounded bg-black/10 hover:bg-black/15 font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Entry Row (Enter)
              </button>

              <div>
                {!isBalanced ? (
                  <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs bg-red-100 dark:bg-red-950/50 px-3 py-1 rounded border border-red-300">
                    <AlertCircle className="w-4 h-4" />
                    <span>Imbalance Difference: ₹{difference.toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-100 dark:bg-emerald-950/50 px-3 py-1 rounded border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Balanced Voucher (Ready to Accept)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Narration Box */}
          <div className="p-4 border-t border-black/10 bg-black/5 space-y-1">
            <label className="block text-[11px] uppercase font-bold opacity-75">
              Narration:
            </label>
            <textarea
              rows={2}
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="Being narration of transactions..."
              className="w-full px-3 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 font-mono text-xs focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-black/10 flex items-center justify-between border-t border-black/10">
            <button
              type="button"
              onClick={goBack}
              className="px-4 py-2 rounded bg-black/20 hover:bg-black/30 font-bold text-xs"
            >
              [Esc] Cancel / Back
            </button>

            <div className="flex items-center gap-3">
              <span className="text-[11px] opacity-60 hidden sm:inline">
                Shortcut: <strong>Ctrl + A</strong> to Accept
              </span>
              <button
                type="button"
                disabled={!isBalanced}
                onClick={() => setShowAcceptModal(true)}
                className="px-6 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs shadow-md transition-transform active:scale-95 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Accept? (Ctrl+A)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tally Authentic "Accept? Yes/No" Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className={`w-full max-w-sm rounded-lg border-2 p-5 space-y-4 text-center font-mono ${getCardStyle()}`}>
            <div className="text-sm font-bold opacity-75 uppercase">
              Tally Voucher Confirmation
            </div>
            <div className="text-xl font-black text-amber-500">
              Accept?
            </div>
            <div className="text-xs opacity-80">
              Post {type} Voucher <strong>{voucherNo}</strong> of ₹{totalDebit.toLocaleString('en-IN')} to Ledger accounts?
            </div>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={handleSave}
                className="px-6 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md"
                autoFocus
              >
                Yes (Enter)
              </button>
              <button
                onClick={() => setShowAcceptModal(false)}
                className="px-6 py-2 rounded bg-red-700 hover:bg-red-600 text-white font-black text-sm shadow-md"
              >
                No (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
