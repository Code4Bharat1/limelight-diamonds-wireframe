'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, ShieldCheck, ToggleLeft, ToggleRight,
  Warehouse, Store, History, Check, X
} from 'lucide-react';
import Link from 'next/link';
import { usersApi, warehousesApi, storesApi } from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';
import Modal from '../../../components/ui/Modal';
import StatusBadge from '../../../components/ui/StatusBadge';
import { getRoleLabel, getRoleBadgeColor, formatDateTime, cn } from '../../../lib/utils';

const ROLES = [
  'super_admin',
  'warehouse_manager',
  'warehouse_staff',
  'store_manager',
  'inventory_manager',
];

const DESIGNATIONS = [
  'Super Admin & Managing Director',
  'Warehouse Operations Manager',
  'Senior Dispatch & Packing Specialist',
  'Inward & QC Specialist',
  'Store Operations Manager',
  'Assistant Store Manager',
  'Head of Inventory & Supply Chain',
  'Logistics Coordinator',
];

function UserForm({ user, warehouses = [], stores = [], onSave, onClose }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'warehouse_staff',
    designation: user?.designation || '',
    assignedWarehouseId: user?.assignedWarehouse?._id || '',
    assignedStoreId: user?.assignedStore?._id || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user) {
        await usersApi.update(user._id, form);
        toast('User details updated!', 'success');
      } else {
        await usersApi.create(form);
        toast('New team user created!', 'success');
      }
      onSave();
    } catch {
      toast('Failed to save user', 'error');
    }
    setSaving(false);
  };

  const isWarehouseRole = ['warehouse_manager', 'warehouse_staff'].includes(form.role);
  const isStoreRole = form.role === 'store_manager';

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group col-span-2">
          <label className="label text-xs">Full Name *</label>
          <input
            className="input text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="label text-xs">Email Address *</label>
          <input
            type="email"
            className="input text-sm"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="label text-xs">Phone Number</label>
          <input
            className="input text-sm"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="label text-xs">System Role (5 Roles) *</label>
          <select
            className="input select text-sm font-semibold text-brand-900"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{getRoleLabel(r)}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label text-xs">Job Title / Designation</label>
          <input
            list="designations"
            className="input text-sm"
            value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
          />
          <datalist id="designations">
            {DESIGNATIONS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>

        {/* Warehouse-wise Access (Feature 4) */}
        {isWarehouseRole && (
          <div className="form-group col-span-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <label className="label text-xs font-bold text-blue-900">Assigned Central Warehouse</label>
            <select
              className="input select text-xs bg-white"
              value={form.assignedWarehouseId}
              onChange={(e) => setForm({ ...form, assignedWarehouseId: e.target.value })}
            >
              <option value="">— All Warehouses Access —</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>
        )}

        {/* Store-wise Access (Feature 5) */}
        {isStoreRole && (
          <div className="form-group col-span-2 p-3 bg-teal-50 rounded-xl border border-teal-200">
            <label className="label text-xs font-bold text-teal-900">Assigned Retail Showroom Store *</label>
            <select
              className="input select text-xs bg-white"
              value={form.assignedStoreId}
              onChange={(e) => setForm({ ...form, assignedStoreId: e.target.value })}
              required
            >
              <option value="">— Select Retail Showroom —</option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <button type="button" className="btn-secondary flex-1 text-xs" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1 text-xs" disabled={saving}>
          {saving ? 'Saving...' : user ? 'Update User' : 'Register User'}
        </button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, wRes, sRes] = await Promise.all([
        usersApi.getAll(),
        warehousesApi.getAll(),
        storesApi.getAll(),
      ]);
      setUsers(uRes.data.data || []);
      setWarehouses(wRes.data.data || []);
      setStores(sRes.data.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggle = async (userId) => {
    try {
      await usersApi.toggleActive(userId);
      toast('User access status updated', 'success');
      fetchUsers();
    } catch {}
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Users & Role-Based Access Control (RBAC)</h1>
          <p className="text-gray-500 text-xs">
            Role assignments across Super Admin, Warehouse Managers, Warehouse Staff, Store Managers & Inventory Managers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/activity-logs" className="btn-secondary btn-sm flex items-center gap-1.5 text-xs">
            <History className="w-3.5 h-3.5" /> View Activity Trail
          </Link>
          <button
            className="btn-primary btn-sm flex items-center gap-1.5 text-xs"
            onClick={() => {
              setEditTarget(null);
              setModal(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Add New User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-wrapper card p-0">
        <table className="table text-xs">
          <thead>
            <tr>
              <th>User Name & Email</th>
              <th>System Role</th>
              <th>Designation</th>
              <th>Facility / Store Access</th>
              <th>Approval Permissions</th>
              <th>Account Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const assignedLoc = u.assignedStore?.name
                  ? `Store: ${u.assignedStore.name}`
                  : u.assignedWarehouse?.name
                  ? `WH: ${u.assignedWarehouse.name}`
                  : 'All Locations (Central)';

                const canApprove = ['super_admin', 'owner_admin', 'warehouse_manager', 'inventory_manager'].includes(u.role);

                return (
                  <tr key={u._id} className="hover:bg-gray-50/80">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{u.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={cn('badge text-[10px] font-bold border', getRoleBadgeColor(u.role))}>
                        {getRoleLabel(u.role)}
                      </span>
                    </td>

                    <td className="text-gray-600 font-medium">{u.designation || '—'}</td>

                    <td>
                      <div className="flex items-center gap-1 text-gray-700 text-xs font-semibold">
                        {u.assignedStore ? (
                          <Store className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        ) : u.assignedWarehouse ? (
                          <Warehouse className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        )}
                        <span className="truncate max-w-[180px]">{assignedLoc}</span>
                      </div>
                    </td>

                    <td>
                      {canApprove ? (
                        <span className="badge bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold">
                          ✓ Adjustments, Claims & Reqs
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">Execution / Scan Only</span>
                      )}
                    </td>

                    <td>
                      <StatusBadge status={u.isActive ? 'active' : 'inactive'} />
                    </td>

                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          className="btn-ghost btn-icon p-1 min-h-0 text-gray-400 hover:text-blue-600"
                          onClick={() => {
                            setEditTarget(u);
                            setModal(true);
                          }}
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className={cn('btn-ghost btn-icon p-1 min-h-0', u.isActive ? 'text-emerald-600' : 'text-gray-400')}
                          onClick={() => handleToggle(u._id)}
                          title="Toggle Access"
                        >
                          {u.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editTarget ? `Edit User: ${editTarget.name}` : 'Register New Team Member'}
        size="md"
      >
        <UserForm
          user={editTarget}
          warehouses={warehouses}
          stores={stores}
          onSave={() => {
            setModal(false);
            fetchUsers();
          }}
          onClose={() => setModal(false)}
        />
      </Modal>
    </div>
  );
}
