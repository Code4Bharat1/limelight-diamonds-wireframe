'use client';
import { useState, useEffect } from 'react';
import {
  QrCode, Download, Printer, Plus, Trash2, CheckCircle2,
  Package, Boxes, Copy, Check, Eye, Search, Filter, RefreshCw,
  Sparkles, ExternalLink, ShieldCheck, Tag, Info, AlertTriangle,
  Building, User, Truck, Calendar, Layers, ArrowRight,
  ClipboardCheck, ChevronRight
} from 'lucide-react';
import { productsApi, storesApi, warehousesApi, customersApi } from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';
import { formatCurrency, formatDateTime, formatDate, cn } from '../../../lib/utils';
import Modal from '../../../components/ui/Modal';

// Helper to generate QR data URL client-side
async function createQRCode(dataString, options = {}) {
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(dataString, {
      width: options.width || 320,
      margin: options.margin || 2,
      color: {
        dark: options.darkColor || '#14381e', // Limelight dark green brand
        light: '#ffffff',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    });
  } catch (err) {
    console.error('QR creation failed:', err);
    throw err;
  }
}

export default function QRCodesPage() {
  const [activeTab, setActiveTab] = useState('multi_order'); // 'multi_order', 'single_product', 'catalog'

  // Master Data
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 1: Multi-Product Order QR State
  // ─────────────────────────────────────────────────────────────────────────────
  const [orderNumber, setOrderNumber] = useState('ORD-2026-9042');
  const [orderRecipient, setOrderRecipient] = useState('Limelight Diamonds Bandra Showroom');
  const [orderWarehouse, setOrderWarehouse] = useState('wh_1');
  const [orderPackageType, setOrderPackageType] = useState('Master Shipping Carton');
  const [orderNotes, setOrderNotes] = useState('Handle with care; velvet boxes stored in moisture-sealed barrier.');
  const [orderItems, setOrderItems] = useState([]);
  const [generatedOrderQR, setGeneratedOrderQR] = useState('');
  const [generatedOrderPayload, setGeneratedOrderPayload] = useState(null);
  const [generatingOrder, setGeneratingOrder] = useState(false);
  const [orderCopied, setOrderCopied] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 2: Single Product QR State
  // ─────────────────────────────────────────────────────────────────────────────
  const [singleProductId, setSingleProductId] = useState('');
  const [singleBatch, setSingleBatch] = useState('BATCH-2026-NOV');
  const [singleQuantity, setSingleQuantity] = useState(1);
  const [singleTagSerial, setSingleTagSerial] = useState('TAG-LLD-8901');
  const [singleQC, setSingleQC] = useState('QC PASSED - GRADE A');
  const [singleFormat, setSingleFormat] = useState('json'); // 'json' or 'sku'
  const [generatedSingleQR, setGeneratedSingleQR] = useState('');
  const [generatedSinglePayload, setGeneratedSinglePayload] = useState(null);
  const [generatingSingle, setGeneratingSingle] = useState(false);
  const [singleCopied, setSingleCopied] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 3: Catalog State
  // ─────────────────────────────────────────────────────────────────────────────
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Initial Data Fetch
  useEffect(() => {
    const loadMasterData = async () => {
      setLoadingInitial(true);
      try {
        const [prodRes, stRes, whRes, custRes] = await Promise.all([
          productsApi.getAll({ limit: 100 }),
          storesApi.getAll(),
          warehousesApi.getAll(),
          customersApi.getAll({ limit: 100 }),
        ]);

        const prodList = prodRes.data.data || [];
        const strList = stRes.data.data || [];
        const whList = whRes.data.data || [];
        const custList = custRes.data.data || [];

        setProducts(prodList);
        setStores(strList);
        setWarehouses(whList);
        setCustomers(custList);

        // Pre-populate Multi-Product Order with 4 products so user can immediately test 4 products
        if (prodList.length >= 4) {
          setOrderItems([
            { productId: prodList[0]._id, quantity: 20, batch: 'BATCH-2026-11' },
            { productId: prodList[1]._id, quantity: 5, batch: 'BATCH-2026-11' },
            { productId: prodList[2]._id, quantity: 10, batch: 'BATCH-2026-10' },
            { productId: prodList[3]._id, quantity: 4, batch: 'BATCH-2026-09' },
          ]);
        } else if (prodList.length > 0) {
          setOrderItems(prodList.slice(0, 4).map((p) => ({ productId: p._id, quantity: 5, batch: 'BATCH-2026-01' })));
        }

        if (prodList.length > 0) {
          setSingleProductId(prodList[0]._id);
        }
      } catch (err) {
        console.error('Failed to load master data:', err);
        toast('Failed to load products list', 'error');
      } finally {
        setLoadingInitial(false);
      }
    };
    loadMasterData();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Handlers for Multi-Product Order QR
  // ─────────────────────────────────────────────────────────────────────────────
  const handleAddOrderItem = () => {
    const defaultProdId = products[0]?._id || '';
    setOrderItems((prev) => [
      ...prev,
      { productId: defaultProdId, quantity: 5, batch: `BATCH-2026-${String(new Date().getMonth() + 1).padStart(2, '0')}` },
    ]);
  };

  const handleRemoveOrderItem = (index) => {
    if (orderItems.length <= 1) {
      toast('Order must contain at least 1 product', 'error');
      return;
    }
    setOrderItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateOrderItem = (index, field, value) => {
    setOrderItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const generateNewOrderNumber = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    setOrderNumber(`ORD-2026-${num}`);
  };

  const handleGenerateOrderQR = async (e) => {
    if (e) e.preventDefault();
    if (orderItems.length === 0) {
      toast('Please add at least one product to the order', 'error');
      return;
    }

    setGeneratingOrder(true);
    try {
      // Map item details with complete product specs
      const mappedProducts = orderItems.map((item) => {
        const prod = products.find((p) => p._id === item.productId) || {};
        return {
          productId: prod._id,
          sku: prod.sku || 'SKU-UNKNOWN',
          name: prod.name || 'Unknown Product',
          category: prod.category || 'Packaging',
          quantity: Number(item.quantity) || 1,
          unit: prod.unit || 'pcs',
          batch: item.batch || 'DEFAULT',
          price: prod.sellingPrice || prod.purchasePrice || 0,
        };
      });

      const selectedWh = warehouses.find((w) => w._id === orderWarehouse);

      const orderPayload = {
        manifest: 'LLD-ORDER-MANIFEST',
        version: '1.0',
        orderNumber: orderNumber || `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        recipient: orderRecipient || 'Store Consignment',
        originWarehouse: selectedWh?.name || 'Mumbai Central Warehouse',
        packageType: orderPackageType,
        totalItems: mappedProducts.length,
        totalQuantity: mappedProducts.reduce((sum, item) => sum + item.quantity, 0),
        notes: orderNotes,
        createdAt: new Date().toISOString(),
        items: mappedProducts,
      };

      const qrString = JSON.stringify(orderPayload);
      const dataUrl = await createQRCode(qrString, { width: 340 });

      setGeneratedOrderQR(dataUrl);
      setGeneratedOrderPayload(orderPayload);
      toast(`QR Generated for Order with ${mappedProducts.length} products!`, 'success');
    } catch (err) {
      toast('Failed to generate order QR code', 'error');
    } finally {
      setGeneratingOrder(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Handlers for Single Product QR
  // ─────────────────────────────────────────────────────────────────────────────
  const handleGenerateSingleQR = async (e) => {
    if (e) e.preventDefault();
    const prod = products.find((p) => p._id === singleProductId);
    if (!prod) {
      toast('Please select a product', 'error');
      return;
    }

    setGeneratingSingle(true);
    try {
      let qrPayloadString;
      let payloadObject;

      if (singleFormat === 'json') {
        payloadObject = {
          type: 'single_product',
          brand: 'Limelight Diamonds',
          sku: prod.sku,
          name: prod.name,
          category: prod.category,
          unit: prod.unit,
          quantity: Number(singleQuantity) || 1,
          batch: singleBatch,
          serial: singleTagSerial,
          qc: singleQC,
          price: prod.sellingPrice || prod.purchasePrice || 0,
          generatedAt: new Date().toISOString(),
        };
        qrPayloadString = JSON.stringify(payloadObject);
      } else {
        qrPayloadString = `LLD-SKU-${prod.sku.toUpperCase()}`;
        payloadObject = { sku: prod.sku, value: qrPayloadString };
      }

      const dataUrl = await createQRCode(qrPayloadString, { width: 320 });
      setGeneratedSingleQR(dataUrl);
      setGeneratedSinglePayload(payloadObject);
      toast(`QR Generated for ${prod.name}!`, 'success');
    } catch {
      toast('Failed to generate single product QR', 'error');
    } finally {
      setGeneratingSingle(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Handlers for Download, Print & Copy
  // ─────────────────────────────────────────────────────────────────────────────
  const handleDownloadImage = (dataUrl, filename) => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename || 'qrcode.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('QR Code downloaded', 'success');
  };

  const handleCopyText = (content, setCopiedState) => {
    const text = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content);
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
    toast('Copied to clipboard', 'info');
  };

  // Filtered products for catalog
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !catalogSearch ||
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const categories = ['all', ...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <QrCode className="w-6 h-6 text-brand-700" />
            QR Code Generator & Tag Hub
          </h1>
          <p className="text-gray-500 text-xs">
            Generate itemized multi-product order QR codes, single product labels, and printable packaging tags
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn-secondary btn-sm flex items-center gap-1.5 text-xs shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> Print Current View
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('multi_order')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'multi_order'
              ? 'bg-brand-700 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Multi-Product Order QR (Consignment)</span>
          <span className="badge bg-white/20 text-white text-[10px] py-0 px-1.5 ml-1">Order Manifest</span>
        </button>

        <button
          onClick={() => setActiveTab('single_product')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'single_product'
              ? 'bg-brand-700 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Single Product Custom QR</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'bg-brand-700 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Product QR Catalog ({products.length})</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          TAB 1: Multi-Product Order QR Generator
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'multi_order' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-brand-700" />
                    Multi-Product Order QR Configuration
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Select multiple products (e.g. 4 SKUs) to embed full details of each product into a single QR tag.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={generateNewOrderNumber}
                  className="btn-ghost btn-sm text-[11px] text-brand-700 flex items-center gap-1"
                  title="Generate new random order ID"
                >
                  <RefreshCw className="w-3 h-3" /> New Order #
                </button>
              </div>

              {/* Order Meta Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="form-group">
                  <label className="label text-xs font-bold text-gray-800">Order / Consignment No. *</label>
                  <input
                    type="text"
                    className="input text-xs font-mono font-bold text-gray-900"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label text-xs font-bold text-gray-800">Package / Container Type</label>
                  <select
                    className="input select text-xs"
                    value={orderPackageType}
                    onChange={(e) => setOrderPackageType(e.target.value)}
                  >
                    <option value="Master Shipping Carton">Master Shipping Carton</option>
                    <option value="Tamper-Evident Courier Pouch">Tamper-Evident Courier Pouch</option>
                    <option value="Pallet Box Crate">Pallet Box Crate</option>
                    <option value="Showroom Display Tray">Showroom Display Tray</option>
                    <option value="Direct Client Gift Box">Direct Client Gift Box</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label text-xs font-bold text-gray-800">Recipient Showroom / Client *</label>
                  <input
                    type="text"
                    className="input text-xs"
                    placeholder="e.g. Bandra Showroom, FC Road Store, or Client Name"
                    value={orderRecipient}
                    onChange={(e) => setOrderRecipient(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label text-xs font-bold text-gray-800">Fulfillment Warehouse</label>
                  <select
                    className="input select text-xs"
                    value={orderWarehouse}
                    onChange={(e) => setOrderWarehouse(e.target.value)}
                  >
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-Product List */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="label text-xs font-bold text-gray-900 mb-0">
                      Products Inside This Package ({orderItems.length} Selected)
                    </label>
                    <span className="text-[10px] text-gray-500">
                      Each product's SKU, name, quantity, and batch are encoded into the QR code
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOrderItem}
                    className="btn-primary btn-sm text-xs flex items-center gap-1 py-1 px-2.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Product
                  </button>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {orderItems.map((item, idx) => {
                    const prod = products.find((p) => p._id === item.productId);
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <select
                              className="input select text-xs bg-white font-medium"
                              value={item.productId}
                              onChange={(e) => handleUpdateOrderItem(idx, 'productId', e.target.value)}
                            >
                              {products.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.sku} — {p.name} ({p.unit})
                                </option>
                              ))}
                            </select>
                          </div>
                          {orderItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOrderItem(idx)}
                              className="text-gray-400 hover:text-red-600 p-1 rounded"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-gray-500 block">Quantity ({prod?.unit || 'pcs'})</span>
                            <input
                              type="number"
                              min="1"
                              className="input text-xs font-bold text-center bg-white"
                              value={item.quantity}
                              onChange={(e) => handleUpdateOrderItem(idx, 'quantity', e.target.value)}
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-500 block">Batch / Lot</span>
                            <input
                              type="text"
                              className="input text-xs font-mono bg-white"
                              value={item.batch}
                              placeholder="e.g. LOT-NV26"
                              onChange={(e) => handleUpdateOrderItem(idx, 'batch', e.target.value)}
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-500 block">Est. Unit Price</span>
                            <div className="input text-xs bg-gray-100 flex items-center text-gray-600 font-mono">
                              {formatCurrency(prod?.purchasePrice || prod?.sellingPrice || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Bar */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-600">Total Products in Box:</span>{' '}
                    <strong className="text-gray-900">{orderItems.length} SKUs</strong>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Units:</span>{' '}
                    <strong className="text-brand-800">
                      {orderItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)} units
                    </strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label text-xs font-bold text-gray-800">Handling & Staging Instructions</label>
                  <textarea
                    className="input h-14 resize-none text-xs"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Instructions for courier or showroom unboxing..."
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateOrderQR}
                  disabled={generatingOrder || orderItems.length === 0}
                  className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  {generatingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating Encoded QR...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Order Manifest QR Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Generated QR & Shipping Box Label Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {generatedOrderQR ? (
              <div className="space-y-4">
                {/* Visual Label Card */}
                <div className="card p-5 border-2 border-brand-700/30 bg-white shadow-xl space-y-4 print-box-label">
                  <div className="flex items-center justify-between border-b pb-3 border-gray-200">
                    <div>
                      <div className="text-[10px] font-bold text-brand-700 tracking-wider uppercase">
                        Limelight Diamonds ERP
                      </div>
                      <h4 className="font-mono text-base font-bold text-gray-900">
                        {generatedOrderPayload?.orderNumber}
                      </h4>
                    </div>
                    <span className="badge bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {generatedOrderPayload?.packageType}
                    </span>
                  </div>

                  {/* QR Image + Destination */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50/70 p-3 rounded-xl border border-gray-200">
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 shrink-0">
                      <img
                        src={generatedOrderQR}
                        alt="Order Manifest QR"
                        className="w-36 h-36 mx-auto object-contain"
                      />
                    </div>
                    <div className="space-y-1 text-xs text-center sm:text-left">
                      <div className="text-[10px] text-gray-400 font-semibold uppercase">Ship To Destination</div>
                      <div className="font-bold text-gray-900 text-sm leading-tight">
                        {generatedOrderPayload?.recipient}
                      </div>
                      <div className="text-[11px] text-gray-600">
                        Origin: <span className="font-medium">{generatedOrderPayload?.originWarehouse}</span>
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Generated: {formatDate(generatedOrderPayload?.createdAt)}
                      </div>
                      <div className="mt-1">
                        <span className="badge bg-brand-50 border border-brand-200 text-brand-800 text-[10px] font-bold">
                          {generatedOrderPayload?.totalItems} SKUs · {generatedOrderPayload?.totalQuantity} Units
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Itemized Manifest Table */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wide">
                        Package Manifest Details
                      </span>
                      <span className="text-[10px] text-gray-500">Scan-Verified</span>
                    </div>

                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="table text-xs">
                        <thead className="bg-gray-100 text-[10px] text-gray-600 uppercase">
                          <tr>
                            <th>Item Name & SKU</th>
                            <th className="text-right">Qty</th>
                            <th className="text-right">Batch</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-[11px]">
                          {generatedOrderPayload?.items?.map((it, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td>
                                <div className="font-bold text-gray-900 leading-tight">{it.name}</div>
                                <div className="font-mono text-[10px] text-brand-700">{it.sku}</div>
                              </td>
                              <td className="text-right font-bold text-gray-900">
                                {it.quantity} {it.unit}
                              </td>
                              <td className="text-right font-mono text-[10px] text-gray-500">
                                {it.batch || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {generatedOrderPayload?.notes && (
                    <div className="p-2 bg-yellow-50/70 border border-yellow-200 rounded-lg text-[10px] text-yellow-900">
                      <strong>Handling Note:</strong> {generatedOrderPayload.notes}
                    </div>
                  )}

                  {/* Action Buttons for this QR */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadImage(
                          generatedOrderQR,
                          `Limelight-Order-${generatedOrderPayload.orderNumber}-QR.png`
                        )
                      }
                      className="btn-secondary text-xs flex items-center justify-center gap-1.5 py-2"
                    >
                      <Download className="w-3.5 h-3.5" /> Download QR
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="btn-primary text-xs flex items-center justify-center gap-1.5 py-2 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Box Label
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyText(generatedOrderPayload, setOrderCopied)}
                    className="btn-ghost btn-sm text-[11px] text-gray-600 w-full flex items-center justify-center gap-1 border border-gray-200 py-2"
                  >
                    {orderCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{orderCopied ? 'Copied Payload!' : 'Copy Raw Manifest JSON'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center space-y-3 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[420px]">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-700">
                  <Boxes className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800">Order Package QR Ready to Generate</h4>
                  <p className="text-gray-500 text-xs max-w-xs mt-1">
                    Select your order's products on the left and click "Generate Order Manifest QR Code".
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateOrderQR}
                  className="btn-primary btn-sm text-xs mt-2"
                >
                  Generate 4-Product Order QR Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          TAB 2: Single Product QR Generator
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'single_product' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Config (7 cols) */}
          <div className="lg:col-span-7 card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-brand-700" />
                  Single Product QR Code Generator
                </h3>
                <p className="text-[11px] text-gray-500">
                  Select a particular product to generate a customized inventory QR tag with batch, pack quantity, and serial tags.
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerateSingleQR} className="space-y-4 text-xs">
              {/* Product Selector */}
              <div className="form-group">
                <label className="label text-xs font-bold text-gray-800">Select Product SKU *</label>
                <select
                  className="input select text-xs font-medium bg-white"
                  value={singleProductId}
                  onChange={(e) => setSingleProductId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Select a Product --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.sku} — {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Product Quick Info */}
              {(() => {
                const selectedProd = products.find((p) => p._id === singleProductId);
                if (!selectedProd) return null;
                return (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Category</span>
                      <span className="font-semibold text-gray-800">{selectedProd.category}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Unit Type</span>
                      <span className="font-semibold text-gray-800">{selectedProd.unit}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Unit Price</span>
                      <span className="font-semibold text-emerald-700">
                        {formatCurrency(selectedProd.sellingPrice || selectedProd.purchasePrice || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Warehouse Stock</span>
                      <span className="font-bold text-brand-800">{selectedProd.currentStock} {selectedProd.unit}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label text-xs font-bold text-gray-800">Batch / Lot Number</label>
                  <input
                    type="text"
                    className="input text-xs font-mono"
                    value={singleBatch}
                    onChange={(e) => setSingleBatch(e.target.value)}
                    placeholder="e.g. BATCH-2026-NOV"
                  />
                </div>

                <div className="form-group">
                  <label className="label text-xs font-bold text-gray-800">Pack Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="input text-xs font-bold"
                    value={singleQuantity}
                    onChange={(e) => setSingleQuantity(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="label text-xs font-bold text-gray-800">Serial Tag ID (Optional)</label>
                  <input
                    type="text"
                    className="input text-xs font-mono"
                    value={singleTagSerial}
                    onChange={(e) => setSingleTagSerial(e.target.value)}
                    placeholder="e.g. TAG-LLD-8901"
                  />
                </div>

                <div className="form-group">
                  <label className="label text-xs font-bold text-gray-800">Quality Inspection QC Stamp</label>
                  <select
                    className="input select text-xs"
                    value={singleQC}
                    onChange={(e) => setSingleQC(e.target.value)}
                  >
                    <option value="QC PASSED - GRADE A">QC PASSED - GRADE A</option>
                    <option value="QC VERIFIED - PACKED">QC VERIFIED - PACKED</option>
                    <option value="SPECIAL RUN - LIMITED">SPECIAL RUN - LIMITED</option>
                    <option value="UNINSPECTED RAW">UNINSPECTED RAW</option>
                  </select>
                </div>
              </div>

              {/* Data Format Selection */}
              <div className="form-group space-y-1">
                <label className="label text-xs font-bold text-gray-800">QR Code Data Payload Structure</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSingleFormat('json')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      singleFormat === 'json'
                        ? 'bg-brand-50 border-brand-500 font-bold text-brand-900 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-xs">Structured Product Manifest</div>
                    <div className="text-[10px] text-gray-500 font-normal">
                      Encodes SKU, Name, Batch, Pack Qty & QC info (JSON)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSingleFormat('sku')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      singleFormat === 'sku'
                        ? 'bg-brand-50 border-brand-500 font-bold text-brand-900 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-xs">Standard SKU Tag</div>
                    <div className="text-[10px] text-gray-500 font-normal">
                      Simple barcode SKU text (e.g. LLD-SKU-BOX-01)
                    </div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={generatingSingle || !singleProductId}
                className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                {generatingSingle ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating Product QR...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Generate Product QR Code</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Result (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {generatedSingleQR ? (
              <div className="card p-6 border-2 border-brand-700/20 bg-white shadow-xl space-y-4 print-single-label">
                <div className="text-center space-y-1 border-b pb-3 border-gray-100">
                  <div className="text-[10px] font-bold text-brand-700 tracking-wider uppercase">
                    Limelight Diamonds · Inventory Tag
                  </div>
                  {(() => {
                    const prod = products.find((p) => p._id === singleProductId);
                    return (
                      <>
                        <h4 className="font-bold text-gray-900 text-sm">{prod?.name}</h4>
                        <div className="font-mono text-xs font-bold text-brand-800 bg-brand-50 px-2 py-0.5 rounded-full inline-block">
                          {prod?.sku}
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-inner flex flex-col items-center justify-center">
                  <img
                    src={generatedSingleQR}
                    alt="Generated Product QR"
                    className="w-48 h-48 object-contain"
                  />
                  <div className="text-[10px] font-mono text-gray-400 mt-2">
                    {singleFormat === 'json' ? 'JSON Product Manifest Encoded' : `LLD-SKU-${products.find((p) => p._id === singleProductId)?.sku}`}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Batch / Lot</span>
                    <span className="font-mono font-bold text-gray-800">{singleBatch || 'Standard'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Pack Size</span>
                    <span className="font-bold text-gray-800">{singleQuantity} pcs</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">QC Status</span>
                    <span className="font-semibold text-emerald-700">{singleQC}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Tag Serial</span>
                    <span className="font-mono text-gray-700">{singleTagSerial}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadImage(
                        generatedSingleQR,
                        `QR-${products.find((p) => p._id === singleProductId)?.sku || 'Product'}.png`
                      )
                    }
                    className="btn-secondary text-xs flex items-center justify-center gap-1.5 py-2"
                  >
                    <Download className="w-3.5 h-3.5" /> Download QR
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn-primary text-xs flex items-center justify-center gap-1.5 py-2"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Tag
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyText(generatedSinglePayload, setSingleCopied)}
                  className="btn-ghost btn-sm text-[11px] text-gray-600 w-full flex items-center justify-center gap-1 border border-gray-200 py-1.5"
                >
                  {singleCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{singleCopied ? 'Copied Payload!' : 'Copy Encoded QR String'}</span>
                </button>
              </div>
            ) : (
              <div className="card p-8 text-center space-y-3 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[380px]">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-700">
                  <QrCode className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800">Product Tag Preview</h4>
                  <p className="text-gray-500 text-xs max-w-xs mt-1">
                    Select a product SKU and click "Generate Product QR Code" to preview and print.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          TAB 3: Product QR Catalog (Batch / Print All)
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Search and Category Filter */}
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search SKU or name..."
                  className="input pl-8 text-xs w-full"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
              </div>

              <select
                className="input select text-xs max-w-[160px]"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c === 'all' ? 'All Categories' : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 font-medium">
                Showing {filteredProducts.length} of {products.length} products
              </span>
              <button
                onClick={() => window.print()}
                className="btn-secondary btn-sm flex items-center gap-1.5 text-xs shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Print All Matching Labels
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 print-grid">
            {filteredProducts.map((p) => (
              <div
                key={p._id}
                className="card p-3.5 flex flex-col items-center gap-2 text-center hover:shadow-md transition-shadow print-card border border-gray-200"
              >
                <div className="p-1.5 bg-white rounded-xl border border-gray-100 shadow-sm">
                  {p.qrCodeImage ? (
                    <img src={p.qrCodeImage} alt={p.sku} className="w-28 h-28 object-contain" />
                  ) : (
                    <div className="w-28 h-28 bg-gray-50 rounded-lg flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="w-full min-w-0">
                  <div className="font-bold text-xs text-gray-900 truncate" title={p.name}>
                    {p.name}
                  </div>
                  <div className="font-mono text-[10px] text-brand-700 font-semibold">{p.sku}</div>
                  <div className="text-[10px] text-gray-400 capitalize">{p.category}</div>
                </div>

                <div className="flex items-center gap-1 w-full pt-1 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setSingleProductId(p._id);
                      setActiveTab('single_product');
                    }}
                    className="btn-ghost btn-sm text-[10px] text-brand-700 flex-1 py-1"
                    title="Customize this product's QR"
                  >
                    Customize
                  </button>
                  <button
                    onClick={() => handleDownloadImage(p.qrCodeImage, `QR-${p.sku}.png`)}
                    className="btn-ghost btn-icon p-1 text-gray-400 hover:text-gray-700"
                    title="Download PNG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Print Styling */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-box-label, .print-box-label * {
            visibility: visible;
          }
          .print-box-label {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            border: 2px solid #000 !important;
            padding: 20px !important;
            box-shadow: none !important;
          }
          .print-single-label, .print-single-label * {
            visibility: visible;
          }
          .print-single-label {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            box-shadow: none !important;
          }
          .print-grid, .print-grid * {
            visibility: visible;
          }
          .print-grid {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .print-card {
            page-break-inside: avoid;
            box-shadow: none !important;
            border: 1px solid #ccc !important;
          }
          header, nav, .bottom-nav, button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
