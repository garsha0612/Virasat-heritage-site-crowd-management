'use client';

import Link from 'next/link';
import { Compass, UserCheck, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import BrandName from '@/components/brand/BrandName';
import BrandTagline from '@/components/brand/BrandTagline';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

/**
 * ANVAYA Primary Navigation Header
 * Sticky, responsive navbar integrating brand mark, navigation links, and dynamic visitor/admin session actions.
 */
export default function Navbar() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-heritage-ivory/95 backdrop-blur-md border-b border-heritage-sandstone/25 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Group */}
        <Link
          href="/"
          className="group flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-heritage-sandstone rounded-lg p-1 -ml-1 select-none"
          aria-label="ANVAYA - Return to Home"
        >
          <Logo size="md" />
          <div className="flex flex-col">
            <BrandName size="md" />
            <BrandTagline className="hidden sm:block text-[10px]" />
          </div>
        </Link>

        {/* Center Desktop Navigation */}
        <DesktopNavigation />

        {/* Right Desktop Actions & Mobile Menu Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Button
            href="/explore"
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            leftIcon={Compass}
          >
            Explore
          </Button>

          {!loading && isAuthenticated && user ? (
            <div className="hidden sm:flex items-center gap-2.5">
              {isAdmin ? (
                <Button
                  href="/admin"
                  variant="primary"
                  size="sm"
                  leftIcon={ShieldCheck}
                  className="bg-[#1E251E] hover:bg-[#2C382C] text-heritage-gold border border-heritage-gold/30"
                >
                  Admin Portal
                </Button>
              ) : (
                <Button
                  href="/dashboard"
                  variant="primary"
                  size="sm"
                  leftIcon={LayoutDashboard}
                >
                  Dashboard
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                title="Sign Out of ANVAYA"
                className="text-heritage-charcoal-500 hover:text-rose-700"
                leftIcon={LogOut}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              href="/login"
              variant="primary"
              size="sm"
              className="hidden sm:inline-flex"
              leftIcon={UserCheck}
            >
              Sign In
            </Button>
          )}

          {/* Mobile Navigation Drawer Trigger */}
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
