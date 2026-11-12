'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import MobileMenu from './MobileMenu';

/**
 * ANVAYA Mobile Navigation Toggle Wrapper
 * Manages open/close state for mobile viewports (< 768px).
 */
export default function MobileNavigation({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`md:hidden ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2.5 rounded-lg text-heritage-charcoal hover:bg-heritage-sandstone-100 border border-heritage-sandstone/30 transition-colors focus:outline-none focus:ring-2 focus:ring-heritage-sandstone"
        aria-label="Open mobile navigation menu"
        aria-expanded={isOpen}
      >
        <Menu className="w-5 h-5" aria-hidden="true" />
      </button>

      <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
