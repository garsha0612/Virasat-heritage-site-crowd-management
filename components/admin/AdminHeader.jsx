'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, Shield, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AdminHeader({ onMenuClick }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      router.push('/login');
    } catch {
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="h-20 bg-white border-b border-heritage-sandstone/30 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-heritage-sm">
      <div className="flex items-center gap-4">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 rounded-xl text-heritage-charcoal-700 hover:text-heritage-green hover:bg-heritage-sandstone-50 lg:hidden border border-heritage-sandstone/30"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* System Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>MongoDB Replica Set Active</span>
          <span className="text-emerald-400">•</span>
          <span className="font-mono">ACID Fenced</span>
        </div>
      </div>

      {/* Admin User Profile & Logout Action */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-heritage-green/10 border border-heritage-green/20 text-heritage-green flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-heritage-charcoal leading-tight">
              {user?.name || 'Administrator'}
            </p>
            <p className="text-[10px] font-mono text-heritage-gold-600 font-semibold">
              Super Admin
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-heritage-sandstone/30 hidden sm:block" />

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-heritage-sandstone/30 hover:border-rose-200 text-heritage-charcoal-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-all disabled:opacity-50"
          title="Sign out of Administrative Portal"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </header>
  );
}
