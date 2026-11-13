'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export const BASE_NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Explore', href: '/explore' },
  { label: 'Crowd Status', href: '/crowd-status' },
  { label: 'About', href: '/about' },
];

/**
 * ANVAYA Navigation Links Primitive
 * Renders active-state aware links for desktop and mobile navigation with role awareness.
 */
export default function NavigationLinks({
  onLinkClick,
  orientation = 'horizontal',
  className = '',
}) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const isVertical = orientation === 'vertical';

  let links = [...BASE_NAV_LINKS];

  // Dynamic links based on role
  if (isAuthenticated && user) {
    if (user.role === 'admin') {
      links.push({ label: 'Admin Portal', href: '/admin' });
    } else {
      links.push({ label: 'My Bookings', href: '/dashboard' });
      links.push({ label: 'Refunds', href: '/account/refunds' });
      links.push({ label: 'My Profile', href: '/profile' });
    }
  }

  return (
    <ul
      className={`${
        isVertical ? 'flex flex-col space-y-2' : 'flex items-center space-x-1 lg:space-x-2'
      } ${className}`}
    >
      {links.map((link) => {
        const isActive =
          link.href === '/'
            ? pathname === '/'
            : pathname?.startsWith(link.href);

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onLinkClick}
              className={`block text-xs uppercase tracking-widest font-semibold transition-all duration-150 rounded-md px-3 py-2 select-none ${
                isVertical
                  ? 'text-sm py-3 px-4 border-b border-heritage-sandstone/15'
                  : ''
              } ${
                isActive
                  ? 'text-heritage-green bg-heritage-sandstone-100/60 font-bold'
                  : 'text-heritage-charcoal-700 hover:text-heritage-green hover:bg-heritage-sandstone-50'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
