'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, Edit2, Trash2, QrCode, Package, Eye,
  AlertTriangle, Sparkles, Building, Printer, Check, X
} from 'lucide-react';
import Link from 'next/link';
import { productsApi, suppliersApi } from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Modal from '../../../components/ui/Modal';
import StatusBadge from '../../../components/ui/StatusBadge';
import { formatCurrency, cn } from '../../../lib/utils';

const CATEGORIES = [
  'All',
  'Packaging',
  'Display Items',
  'Gifts & Collateral',
  'Bags & Pouches',
  'Stationery & Consumables',
  'Props & VM',
];

function ProductForm({ product, suppliers = [], onSave, onClose }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || 'Packaging',
    brand: product?.brand || 'Limelight Diamonds',
    unit: product?.unit || 'pcs',
    purchasePrice: product?.purchasePrice || '',
    sellingPrice: product?.sellingPrice || '',
    minStockLevel: product?.minStockLevel || 50,
    reorderQty: product?.reorderQty || 100,
    storageLocation: product?.storageLocation || 'Ground Floor · Zone A · Rack 1',
    description: product?.description || '',
    supplierIds: product?.suppliers?.map((s) => s._id) || (suppliers[0] ? [suppliers[0]._id] : []),
    isActive: product?.isActive !== false,
  });
  const [saving, setSaving] = useState(false);
  const [generatingSKU, setGeneratingSKU] = useState(false);

  const handleAutoGenerateSKU = async () => {
    setGeneratingSKU(true);
    try {
      const res = await productsApi.generateSKU(form.category, form.name);
      setForm((prev) => ({ ...prev, sku: res.data.sku }));
      toast('SKU auto-generated!', 'success');
    } catch {}
    setGeneratingSKU(false);
  };

  const toggleSupplier = (sId) => {
    setForm((prev) => {
      const current = prev.supplierIds || [];
      return {
        ...prev,
        supplierIds: current.includes(sId)
          ? current.filter((id) => id !== sId)
          : [...current, sId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (product) {
        await productsApi.update(product._id, form);
        toast('Product updated successfully', 'success');
      } else {
        await productsApi.create(form);
        toast('New product SKU created successfully', 'success');
      }
      onSave();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div className="form-group col-span-2">
          <label className="label text-xs">Product / Material Name *</label>
          <input
            className="input text-sm"
            placeholder="e.g. Luxury Solitaire Ring Box (Emerald Velvet)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        {/* SKU & Auto Generator */}
        <div className="form-group col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <label className="label text-xs mb-0">SKU Code *</label>
            <button
              type="button"
              onClick={handleAutoGenerateSKU}
              disabled={generatingSKU}
              className="text-[11px] text-brand-700 font-bold hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-brand-600" />
              <span>Auto-Generate</span>
            </button>
          </div>
          <input
            className="input uppercase text-sm font-mono font-bold"
            placeholder="PKG-BX-RNG-01"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
            required
            disabled={!!product}
          />
        </div>

        {/* Category */}
        <div className="form-group col-span-2 md:col-span-1">
          <label className="label text-xs">Category *</label>
          <select
            className="input select text-sm"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          >
            {CATEGORIES.filter((c) => c !== 'All').map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Brand */}
        <div className="form-group">
          <label className="label text-xs">Brand Label</label>
          <input
            className="input text-sm"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
          />
        </div>

        {/* Unit */}
        <div className="form-group">
          <label className="label text-xs">Unit of Measure</label>
          <select
            className="input select text-sm"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          >
            {['pcs', 'pack', 'set', 'roll', 'box', 'meter'].map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Cost & Transfer Price */}
        <div className="form-group">
          <label className="label text-xs">Procurement / Purchase Cost (₹)</label>
          <input
            type="number"
            className="input text-sm"
            value={form.purchasePrice}
            onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="label text-xs">Internal Valuation / Transfer (₹)</label>
          <input
            type="number"
            className="input text-sm"
            value={form.sellingPrice}
            onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
          />
        </div>

        {/* Thresholds */}
        <div className="form-group">
          <label className="label text-xs">Minimum Stock Threshold</label>
          <input
            type="number"
            className="input text-sm"
            value={form.minStockLevel}
            onChange={(e) => setForm({ ...form, minStockLevel: Number(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label className="label text-xs">Standard Reorder Quantity</label>
          <input
            type="number"
            className="input text-sm"
            value={form.reorderQty}
            onChange={(e) => setForm({ ...form, reorderQty: Number(e.target.value) })}
          />
        </div>

        {/* Storage Location */}
        <div className="form-group col-span-2">
          <label className="label text-xs">Default Warehouse Storage Bin</label>
          <input
            className="input text-sm"
            placeholder="Ground Floor · Zone A · Rack R-01"
            value={form.storageLocation}
            onChange={(e) => setForm({ ...form, storageLocation: e.target.value })}
          />
        </div>

        {/* Multiple Vendor Mapping (Feature 5 in Product Management) */}
        <div className="col-span-2 space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <label className="label text-xs font-bold text-gray-800 mb-1 flex items-center justify-between">
            <span>Mapped Vendors / Suppliers</span>
            <span className="text-[10px] text-gray-400 font-normal">Select all vendors that supply this SKU</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suppliers.map((s) => {
              const isSelected = form.supplierIds?.includes(s._id);
              return (
                <div
                  key={s._id}
                  onClick={() => toggleSupplier(s._id)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected ? 'bg-brand-50 border-brand-300 text-brand-900 font-bold' : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="accent-brand-700 w-3.5 h-3.5 rounded"
                  />
                  <div className="truncate">
                    <div className="truncate leading-tight">{s.name}</div>
                    <div className="text-[10px] opacity-70">{s.code} · {s.city}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div className="form-group col-span-2">
          <label className="label text-xs">Description & Specifications</label>
          <textarea
            className="input h-16 resize-none text-sm"
            placeholder="Material specs, velvet finish, branding dimensions, etc."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* Status */}
        <div className="form-group col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="w-4 h-4 accent-brand-700"
          />
          <label htmlFor="isActive" className="text-xs font-semibold text-gray-700 cursor-pointer">
            Active in Catalog & Store Ordering
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <button type="button" className="btn-secondary flex-1 text-xs" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1 text-xs" disabled={saving}>
          {saving ? 'Saving...' : product ? 'Update SKU' : 'Create Product SKU'}
        </button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [qrModalProduct, setQrModalProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, supRes] = await Promise.all([
        productsApi.getAll({
          search,
          category: selectedCategory === 'All' ? undefined : selectedCategory,
          lowStock: filterLowStock,
          limit: 100,
        }),
        suppliersApi.getAll(),
      ]);
      setProducts(prodRes.data.data || []);
      setTotal(prodRes.data.total || 0);
      setSuppliers(supRes.data.data || []);
    } catch {}
    setLoading(false);
  }, [search, selectedCategory, filterLowStock]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productsApi.delete(deleteTarget._id);
      toast('Product SKU deactivated', 'success');
      setDeleteTarget(null);
      fetchProducts();
    } catch {
      toast('Failed to delete product', 'error');
    }
    setDeleting(false);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Products & SKU Catalog</h1>
          <p className="text-gray-500 text-xs">
            Packaging, Showroom Displays, Luxury Gift Kits, Carry Bags & Stationery
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/qr-codes" className="btn-secondary btn-sm flex items-center gap-1.5 text-xs">
            <QrCode className="w-3.5 h-3.5" /> Printable QR Labels
          </Link>
          <button
            className="btn-primary btn-sm flex items-center gap-1.5 text-xs"
            onClick={() => {
              setEditProduct(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Add New SKU
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-brand-700 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search & Low Stock Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 text-xs"
            placeholder="Search SKU code, product title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`btn-sm flex items-center gap-1.5 text-xs border ${
            filterLowStock
              ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Low Stock Items Only</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="table-wrapper card p-0">
        <table className="table text-xs">
          <thead>
            <tr>
              <th>SKU / Product</th>
              <th>Category</th>
              <th>Warehouse Stock</th>
              <th>Store Stock</th>
              <th>Total Available</th>
              <th>Mapped Vendors</th>
              <th>Storage Location</th>
              <th>Unit Cost</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-gray-400">
                  <Package className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  No matching products or SKUs found.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const isLow = p.currentStock <= p.minStockLevel;
                return (
                  <tr key={p._id} className="hover:bg-gray-50/80">
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQrModalProduct(p)}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-brand-50 flex items-center justify-center text-gray-500 hover:text-brand-700 shrink-0"
                          title="View QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <div className="min-w-0">
                          <Link href={`/products/${p._id}`} className="font-bold text-gray-900 hover:text-brand-700 hover:underline block truncate">
                            {p.name}
                          </Link>
                          <span className="font-mono text-[10px] text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded font-semibold">
                            {p.sku}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="badge bg-gray-100 text-gray-700 text-[10px]">
                        {p.category}
                      </span>
                    </td>

                    <td>
                      <span className="font-semibold text-gray-800">
                        {p.warehouseTotalStock?.toLocaleString('en-IN') || 0}{' '}
                        <span className="text-[10px] text-gray-400 font-normal">{p.unit}</span>
                      </span>
                    </td>

                    <td>
                      <span className="font-semibold text-teal-800">
                        {p.storeTotalStock?.toLocaleString('en-IN') || 0}{' '}
                        <span className="text-[10px] text-gray-400 font-normal">{p.unit}</span>
                      </span>
                    </td>

                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                          {p.currentStock?.toLocaleString('en-IN')} {p.unit}
                        </span>
                        {isLow && (
                          <span className="badge bg-red-100 text-red-700 text-[9px] py-0 px-1">
                            Min: {p.minStockLevel}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="text-[11px] text-gray-600 truncate max-w-[140px]">
                        {p.suppliers && p.suppliers.length > 0 ? (
                          p.suppliers.map((s) => s.name.split(' ')[0]).join(', ')
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>

                    <td className="text-gray-500 text-[11px]">
                      {p.storageLocation || '—'}
                    </td>

                    <td className="font-medium text-gray-800">
                      {formatCurrency(p.purchasePrice)}
                    </td>

                    <td>
                      <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
                    </td>

                    <td>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/products/${p._id}`}
                          className="btn-ghost btn-icon p-1 min-h-0 text-gray-400 hover:text-brand-700"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          className="btn-ghost btn-icon p-1 min-h-0 text-gray-400 hover:text-blue-600"
                          onClick={() => {
                            setEditProduct(p);
                            setModalOpen(true);
                          }}
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="btn-ghost btn-icon p-1 min-h-0 text-gray-400 hover:text-red-600"
                          onClick={() => setDeleteTarget(p)}
                          title="Deactivate SKU"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Product Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProduct ? `Edit SKU: ${editProduct.sku}` : 'Add New Product SKU'}
        size="lg"
      >
        <ProductForm
          product={editProduct}
          suppliers={suppliers}
          onSave={() => {
            setModalOpen(false);
            fetchProducts();
          }}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

      {/* QR Code Tag Modal */}
      <Modal
        isOpen={!!qrModalProduct}
        onClose={() => setQrModalProduct(null)}
        title="Printable QR Asset Tag"
        size="sm"
      >
        {qrModalProduct && (
          <div className="p-6 text-center space-y-4">
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-2xl bg-white inline-block shadow-inner">
              {qrModalProduct.qrCodeImage ? (
                <img
                  src={qrModalProduct.qrCodeImage}
                  alt={qrModalProduct.sku}
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <QrCode className="w-40 h-40 text-gray-400 mx-auto" />
              )}
              <div className="font-mono text-xs font-bold text-gray-900 mt-2">
                {qrModalProduct.sku}
              </div>
              <div className="text-[11px] text-gray-500 font-medium truncate max-w-[200px] mx-auto">
                {qrModalProduct.name}
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Compatible with handheld Zebra/Honeywell barcode & QR tag scanners
            </p>
            <button
              onClick={() => {
                window.print();
              }}
              className="btn-primary w-full text-xs flex items-center justify-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" /> Print Tag Label
            </button>
          </div>
        )}
      </Modal>

      {/* Delete/Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate Product SKU"
        message={`Are you sure you want to deactivate "${deleteTarget?.name}" (${deleteTarget?.sku})?`}
        loading={deleting}
      />
    </div>
  );
}
