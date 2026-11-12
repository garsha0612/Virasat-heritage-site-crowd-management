import NavigationLinks from './NavigationLinks';

/**
 * ANVAYA Desktop Navigation
 * Horizontal menu visible on medium and larger viewports.
 */
export default function DesktopNavigation({ className = '' }) {
  return (
    <nav
      aria-label="Desktop Primary Navigation"
      className={`hidden md:flex items-center ${className}`}
    >
      <NavigationLinks orientation="horizontal" />
    </nav>
  );
}
