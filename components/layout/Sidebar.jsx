'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, QrCode, ArrowDownToLine, ArrowUpFromLine,
  ArrowLeftRight, Warehouse, Settings2, AlertTriangle, RotateCcw,
  ClipboardList, Users, Truck, UserCheck, BarChart2,
  Bell, ShieldCheck, LogOut, ChevronRight, Store, ShoppingBag,
  CreditCard, History, Send, Target
} from 'lucide-react';
import useAuthStore from '../../lib/authStore';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';
import { goalsApi, storeRequests } from '../../lib/api';
import BrandMark from '../ui/BrandMark';

const allNavItems = [
  // Main
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
  { href: '/goals', label: 'Transfers & Dispatch', icon: Target, section: 'main' },
  { href: '/stores', label: 'Stores & Retail', icon: Store, section: 'main' },

  // Inventory & Warehouse
  { href: '/products', label: 'Products & SKUs', icon: Package, section: 'inventory' },
  { href: '/qr-codes', label: 'QR Tags', icon: QrCode, section: 'inventory' },
  { href: '/stock/incoming', label: 'Inward Receiving', icon: ArrowDownToLine, section: 'inventory' },
  { href: '/stock/outgoing', label: 'Outward Dispatch', icon: ArrowUpFromLine, section: 'inventory' },
  { href: '/stock/transfers', label: 'Inter-Unit Transfers', icon: ArrowLeftRight, section: 'inventory' },
  { href: '/warehouses', label: 'Warehouses & Floors', icon: Warehouse, section: 'inventory' },
  { href: '/stock/adjustments', label: 'Stock Adjustments', icon: Settings2, section: 'inventory' },
  { href: '/stock/damaged', label: 'Damage & Claims', icon: AlertTriangle, section: 'inventory' },
  { href: '/returns', label: 'Store Returns', icon: RotateCcw, section: 'inventory' },
  { href: '/audits', label: 'Physical Count Audits', icon: ClipboardList, section: 'inventory' },

  // Store Operations & POS
  { href: '/stores/requests', label: 'Stock Requests', icon: Send, section: 'stores' },
  { href: '/stores/consumption', label: 'Store Consumption', icon: ShoppingBag, section: 'stores' },
  { href: '/pos-integration', label: 'POS Integration', icon: CreditCard, section: 'stores' },

  // Relationships & Admin
  { href: '/suppliers', label: 'Suppliers & Vendors', icon: Truck, section: 'parties' },
  { href: '/customers', label: 'Customers & Lounges', icon: UserCheck, section: 'parties' },
  { href: '/reports', label: 'Reports & Analytics', icon: BarChart2, section: 'admin' },
  { href: '/activity-logs', label: 'Activity Audit Trail', icon: History, section: 'admin' },
  { href: '/users', label: 'Users & Roles', icon: ShieldCheck, section: 'admin' },
  { href: '/notifications', label: 'Notifications', icon: Bell, section: 'admin' },
];

const sectionLabels = {
  main: '',
  inventory: 'Warehouse & Inventory',
  stores: 'Store Operations & POS',
  parties: 'Vendors & Partners',
  admin: 'Control & Intelligence',
};

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [urgentGoalsCount, setUrgentGoalsCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const checkAlerts = async () => {
      try {
        const res = await goalsApi.getAlerts();
        setUrgentGoalsCount(res.data.count || 0);
      } catch {}
    };
    checkAlerts();
    const interval = setInterval(checkAlerts, 20000);
    return () => clearInterval(interval);
  }, [user]);

  // Role-based navigation filtering for the 5 client roles
  const getNavItems = () => {
    const role = user?.role;
    if (['super_admin', 'owner_admin'].includes(role)) {
      return allNavItems;
    }
    if (role === 'inventory_manager') {
      return allNavItems.filter((i) => i.href !== '/users');
    }
    if (role === 'warehouse_manager') {
      return allNavItems.filter((i) =>
        ['/dashboard', '/goals', '/products', '/qr-codes', '/stock/incoming', '/stock/outgoing', '/stock/transfers', '/warehouses', '/stock/adjustments', '/stock/damaged', '/returns', '/audits', '/stores/requests', '/suppliers', '/reports', '/notifications'].includes(i.href)
      );
    }
    if (role === 'store_manager') {
      return allNavItems.filter((i) =>
        ['/dashboard', '/stores', '/stores/requests', '/stores/consumption', '/returns', '/pos-integration', '/reports', '/notifications'].includes(i.href)
      );
    }
    if (['warehouse_staff', 'worker'].includes(role)) {
      return allNavItems.filter((i) =>
        ['/goals', '/products', '/qr-codes', '/stock/incoming', '/stock/outgoing', '/audits', '/notifications'].includes(i.href)
      );
    }
    return allNavItems;
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  // Group by section
  const sections = {};
  navItems.forEach((item) => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 w-64 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <BrandMark className="w-9 h-9 shrink-0" />
        <div className="min-w-0">
          <div className="font-bold text-sm text-ink truncate tracking-tight">Limelight Diamonds</div>
          <div className="text-[11px] text-gray-400 font-medium truncate">Warehouse & Store ERP</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto btn-ghost btn-icon p-1 min-h-0">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-hide">
        {Object.entries(sections).map(([section, items]) => (
          <div key={section}>
            {sectionLabels[section] && (
              <div className="px-3 pt-3.5 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {sectionLabels[section]}
              </div>
            )}
            {items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn('sidebar-link flex items-center justify-between text-xs py-2', isActive && 'active')}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <item.icon className="w-4 h-4 link-icon shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.href === '/goals' && urgentGoalsCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse shrink-0">
                      {urgentGoalsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Active User Footer */}
      <div className="border-t border-gray-100 p-3">
        <div
          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => { router.push('/profile'); onClose?.(); }}
        >
          <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-gray-900 truncate">{user?.name}</div>
            <div className="text-[10px] text-gray-400 truncate capitalize font-medium">
              {user?.designation || user?.role?.replace(/_/g, ' ')}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            className="btn-ghost btn-icon min-h-0 p-1.5 text-gray-400 hover:text-red-500"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
