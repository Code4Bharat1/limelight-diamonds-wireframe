import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

export function formatTime(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(date));
}

export function getStatusColor(status) {
  const map = {
    incoming: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    outgoing: 'text-red-700 bg-red-50 border-red-200',
    transfer: 'text-blue-700 bg-blue-50 border-blue-200',
    adjustment: 'text-amber-700 bg-amber-50 border-amber-200',
    damaged: 'text-red-700 bg-red-50 border-red-200',
    return: 'text-purple-700 bg-purple-50 border-purple-200',
    audit_correction: 'text-teal-700 bg-teal-50 border-teal-200',
    pending: 'text-amber-700 bg-amber-50 border-amber-200',
    pending_approval: 'text-amber-700 bg-amber-50 border-amber-200',
    pending_inspection: 'text-amber-700 bg-amber-50 border-amber-200',
    approved: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    rejected: 'text-red-700 bg-red-50 border-red-200',
    completed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    in_progress: 'text-blue-700 bg-blue-50 border-blue-200',
    ready_to_dispatch: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    dispatched: 'text-blue-700 bg-blue-50 border-blue-200',
    in_transit: 'text-purple-700 bg-purple-50 border-purple-200',
    delivered: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    partially_dispatched: 'text-orange-700 bg-orange-50 border-orange-200',
    urgent: 'text-red-700 bg-red-50 border-red-200',
    high: 'text-amber-700 bg-amber-50 border-amber-200',
    normal: 'text-blue-700 bg-blue-50 border-blue-200',
    cancelled: 'text-gray-600 bg-gray-50 border-gray-200',
    active: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    inactive: 'text-gray-600 bg-gray-50 border-gray-200',
    fulfilled: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    claimed: 'text-orange-700 bg-orange-50 border-orange-200',
    settled: 'text-teal-700 bg-teal-50 border-teal-200',
  };
  return map[status] || 'text-gray-600 bg-gray-50 border-gray-200';
}

export function getRoleLabel(role) {
  const map = {
    super_admin: 'Super Admin',
    warehouse_manager: 'Warehouse Manager',
    warehouse_staff: 'Warehouse Staff',
    store_manager: 'Store Manager',
    inventory_manager: 'Inventory Manager',
    // Fallback for previous keys
    owner_admin: 'Super Admin',
    manager: 'Warehouse Manager',
    supervisor: 'Inventory Manager',
    worker: 'Warehouse Staff',
  };
  return map[role] || role;
}

export function getRoleBadgeColor(role) {
  const map = {
    super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
    warehouse_manager: 'bg-blue-100 text-blue-800 border-blue-200',
    warehouse_staff: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    store_manager: 'bg-amber-100 text-amber-800 border-amber-200',
    inventory_manager: 'bg-teal-100 text-teal-800 border-teal-200',
    // Fallback
    owner_admin: 'bg-purple-100 text-purple-800 border-purple-200',
    manager: 'bg-blue-100 text-blue-800 border-blue-200',
    supervisor: 'bg-teal-100 text-teal-800 border-teal-200',
    worker: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };
  return map[role] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getMovementIcon(type) {
  const map = {
    incoming: '📥',
    outgoing: '📤',
    transfer: '🔄',
    adjustment: '⚖️',
    damaged: '⚠️',
    return: '↩️',
    consumption: '🏷️',
    pos_sale: '💳',
    audit_correction: '🔍',
  };
  return map[type] || '📦';
}

export function truncate(str, len = 30) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

export function downloadCSV(data, filename) {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || 'export.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function monthName(month) {
  const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return names[(month || 1) - 1];
}
