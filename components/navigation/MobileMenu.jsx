'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  ArrowRight,
  UserCheck,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  User,
} from 'lucide-react';
import NavigationLinks from './NavigationLinks';
import Logo from '@/components/brand/Logo';
import BrandName from '@/components/brand/BrandName';
import BrandTagline from '@/components/brand/BrandTagline';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

/**
 * ANVAYA Accessible Mobile Navigation Drawer
 * Mounts when menu toggle is active, supporting focus traps and ESC cancellation.
 */
export default function MobileMenu({ isOpen, onClose }) {
  const menuRef = useRef(null);
  const { user, isAuthenticated, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Close on ESC key press
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-heritage-charcoal-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div
        ref={menuRef}
        className="fixed inset-y-0 right-0 w-full max-w-xs sm:max-w-sm bg-heritage-ivory border-l border-heritage-sandstone/30 shadow-heritage-lg z-10 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250 ease-out"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-heritage-sandstone/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div>
              <BrandName size="sm" />
              <BrandTagline className="text-[9px]" />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-heritage-charcoal-500 hover:text-heritage-charcoal hover:bg-heritage-sandstone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-heritage-sandstone"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Authenticated User Snippet (Mobile) */}
        {isAuthenticated && user && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-heritage-sandstone-100/60 border border-heritage-sandstone/30">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-sm ${
                isAdmin ? 'bg-[#1E251E] text-heritage-gold border border-heritage-gold/30' : 'bg-heritage-green text-heritage-ivory'
              }`}>
                {user.name ? user.name.charAt(0).toUpperCase() : (isAdmin ? 'A' : 'V')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-heritage-charcoal truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-heritage-charcoal-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-heritage-sandstone/20 flex items-center justify-between text-xs">
              <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider font-semibold px-2 py-0.5 rounded border ${
                isAdmin ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-heritage-green bg-white border-heritage-green/20'
              }`}>
                <ShieldCheck className="w-3 h-3" />
                {user.role}
              </span>
              {isAdmin ? (
                <Link
                  href="/admin/settings"
                  onClick={onClose}
                  className="text-xs text-heritage-sandstone-700 hover:text-heritage-charcoal underline"
                >
                  Admin Settings
                </Link>
              ) : (
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="text-xs text-heritage-sandstone-700 hover:text-heritage-charcoal underline"
                >
                  Edit Profile
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Drawer Navigation Links */}
        <div className="p-6 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-heritage-charcoal-400 mb-3 px-2">
            Navigation
          </p>
          <NavigationLinks orientation="vertical" onLinkClick={onClose} />
        </div>

        {/* Drawer Action Buttons Footer */}
        <div className="p-6 border-t border-heritage-sandstone/20 bg-white/50 space-y-3">
          <Button
            href="/explore"
            variant="primary"
            size="md"
            className="w-full justify-between"
            onClick={onClose}
            rightIcon={ArrowRight}
          >
            Explore Monuments
          </Button>

          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <Button
                  href="/admin"
                  variant="outline"
                  size="md"
                  className="w-full justify-center bg-[#1E251E] text-heritage-gold hover:bg-[#2C382C] border-heritage-gold/30"
                  onClick={onClose}
                  leftIcon={ShieldCheck}
                >
                  Admin Control Portal
                </Button>
              ) : (
                <Button
                  href="/dashboard"
                  variant="outline"
                  size="md"
                  className="w-full justify-center"
                  onClick={onClose}
                  leftIcon={LayoutDashboard}
                >
                  Visitor Dashboard
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-rose-700 hover:bg-rose-50"
                onClick={() => {
                  onClose();
                  logout();
                }}
                leftIcon={LogOut}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                href="/login"
                variant="outline"
                size="md"
                className="w-full justify-center"
                onClick={onClose}
                leftIcon={UserCheck}
              >
                Visitor Sign In
              </Button>
              <Button
                href="/register"
                variant="ghost"
                size="sm"
                className="w-full justify-center text-heritage-charcoal-700"
                onClick={onClose}
              >
                Create New Account
              </Button>
            </>
          )}

          <p className="text-[10px] text-center text-heritage-charcoal-400 pt-2 font-mono">
            Smart Tourism • Verified Capacity
          </p>
        </div>
      </div>
    </div>
  );
}
