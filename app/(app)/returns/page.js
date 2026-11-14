'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RotateCcw, Plus, Store, Check, X, CheckCircle, Package,
  AlertTriangle, Warehouse, UserCheck, Shield, Camera, UploadCloud,
  Image as ImageIcon, Trash2, Maximize2, ChevronLeft, ChevronRight,
  Info, Sparkles, Clock, ArrowRight, ExternalLink, FileText,
  CheckCircle2, XCircle, Eye, AlertCircle, Search, Filter,
  RefreshCw, Video, Focus, Zap
} from 'lucide-react';
import { returnsApi, storesApi, warehousesApi, productsApi, sampleReturnImages } from '../../../lib/api';
import Modal from '../../../components/ui/Modal';
import StatusBadge from '../../../components/ui/StatusBadge';
import { toast } from '../../../components/ui/Toast';
import { formatDateTime, cn } from '../../../lib/utils';
import useAuthStore from '../../../lib/authStore';

// ─── Quick Return Reason Presets (1-Click selection for Store Managers) ──────
const REASON_PRESETS = [
  {
    id: 'defective',
    title: 'Defective / Damaged Packaging',
    shortLabel: 'Defective / Damaged',
    icon: AlertTriangle,
    reasonText: 'Defective packaging returned for vendor warranty claim',
    defaultCondition: 'defective',
    color: 'border-red-200 bg-red-50/70 text-red-800 hover:bg-red-100',
    activeColor: 'border-red-600 bg-red-600 text-white shadow-sm ring-2 ring-red-400 ring-offset-1',
    requiresPhoto: true,
    suggestedSample: 'brokenHinge',
    suggestedNote: 'Hinge spring snapped / defective latch identified on delivery',
  },
  {
    id: 'surplus',
    title: 'Surplus Store Stock',
    shortLabel: 'Surplus Overstock',
    icon: Package,
    reasonText: 'Surplus store inventory returned to central warehouse',
    defaultCondition: 'good',
    color: 'border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100',
    activeColor: 'border-emerald-600 bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400 ring-offset-1',
    requiresPhoto: false,
    suggestedSample: 'surplusLot',
    suggestedNote: 'Excess stock returned after promotional showcase; factory seal intact',
  },
  {
    id: 'customer_exchange',
    title: 'Customer Packaging Exchange',
    shortLabel: 'Customer Exchange',
    icon: RotateCcw,
    reasonText: 'Customer return / packaging exchange',
    defaultCondition: 'good',
    color: 'border-blue-200 bg-blue-50/70 text-blue-800 hover:bg-blue-100',
    activeColor: 'border-blue-600 bg-blue-600 text-white shadow-sm ring-2 ring-blue-400 ring-offset-1',
    requiresPhoto: false,
    suggestedSample: 'surplusLot',
    suggestedNote: 'Customer upgraded to VIP gift hamper; standard jewelry box returned',
  },
  {
    id: 'vm_display',
    title: 'Seasonal VM Display End',
    shortLabel: 'VM Display Rotation',
    icon: Store,
    reasonText: 'Seasonal visual merchandising & display end',
    defaultCondition: 'needs_refurbish',
    color: 'border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100',
    activeColor: 'border-amber-600 bg-amber-600 text-white shadow-sm ring-2 ring-amber-400 ring-offset-1',
    requiresPhoto: true,
    suggestedSample: 'scratchedAcrylic',
    suggestedNote: 'Seasonal window display pedestals returned for warehouse polish and re-wrap',
  },
];

const DISPATCH_NOTE_CHIPS = [
  'Weekly Showroom Logistics Van',
  'Blue Dart Express Courier (Tracked)',
  'Securely Packed with Bubble Wrap',
  'Urgent QC Inspection Requested',
];

