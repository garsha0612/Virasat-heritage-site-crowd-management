import Navbar from '@/components/navigation/Navbar';
import Footer from '@/components/layout/Footer';

/**
 * ANVAYA Protected Visitor Portal Layout
 * Wraps protected visitor pages with standard navigation and footer framing.
 */
export default function VisitorLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-heritage-ivory selection:bg-heritage-sandstone/30 selection:text-heritage-green">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
