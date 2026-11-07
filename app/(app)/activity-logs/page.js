'use client';
import { useState, useEffect } from 'react';
import { History, Search, ShieldCheck, User, Laptop, Clock, Filter, RefreshCw } from 'lucide-react';
import { activityLogsApi } from '../../../lib/api';
import { formatDateTime, cn } from '../../../lib/utils';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await activityLogsApi.getAll({ limit: 50 });
      setLogs(res.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      !search ||
      log.description?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.action?.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === 'all' || log.action?.includes(filterAction);
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Activity & Audit Trail Logs</h1>
          <p className="text-gray-500 text-xs">
            Immutable chronological record of all operational actions, dispatches, store receipts & POS auto-deductions
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="btn-secondary btn-sm flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 text-xs"
            placeholder="Search action, user name, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            className="input select text-xs py-1.5"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="all">All Action Categories</option>
            <option value="DISPATCH">Dispatches & Transfers</option>
            <option value="STORE">Store Operations</option>
            <option value="POS">POS Auto-Deductions</option>
            <option value="DAMAGE">Damage & Defect Claims</option>
            <option value="STOCK">Stock Inward / Outward</option>
            <option value="USER">User Authentication</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="table-wrapper card p-0">
        <table className="table text-xs">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User / Performer</th>
              <th>Action Category</th>
              <th>Operational Details</th>
              <th>Entity</th>
              <th>IP / Device</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <History className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  No matching activity logs recorded.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50/80">
                  <td className="text-gray-500 whitespace-nowrap font-mono text-[11px]">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td>
                    <div className="font-semibold text-gray-900">{log.user?.name || 'System Auto'}</div>
                    <div className="text-[10px] text-gray-400 capitalize">{log.user?.role?.replace(/_/g, ' ') || 'Process'}</div>
                  </td>
                  <td>
                    <span className="badge bg-gray-100 text-gray-800 font-mono text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="text-gray-700 max-w-md">
                    {log.description}
                  </td>
                  <td>
                    <span className="badge bg-brand-50 text-brand-800 text-[10px]">
                      {log.entityType || 'General'}
                    </span>
                  </td>
                  <td className="font-mono text-[10px] text-gray-400">
                    {log.ipAddress || '10.0.1.25'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

