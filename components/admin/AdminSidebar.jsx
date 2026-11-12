'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Landmark,
  Ticket,
  Users,
  UserCheck,
  Clock,
  Activity,
  BarChart3,
  Settings,
  ShieldCheck,
  X,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const ADMIN_NAV_SECTIONS = [
  {
    title: 'Operations',
    items: [
      { href: '/admin', label: 'Admin Overview', icon: LayoutDashboard, exact: true },
      { href: '/admin/sites', label: 'Destinations (Sites)', icon: Landmark },
      { href: '/admin/bookings', label: 'Bookings & Passes', icon: Ticket },
      { href: '/admin/slots', label: 'Time Slots & Quota', icon: Clock },
      { href: '/admin/crowd', label: 'Crowd Telemetry', icon: Activity },
    ],
  },
  {
    title: 'Access & Governance',
    items: [
      { href: '/admin/users', label: 'Registered Visitors', icon: Users, exact: true },
      { href: '/admin/users?role=staff', label: 'Staff Accounts', icon: UserCheck },
      { href: '/admin/reports', label: 'Financial Reports', icon: BarChart3 },
      { href: '/admin/settings', label: 'Audit Logs & Settings', icon: Settings },
    ],
  },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isLinkActive = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href.split('?')[0]);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-heritage-charcoal/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#1E251E] text-heritage-sandstone-100 flex flex-col border-r border-[#2C382C] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-[#2C382C]/70">
          <Link href="/admin" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-10 h-10 rounded-xl bg-heritage-gold-500/15 border border-heritage-gold-500/30 flex items-center justify-center text-heritage-gold">
              <ShieldCheck className="w-5 h-5 text-heritage-gold" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold tracking-wider text-heritage-ivory block leading-none">
                ANVAYA
              </span>
              <span className="text-[10px] tracking-widest uppercase font-mono text-heritage-gold-400 mt-1 block">
                Control Portal
              </span>
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-heritage-sandstone-400 hover:text-white hover:bg-white/5 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          {ADMIN_NAV_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              <div className="px-3 pb-1 text-[10px] uppercase font-mono tracking-widest text-heritage-gold-400 font-bold">
                {section.title}
              </div>

              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isLinkActive(item);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-heritage-gold text-[#141A14] font-bold shadow-md shadow-heritage-gold/20'
                        : 'text-heritage-sandstone-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#141A14]' : 'text-heritage-sandstone-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Footer Actions */}
        <div className="p-4 border-t border-[#2C382C]/70 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-heritage-sandstone-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Portal Live</span>
            </span>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-heritage-sandstone-400 font-mono">
              View
            </span>
          </Link>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
