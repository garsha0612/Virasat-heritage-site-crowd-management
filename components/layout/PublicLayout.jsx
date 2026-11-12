import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/layout/Footer';

/**
 * ANVAYA Public Layout Component
 * Standard layout wrapper providing sticky navigation, main content area, and platform footer.
 */
export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-heritage-ivory text-heritage-charcoal selection:bg-heritage-sandstone/30 selection:text-heritage-green">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
