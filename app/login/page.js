'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Shield, Warehouse, Store, Boxes, UserCheck } from 'lucide-react';
import useAuthStore from '@/lib/authStore';
import LanguageSwitch from '@/components/ui/LanguageSwitch';
import BrandMark from '@/components/ui/BrandMark';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, initialize, isLoading, user } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { initialize(); }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (['warehouse_staff', 'worker'].includes(user.role)) {
        router.replace('/worker');
      } else if (user.role === 'store_manager') {
        router.replace('/stores');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Please enter email and password');
      return;
    }
    setSubmitting(true);
    try {
      const loggedUser = await login(form.email, form.password);
      if (['warehouse_staff', 'worker'].includes(loggedUser.role)) {
        router.replace('/worker');
      } else if (loggedUser.role === 'store_manager') {
        router.replace('/stores');
      } else {
        router.replace('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else {
        setError(err.message || 'Login failed. Check credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const demoAccounts = [
    {
      role: 'Super Admin',
      name: 'Vikram Shah',
      email: 'admin@limelightdiamonds.com',
      color: 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100',
      icon: Shield,
    },
    {
      role: 'Warehouse Manager',
      name: 'Neha Kapoor',
      email: 'warehouse.manager@limelightdiamonds.com',
      color: 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100',
      icon: Warehouse,
    },
    {
      role: 'Inventory Manager',
      name: 'Rohan Desai',
      email: 'inventory.manager@limelightdiamonds.com',
      color: 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100',
      icon: Boxes,
    },
    {
      role: 'Store Manager',
      name: 'Pooja Verma',
      email: 'store.manager@limelightdiamonds.com',
      color: 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100',
      icon: Store,
    },
    {
      role: 'Warehouse Staff',
      name: 'Rahul Patil',
      email: 'warehouse.staff@limelightdiamonds.com',
      color: 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100',
      icon: UserCheck,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left branding panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-brand-800 via-brand-700 to-teal-800 flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center p-2 shadow-xl">
              <BrandMark className="w-full h-full" />
            </div>
            <div>
              <div className="font-bold text-2xl tracking-tight">Limelight Diamonds</div>
              <div className="text-white/70 text-xs font-medium tracking-wide">Enterprise Warehouse & Store ERP</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Centralized inventory,<br />store replenishment &<br />POS synchronization.
          </h1>
          <p className="text-white/80 text-base leading-relaxed max-w-md">
            Engineered for Limelight Diamonds retail operations — tracking packaging, luxury gift kits, visual merchandising displays, and POS inventory deduction in real time.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/10">
          {[
            { label: 'Active SKUs', value: '18+' },
            { label: 'Central Warehouses', value: '3' },
            { label: 'Retail Stores Linked', value: '5' },
            { label: 'Live POS Terminals', value: '5 Online' },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-white/70 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-6 md:hidden">
            <BrandMark className="w-10 h-10" />
            <div>
              <div className="font-bold text-lg text-ink">Limelight Diamonds</div>
              <div className="text-gray-500 text-xs">Warehouse & Store ERP</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-6">Sign in to your role dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="label text-xs" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  className="input pl-9 text-sm"
                  placeholder="name@limelightdiamonds.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label text-xs" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="input pl-9 pr-9 text-sm"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-h-0 p-0"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-2.5 text-sm"
              disabled={submitting}
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Logins for the 5 Roles */}
          <div className="mt-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-card space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Quick Demo Login (5 Client Roles)
              </span>
              <span className="text-[10px] text-brand-700 font-semibold">1-Click</span>
            </div>

            <div className="space-y-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => setForm({ email: acc.email, password: 'password123' })}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all ${acc.color}`}
                >
                  <div className="flex items-center gap-2">
                    <acc.icon className="w-3.5 h-3.5 shrink-0" />
                    <div>
                      <div className="font-bold leading-tight">{acc.role}</div>
                      <div className="text-[10px] opacity-80">{acc.name}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono opacity-60">Use Account →</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 text-center pt-1">
              Select any role above then click Sign In (default password works)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
