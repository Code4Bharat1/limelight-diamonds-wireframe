'use client';
import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Warehouse, MapPin, Layers, Boxes,
  ChevronDown, ChevronRight, Check, X
} from 'lucide-react';
import { warehousesApi } from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { cn } from '../../../lib/utils';

function WarehouseForm({ warehouse, onSave, onClose }) {
  const [form, setForm] = useState({
    name: warehouse?.name || '',
    code: warehouse?.code || '',
    location: warehouse?.location || '',
    address: warehouse?.address || '',
    capacity: warehouse?.capacity || 10000,
    contactPhone: warehouse?.contactPhone || '',
    notes: warehouse?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (warehouse) {
        await warehousesApi.update(warehouse._id, form);
        toast('Warehouse updated!', 'success');
      } else {
        await warehousesApi.create(form);
        toast('Warehouse created!', 'success');
      }
      onSave();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed', 'error');
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group col-span-2">
          <label className="label text-xs">Warehouse Facility Name *</label>
          <input
            className="input text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="label text-xs">Warehouse Code *</label>
          <input
            className="input text-sm uppercase font-mono"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            required
          />
        </div>
        <div className="form-group">
          <label className="label text-xs">City/Location *</label>
          <input
            className="input text-sm"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="label text-xs">Storage Capacity (Units)</label>
          <input
            type="number"
            className="input text-sm"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="label text-xs">Contact Phone</label>
          <input
            className="input text-sm"
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
          />
        </div>
        <div className="form-group col-span-2">
          <label className="label text-xs">Address</label>
          <textarea
            className="input h-16 resize-none text-sm"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
      </div>
      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <button type="button" className="btn-secondary flex-1 text-xs" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1 text-xs" disabled={saving}>
          {saving ? 'Saving...' : warehouse ? 'Update Warehouse' : 'Create Warehouse'}
        </button>
      </div>
    </form>
  );
}

function FloorModal({ warehouse, onSave, onClose }) {
  const [floorName, setFloorName] = useState('');
  const [description, setDescription] = useState('');
  const [zoneName, setZoneName] = useState('Zone A');
  const [racks, setRacks] = useState('R-01, R-02, R-03');
  const [saving, setSaving] = useState(false);

  const handleAddFloor = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const racksArr = racks.split(',').map((r) => r.trim()).filter(Boolean);
      await warehousesApi.addFloor(warehouse._id, {
        name: floorName,
        description,
        zones: [{ id: `zn_${Date.now()}`, name: zoneName, racks: racksArr }],
      });
      toast('Floor & storage zones added to warehouse!', 'success');
      onSave();
    } catch {
      toast('Failed to add floor', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFloor = async (floorId) => {
    if (!confirm('Remove this floor layout?')) return;
    try {
      await warehousesApi.deleteFloor(warehouse._id, floorId);
      toast('Floor removed', 'info');
      onSave();
    } catch {}
  };

  return (
    <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-1">
          Active Floors & Storage Zones in {warehouse.name}
        </h3>
        <p className="text-xs text-gray-400">
          Manage warehouse levels, storage zones (Packaging, Displays, Stationery) and bin racks
        </p>
      </div>

      {/* Existing Floors */}
      <div className="space-y-3">
        {warehouse.floors?.map((fl) => (
          <div key={fl.id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-700" />
                <span className="font-bold text-xs text-gray-900">{fl.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteFloor(fl.id)}
                className="text-gray-400 hover:text-red-500 text-xs"
              >
                Delete Floor
              </button>
            </div>
            {fl.description && <p className="text-[11px] text-gray-500">{fl.description}</p>}

            <div className="pt-2 border-t border-gray-200 space-y-1.5">
              {fl.zones?.map((zn) => (
                <div key={zn.id} className="bg-white p-2 rounded-lg border border-gray-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-800">{zn.name}</span>
                  <div className="flex items-center gap-1">
                    {zn.racks?.map((rk) => (
                      <span key={rk} className="badge bg-gray-100 text-gray-700 text-[10px] py-0 px-1.5 font-mono">
                        {rk}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add New Floor Form */}
      <form onSubmit={handleAddFloor} className="pt-4 border-t border-gray-100 space-y-3 bg-white p-4 rounded-xl border">
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
          Add New Warehouse Floor Level
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="label text-xs">Floor Level Name *</label>
            <input
              className="input text-xs"
              placeholder="e.g. 2nd Floor (Reserve Storage)"
              value={floorName}
              onChange={(e) => setFloorName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="label text-xs">Primary Storage Zone Name *</label>
            <input
              className="input text-xs"
              placeholder="Zone A - Bulk Boxes"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label className="label text-xs">Racks (Comma-separated)</label>
          <input
            className="input text-xs font-mono"
            placeholder="R-01, R-02, R-03, R-04"
            value={racks}
            onChange={(e) => setRacks(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="label text-xs">Floor Description</label>
          <input
            className="input text-xs"
            placeholder="Purpose of this level"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" className="btn-primary btn-sm text-xs" disabled={saving}>
            {saving ? 'Adding Floor...' : '+ Add Floor Level'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [floorModalTarget, setFloorModalTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await warehousesApi.getAll();
      setWarehouses(res.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await warehousesApi.delete(deleteTarget._id);
      toast('Warehouse deactivated', 'success');
      setDeleteTarget(null);
      fetchWarehouses();
    } catch {}
    setDeleting(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Warehouses & Floor Management</h1>
          <p className="text-gray-500 text-xs">
            Multi-location hubs, floor levels, storage zones & bin rack assignments
          </p>
        </div>
        <button
          className="btn-primary btn-sm flex items-center gap-1.5 text-xs"
          onClick={() => {
            setEditTarget(null);
            setModalOpen(true);
          }}
        >
          <Plus className="w-3.5 h-3.5" /> Add Warehouse
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-56" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {warehouses.map((wh) => (
            <div key={wh._id} className="card-hover flex flex-col justify-between p-5 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="btn-ghost btn-icon p-1 min-h-0 text-gray-400 hover:text-gray-900"
                      onClick={() => {
                        setEditTarget(wh);
                        setModalOpen(true);
                      }}
                      title="Edit Warehouse"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="btn-ghost btn-icon p-1 min-h-0 text-gray-400 hover:text-red-600"
                      onClick={() => setDeleteTarget(wh)}
                      title="Deactivate"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="font-mono text-[10px] text-brand-700 font-bold">{wh.code}</div>
                  <h3 className="font-bold text-gray-900 text-sm mt-0.5">{wh.name}</h3>
                  <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{wh.location} · {wh.address}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-xl p-2.5 text-center text-xs">
                <div>
                  <div className="font-bold text-gray-900">{wh.totalStock?.toLocaleString('en-IN') || 0}</div>
                  <div className="text-[10px] text-gray-400">Total Stock</div>
                </div>
                <div>
                  <div className="font-bold text-gray-900">{wh.capacityUsed || 0}%</div>
                  <div className="text-[10px] text-gray-400">Capacity</div>
                </div>
                <div>
                  <div className="font-bold text-amber-600">{wh.lowStockCount || 0}</div>
                  <div className="text-[10px] text-gray-400">Low Stock</div>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      (wh.capacityUsed || 0) > 80
                        ? 'bg-red-500'
                        : (wh.capacityUsed || 0) > 60
                        ? 'bg-amber-500'
                        : 'bg-brand-700'
                    )}
                    style={{ width: `${wh.capacityUsed || 0}%` }}
                  />
                </div>
              </div>

              {/* Floor Management Action Button (Feature 7) */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-brand-700" />
                  <span>{wh.floors?.length || 1} Floor Levels</span>
                </span>
                <button
                  onClick={() => setFloorModalTarget(wh)}
                  className="text-brand-700 font-bold hover:underline flex items-center gap-1"
                >
                  Manage Floors →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warehouse Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Warehouse' : 'Add New Warehouse Facility'}
        size="md"
      >
        <WarehouseForm
          warehouse={editTarget}
          onSave={() => {
            setModalOpen(false);
            fetchWarehouses();
          }}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

      {/* Floor & Zone Management Modal */}
      <Modal
        isOpen={!!floorModalTarget}
        onClose={() => setFloorModalTarget(null)}
        title={`Floor & Zone Layout: ${floorModalTarget?.name}`}
        size="lg"
      >
        {floorModalTarget && (
          <FloorModal
            warehouse={floorModalTarget}
            onSave={() => {
              fetchWarehouses();
              // refresh target
              const updated = warehouses.find((w) => w._id === floorModalTarget._id);
              if (updated) setFloorModalTarget(updated);
            }}
            onClose={() => setFloorModalTarget(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate Warehouse"
        message={`Are you sure you want to deactivate "${deleteTarget?.name}"?`}
        loading={deleting}
      />
    </div>
  );
}
