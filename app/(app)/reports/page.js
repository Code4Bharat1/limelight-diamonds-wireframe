'use client';
import { useState, useEffect } from 'react';
import {
  BarChart2, TrendingUp, Download, FileText, Package, Warehouse,
  Store, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  AlertTriangle, RotateCcw, ShoppingBag, Truck, Search
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { reportsApi, productsApi } from '../../../lib/api';
import { formatCurrency, downloadCSV, cn } from '../../../lib/utils';
import { toast } from '../../../components/ui/Toast';

const reportTypes = [
  { key: 'stock-summary', label: 'SKU Stock Summary', icon: '📦' },
  { key: 'warehouse-wise', label: 'Warehouse Stock', icon: '🏢' },
  { key: 'store-wise', label: 'Store-wise Stock', icon: '🏪' },
  { key: 'incoming', label: 'Inward Receiving', icon: '📥' },
  { key: 'outgoing', label: 'Outward Dispatches', icon: '📤' },
  { key: 'transfers', label: 'Stock Transfers', icon: '🔄' },
  { key: 'damaged', label: 'Damage & Loss', icon: '⚠️' },
  { key: 'returns', label: 'Store Returns', icon: '↩️' },
  { key: 'consumption', label: 'Store Consumption', icon: '🏷️' },
  { key: 'vendor-performance', label: 'Vendor Performance', icon: '🚚' },
  { key: 'product-movement', label: 'Product Ledger', icon: '🔍' },
  { key: 'low-stock', label: 'Low Stock Alert', icon: '🚨' },
  { key: 'movement', label: 'Movement Trend Chart', icon: '📊' },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('stock-summary');
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    productsApi.getAll({ limit: 100 }).then((res) => {
      const list = res.data.data || [];
      setProducts(list);
      if (list.length > 0) setSelectedProductId(list[0]._id);
    });
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.get(activeReport, {
        from: dateFrom,
        to: dateTo,
        productId: selectedProductId,
      });
      setData(res.data.data || []);
    } catch {
      toast('Failed to fetch report', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, selectedProductId]);

  const handleExport = async () => {
    try {
      const res = await reportsApi.exportCSV(activeReport, {
        from: dateFrom,
        to: dateTo,
        productId: selectedProductId,
      });
      downloadCSV(res.data, `${activeReport}-${dateFrom}-${dateTo}.csv`);
      toast('Report exported to CSV successfully!', 'success');
    } catch {
      toast('Export failed', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Enterprise Reports & Analytics</h1>
          <p className="text-gray-500 text-xs">
            SKU summaries, warehouse & store-wise counts, inward/outward dispatches & vendor metrics
          </p>
        </div>
        <button className="btn-secondary btn-sm flex items-center gap-2 text-xs" onClick={handleExport}>
          <Download className="w-4 h-4" /> Export CSV Data
        </button>
      </div>

      {/* Report Type Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {reportTypes.map((r) => (
          <button
            key={r.key}
            className={cn(
              'flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all',
              activeReport === r.key
                ? 'border-brand-700 bg-brand-50 text-brand-900 font-bold shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            )}
            onClick={() => setActiveReport(r.key)}
          >
            <span className="text-lg shrink-0">{r.icon}</span>
            <span className="text-xs truncate">{r.label}</span>
          </button>
        ))}
      </div>

      {/* Date & Product Filter Bar */}
      <div className="card flex flex-col md:flex-row items-stretch md:items-end gap-3 p-4 bg-gray-50 border border-gray-200">
        <div className="form-group flex-1">
          <label className="label text-xs">From Date</label>
          <input
            type="date"
            className="input text-xs bg-white"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="form-group flex-1">
          <label className="label text-xs">To Date</label>
          <input
            type="date"
            className="input text-xs bg-white"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        {activeReport === 'product-movement' && (
          <div className="form-group flex-1">
            <label className="label text-xs">Select Product SKU *</label>
            <select
              className="input select text-xs bg-white"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          className="btn-primary btn-sm text-xs py-2 px-4 shrink-0"
          onClick={fetchReport}
          disabled={loading}
        >
          {loading ? 'Generating...' : '⚡ Generate Report'}
        </button>
      </div>

      {/* Report Output View */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              {reportTypes.find((r) => r.key === activeReport)?.label}
            </h2>
            <p className="text-[11px] text-gray-400">
              Showing records from {dateFrom} to {dateTo} · {data.length} total rows
            </p>
          </div>
          <button
            onClick={handleExport}
            className="text-xs text-brand-700 font-bold hover:underline flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Download Spreadsheet
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400">
            <div className="w-6 h-6 border-2 border-brand-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Compiling report dataset...
          </div>
        ) : data.length === 0 ? (
          <div className="empty-state py-16 text-center">
            <BarChart2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h3 className="text-gray-700 font-bold text-xs">No data for the selected period</h3>
            <p className="text-gray-400 text-[11px]">Try expanding the date range or selecting another report</p>
          </div>
        ) : activeReport === 'movement' ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="incoming" fill="#3f7d07" radius={[4, 4, 0, 0]} name="Inward (Supplier)" />
                <Bar dataKey="outgoing" fill="#ea580c" radius={[4, 4, 0, 0]} name="Outward (Stores)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table text-xs">
              <thead>
                <tr>
                  {Object.keys(data[0])
                    .filter((k) => !['_id', 'id'].includes(k))
                    .map((k) => (
                      <th key={k} className="capitalize">
                        {k.replace(/([A-Z])/g, ' $1')}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/80">
                    {Object.entries(row)
                      .filter(([k]) => !['_id', 'id'].includes(k))
                      .map(([k, v]) => {
                        const isVal = k.toLowerCase().includes('price') || k.toLowerCase().includes('value') || k.toLowerCase().includes('valuation');
                        return (
                          <td key={k}>
                            {typeof v === 'number' && isVal ? (
                              <span className="font-semibold">{formatCurrency(v)}</span>
                            ) : v?.toString() || '—'}
                          </td>
                        );
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
