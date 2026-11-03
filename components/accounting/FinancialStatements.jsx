'use client';
import React, { useState } from 'react';
import {
  FileText, Download, Printer, Filter, Search,
  ChevronDown, ChevronRight, ArrowUpDown, Layers,
  TrendingUp, TrendingDown, DollarSign, Calendar,
  CheckCircle, Plus, Eye
} from 'lucide-react';
import useAccountingStore from '../../lib/accountingStore';

/* ──────────────────────────────────────────────────────────
   1. BALANCE SHEET VIEW
   ────────────────────────────────────────────────────────── */
export function BalanceSheetView() {
  const { getBalanceSheetData, financialYear, currentDate, isDetailedView, setView } = useAccountingStore();
  const bs = getBalanceSheetData();

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="p-3 bg-black/5 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
        <div>
          <span className="font-bold uppercase opacity-80">Limelight Diamonds Pvt. Ltd.</span>
          <div className="text-[11px] opacity-60">Balance Sheet as at {new Date(currentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-black/10 px-2 py-0.5 rounded text-[11px] font-bold">
            FY: {financialYear}
          </span>
        </div>
      </div>

      {/* Dual Pane T-Format Balance Sheet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LIABILITIES PANE */}
        <div className="border border-black/20 rounded-lg overflow-hidden bg-white/50 dark:bg-slate-900/50">
          <div className="px-3 py-2 bg-amber-600/20 border-b border-black/20 font-bold flex items-center justify-between text-xs">
            <span className="uppercase tracking-wider">LIABILITIES</span>
            <span>Amount (₹)</span>
          </div>

          <div className="p-3 space-y-3 divide-y divide-black/10 text-xs">
            {/* Capital Account */}
            <div className="pt-2">
              <div className="flex justify-between font-bold">
                <span className="text-blue-700 dark:text-blue-400">Capital Account</span>
                <span>₹{bs.liabilities.capital.balance.toLocaleString('en-IN')}</span>
              </div>
              {isDetailedView && (
                <div className="pl-3 pt-1 space-y-0.5 opacity-80 text-[11px]">
                  {bs.liabilities.capital.ledgers.map((l) => (
                    <div key={l.id} className="flex justify-between hover:underline cursor-pointer" onClick={() => setView('ledger-view', { ledgerId: l.id })}>
                      <span>{l.name}</span>
                      <span>₹{l.currentBalance?.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reserves & Surplus */}
            <div className="pt-2">
              <div className="flex justify-between font-bold">
                <span className="text-blue-700 dark:text-blue-400">Reserves & Surplus</span>
                <span>₹{bs.liabilities.reserves.balance.toLocaleString('en-IN')}</span>
              </div>
              {isDetailedView && (
                <div className="pl-3 pt-1 space-y-0.5 opacity-80 text-[11px]">
                  {bs.liabilities.reserves.ledgers.map((l) => (
                    <div key={l.id} className="flex justify-between hover:underline cursor-pointer" onClick={() => setView('ledger-view', { ledgerId: l.id })}>
                      <span>{l.name}</span>
                      <span>₹{l.currentBalance?.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profit & Loss Account (Current Period Net Profit) */}
            <div className="pt-2">
              <div className="flex justify-between font-bold">
                <span className="text-emerald-700 dark:text-emerald-400">Profit & Loss A/c (Net Profit)</span>
                <span className="text-emerald-600 font-black">₹{bs.liabilities.netProfit.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Current Liabilities (Sundry Creditors & Taxes) */}
            <div className="pt-2">
              <div className="flex justify-between font-bold">
                <span className="text-amber-700 dark:text-amber-400">Current Liabilities</span>
                <span>₹{(bs.liabilities.creditors.balance + bs.liabilities.dutiesTaxes.balance).toLocaleString('en-IN')}</span>
              </div>
              {isDetailedView && (
                <div className="pl-3 pt-1 space-y-1 opacity-90 text-[11px]">
                  <div className="flex justify-between font-semibold opacity-75">
                    <span>Sundry Creditors (Suppliers)</span>
                    <span>₹{bs.liabilities.creditors.balance.toLocaleString('en-IN')}</span>
                  </div>
                  {bs.liabilities.creditors.ledgers.slice(0, 4).map((l) => (
                    <div key={l.id} className="flex justify-between pl-2 opacity-75 hover:underline cursor-pointer" onClick={() => setView('ledger-view', { ledgerId: l.id })}>
                      <span>{l.name}</span>
                      <span>₹{l.currentBalance?.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold opacity-75 pt-1">
                    <span>Duties & Taxes (GST Payable)</span>
                    <span>₹{bs.liabilities.dutiesTaxes.balance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-3 py-2 bg-black/10 border-t-2 border-black/30 font-black flex items-center justify-between text-sm">
            <span className="uppercase">Total Liabilities</span>
            <span>₹{bs.liabilities.total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* ASSETS PANE */}
        <div className="border border-black/20 rounded-lg overflow-hidden bg-white/50 dark:bg-slate-900/50">
          <div className="px-3 py-2 bg-emerald-600/20 border-b border-black/20 font-bold flex items-center justify-between text-xs">
            <span className="uppercase tracking-wider">ASSETS</span>
            <span>Amount (₹)</span>
          </div>

          <div className="p-3 space-y-3 divide-y divide-black/10 text-xs">
            {/* Fixed Assets */}
            <div className="pt-2">
              <div className="flex justify-between font-bold">
                <span className="text-purple-700 dark:text-purple-400">Fixed Assets</span>
                <span>₹{bs.assets.fixedAssets.balance.toLocaleString('en-IN')}</span>
              </div>
              {isDetailedView && (
                <div className="pl-3 pt-1 space-y-0.5 opacity-80 text-[11px]">
                  {bs.assets.fixedAssets.ledgers.map((l) => (
                    <div key={l.id} className="flex justify-between hover:underline cursor-pointer" onClick={() => setView('ledger-view', { ledgerId: l.id })}>
                      <span>{l.name}</span>
                      <span>₹{l.currentBalance?.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Assets */}
            <div className="pt-2">
              <div className="flex justify-between font-bold">
                <span className="text-emerald-700 dark:text-emerald-400">Current Assets</span>
                <span>
                  ₹{(
                    bs.assets.closingStock +
                    bs.assets.debtors.balance +
                    bs.assets.bank.balance +
                    bs.assets.cash.balance
                  ).toLocaleString('en-IN')}
                </span>
              </div>

              {isDetailedView && (
                <div className="pl-3 pt-1 space-y-1 opacity-90 text-[11px]">
                  {/* Closing Stock */}
                  <div className="flex justify-between font-semibold hover:underline cursor-pointer" onClick={() => setView('stock-summary')}>
                    <span>Closing Stock (Diamond & Jewellery Inventory)</span>
                    <span className="font-bold text-purple-600">₹{bs.assets.closingStock.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Sundry Debtors */}
                  <div className="flex justify-between font-semibold pt-1 opacity-80">
                    <span>Sundry Debtors (Receivables)</span>
                    <span>₹{bs.assets.debtors.balance.toLocaleString('en-IN')}</span>
                  </div>
                  {bs.assets.debtors.ledgers.slice(0, 4).map((l) => (
                    <div key={l.id} className="flex justify-between pl-2 opacity-75 hover:underline cursor-pointer" onClick={() => setView('ledger-view', { ledgerId: l.id })}>
                      <span>{l.name}</span>
                      <span>₹{l.currentBalance?.toLocaleString('en-IN')}</span>
                    </div>
                  ))}

                  {/* Bank Accounts */}
                  <div className="flex justify-between font-semibold pt-1 opacity-80">
                    <span>Bank Accounts</span>
                    <span>₹{bs.assets.bank.balance.toLocaleString('en-IN')}</span>
                  </div>
                  {bs.assets.bank.ledgers.map((l) => (
                    <div key={l.id} className="flex justify-between pl-2 opacity-75 hover:underline cursor-pointer" onClick={() => setView('ledger-view', { ledgerId: l.id })}>
                      <span>{l.name}</span>
                      <span>₹{l.currentBalance?.toLocaleString('en-IN')}</span>
                    </div>
                  ))}

                  {/* Cash in Hand */}
                  <div className="flex justify-between font-semibold pt-1 opacity-80">
                    <span>Cash-in-hand</span>
                    <span>₹{bs.assets.cash.balance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-3 py-2 bg-black/10 border-t-2 border-black/30 font-black flex items-center justify-between text-sm">
            <span className="uppercase">Total Assets</span>
            <span>₹{bs.assets.total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   2. PROFIT & LOSS ACCOUNT VIEW
   ────────────────────────────────────────────────────────── */
export function ProfitLossView() {
  const { getProfitAndLossData, financialYear, setView } = useAccountingStore();
  const pnl = getProfitAndLossData();

  return (
    <div className="space-y-4">
      <div className="p-3 bg-black/5 rounded-lg flex items-center justify-between text-xs">
        <div>
          <span className="font-bold uppercase">Trading and Profit & Loss Account</span>
          <div className="text-[11px] opacity-60">For the period: {financialYear}</div>
        </div>
        <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[11px]">
          Net Profit: ₹{pnl.netProfit.toLocaleString('en-IN')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* EXPENSES / TRADING DR */}
        <div className="border border-black/20 rounded-lg overflow-hidden bg-white/50 dark:bg-slate-900/50 text-xs">
          <div className="px-3 py-2 bg-red-600/20 border-b border-black/20 font-bold flex justify-between">
            <span className="uppercase">Particulars (Debits)</span>
            <span>Amount (₹)</span>
          </div>

          <div className="p-3 space-y-2.5 divide-y divide-black/10">
            <div className="flex justify-between">
              <span>To Opening Stock</span>
              <span className="font-semibold">₹{pnl.openingStock.toLocaleString('en-IN')}</span>
            </div>

            <div className="pt-2">
              <div className="flex justify-between font-bold">
                <span>To Purchase Accounts</span>
                <span>₹{pnl.totalPurchases.toLocaleString('en-IN')}</span>
              </div>
              <div className="pl-3 text-[11px] opacity-75">
                <div className="flex justify-between">
                  <span>Domestic Purchases @ 18%</span>
                  <span>₹{pnl.purchaseDomestic.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex justify-between font-bold">
                <span>To Direct Expenses</span>
                <span>₹{pnl.totalDirectExpenses.toLocaleString('en-IN')}</span>
              </div>
              <div className="pl-3 text-[11px] opacity-75 space-y-0.5">
                {pnl.directExpenses.map((e) => (
                  <div key={e.id} className="flex justify-between">
                    <span>{e.name}</span>
                    <span>₹{e.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-between font-black text-emerald-700 dark:text-emerald-400">
              <span>To Gross Profit c/d</span>
              <span>₹{pnl.grossProfit.toLocaleString('en-IN')}</span>
            </div>

            <div className="pt-3 border-t-2 border-black/20">
              <div className="flex justify-between font-bold text-amber-700 dark:text-amber-400">
                <span>To Indirect Expenses</span>
                <span>₹{pnl.totalIndirectExpenses.toLocaleString('en-IN')}</span>
              </div>
              <div className="pl-3 pt-1 text-[11px] opacity-80 space-y-0.5">
                {pnl.indirectExpenses.map((e) => (
                  <div key={e.id} className="flex justify-between hover:underline cursor-pointer" onClick={() => setView('ledger-view', { ledgerId: e.id })}>
                    <span>{e.name}</span>
                    <span>₹{e.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-between font-black text-sm text-emerald-600">
              <span>To Net Profit (Transferred to Capital)</span>
              <span>₹{pnl.netProfit.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* INCOMES / TRADING CR */}
        <div className="border border-black/20 rounded-lg overflow-hidden bg-white/50 dark:bg-slate-900/50 text-xs">
          <div className="px-3 py-2 bg-emerald-600/20 border-b border-black/20 font-bold flex justify-between">
            <span className="uppercase">Particulars (Credits)</span>
            <span>Amount (₹)</span>
          </div>

          <div className="p-3 space-y-2.5 divide-y divide-black/10">
            <div className="pt-1">
              <div className="flex justify-between font-bold">
                <span>By Sales Accounts (Turnover)</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  ₹{pnl.totalSales.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="pl-3 text-[11px] opacity-75">
                <div className="flex justify-between">
                  <span>Domestic Sales @ 18%</span>
                  <span>₹{pnl.salesDomestic.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <span>By Closing Stock</span>
              <span className="font-semibold">₹{pnl.closingStock.toLocaleString('en-IN')}</span>
            </div>

            <div className="pt-4 border-t-2 border-black/20">
              <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-400">
                <span>By Gross Profit b/d</span>
                <span>₹{pnl.grossProfit.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex justify-between font-bold">
                <span>By Indirect Incomes</span>
                <span>₹{pnl.totalIndirectIncomes.toLocaleString('en-IN')}</span>
              </div>
              <div className="pl-3 text-[11px] opacity-80 space-y-0.5">
                {pnl.indirectIncomes.map((i) => (
                  <div key={i.id} className="flex justify-between">
                    <span>{i.name}</span>
                    <span>₹{i.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   3. TRIAL BALANCE VIEW
   ────────────────────────────────────────────────────────── */
export function TrialBalanceView() {
  const { getTrialBalanceData, isDetailedView, setView } = useAccountingStore();
  const { groups, totalDebit, totalCredit } = getTrialBalanceData();

  return (
    <div className="space-y-4 text-xs font-mono">
      <div className="border border-black/20 rounded-lg overflow-hidden bg-white/50 dark:bg-slate-900/50">
        <div className="px-4 py-2.5 bg-black/10 border-b border-black/20 font-bold flex items-center justify-between">
          <span className="uppercase">Tally Trial Balance (Group-wise)</span>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-emerald-700 dark:text-emerald-400">Total Debit: ₹{totalDebit.toLocaleString('en-IN')}</span>
            <span className="text-blue-700 dark:text-blue-400">Total Credit: ₹{totalCredit.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-black/20 text-left font-bold opacity-75 bg-black/5">
                <th className="py-2.5 px-4">Group / Particulars</th>
                <th className="py-2.5 px-4 text-right w-44">Debit (₹)</th>
                <th className="py-2.5 px-4 text-right w-44">Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {groups.map((grp) => (
                <React.Fragment key={grp.groupName}>
                  <tr className="font-bold bg-black/5 hover:bg-black/10 transition-colors">
                    <td className="py-2 px-4 text-amber-700 dark:text-amber-400">
                      {grp.groupName}
                    </td>
                    <td className="py-2 px-4 text-right">
                      {grp.totalDebit > 0 ? `₹${grp.totalDebit.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-2 px-4 text-right">
                      {grp.totalCredit > 0 ? `₹${grp.totalCredit.toLocaleString('en-IN')}` : '—'}
                    </td>
                  </tr>

                  {isDetailedView &&
                    grp.ledgers.map((led) => (
                      <tr
                        key={led.id}
                        onClick={() => setView('ledger-view', { ledgerId: led.id })}
                        className="text-[11px] opacity-85 hover:bg-black/10 cursor-pointer transition-colors"
                      >
                        <td className="py-1.5 pl-8 pr-4 flex items-center gap-2">
                          <span className="opacity-40">↳</span>
                          <span className="hover:underline">{led.name}</span>
                        </td>
                        <td className="py-1.5 px-4 text-right">
                          {led.debit > 0 ? `₹${led.debit.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-1.5 px-4 text-right">
                          {led.credit > 0 ? `₹${led.credit.toLocaleString('en-IN')}` : '—'}
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black/30 font-black text-sm bg-black/15">
                <td className="py-2.5 px-4 uppercase">Total Grand Balance</td>
                <td className="py-2.5 px-4 text-right">₹{totalDebit.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-4 text-right">₹{totalCredit.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   4. DAY BOOK VIEW
   ────────────────────────────────────────────────────────── */
export function DayBookView() {
  const { vouchers, setView } = useAccountingStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch =
      v.voucherNo.toLowerCase().includes(search.toLowerCase()) ||
      v.narration.toLowerCase().includes(search.toLowerCase()) ||
      v.entries.some((e) => e.ledgerName.toLowerCase().includes(search.toLowerCase()));
    const matchesType = filterType === 'All' || v.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalAmount = filteredVouchers.reduce((sum, v) => sum + v.totalAmount, 0);

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Controls & Filter Bar */}
      <div className="p-3 bg-black/5 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 opacity-50" />
          <input
            type="text"
            placeholder="Search by Voucher No, Ledger, or Narration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 text-xs outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="opacity-70 text-[11px] font-bold">Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 font-bold text-xs outline-none"
          >
            <option value="All">All Vouchers</option>
            <option value="Sales">Sales</option>
            <option value="Purchase">Purchase</option>
            <option value="Payment">Payment</option>
            <option value="Receipt">Receipt</option>
            <option value="Contra">Contra</option>
            <option value="Journal">Journal</option>
          </select>

          <button
            onClick={() => setView('vouchers')}
            className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Voucher (V)</span>
          </button>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="border border-black/20 rounded-lg overflow-hidden bg-white/50 dark:bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-black/20 text-left font-bold opacity-75 bg-black/5">
                <th className="py-2.5 px-3 w-28">Date</th>
                <th className="py-2.5 px-3 w-32">Voucher No</th>
                <th className="py-2.5 px-3 w-28">Type</th>
                <th className="py-2.5 px-3">Particulars & Narration</th>
                <th className="py-2.5 px-3 text-right w-36">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center opacity-50">
                    No vouchers found for this selection.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-black/5 transition-colors">
                    <td className="py-2 px-3 font-semibold">{v.date}</td>
                    <td className="py-2 px-3 font-bold text-blue-700 dark:text-blue-400">{v.voucherNo}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-black/10">
                        {v.type}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {v.entries.map((e) => e.ledgerName).join(' ↔ ')}
                      </div>
                      <div className="text-[11px] opacity-65 italic mt-0.5 truncate max-w-lg">
                        {v.narration}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-black text-xs">
                      ₹{v.totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black/30 font-black text-sm bg-black/15">
                <td colSpan={4} className="py-2.5 px-3 text-right uppercase">
                  Total Day Book Volume
                </td>
                <td className="py-2.5 px-3 text-right">₹{totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   5. LEDGER STATEMENT & CASH/BANK BOOK VIEW
   ────────────────────────────────────────────────────────── */
export function LedgerReportView() {
  const { ledgers, activeLedgerId, setView, getLedgerStatement } = useAccountingStore();
  const [selectedId, setSelectedId] = useState(activeLedgerId || 'led_3');

  const stmt = getLedgerStatement(selectedId);

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Ledger Selector Header */}
      <div className="p-3 bg-black/5 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <span className="font-bold opacity-75">Select Ledger:</span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 font-bold text-xs outline-none"
          >
            {ledgers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.group})
              </option>
            ))}
          </select>
        </div>

        {stmt?.ledger && (
          <div className="flex items-center gap-3 text-xs">
            <span className="opacity-75">Opening: <strong>₹{stmt.ledger.openingBalance.toLocaleString('en-IN')} {stmt.ledger.type}</strong></span>
            <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">
              Closing Bal: ₹{stmt.closingBalance.toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      {/* Ledger Statement Table */}
      <div className="border border-black/20 rounded-lg overflow-hidden bg-white/50 dark:bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-black/20 text-left font-bold opacity-75 bg-black/5">
                <th className="py-2.5 px-3 w-28">Date</th>
                <th className="py-2.5 px-3">Particulars & Details</th>
                <th className="py-2.5 px-3 w-28">Voucher Type</th>
                <th className="py-2.5 px-3 w-32">Vch No.</th>
                <th className="py-2.5 px-3 text-right w-32">Debit (₹)</th>
                <th className="py-2.5 px-3 text-right w-32">Credit (₹)</th>
                <th className="py-2.5 px-3 text-right w-36">Running Bal (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              <tr className="bg-black/5 font-semibold opacity-80">
                <td className="py-2 px-3">01-Apr-2025</td>
                <td colSpan={3} className="py-2 px-3 italic">Opening Balance b/f</td>
                <td className="py-2 px-3 text-right">{stmt?.ledger?.type === 'Dr' ? `₹${stmt.ledger.openingBalance.toLocaleString('en-IN')}` : '—'}</td>
                <td className="py-2 px-3 text-right">{stmt?.ledger?.type === 'Cr' ? `₹${stmt.ledger.openingBalance.toLocaleString('en-IN')}` : '—'}</td>
                <td className="py-2 px-3 text-right font-bold">₹{stmt?.ledger?.openingBalance.toLocaleString('en-IN')}</td>
              </tr>

              {stmt?.transactions?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center opacity-50">
                    No transactions recorded for this ledger in the selected period.
                  </td>
                </tr>
              ) : (
                stmt?.transactions?.map((t) => (
                  <tr key={t.id} className="hover:bg-black/5 transition-colors">
                    <td className="py-2 px-3">{t.date}</td>
                    <td className="py-2 px-3">
                      <div className="font-semibold">{t.particulars}</div>
                      <div className="text-[10px] opacity-60 italic">{t.narration}</div>
                    </td>
                    <td className="py-2 px-3">{t.voucherType}</td>
                    <td className="py-2 px-3 font-semibold text-blue-700 dark:text-blue-400">{t.voucherNo}</td>
                    <td className="py-2 px-3 text-right">{t.debit ? `₹${t.debit.toLocaleString('en-IN')}` : '—'}</td>
                    <td className="py-2 px-3 text-right">{t.credit ? `₹${t.credit.toLocaleString('en-IN')}` : '—'}</td>
                    <td className="py-2 px-3 text-right font-black">₹{t.runningBalance.toLocaleString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black/30 font-black text-xs bg-black/15">
                <td colSpan={4} className="py-2.5 px-3 text-right uppercase">
                  Totals & Net Closing Balance
                </td>
                <td className="py-2.5 px-3 text-right">₹{stmt?.totalDebit?.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-3 text-right">₹{stmt?.totalCredit?.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400">
                  ₹{stmt?.closingBalance?.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   6. STOCK SUMMARY VIEW (Integrated Diamond Stock)
   ────────────────────────────────────────────────────────── */
export function StockSummaryView() {
  const { stockGroups, getClosingStockValue, isDetailedView } = useAccountingStore();
  const totalValuation = getClosingStockValue();

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-3 bg-black/5 rounded-lg flex items-center justify-between">
        <div>
          <span className="font-bold uppercase">Diamond Stock Summary & Inventory Valuation</span>
          <div className="text-[11px] opacity-60">Godown / Warehouse item breakdown</div>
        </div>
        <span className="bg-purple-700 text-white font-bold px-3 py-1 rounded text-xs">
          Total Inventory Value: ₹{totalValuation.toLocaleString('en-IN')}
        </span>
      </div>

      <div className="border border-black/20 rounded-lg overflow-hidden bg-white/50 dark:bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-black/20 text-left font-bold opacity-75 bg-black/5">
                <th className="py-2.5 px-4">Item / Group Name</th>
                <th className="py-2.5 px-3 text-right">Inward Qty</th>
                <th className="py-2.5 px-3 text-right">Outward Qty</th>
                <th className="py-2.5 px-3 text-right">Closing Qty</th>
                <th className="py-2.5 px-3 text-right">Rate / Unit</th>
                <th className="py-2.5 px-4 text-right w-36">Total Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {stockGroups.map((grp) => {
                const groupTotalValue = grp.items.reduce((s, i) => s + i.closingQty * i.rate, 0);

                return (
                  <React.Fragment key={grp.group}>
                    <tr className="font-bold bg-black/5 hover:bg-black/10">
                      <td className="py-2 px-4 text-amber-700 dark:text-amber-400 uppercase">
                        📦 {grp.group}
                      </td>
                      <td colSpan={4} className="py-2 px-3 text-right text-[11px] opacity-60">
                        {grp.items.length} SKUs in Group
                      </td>
                      <td className="py-2 px-4 text-right font-black">
                        ₹{groupTotalValue.toLocaleString('en-IN')}
                      </td>
                    </tr>

                    {isDetailedView &&
                      grp.items.map((item) => (
                        <tr key={item.name} className="text-[11px] hover:bg-black/5">
                          <td className="py-1.5 pl-8 pr-4 flex items-center gap-2">
                            <span className="opacity-40">↳</span>
                            <span>{item.name}</span>
                          </td>
                          <td className="py-1.5 px-3 text-right opacity-75">{item.inwardQty} {item.unit}</td>
                          <td className="py-1.5 px-3 text-right opacity-75">{item.outwardQty} {item.unit}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-blue-700 dark:text-blue-400">
                            {item.closingQty} {item.unit}
                          </td>
                          <td className="py-1.5 px-3 text-right">₹{item.rate}</td>
                          <td className="py-1.5 px-4 text-right font-bold">
                            ₹{(item.closingQty * item.rate).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black/30 font-black text-sm bg-black/15">
                <td colSpan={5} className="py-2.5 px-4 uppercase">
                  Grand Total Closing Stock
                </td>
                <td className="py-2.5 px-4 text-right">₹{totalValuation.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   7. GST REPORTS (GSTR-1 & GSTR-3B Summary)
   ────────────────────────────────────────────────────────── */
export function GstReportView() {
  const { gstin, companyName, vouchers, ledgers } = useAccountingStore();

  const salesVouchers = vouchers.filter((v) => v.type === 'Sales');
  const purchaseVouchers = vouchers.filter((v) => v.type === 'Purchase');

  const totalTaxableSales = salesVouchers.reduce((sum, v) => sum + v.totalAmount / 1.18, 0);
  const totalOutputGst = totalTaxableSales * 0.18;

  const totalTaxablePurchase = purchaseVouchers.reduce((sum, v) => sum + v.totalAmount / 1.18, 0);
  const totalInputGst = totalTaxablePurchase * 0.18;

  const netTaxPayable = totalOutputGst - totalInputGst;

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-3 bg-black/5 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-bold uppercase">GST Statutory & Portal Compliance Wireframe</span>
          <div className="text-[11px] opacity-60">Company GSTIN: <strong>{gstin}</strong> · State: Maharashtra (27)</div>
        </div>
        <div className="flex gap-2">
          <span className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[11px]">
            GSTR-1 (Outward)
          </span>
          <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[11px]">
            GSTR-3B (Summary)
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-black/20 bg-white/50 dark:bg-slate-900/50">
          <div className="text-[10px] uppercase font-bold opacity-60">Output GST Liability (Sales)</div>
          <div className="text-xl font-black text-amber-600 mt-1">₹{Math.round(totalOutputGst).toLocaleString('en-IN')}</div>
          <div className="text-[11px] opacity-75 mt-0.5">CGST: ₹{Math.round(totalOutputGst / 2).toLocaleString('en-IN')} | SGST: ₹{Math.round(totalOutputGst / 2).toLocaleString('en-IN')}</div>
        </div>

        <div className="p-4 rounded-lg border border-black/20 bg-white/50 dark:bg-slate-900/50">
          <div className="text-[10px] uppercase font-bold opacity-60">Eligible Input Tax Credit (ITC)</div>
          <div className="text-xl font-black text-blue-600 mt-1">₹{Math.round(totalInputGst).toLocaleString('en-IN')}</div>
          <div className="text-[11px] opacity-75 mt-0.5">From B2B registered supplier purchases</div>
        </div>

        <div className="p-4 rounded-lg border border-black/20 bg-white/50 dark:bg-slate-900/50">
          <div className="text-[10px] uppercase font-bold opacity-60">Net GST Cash Ledger Payable</div>
          <div className="text-xl font-black text-emerald-600 mt-1">₹{Math.round(Math.max(0, netTaxPayable)).toLocaleString('en-IN')}</div>
          <div className="text-[11px] opacity-75 mt-0.5">After electronic credit ledger offset</div>
        </div>
      </div>

      {/* B2B Invoices Table */}
      <div className="border border-black/20 rounded-lg overflow-hidden bg-white/50 dark:bg-slate-900/50">
        <div className="px-4 py-2.5 bg-black/10 border-b border-black/20 font-bold flex justify-between">
          <span className="uppercase">Table 4A - B2B Inward/Outward Tax Invoices</span>
          <span>{salesVouchers.length + purchaseVouchers.length} Invoices</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-black/20 text-left font-bold opacity-75 bg-black/5">
                <th className="py-2.5 px-3">Party GSTIN</th>
                <th className="py-2.5 px-3">Invoice No</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Taxable Val (₹)</th>
                <th className="py-2.5 px-3 text-right">CGST (9%)</th>
                <th className="py-2.5 px-3 text-right">SGST (9%)</th>
                <th className="py-2.5 px-3 text-right">Total Invoice (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {salesVouchers.map((v) => {
                const taxable = Math.round(v.totalAmount / 1.18);
                const tax = Math.round((v.totalAmount - taxable) / 2);
                return (
                  <tr key={v.id} className="hover:bg-black/5">
                    <td className="py-2 px-3 font-semibold text-blue-700 dark:text-blue-400">27AAACT0001G1Z1</td>
                    <td className="py-2 px-3 font-bold">{v.voucherNo}</td>
                    <td className="py-2 px-3">{v.date}</td>
                    <td className="py-2 px-3 text-right">₹{taxable.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-right">₹{tax.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-right">₹{tax.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-right font-black">₹{v.totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   8. RATIO ANALYSIS VIEW
   ────────────────────────────────────────────────────────── */
export function RatioAnalysisView() {
  const { getBalanceSheetData, getProfitAndLossData } = useAccountingStore();
  const bs = getBalanceSheetData();
  const pnl = getProfitAndLossData();

  const currentAssets =
    bs.assets.closingStock +
    bs.assets.debtors.balance +
    bs.assets.bank.balance +
    bs.assets.cash.balance;

  const currentLiabilities =
    bs.liabilities.creditors.balance + bs.liabilities.dutiesTaxes.balance;

  const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities).toFixed(2) : 'N/A';
  const quickAssets = currentAssets - bs.assets.closingStock;
  const quickRatio = currentLiabilities > 0 ? (quickAssets / currentLiabilities).toFixed(2) : 'N/A';
  const grossMargin = pnl.totalSales > 0 ? ((pnl.grossProfit / pnl.totalSales) * 100).toFixed(1) : 0;
  const netMargin = pnl.totalSales > 0 ? ((pnl.netProfit / pnl.totalSales) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-3 bg-black/5 rounded-lg">
        <span className="font-bold uppercase">Tally Ratio Analysis & Key Financial Indicators</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Principal Ratios */}
        <div className="p-4 rounded-lg border border-black/20 bg-white/50 dark:bg-slate-900/50 space-y-3">
          <div className="font-bold text-amber-700 dark:text-amber-400 uppercase border-b border-black/10 pb-1.5">
            Liquidity & Solvency Ratios
          </div>
          <div className="flex justify-between">
            <span className="opacity-75">Current Ratio (Standard 2:1):</span>
            <span className="font-black text-sm text-emerald-600">{currentRatio} : 1</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-75">Quick / Acid-Test Ratio (Standard 1:1):</span>
            <span className="font-black text-sm text-blue-600">{quickRatio} : 1</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-75">Working Capital:</span>
            <span className="font-bold">₹{(currentAssets - currentLiabilities).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-75">Debt-Equity Ratio:</span>
            <span className="font-bold">0.18 : 1</span>
          </div>
        </div>

        {/* Profitability Ratios */}
        <div className="p-4 rounded-lg border border-black/20 bg-white/50 dark:bg-slate-900/50 space-y-3">
          <div className="font-bold text-emerald-700 dark:text-emerald-400 uppercase border-b border-black/10 pb-1.5">
            Profitability & Turnover Ratios
          </div>
          <div className="flex justify-between">
            <span className="opacity-75">Gross Profit Margin %:</span>
            <span className="font-black text-sm text-emerald-600">{grossMargin}%</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-75">Net Profit Margin %:</span>
            <span className="font-black text-sm text-emerald-600">{netMargin}%</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-75">Return on Capital Employed (ROCE):</span>
            <span className="font-bold text-blue-600">18.4%</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-75">Stock Turnover Ratio:</span>
            <span className="font-bold">4.8 times / yr</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   9. ACCOUNTS INFO / MASTERS VIEW
   ────────────────────────────────────────────────────────── */
export function AccountsInfoView({ onOpenLedgerModal }) {
  const { ledgers, standardGroups, setView } = useAccountingStore();
  const [selectedGroup, setSelectedGroup] = useState('All');

  const filteredLedgers = ledgers.filter(
    (l) => selectedGroup === 'All' || l.group === selectedGroup
  );

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="p-3 bg-black/5 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <span className="font-bold opacity-75">Group:</span>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded border border-black/20 bg-white dark:bg-slate-800 font-bold text-xs outline-none"
          >
            <option value="All">All Primary & Sub Groups ({ledgers.length} Ledgers)</option>
            {standardGroups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <button
          onClick={onOpenLedgerModal}
          className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Ledger (Alt+C)</span>
        </button>
      </div>

      <div className="border border-black/20 rounded-lg overflow-hidden bg-white/50 dark:bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-black/20 text-left font-bold opacity-75 bg-black/5">
                <th className="py-2.5 px-4">Ledger Name</th>
                <th className="py-2.5 px-4">Parent Group</th>
                <th className="py-2.5 px-3">City / GSTIN</th>
                <th className="py-2.5 px-4 text-right">Opening Bal</th>
                <th className="py-2.5 px-4 text-right w-40">Current Bal (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {filteredLedgers.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => setView('ledger-view', { ledgerId: l.id })}
                  className="hover:bg-black/5 cursor-pointer transition-colors"
                >
                  <td className="py-2 px-4 font-bold text-blue-700 dark:text-blue-400 hover:underline">
                    {l.name}
                  </td>
                  <td className="py-2 px-4 opacity-80">{l.group}</td>
                  <td className="py-2 px-3 text-[11px] opacity-60">
                    {l.gstin || l.city || '—'}
                  </td>
                  <td className="py-2 px-4 text-right opacity-80">
                    ₹{l.openingBalance?.toLocaleString('en-IN')} {l.type}
                  </td>
                  <td className="py-2 px-4 text-right font-black">
                    ₹{l.currentBalance?.toLocaleString('en-IN')} {l.type}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
