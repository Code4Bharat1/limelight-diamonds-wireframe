'use client';
import { useState, useEffect } from 'react';
import {
  Target, X, Calendar, Clock, AlertTriangle, User,
  Package, Building, UserCheck, Flame, CheckCircle, Store, Plus
} from 'lucide-react';
import Modal from '../ui/Modal';
import { productsApi, customersApi, warehousesApi, storesApi, usersApi, goalsApi } from '../../lib/api';
import useAuthStore from '../../lib/authStore';

export default function AssignGoalModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [destinationType, setDestinationType] = useState('store'); // 'store' or 'customer'
  const [title, setTitle] = useState('');
  const [storeId, setStoreId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [priority, setPriority] = useState('normal');
  const [scheduledDispatchDate, setScheduledDispatchDate] = useState(() => {
    const d = new Date(Date.now() + 6 * 3600000);
    return d.toISOString().slice(0, 16);
  });
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600000);
    return d.toISOString().slice(0, 16);
  });
  const [courierName, setCourierName] = useState('Sequel Secure Logistics');
  const [assignedWorkerIds, setAssignedWorkerIds] = useState([]);
  const [notes, setNotes] = useState('Handle with care; velvet boxes must remain moisture-free.');
  const [isPartialDispatch, setIsPartialDispatch] = useState(false);

  // Multi-SKU Items Array
  const [items, setItems] = useState([
    { productId: '', quantity: 20 },
  ]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      loadDependencies();
    }
  }, [isOpen]);

  const loadDependencies = async () => {
    setLoadingInitial(true);
    try {
      const [prodRes, storeRes, custRes, whRes, userRes] = await Promise.all([
        productsApi.getAll({ limit: 100 }),
        storesApi.getAll(),
        customersApi.getAll(),
        warehousesApi.getAll(),
        usersApi.getAll(),
      ]);
      const prods = prodRes.data.data || [];
      const strs = storeRes.data.data || [];
      const whs = whRes.data.data || [];
      setProducts(prods);
      setStores(strs);
      setCustomers(custRes.data.data || []);
      setWarehouses(whs);

      const staff = (userRes.data.data || []).filter((u) => ['warehouse_staff', 'worker'].includes(u.role));
      setWorkers(staff);
      if (staff.length > 0) setAssignedWorkerIds([staff[0]._id]);

      if (strs.length > 0) setStoreId(strs[0]._id);
      if (whs.length > 0) setWarehouseId(whs[0]._id);
      if (prods.length > 0) setItems([{ productId: prods[0]._id, quantity: 20 }]);
    } catch {
      setError('Failed to load dispatch dependencies.');
    } finally {
      setLoadingInitial(false);
    }
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, { productId: products[0]?._id || '', quantity: 10 }]);
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

  const handleWorkerToggle = (workerId) => {
    setAssignedWorkerIds((prev) =>
      prev.includes(workerId) ? prev.filter((id) => id !== workerId) : [...prev, workerId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (destinationType === 'store' && !storeId) {
      setError('Please select destination showroom store');
      return;
    }
    if (destinationType === 'customer' && !customerId) {
      setError('Please select destination corporate client');
      return;
    }
    if (!warehouseId) {
      setError('Please select fulfillment warehouse');
      return;
    }
    if (!items.length || items.some((i) => !i.productId || i.quantity < 1)) {
      setError('Please select valid products and positive quantities for all items');
      return;
    }

    setSubmitting(true);
    try {
      const targetStore = stores.find((s) => s._id === storeId);
      const targetCust = customers.find((c) => c._id === customerId);

      await goalsApi.create({
        title: title || `Stock Dispatch to ${destinationType === 'store' ? targetStore?.name : targetCust?.name}`,
        storeId: destinationType === 'store' ? storeId : null,
        customerId: destinationType === 'customer' ? customerId : null,
        warehouseId,
        items,
        priority,
        scheduledDispatchDate,
        expectedDeliveryDate,
        courierName,
        assignedWorkerIds,
        notes,
        isPartialDispatch,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create dispatch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Stock Transfer & Dispatch Order" size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto text-xs">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Destination Type Toggle (Feature 4: Destination Store Selection) */}
        <div>
          <label className="label text-xs font-bold text-gray-800 mb-1.5">Destination Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDestinationType('store')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                destinationType === 'store'
                  ? 'bg-brand-50 border-brand-700 text-brand-900 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Showroom Retail Store</span>
            </button>
            <button
              type="button"
              onClick={() => setDestinationType('customer')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                destinationType === 'customer'
                  ? 'bg-brand-50 border-brand-700 text-brand-900 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>VIP Client / Exhibition Lounge</span>
            </button>
          </div>
        </div>

        {/* Origin & Destination Selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="label text-xs">Origin Warehouse Facility *</label>
            <select
              className="input select text-xs"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              required
            >
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label text-xs">
              {destinationType === 'store' ? 'Destination Retail Store *' : 'Destination Client *'}
            </label>
            {destinationType === 'store' ? (
              <select
                className="input select text-xs"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                required
              >
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                ))}
              </select>
            ) : (
              <select
                className="input select text-xs"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              >
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} ({c.city})</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Multi-SKU Items Selection (Feature 2: Multi-SKU dispatch) */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <label className="label text-xs font-bold text-gray-800 mb-0">
              Dispatched Consignment Items (Multi-SKU)
            </label>
            <button
              type="button"
              onClick={addItemRow}
              className="text-xs text-brand-700 font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + Add Another SKU
            </button>
          </div>

          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <div className="flex-1">
                  <select
                    className="input select text-xs bg-white"
                    value={it.productId}
                    onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                    required
                  >
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.sku} — {p.name} (Avail: {p.warehouseTotalStock} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    min="1"
                    className="input text-xs bg-white text-center font-bold"
                    placeholder="Quantity"
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    required
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dispatch Scheduling & Dates (Feature 6 & 7: Planned date/time & Expected delivery) */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <div className="form-group">
            <label className="label text-xs">Planned Dispatch Date/Time *</label>
            <input
              type="datetime-local"
              className="input text-xs"
              value={scheduledDispatchDate}
              onChange={(e) => setScheduledDispatchDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="label text-xs">Expected Store Delivery Date/Time *</label>
            <input
              type="datetime-local"
              className="input text-xs"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Priority, Courier & Assigned Staff */}
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="label text-xs">Dispatch Priority</label>
            <select
              className="input select text-xs"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="normal">Normal Route</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent / Express Delivery</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label text-xs">Assigned Logistics Partner</label>
            <input
              className="input text-xs"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              placeholder="e.g. Sequel Secure, BVC Express"
            />
          </div>
        </div>

        {/* Staff Assignment */}
        <div className="form-group">
          <label className="label text-xs">Assigned Warehouse Staff for Picking & Packing</label>
          <div className="flex flex-wrap gap-2">
            {workers.map((w) => {
              const isChecked = assignedWorkerIds.includes(w._id);
              return (
                <button
                  key={w._id}
                  type="button"
                  onClick={() => handleWorkerToggle(w._id)}
                  className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                    isChecked ? 'bg-brand-50 border-brand-300 text-brand-900 font-bold' : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  <input type="checkbox" checked={isChecked} onChange={() => {}} className="accent-brand-700 w-3 h-3" />
                  <span>{w.name} ({w.designation})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Partial Dispatch Checkbox (Feature 14) */}
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            id="isPartial"
            checked={isPartialDispatch}
            onChange={(e) => setIsPartialDispatch(e.target.checked)}
            className="accent-brand-700 w-3.5 h-3.5"
          />
          <label htmlFor="isPartial" className="text-xs font-semibold text-gray-700 cursor-pointer">
            Allow Partial Dispatch (Split consignment if stock arrives in batches)
          </label>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="label text-xs">Dispatch Instructions & Handling Notes</label>
          <textarea
            className="input h-14 resize-none text-xs"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-3 border-t border-gray-100">
          <button type="button" className="btn-secondary flex-1 text-xs" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1 text-xs" disabled={submitting}>
            {submitting ? 'Creating Dispatch...' : 'Generate Dispatch Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
