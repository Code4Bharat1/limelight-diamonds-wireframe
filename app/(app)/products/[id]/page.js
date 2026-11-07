'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Package, ChevronLeft, QrCode, AlertTriangle, ArrowDownToLine,
  ArrowUpFromLine, ArrowLeftRight, Clock, Building2, MapPin, Tag,
  Warehouse, Store, Truck, Printer
} from 'lucide-react';
import { productsApi } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const [prodRes, movRes] = await Promise.all([
          productsApi.getById(id),
          productsApi.getMovements(id, { limit: 20 }),
        ]);
        setProduct(prodRes.data.data);
        setMovements(movRes.data.data || []);
      } catch (err) {
        toast('Failed to load product details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse p-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card h-64 bg-gray-200" />
          <div className="card md:col-span-2 h-64 bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="empty-state py-20 text-center">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-800">Product not found</h2>
        <button onClick={() => router.back()} className="btn-secondary mt-4">
          <ChevronLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const isLowStock = product.currentStock <= product.minStockLevel;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="btn-ghost btn-sm flex items-center gap-1 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Products Catalog
        </button>
        <div className="flex items-center gap-2">
          <StatusBadge status={product.isActive ? 'active' : 'inactive'} />
          <button
            onClick={() => window.print()}
            className="btn-secondary btn-sm flex items-center gap-1.5 text-xs"
          >
            <Printer className="w-3.5 h-3.5" /> Print QR Label
          </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: QR & Identifiers */}
        <div className="card flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="w-44 h-44 rounded-2xl bg-white flex items-center justify-center p-3 border-2 border-dashed border-gray-200 shadow-sm">
            {product.qrCodeImage ? (
              <img src={product.qrCodeImage} alt={product.sku} className="w-full h-full object-contain" />
            ) : (
              <QrCode className="w-24 h-24 text-gray-300" />
            )}
          </div>
          <div>
            <div className="font-mono text-sm font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full inline-block">
              {product.sku}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">QR Value: {product.qrCodeValue}</div>
          </div>
        </div>

        {/* Right: Overview & Pricing */}
        <div className="card md:col-span-2 space-y-4 p-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
              <span>{product.brand}</span>
              <span>•</span>
              <span className="text-brand-700 font-bold">{product.category}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
            {product.description && (
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{product.description}</p>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="text-[11px] text-gray-500 font-medium">Total Active Stock</div>
              <div className={cn('text-xl font-bold mt-0.5', isLowStock ? 'text-red-600' : 'text-gray-900')}>
                {product.currentStock?.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-gray-400">{product.unit}</span>
              </div>
              {isLowStock && (
                <div className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" /> Min Threshold: {product.minStockLevel}
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="text-[11px] text-gray-500 font-medium">Procurement Cost</div>
              <div className="text-lg font-bold text-gray-800 mt-0.5">
                {formatCurrency(product.purchasePrice)}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="text-[11px] text-gray-500 font-medium">Valuation Price</div>
              <div className="text-lg font-bold text-gray-800 mt-0.5">
                {formatCurrency(product.sellingPrice)}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="text-[11px] text-gray-500 font-medium">Storage Location</div>
              <div className="text-xs font-bold text-brand-800 mt-1 truncate">
                {product.storageLocation || 'Zone A'}
              </div>
            </div>
          </div>

          {/* Mapped Suppliers */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-gray-400" />
              <span>Mapped Vendor Partners</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.suppliers && product.suppliers.length > 0 ? (
                product.suppliers.map((s) => (
                  <div key={s._id} className="badge bg-white border border-gray-200 text-gray-800 text-xs py-1 px-2.5">
                    <span className="font-bold">{s.name}</span>
                    <span className="text-[10px] text-gray-400 ml-1.5 font-mono">{s.code}</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-gray-400">No vendors directly mapped</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stock Locations: Warehouses vs Stores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Warehouses */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
              <Warehouse className="w-4 h-4 text-brand-700" />
              <span>Central Warehouses Stock</span>
            </h3>
            <span className="text-xs font-bold text-brand-700">
              {product.warehouseTotalStock?.toLocaleString('en-IN') || 0} {product.unit}
            </span>
          </div>
          <div className="space-y-2">
            {product.warehouseStock?.map((ws) => (
              <div key={ws.warehouse?._id} className="p-2.5 rounded-xl bg-gray-50 flex items-center justify-between text-xs">
                <span className="text-gray-700 font-medium">{ws.warehouse?.name}</span>
                <span className="font-bold text-gray-900">{ws.quantity} {product.unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stores */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
              <Store className="w-4 h-4 text-teal-700" />
              <span>Retail Stores Stock</span>
            </h3>
            <span className="text-xs font-bold text-teal-700">
              {product.storeTotalStock?.toLocaleString('en-IN') || 0} {product.unit}
            </span>
          </div>
          <div className="space-y-2">
            {product.storeStock?.map((ss) => (
              <div key={ss.store?._id} className="p-2.5 rounded-xl bg-gray-50 flex items-center justify-between text-xs">
                <span className="text-gray-700 font-medium">{ss.store?.name}</span>
                <span className="font-bold text-teal-800">{ss.quantity} {product.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Movement Ledger */}
      <div className="card space-y-3">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>Product Movement History</span>
        </h3>
        <div className="table-wrapper">
          <table className="table text-xs">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Source / Origin</th>
                <th>Destination</th>
                <th>Reference</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No movement records logged for this product SKU yet.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m._id}>
                    <td className="text-gray-500">{formatDateTime(m.createdAt)}</td>
                    <td>
                      <span className="capitalize font-semibold text-gray-800">{m.type}</span>
                    </td>
                    <td className="font-bold text-gray-900">
                      {m.quantity} {product.unit}
                    </td>
                    <td className="text-gray-600">{m.fromWarehouse?.name || m.supplier?.name || '—'}</td>
                    <td className="text-gray-600">{m.toWarehouse?.name || m.store?.name || m.customer?.name || '—'}</td>
                    <td className="font-mono text-[11px] text-gray-500">{m.referenceNo || '—'}</td>
                    <td className="text-gray-500 text-[11px]">{m.notes || m.reason || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
