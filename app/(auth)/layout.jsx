import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import BrandName from '@/components/brand/BrandName';
import BrandTagline from '@/components/brand/BrandTagline';
import Container from '@/components/ui/Container';

/**
 * ANVAYA Dedicated Authentication Layout
 * Clean, focused editorial framing with heritage branding and security assurances.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-heritage-ivory flex flex-col justify-between selection:bg-heritage-sandstone/30 selection:text-heritage-green">
      {/* Top Header */}
      <header className="py-6 border-b border-heritage-sandstone/20 bg-white/70 backdrop-blur-sm">
        <Container size="xl" className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-heritage-sandstone rounded-lg p-1 -ml-1 select-none"
            aria-label="ANVAYA - Return to Home"
          >
            <Logo size="md" />
            <div className="flex flex-col">
              <BrandName size="md" />
              <BrandTagline className="hidden sm:block text-[10px]" />
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-heritage-charcoal-600 hover:text-heritage-green transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Portal</span>
          </Link>
        </Container>
      </header>

      {/* Main Form Slot */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Bottom Footer */}
      <footer className="py-6 border-t border-heritage-sandstone/20 bg-white/40 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-heritage-charcoal-500 font-sans">
          <ShieldCheck className="w-4 h-4 text-heritage-green" />
          <span>Official Smart Crowd Management & Heritage Ticketing Gateway</span>
        </div>
      </footer>
    </div>
  );
}
