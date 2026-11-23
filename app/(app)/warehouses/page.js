'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Search, AlertTriangle, CheckCircle2, Download,
  Layers, Settings, ExternalLink, ArrowUpDown
} from 'lucide-react';
import Link from 'next/link';
import { warehousesApi, productsApi } from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';
import Modal from '../../../components/ui/Modal';
import { cn } from '../../../lib/utils';

const CATEGORIES = [
  'All',
  'Packaging',
  'Display Items',
  'Gifts & Collateral',
  'Bags & Pouches',
  'Stationery & Consumables',
  'Props & VM',
];

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
      toast('Floor added successfully', 'success');
      setFloorName('');
      setDescription('');
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
    <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
      <div>
        <h3 className="text-sm font-bold text-gray-900">
          Floor Layout & Bin Racks
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {warehouse.name} · {warehouse.location}
        </p>
      </div>

      <div className="space-y-2.5">
        {warehouse.floors?.map((fl) => (
          <div key={fl.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-gray-900">{fl.name}</span>
              {warehouse.floors.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteFloor(fl.id)}
                  className="text-gray-400 hover:text-red-600 text-xs"
                >
                  Delete
                </button>
              )}
            </div>
            {fl.description && <p className="text-[11px] text-gray-500 mt-0.5">{fl.description}</p>}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              {fl.zones?.map((zn) => (
                <span key={zn.id} className="text-[11px] bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-700">
                  {zn.name}: <span className="font-mono text-gray-500">{zn.racks?.join(', ')}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddFloor} className="pt-4 border-t border-gray-100 space-y-3">
        <h4 className="text-xs font-bold text-gray-800">Add Floor Level</h4>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input text-xs"
            placeholder="Floor Name (e.g. 2nd Floor)"
            value={floorName}
            onChange={(e) => setFloorName(e.target.value)}
            required
          />
          <input
            className="input text-xs"
            placeholder="Zone Name (e.g. Zone A)"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            required
          />
        </div>
        <input
          className="input text-xs font-mono"
          placeholder="Racks (e.g. R-01, R-02, R-03)"
          value={racks}
          onChange={(e) => setRacks(e.target.value)}
          required
        />
        <div className="flex justify-end">
          <button type="submit" className="btn-primary btn-sm text-xs" disabled={saving}>
            {saving ? 'Adding...' : 'Add Level'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CentralWarehouseStockPage() {
  const [warehouse, setWarehouse] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [floorModalOpen, setFloorModalOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [whRes, prodRes] = await Promise.all([
        warehousesApi.getAll(),
        productsApi.getAll({ limit: 100 }),
      ]);
      const activeWh = (whRes.data.data || [])[0] || null;
      setWarehouse(activeWh);
      setProducts(prodRes.data.data || []);
    } catch {
      toast('Failed to load inventory data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute live remaining inventory
  const inventoryItems = useMemo(() => {
    if (!warehouse) return [];
    return products.map((p) => {
      const ws = p.warehouseStock?.find((w) => w.warehouse?._id === warehouse._id);
      const unitsLeft = ws ? ws.quantity : (p.warehouseTotalStock ?? 0);
      const minThreshold = p.minStockLevel || 50;
      const isLowStock = unitsLeft <= minThreshold;

      return {
        ...p,
        unitsLeft,
        minThreshold,
        isLowStock,
      };
    });
  }, [warehouse, products]);

  // Filtered inventory
  const filtered = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        (item.storageLocation && item.storageLocation.toLowerCase().includes(search.toLowerCase()));

      const matchCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      const matchLowStock = !lowStockOnly || item.isLowStock;

      return matchSearch && matchCategory && matchLowStock;
    });
  }, [inventoryItems, search, selectedCategory, lowStockOnly]);

  const totalRemainingUnits = useMemo(() => {
    return inventoryItems.reduce((acc, curr) => acc + curr.unitsLeft, 0);
  }, [inventoryItems]);

  const lowStockCount = useMemo(() => {
    return inventoryItems.filter((i) => i.isLowStock).length;
  }, [inventoryItems]);

  const handleExportCSV = () => {
    const headers = ['SKU', 'Product Name', 'Category', 'Units Left', 'Min Buffer', 'Location', 'Status'];
    const rows = filtered.map((i) => [
      i.sku,
      `"${i.name.replace(/"/g, '""')}"`,
      i.category,
      i.unitsLeft,
      i.minThreshold,
      `"${i.storageLocation || ''}"`,
      i.isLowStock ? 'Low Stock' : 'In Stock',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Central_Inventory_Stock_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-16 max-w-6xl">
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Central Inventory</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Limelight Central Hub (BKC) · <span className="font-semibold text-gray-900">{totalRemainingUnits.toLocaleString('en-IN')} units on hand</span> across {inventoryItems.length} products
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFloorModalOpen(true)}
            className="btn-secondary btn-sm text-xs flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-gray-500" /> Floors & Racks
          </button>
          <button
            onClick={handleExportCSV}
            className="btn-secondary btn-sm text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" /> Export CSV
          </button>
        </div>
      </div>

      {/* Clean Filters Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 text-xs"
            placeholder="Search product or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Low Stock Toggle & Counts */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5',
              lowStockOnly
                ? 'bg-amber-50 border-amber-300 text-amber-800 font-semibold'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            <AlertTriangle className={cn('w-3.5 h-3.5', lowStockOnly ? 'text-amber-600' : 'text-gray-400')} />
            Low Stock Only {lowStockCount > 0 && `(${lowStockCount})`}
          </button>
        </div>
      </div>

      {/* Clean Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-100 scrollbar-hide text-xs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors',
              selectedCategory === cat
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Simple, Clean Products Stock Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table text-xs w-full">
            <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="py-2.5 px-4 text-left font-semibold">Product / SKU</th>
                <th className="py-2.5 px-3 text-left font-semibold">Category</th>
                <th className="py-2.5 px-4 text-left font-semibold text-gray-900">Units in Central Stock</th>
                <th className="py-2.5 px-3 text-left font-semibold">Min Buffer</th>
                <th className="py-2.5 px-3 text-left font-semibold">Storage Rack</th>
                <th className="py-2.5 px-3 text-left font-semibold">Status</th>
                <th className="py-2.5 px-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="py-3 px-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Name & SKU */}
                    <td className="py-3 px-4">
                      <Link
                        href={`/products/${item._id}`}
                        className="font-semibold text-gray-900 hover:text-brand-700 hover:underline"
                      >
                        {item.name}
                      </Link>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                        {item.sku}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 text-gray-600">
                      {item.category}
                    </td>

                    {/* Units Left */}
                    <td className="py-3 px-4">
                      <span className={cn(
                        'font-bold text-sm',
                        item.isLowStock ? 'text-amber-700' : 'text-gray-900'
                      )}>
                        {item.unitsLeft.toLocaleString('en-IN')}
                      </span>
                      <span className="text-gray-400 ml-1 text-xs">{item.unit || 'pcs'}</span>
                    </td>

                    {/* Min Buffer */}
                    <td className="py-3 px-3 text-gray-500">
                      {item.minThreshold} {item.unit}
                    </td>

                    {/* Storage Location */}
                    <td className="py-3 px-3 text-gray-600 font-mono text-[11px]">
                      {item.storageLocation || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {item.isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> In Stock
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/products/${item._id}`}
                        className="text-brand-700 hover:underline font-medium text-xs"
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Count */}
        <div className="py-2.5 px-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
          <span>Showing {filtered.length} of {inventoryItems.length} items</span>
          <span>Limelight Diamonds · Inventory System</span>
        </div>
      </div>

      {/* Floor & Racks Modal (Only when clicked) */}
      <Modal
        isOpen={floorModalOpen}
        onClose={() => setFloorModalOpen(false)}
        title="Storage Floors & Bin Racks"
        size="md"
      >
        {warehouse && (
          <FloorModal
            warehouse={warehouse}
            onSave={() => {
              fetchData();
            }}
            onClose={() => setFloorModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}
