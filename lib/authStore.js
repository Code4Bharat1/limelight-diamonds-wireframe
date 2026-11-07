'use client';
import { create } from 'zustand';
import { authApi } from './api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('de_token');
      const userStr = localStorage.getItem('de_user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    }
  },

  login: async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token, ...user } = res.data.data;
    localStorage.setItem('de_token', token);
    localStorage.setItem('de_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
    return user;
  },

  logout: () => {
    localStorage.removeItem('de_token');
    localStorage.removeItem('de_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (updates) => {
    const user = { ...get().user, ...updates };
    localStorage.setItem('de_user', JSON.stringify(user));
    set({ user });
  },

  // Role checks for the 5 client-specified roles:
  // 1. Super Admin
  // 2. Warehouse Manager
  // 3. Warehouse Staff
  // 4. Store Manager
  // 5. Inventory Manager
  isSuperAdmin: () => ['super_admin', 'owner_admin'].includes(get().user?.role),
  isWarehouseManager: () => ['super_admin', 'owner_admin', 'warehouse_manager'].includes(get().user?.role),
  isWarehouseStaff: () => ['warehouse_staff', 'worker'].includes(get().user?.role),
  isStoreManager: () => get().user?.role === 'store_manager',
  isInventoryManager: () => ['super_admin', 'owner_admin', 'inventory_manager'].includes(get().user?.role),

  // Backwards compatibility helpers
  isAdmin: () => ['super_admin', 'owner_admin'].includes(get().user?.role),
  isManager: () => ['super_admin', 'owner_admin', 'warehouse_manager', 'inventory_manager', 'manager'].includes(get().user?.role),
  isWorker: () => ['warehouse_staff', 'worker'].includes(get().user?.role),
  hasRole: (...roles) => roles.includes(get().user?.role),
}));

export default useAuthStore;