// ─── Streamlined Return Form for Store Manager ───────────────────────────────
function ReturnForm({ stores = [], warehouses = [], products = [], onSave, onClose }) {
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);

  // Live Camera states
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' or 'user'
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);

  // Store Manager auto-detection: locks to their store if assigned
  const isStoreMgr = user?.role === 'store_manager' || !!user?.assignedStore;
  const initialStoreId = user?.assignedStore?._id || stores[0]?._id || 'str_1';

  const [storeId, setStoreId] = useState(initialStoreId);
  const [allowStoreChange, setAllowStoreChange] = useState(!isStoreMgr);
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?._id || 'wh_1');

  // Reason & Condition presets
  const [selectedPresetId, setSelectedPresetId] = useState('defective');
  const [reason, setReason] = useState(REASON_PRESETS[0].reasonText);
  const [notes, setNotes] = useState('');

  // Items
  const [items, setItems] = useState([
    { productId: products[0]?._id || 'p_1', quantity: 5, condition: 'defective' },
  ]);

  // Images uploaded by Store Manager
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState(null);

  const selectedStore = stores.find((s) => s._id === storeId) || user?.assignedStore;
  const selectedWarehouse = warehouses.find((w) => w._id === warehouseId);
  const activePreset = REASON_PRESETS.find((p) => p.id === selectedPresetId);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Launch Live Camera
  const startLiveCamera = async (facing = cameraFacing) => {
    setIsLiveCameraOpen(true);
    setCameraError(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Live camera access error:', err);
      setCameraError('Webcam access unavailable or blocked. You can still use the Native Device Camera or click a simulated live photo.');
    }
  };

  // Close Live Camera
  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLiveCameraOpen(false);
    setCameraError(null);
  };

  // Switch between front/back camera
  const switchCameraFacing = () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(next);
    startLiveCamera(next);
  };

  // Direct Click Photo
  const handleClickPhoto = () => {
    if (!videoRef.current) return;
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const now = new Date();
    const timeFormatted = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(12, canvas.height - 38, 420, 26);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`Limelight QC: ${selectedStore?.name || 'Showroom'} · ${timeFormatted}`, 20, canvas.height - 20);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const newImg = {
      id: 'cam_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: `Photo_${now.getHours()}${now.getMinutes()}${now.getSeconds()}_Defect.jpg`,
      url: dataUrl,
      caption: `Direct camera snapshot at ${selectedStore?.name || 'Showroom'} (${timeFormatted})`,
      size: `${(dataUrl.length / 1024).toFixed(0)} KB`,
      uploadedAt: now.toISOString(),
    };

    setImages((prev) => [...prev, newImg]);
    setCapturedCount((c) => c + 1);
    toast('📸 Photo clicked and attached to return manifest!', 'success');
  };

  // Simulated Camera Snapshot fallback
  const handleSimulatedSnap = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);

    const now = new Date();
    const timeFormatted = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sampleKey = activePreset?.suggestedSample || 'brokenHinge';
    const sampleUrl = sampleReturnImages?.[sampleKey] || sampleReturnImages?.brokenHinge;

    const newImg = {
      id: 'cam_sim_' + Date.now(),
      name: `Direct_Camera_Photo_${now.getHours()}${now.getMinutes()}${now.getSeconds()}.png`,
      url: sampleUrl,
      caption: `Live camera snapshot (${timeFormatted}) - ${selectedStore?.name || 'Showroom'}`,
      size: 'Direct Camera Capture',
      uploadedAt: now.toISOString(),
    };

    setImages((prev) => [...prev, newImg]);
    setCapturedCount((c) => c + 1);
    toast('📸 Live camera photo clicked and attached!', 'success');
  };

  // Handle Preset Selection (1-Click!)
  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setReason(preset.reasonText);
    // Auto-update all item conditions to match the preset
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        condition: preset.defaultCondition,
      }))
    );
    if (!notes) {
      setNotes(preset.suggestedNote);
    }
  };

  // Add Item
  const addItemRow = () => {
    const nextProd = products.find((p) => !items.some((it) => it.productId === p._id)) || products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: nextProd?._id || '',
        quantity: 2,
        condition: activePreset?.defaultCondition || 'good',
      },
    ]);
  };

  const removeItemRow = (idx) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  // Adjust Quantity
  const adjustQty = (idx, delta) => {
    setItems((prev) => {
      const copy = [...prev];
      const newQty = Math.max(1, (Number(copy[idx].quantity) || 1) + delta);
      copy[idx] = { ...copy[idx], quantity: newQty };
      return copy;
    });
  };

  // Handle Real File Upload (Drag & Drop or File Browser)
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast('Please upload valid image files (JPG, PNG, WebP)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages((prev) => [
          ...prev,
          {
            id: 'img_' + Math.random().toString(36).slice(2, 9),
            name: file.name,
            url: event.target.result,
            caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            size: `${(file.size / 1024).toFixed(0)} KB`,
            uploadedAt: new Date().toISOString(),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    toast(`Attached ${files.length} photo(s) to return manifest`, 'success');
    e.target.value = '';
  };

  // Handle Quick Sample Photo Addition (Instant Wireframe Demonstration)
  const handleAddSample = (sampleKey, label, desc) => {
    const url = sampleReturnImages?.[sampleKey];
    if (!url) return;
    setImages((prev) => [
      ...prev,
      {
        id: 'img_sample_' + Math.random().toString(36).slice(2, 9),
        name: `${label.toLowerCase().replace(/\s+/g, '_')}.png`,
        url,
        caption: desc,
        size: 'Sample Inspection Proof',
        uploadedAt: new Date().toISOString(),
      },
    ]);
    toast(`Added sample photo: ${label}`, 'info');
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!items.length) {
      toast('Please add at least one product item to return', 'error');
      return;
    }

    // Photo check if defective
    const hasDefectiveItem = items.some((it) => it.condition === 'defective');
    if (hasDefectiveItem && images.length === 0) {
      const confirmNoPhoto = window.confirm(
        'Warehouse QC policy recommends attaching at least 1 photo for defective packaging claims. Do you still wish to submit without photos?'
      );
      if (!confirmNoPhoto) return;
    }

    setSaving(true);
    try {
      await returnsApi.create({
        storeId,
        warehouseId,
        reason,
        notes,
        items,
        images,
      });
      toast(`Store return logged with ${images.length} verification photo(s)!`, 'success');
      onSave();
    } catch (err) {
      console.error(err);
      toast('Failed to record return', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto text-xs">
      {/* ─── Top Banner: Store Manager Auto-Config ─── */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-brand-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">
                {selectedStore?.name || 'Limelight Showroom - Bandra'}
              </span>
              <span className="badge bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                {selectedStore?.code || 'STR-MUM-01'}
              </span>
            </div>
            <div className="text-gray-500 text-[11px] flex items-center gap-2 mt-0.5">
              <span>Manager: <strong className="text-gray-700">{user?.name || 'Pooja Verma'}</strong></span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">Origin Auto-Configured (Minimal Input Mode)</span>
            </div>
          </div>
        </div>

        {/* Change Store option for Super Admins */}
        {!allowStoreChange ? (
          <button
            type="button"
            onClick={() => setAllowStoreChange(true)}
            className="text-[11px] text-emerald-700 hover:text-emerald-900 underline font-semibold"
          >
            Switch Store
          </button>
        ) : (
          <div className="w-48">
            <select
              className="input select text-xs bg-white py-1"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            >
              {stores.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ─── 1. Receiving Warehouse Destination ─── */}
      <div className="space-y-1.5">
        <label className="label text-xs font-bold text-gray-700 flex items-center gap-1.5">
          <Warehouse className="w-3.5 h-3.5 text-gray-500" />
          Receiving Central Warehouse Hub *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {warehouses.map((w) => {
            const isSelected = warehouseId === w._id;
            return (
              <button
                type="button"
                key={w._id}
                onClick={() => setWarehouseId(w._id)}
                className={cn(
                  'p-2.5 rounded-xl border text-left transition-all flex items-center justify-between',
                  isSelected
                    ? 'border-brand-600 bg-brand-50/50 shadow-xs ring-1 ring-brand-500'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                )}
              >
                <div>
                  <div className="font-semibold text-gray-900 text-xs">{w.name}</div>
                  <div className="text-[10px] text-gray-500">{w.city || 'Central Hub'} · Primary Intake Facility</div>
                </div>
                {isSelected && (
                  <CheckCircle className="w-4 h-4 text-brand-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2. Quick Reason Selection (1-Click Chips) ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="label text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Return Reason Category (1-Tap Selection) *
          </label>
          <span className="text-[10px] text-gray-400">Auto-sets item conditions & QC tags</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {REASON_PRESETS.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedPresetId === p.id;
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2.5',
                  isSelected ? p.activeColor : p.color
                )}
              >
                <div className="flex items-center justify-between">
                  <Icon className={cn('w-4 h-4', isSelected ? 'text-white' : '')} />
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div>
                  <div className="font-bold text-xs leading-tight">{p.shortLabel}</div>
                  <div className={cn('text-[10px] mt-0.5', isSelected ? 'text-white/80' : 'text-gray-500')}>
                    {p.requiresPhoto ? 'Requires Photo Proof' : 'No Photo Required'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 3. Returned Items & Quantity ─── */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <label className="label text-xs font-bold text-gray-800 mb-0 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-gray-600" />
            Items to Return & Quantity
          </label>
          <button
            type="button"
            onClick={addItemRow}
            className="text-xs text-brand-700 font-bold hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Another SKU
          </button>
        </div>

        <div className="space-y-2">
          {items.map((it, idx) => {
            const currentProd = products.find((p) => p._id === it.productId);
            return (
              <div
                key={idx}
                className="bg-gray-50/80 p-3 rounded-xl border border-gray-200/90 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              >
                {/* Product Dropdown */}
                <div className="flex-1">
                  <select
                    className="input select text-xs bg-white font-medium text-gray-900"
                    value={it.productId}
                    onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                    required
                  >
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.sku} — {p.name} ({p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-1.5 justify-center">
                  <button
                    type="button"
                    onClick={() => adjustQty(idx, -1)}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center font-bold text-gray-700"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    className="w-16 h-7 input text-xs bg-white text-center font-bold py-0"
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => adjustQty(idx, 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center font-bold text-gray-700"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustQty(idx, 5)}
                    className="px-2 h-7 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-[10px] font-semibold text-gray-600"
                    title="Add 5 units"
                  >
                    +5
                  </button>
                </div>

                {/* Condition Selector */}
                <div className="w-36">
                  <select
                    className={cn(
                      'input select text-xs bg-white font-medium',
                      it.condition === 'defective' ? 'text-red-700 font-bold' : ''
                    )}
                    value={it.condition}
                    onChange={(e) => updateItem(idx, 'condition', e.target.value)}
                  >
                    <option value="good">✓ Good Condition</option>
                    <option value="defective">⚠ Defective / Damaged</option>
                    <option value="needs_refurbish">↺ Needs Polish / Wash</option>
                  </select>
                </div>

                {/* Remove Row */}
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="text-gray-400 hover:text-red-500 p-1 self-center"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 4. Image Upload & Photo Evidence Section (DIRECT PHOTO CLICK + CAMERA) ─── */}
      <div className="space-y-3 pt-3 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="label text-xs font-bold text-gray-900 mb-0 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-600" />
              Store Manager Photo Proof & Defect Documentation *
            </label>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Directly click photos of defects with your live camera or attach existing inspection proofs for warehouse QC intake.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isLiveCameraOpen ? (
              <button
                type="button"
                onClick={() => startLiveCamera()}
                className="btn-success btn-sm text-xs px-3 py-1.5 flex items-center gap-1.5 font-bold shadow-xs hover:scale-102 transition-transform"
              >
                <Camera className="w-3.5 h-3.5" /> Directly Click Photo
              </button>
            ) : (
              <button
                type="button"
                onClick={stopLiveCamera}
                className="btn-secondary btn-sm text-xs px-3 py-1.5 flex items-center gap-1 font-semibold text-gray-700"
              >
                <X className="w-3.5 h-3.5" /> Close Camera
              </button>
            )}

            <span className={cn(
              'badge text-[11px] font-bold',
              images.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            )}>
              📸 {images.length} {images.length === 1 ? 'Photo' : 'Photos'} Attached
            </span>
          </div>
        </div>

        {/* Hidden native inputs */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          multiple
          className="hidden"
        />
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          capture="environment"
          className="hidden"
        />

        {/* ─── LIVE CAMERA VIEWFINDER (When Camera is Opened) ─── */}
        {isLiveCameraOpen ? (
          <div className="relative bg-gray-950 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl space-y-0">
            {/* Top Camera Controls Overlay */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between text-white text-[11px] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-bold tracking-wider text-emerald-400">LIVE CAMERA READY</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-300">Point at damaged box or defect</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={switchCameraFacing}
                  className="px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center gap-1 text-[10px] font-semibold"
                  title="Switch Front/Back Camera"
                >
                  <RefreshCw className="w-3 h-3" /> Flip
                </button>
                <button
                  type="button"
                  onClick={stopLiveCamera}
                  className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white"
                  title="Close Camera"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Flash Effect on Capture */}
            <div
              className={cn(
                'absolute inset-0 z-30 bg-white pointer-events-none transition-opacity duration-200',
                isFlashing ? 'opacity-90' : 'opacity-0'
              )}
            />

            {/* Video Viewport / Viewfinder */}
            <div className="relative h-72 sm:h-80 w-full flex items-center justify-center bg-gray-950 overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Reticle / Corner Targeting Guides */}
              <div className="absolute inset-8 pointer-events-none border border-white/20 rounded-xl">
                {/* Top-Left */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm shadow-sm" />
                {/* Top-Right */}
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm shadow-sm" />
                {/* Bottom-Left */}
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm shadow-sm" />
                {/* Bottom-Right */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-sm shadow-sm" />
                {/* Center Crosshairs */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40 flex items-center justify-center">
                  <Focus className="w-8 h-8 text-emerald-400/70" />
                </div>
              </div>

              {/* Camera Error / Fallback Card if device has no webcam or permission blocked */}
              {cameraError && (
                <div className="absolute inset-4 z-20 bg-gray-900/95 backdrop-blur-md rounded-xl p-5 text-white flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Webcam Permission or Device Unavailable</div>
                    <div className="text-[11px] text-gray-300 mt-1 max-w-sm">
                      Your browser or device blocked webcam access. You can click photos directly via your phone camera or simulate a live snapshot:
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 font-bold"
                    >
                      <Camera className="w-3.5 h-3.5" /> Launch Device Camera
                    </button>
                    <button
                      type="button"
                      onClick={handleSimulatedSnap}
                      className="btn-success text-xs px-3 py-1.5 flex items-center gap-1.5 font-bold"
                    >
                      <Zap className="w-3.5 h-3.5" /> Click Simulated Defect Photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Shutter Action Bar */}
            <div className="p-3 bg-gray-900 border-t border-gray-800 flex items-center justify-between text-white">
              <div className="text-[11px] text-gray-400">
                {capturedCount > 0 ? (
                  <span className="text-emerald-400 font-semibold">
                    ✓ {capturedCount} photo(s) clicked in this session
                  </span>
                ) : (
                  'Center defect inside frame and press Click Photo'
                )}
              </div>

              {/* Big Shutter Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClickPhoto}
                  className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/50 hover:scale-105 active:scale-95 transition-all ring-4 ring-emerald-500/30"
                >
                  <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                  <span>📸 Click Photo Now</span>
                </button>
                <button
                  type="button"
                  onClick={stopLiveCamera}
                  className="btn-secondary btn-sm text-xs bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ─── TWO DIRECT ACTION CARDS (Camera Click vs File Upload) ─── */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card 1: Direct Click Photo */}
            <div
              onClick={() => startLiveCamera()}
              className="border-2 border-emerald-300 hover:border-emerald-500 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <span>Directly Click Photos</span>
                    <span className="badge bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Live Shutter
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                    Open webcam or phone camera to directly frame and click photos of damaged items.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startLiveCamera();
                  }}
                  className="btn-success btn-sm text-xs px-3 py-1 flex items-center gap-1.5 font-bold shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" /> Open Camera Viewfinder
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="text-[11px] text-emerald-700 hover:underline font-semibold"
                >
                  Mobile Camera
                </button>
              </div>
            </div>

            {/* Card 2: Upload Files / Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-brand-500 bg-gray-50/60 hover:bg-brand-50/30 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 text-brand-700 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-xs">
                    Upload from Files or Gallery
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                    Browse files or drag & drop existing photo files from your desktop / device.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200/80">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="btn-secondary btn-sm text-xs px-3 py-1 font-semibold"
                >
                  Browse Computer
                </button>
                <span className="text-[10px] text-gray-400">JPG, PNG, WebP</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Sample Photos for Wireframe Demonstration */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Instant Sample Photos (1-Tap Wireframe Proofs):
            </div>
            <span className="text-[10px] text-gray-400">Click to instantly attach</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleAddSample('brokenHinge', 'Broken Hinge', 'Misaligned spring hinge on luxury ring box (PKG-BX-RNG-01)')}
              className="px-2.5 py-1 rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-50 text-[11px] font-medium flex items-center gap-1.5 shadow-xs"
            >
              <span>🔴</span> Broken Hinge Sample
            </button>
            <button
              type="button"
              onClick={() => handleAddSample('scratchedAcrylic', 'Scratched Display', 'Deep surface scratches on acrylic window stand (PKG-DSP-05)')}
              className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 text-[11px] font-medium flex items-center gap-1.5 shadow-xs"
            >
              <span>🟡</span> Scratched Acrylic Sample
            </button>
            <button
              type="button"
              onClick={() => handleAddSample('crushedCarton', 'Crushed Carton', 'Carton corner crushed during logistics transit')}
              className="px-2.5 py-1 rounded-lg bg-white border border-orange-200 text-orange-700 hover:bg-orange-50 text-[11px] font-medium flex items-center gap-1.5 shadow-xs"
            >
              <span>📦</span> Crushed Carton Sample
            </button>
            <button
              type="button"
              onClick={() => handleAddSample('surplusLot', 'Surplus Stock', 'Pristine factory-sealed packaging lot ready for warehouse restock')}
              className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[11px] font-medium flex items-center gap-1.5 shadow-xs"
            >
              <span>🟢</span> Surplus Lot Sample
            </button>
          </div>
        </div>

        {/* Uploaded Thumbnails Preview Grid */}
        {images.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-gray-700">
              Attached Return Proofs ({images.length}):
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow"
                >
                  <div
                    className="h-24 bg-gray-900 cursor-pointer overflow-hidden flex items-center justify-center"
                    onClick={() => setPreviewModalImg(img)}
                  >
                    <img
                      src={img.url}
                      alt={img.caption || img.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-2">
                    <div className="font-semibold text-gray-900 truncate text-[11px]" title={img.name}>
                      {img.name}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate" title={img.caption}>
                      {img.caption || 'Inspection photo'}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 shadow-md transition-opacity"
                    title="Delete image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Zoom hint */}
                  <button
                    type="button"
                    onClick={() => setPreviewModalImg(img)}
                    className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Zoom in"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── 5. Dispatch Notes with Quick Chips ─── */}
      <div className="space-y-1.5 pt-2 border-t border-gray-100">
        <label className="label text-xs font-bold text-gray-700 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-gray-500" />
          Dispatch & Courier Notes (Optional)
        </label>
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {DISPATCH_NOTE_CHIPS.map((chip, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setNotes((prev) => (prev ? `${prev} · ${chip}` : chip))}
              className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              + {chip}
            </button>
          ))}
        </div>
        <textarea
          className="input h-14 resize-none text-xs"
          placeholder="e.g. Transferred via weekly showroom logistics van with tamper-evident seal."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* ─── Submit Actions ─── */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          className="btn-secondary text-xs px-4 py-2"
          onClick={() => {
            stopLiveCamera();
            onClose();
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5 font-bold shadow-md"
          disabled={saving}
        >
          {saving ? (
            'Submitting...'
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Register Return ({images.length} {images.length === 1 ? 'Photo' : 'Photos'})
            </>
          )}
        </button>
      </div>

      {/* Photo Lightbox in Form */}
      {previewModalImg && (
        <Modal
          isOpen={!!previewModalImg}
          onClose={() => setPreviewModalImg(null)}
          title={`Photo Inspection: ${previewModalImg.name}`}
          size="lg"
        >
          <div className="p-4 space-y-3">
            <div className="max-h-[60vh] flex items-center justify-center bg-gray-950 rounded-xl overflow-hidden p-2">
              <img
                src={previewModalImg.url}
                alt={previewModalImg.name}
                className="max-h-[55vh] object-contain rounded-lg"
              />
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 text-xs">{previewModalImg.name}</div>
                <div className="text-[11px] text-gray-500">{previewModalImg.caption}</div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalImg(null)}
                className="btn-secondary btn-sm text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </form>
  );
}

// ─── Inspection & QC Details Modal (For Warehouse / Admins) ───────────────────
function ReturnInspectionModal({ returnData, onApproveRestock, onApproveDamage, onReject, onClose }) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('Insufficient photo/evidence provided for claim');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!returnData) return null;
  const images = returnData.images || [];
  const currentImg = images[activeImgIndex];

  return (
    <div className="p-6 space-y-5 text-xs max-h-[85vh] overflow-y-auto">
      {/* Return Header Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-gray-900 text-sm">{returnData.returnNumber}</span>
            <StatusBadge status={returnData.status} />
          </div>
          <div className="text-gray-500 text-[11px] mt-1">
            Logged on: {formatDateTime(returnData.createdAt)} by{' '}
            <strong className="text-gray-800">{returnData.returnedBy?.name || 'Store Manager'}</strong>
          </div>
        </div>

        <div className="text-right">
          <div className="text-gray-900 font-bold">{returnData.store?.name}</div>
          <div className="text-gray-500 text-[11px]">→ Destination: {returnData.warehouse?.name}</div>
        </div>
      </div>

      {/* ─── Store Manager Uploaded Photo Gallery ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="label text-xs font-bold text-gray-900 mb-0 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-emerald-600" />
            Store Manager Evidence Photos ({images.length})
          </label>
          {images.length > 0 && (
            <span className="text-[11px] text-gray-500">
              Showing photo {activeImgIndex + 1} of {images.length}
            </span>
          )}
        </div>

        {images.length > 0 ? (
          <div className="space-y-2">
            {/* Main Featured Photo */}
            <div className="relative h-64 sm:h-72 bg-gray-950 rounded-2xl overflow-hidden flex items-center justify-center p-2 border border-gray-800 shadow-inner">
              <img
                src={currentImg.url}
                alt={currentImg.caption || 'Return proof'}
                className="max-h-full max-w-full object-contain rounded-lg"
              />

              {/* Prev / Next Controls if multiple */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center shadow-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImgIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center shadow-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Caption Overlay */}
              <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-xs text-white p-2.5 rounded-xl text-[11px] flex items-center justify-between">
                <div>
                  <div className="font-bold">{currentImg.name || 'Defect Evidence'}</div>
                  <div className="text-gray-300 text-[10px]">{currentImg.caption}</div>
                </div>
                <span className="badge bg-white/20 text-white text-[10px]">
                  Verified Photo
                </span>
              </div>
            </div>

            {/* Thumbnail Navigation Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    type="button"
                    key={img.id || idx}
                    onClick={() => setActiveImgIndex(idx)}
                    className={cn(
                      'w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all',
                      activeImgIndex === idx
                        ? 'border-emerald-600 ring-2 ring-emerald-400'
                        : 'border-gray-200 opacity-60 hover:opacity-100'
                    )}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center text-gray-400">
            <Camera className="w-6 h-6 mx-auto mb-1 text-gray-300" />
            No photos were uploaded with this return.
          </div>
        )}
      </div>

      {/* ─── Returned Items Table ─── */}
      <div className="space-y-2">
        <label className="label text-xs font-bold text-gray-900 mb-0">Returned Line Items</label>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
              <tr>
                <th className="p-2.5">Product SKU & Name</th>
                <th className="p-2.5 text-center">Return Qty</th>
                <th className="p-2.5">Reported Condition</th>
                <th className="p-2.5">Reason Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {returnData.items?.map((it, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="p-2.5 font-medium text-gray-900">
                    <div>{it.product?.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{it.product?.sku}</div>
                  </td>
                  <td className="p-2.5 text-center font-bold text-gray-800">
                    {it.quantity} {it.product?.unit || 'pcs'}
                  </td>
                  <td className="p-2.5">
                    <span className={cn(
                      'badge text-[10px] font-bold capitalize',
                      it.condition === 'defective' ? 'bg-red-100 text-red-800' :
                      it.condition === 'needs_refurbish' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    )}>
                      {it.condition || 'good'}
                    </span>
                  </td>
                  <td className="p-2.5 text-gray-600 text-[11px]">{it.reason || returnData.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courier Notes */}
      {returnData.notes && (
        <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3">
          <div className="text-[11px] font-bold text-blue-900">Store Manager Dispatch Remarks:</div>
          <div className="text-blue-800 text-xs mt-0.5">{returnData.notes}</div>
        </div>
      )}

      {/* ─── Warehouse QC Actions ─── */}
      {returnData.status === 'pending_inspection' ? (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          {!showRejectForm ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-gray-500 text-[11px]">
                Inspect items physically against photos before approving disposition.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onApproveRestock(returnData._id)}
                  className="btn-success text-xs px-3.5 py-2 flex items-center gap-1.5 font-bold"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve Restock (+Stock)
                </button>
                <button
                  type="button"
                  onClick={() => onApproveDamage(returnData._id)}
                  className="btn-danger text-xs px-3.5 py-2 flex items-center gap-1.5 font-bold"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Route to Damage Claim
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  className="btn-secondary text-xs px-3 py-2 text-gray-700 hover:text-red-700"
                >
                  Reject Return
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3 animate-fade-in">
              <div className="font-bold text-red-900 text-xs flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-600" />
                Reject Store Return Claim (Explain Reason)
              </div>
              <select
                className="input select text-xs bg-white"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              >
                <option value="Insufficient photo/evidence provided for claim">Insufficient photo/evidence provided for claim</option>
                <option value="Damage attributed to store mishandling, not transit or vendor fault">Damage attributed to store mishandling, not transit or vendor fault</option>
                <option value="Physical item not received at warehouse loading dock">Physical item not received at warehouse loading dock</option>
                <option value="Item packaging altered or cannot be identified">Item packaging altered or cannot be identified</option>
              </select>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="btn-secondary text-xs"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => onReject(returnData._id, rejectReason)}
                  className="btn-danger text-xs font-bold"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Inspection settled by <strong className="font-bold">{returnData.reviewedBy?.name || 'Warehouse Staff'}</strong></span>
          </div>
          <span className="text-[11px] text-emerald-700">{formatDateTime(returnData.reviewedAt || returnData.createdAt)}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Returns Management Page ─────────────────────────────────────────────
export default function ReturnsPage() {
  const { user } = useAuthStore();
  const [returnsList, setReturnsList] = useState([]);
  const [stores, setStores] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [inspectModalData, setInspectModalData] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Filters
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'pending', 'restock', 'damage', 'rejected'
  const [searchTerm, setSearchTerm] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const [retRes, stRes, whRes, prodRes] = await Promise.all([
        returnsApi.getAll(),
        storesApi.getAll(),
        warehousesApi.getAll(),
        productsApi.getAll({ limit: 100 }),
      ]);
      setReturnsList(retRes.data.data || []);
      setStores(stRes.data.data || []);
      setWarehouses(whRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const handleApproveRestock = async (id) => {
    try {
      await returnsApi.inspectAndApprove(id, {
        status: 'approved_restock',
        comment: 'Items inspected and restocked into central warehouse inventory',
      });
      toast('Return approved! Stock credited back to central warehouse.', 'success');
      setInspectModalData(null);
      fetchReturns();
    } catch {
      toast('Failed to approve return', 'error');
    }
  };

  const handleApproveDamage = async (id) => {
    try {
      await returnsApi.inspectAndApprove(id, {
        status: 'approved_damage',
        comment: 'Items confirmed defective; routed to damage claims',
      });
      toast('Items routed to damage write-off & vendor claims.', 'info');
      setInspectModalData(null);
      fetchReturns();
    } catch {
      toast('Failed to update', 'error');
    }
  };

  const handleRejectReturn = async (id, reason) => {
    try {
      await returnsApi.reject(id, { reason });
      toast('Store return rejected.', 'info');
      setInspectModalData(null);
      fetchReturns();
    } catch {
      toast('Failed to reject return', 'error');
    }
  };

  // Filtered List
  const filteredReturns = returnsList.filter((r) => {
    if (filterTab === 'pending' && r.status !== 'pending_inspection') return false;
    if (filterTab === 'restock' && r.status !== 'approved_restock') return false;
    if (filterTab === 'damage' && r.status !== 'approved_damage') return false;
    if (filterTab === 'rejected' && r.status !== 'rejected') return false;

    if (storeFilter !== 'all' && r.store?._id !== storeFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNo = r.returnNumber?.toLowerCase().includes(q);
      const matchStore = r.store?.name?.toLowerCase().includes(q);
      const matchSku = r.items?.some((it) => it.product?.sku?.toLowerCase().includes(q) || it.product?.name?.toLowerCase().includes(q));
      if (!matchNo && !matchStore && !matchSku) return false;
    }

    return true;
  });

  const pendingCount = returnsList.filter((r) => r.status === 'pending_inspection').length;
  const restockCount = returnsList.filter((r) => r.status === 'approved_restock').length;
  const damageCount = returnsList.filter((r) => r.status === 'approved_damage').length;
  const rejectedCount = returnsList.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ─── Page Header ─── */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">Store Returns & Defect Claims Hub</h1>
            <span className="badge bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Photo Evidence Enabled
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-0.5">
            Streamlined store return workflows back to central warehouse with image evidence verification & inspection
          </p>
        </div>

        <button
          className="btn-primary btn-sm flex items-center gap-1.5 text-xs font-bold shadow-md"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" /> Initiate Store Return
        </button>
      </div>

      {/* ─── Store Manager Guidance Card ─── */}
      <div className="bg-gradient-to-r from-brand-900 via-teal-900 to-gray-900 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Store Manager 1-Tap Workflow (Minimum Inputs)
          </div>
          <div className="text-sm font-semibold">
            Return damaged packaging, surplus stock, or exchange boxes in seconds.
          </div>
          <p className="text-white/70 text-xs leading-relaxed">
            Your store origin is automatically detected. Select a 1-tap reason preset, specify item quantity, snap/upload photos of defects, and submit for instant Central Warehouse QC intake.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn bg-white text-gray-900 hover:bg-gray-100 text-xs font-bold px-4 py-2.5 rounded-xl shrink-0 flex items-center gap-2 shadow-md"
        >
          <Camera className="w-4 h-4 text-emerald-600" />
          Quick Return with Photos
        </button>
      </div>

      {/* ─── Status Filter Tabs ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterTab('all')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
              filterTab === 'all'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            All Returns ({returnsList.length})
          </button>
          <button
            onClick={() => setFilterTab('pending')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5',
              filterTab === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending QC Inspection ({pendingCount})
          </button>
          <button
            onClick={() => setFilterTab('restock')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5',
              filterTab === 'restock'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
            )}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Approved Restock ({restockCount})
          </button>
          <button
            onClick={() => setFilterTab('damage')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5',
              filterTab === 'damage'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-800 bg-red-50 hover:bg-red-100'
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            To Damage Claims ({damageCount})
          </button>
          {rejectedCount > 0 && (
            <button
              onClick={() => setFilterTab('rejected')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                filterTab === 'rejected'
                  ? 'bg-gray-700 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              Rejected ({rejectedCount})
            </button>
          )}
        </div>

        {/* Search & Store Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search return # or SKU..."
              className="input pl-8 py-1.5 text-xs w-full bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input select text-xs py-1.5 bg-white w-44"
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
          >
            <option value="all">All Retail Stores</option>
            {stores.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Returns Table ─── */}
      <div className="table-wrapper card p-0">
        <table className="table text-xs">
          <thead>
            <tr>
              <th>Return No.</th>
              <th>Originating Store</th>
              <th>Destination Hub</th>
              <th>Returned Items</th>
              <th>Condition</th>
              <th>Photo Evidence</th>
              <th>QC Status</th>
              <th>Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filteredReturns.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">
                  <RotateCcw className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  No store returns matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredReturns.map((r) => {
                const images = r.images || [];
                return (
                  <tr key={r._id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Return Number */}
                    <td>
                      <div className="font-mono font-bold text-gray-900">{r.returnNumber}</div>
                      <div className="text-[10px] text-gray-400">By {r.returnedBy?.name || 'Store Staff'}</div>
                    </td>

                    {/* Originating Store */}
                    <td>
                      <div className="font-semibold text-gray-900">{r.store?.name}</div>
                      <div className="text-[10px] text-gray-400">{r.store?.code}</div>
                    </td>

                    {/* Destination Hub */}
                    <td className="text-gray-600 font-medium">{r.warehouse?.name}</td>

                    {/* Items */}
                    <td>
                      <div className="space-y-0.5">
                        {r.items?.map((it, idx) => (
                          <div key={idx} className="font-medium text-gray-800">
                            <strong>{it.quantity}×</strong> {it.product?.name}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Condition */}
                    <td>
                      <span className={cn(
                        'badge text-[10px] capitalize font-bold',
                        r.items?.[0]?.condition === 'defective'
                          ? 'bg-red-100 text-red-800'
                          : r.items?.[0]?.condition === 'needs_refurbish'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      )}>
                        {r.items?.[0]?.condition || 'good'}
                      </span>
                    </td>

                    {/* Photo Evidence Column */}
                    <td>
                      {images.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div
                            onClick={() => setLightboxImg(images[0])}
                            className="relative w-9 h-9 rounded-lg overflow-hidden border border-gray-300 hover:border-emerald-500 cursor-pointer shadow-2xs group shrink-0"
                            title="Click to view photo"
                          >
                            <img
                              src={images[0].url}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setInspectModalData(r)}
                            className="text-left"
                          >
                            <span className="badge bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold cursor-pointer flex items-center gap-1">
                              <Camera className="w-3 h-3" />
                              {images.length} {images.length === 1 ? 'Photo' : 'Photos'}
                            </span>
                          </button>
                        </div>
                      ) : (
                        <span className="badge bg-gray-100 text-gray-400 text-[10px]">
                          No Photo
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={r.status} />
                    </td>

                    {/* Date */}
                    <td className="text-gray-400 text-[11px] whitespace-nowrap">
                      {formatDateTime(r.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectModalData(r)}
                          className="btn-secondary btn-sm py-1 px-2.5 text-xs flex items-center gap-1 font-semibold"
                          title="Inspect Photos and Details"
                        >
                          <Eye className="w-3 h-3 text-gray-500" />
                          {r.status === 'pending_inspection' ? 'Inspect & QC' : 'Details'}
                        </button>

                        {r.status === 'pending_inspection' && (
                          <>
                            <button
                              onClick={() => handleApproveRestock(r._id)}
                              className="btn-success btn-sm py-1 px-2 text-xs flex items-center gap-1"
                              title="Direct Approve Restock"
                            >
                              <Check className="w-3 h-3" /> Restock
                            </button>
                            <button
                              onClick={() => handleApproveDamage(r._id)}
                              className="btn-danger btn-sm py-1 px-2 text-xs flex items-center gap-1"
                              title="Direct Mark Damaged"
                            >
                              <AlertTriangle className="w-3 h-3" /> Damage
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Initiate Return Modal ─── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Initiate Store Return to Central Warehouse"
        size="xl"
      >
        <ReturnForm
          stores={stores}
          warehouses={warehouses}
          products={products}
          onSave={() => {
            setModalOpen(false);
            fetchReturns();
          }}
          onClose={() => setModalOpen(false)}
        />
      </Modal>

      {/* ─── Warehouse Inspection & QC Modal ─── */}
      {inspectModalData && (
        <Modal
          isOpen={!!inspectModalData}
          onClose={() => setInspectModalData(null)}
          title={`QC Inspection: Return ${inspectModalData.returnNumber}`}
          size="xl"
        >
          <ReturnInspectionModal
            returnData={inspectModalData}
            onApproveRestock={handleApproveRestock}
            onApproveDamage={handleApproveDamage}
            onReject={handleRejectReturn}
            onClose={() => setInspectModalData(null)}
          />
        </Modal>
      )}

      {/* ─── Photo Lightbox Viewer ─── */}
      {lightboxImg && (
        <Modal
          isOpen={!!lightboxImg}
          onClose={() => setLightboxImg(null)}
          title={`Photo Proof: ${lightboxImg.name || 'Return Defect'}`}
          size="lg"
        >
          <div className="p-4 space-y-3">
            <div className="max-h-[65vh] flex items-center justify-center bg-gray-950 rounded-xl overflow-hidden p-2">
              <img
                src={lightboxImg.url}
                alt={lightboxImg.name}
                className="max-h-[60vh] object-contain rounded-lg"
              />
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 text-xs">{lightboxImg.name}</div>
                <div className="text-[11px] text-gray-500">{lightboxImg.caption}</div>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="btn-secondary btn-sm text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}