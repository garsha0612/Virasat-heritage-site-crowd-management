import Link from 'next/link';
import { Landmark, Compass, ShieldCheck, Sparkles, Mail, MapPin } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import BrandName from '@/components/brand/BrandName';
import BrandTagline from '@/components/brand/BrandTagline';

/**
 * ANVAYA Comprehensive Platform Footer
 * Features brand mission, quick navigation links, pilot monuments, and simulation notice.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-heritage-charcoal text-heritage-sandstone-200 border-t border-heritage-gold/25 font-sans">
      {/* Top Banner Notice */}
      <div className="bg-heritage-charcoal-900 border-b border-heritage-sandstone/10 py-3 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 text-heritage-gold-300">
            <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Preserving Indian Heritage through Smart Visitor Flow Management</span>
          </div>
          <span className="font-mono text-[11px] text-heritage-sandstone-400">
            National Heritage Portal • Smart Visitor Governance
          </span>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Logo size="md" />
              <div>
                <BrandName size="md" className="text-white" />
                <BrandTagline className="text-[10px] text-heritage-sandstone-400" />
              </div>
            </div>

            <p className="text-xs text-heritage-charcoal-300 leading-relaxed">
              ANVAYA is an intelligent tourism platform engineered to balance public cultural exploration with monument conservation. Plan visits during low-density windows and reserve time-slotted passes.
            </p>

            <div className="pt-2 text-xs text-heritage-sandstone-400 space-y-1.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-heritage-gold" />
                <span>Pilot Enclave: Archaeological Monuments Across India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-heritage-gold" />
                <span>Contact Desk: support@anvaya.in</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <div>
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-heritage-sandstone/15">
              Platform Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-heritage-gold transition-colors block py-0.5">
                  Home Portal
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-heritage-gold transition-colors block py-0.5">
                  Explore Destinations
                </Link>
              </li>
              <li>
                <Link href="/crowd-status" className="hover:text-heritage-gold transition-colors block py-0.5">
                  Live Crowd Telemetry
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-heritage-gold transition-colors block py-0.5">
                  About & Conservation Mission
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-heritage-gold transition-colors block py-0.5">
                  Visitor & Staff Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Featured Destinations */}
          <div>
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-heritage-sandstone/15">
              Pilot Destinations
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/sites/taj-mahal" className="hover:text-heritage-gold transition-colors block py-0.5">
                  Taj Mahal (Agra)
                </Link>
              </li>
              <li>
                <Link href="/sites/red-fort" className="hover:text-heritage-gold transition-colors block py-0.5">
                  Red Fort (Delhi)
                </Link>
              </li>
              <li>
                <Link href="/sites/qutub-minar" className="hover:text-heritage-gold transition-colors block py-0.5">
                  Qutub Minar (Delhi)
                </Link>
              </li>
              <li>
                <Link href="/sites/hampi-monuments" className="hover:text-heritage-gold transition-colors block py-0.5">
                  Hampi Monuments (Karnataka)
                </Link>
              </li>
              <li>
                <Link href="/sites/sun-temple-konark" className="hover:text-heritage-gold transition-colors block py-0.5">
                  Sun Temple (Konark, Odisha)
                </Link>
              </li>
              <li>
                <Link href="/sites/ajanta-caves" className="hover:text-heritage-gold transition-colors block py-0.5">
                  Ajanta Caves (Maharashtra)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Heritage Standards & Smart Governance */}
          <div>
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-heritage-sandstone/15">
              Standards & Integrity
            </h4>
            <div className="bg-heritage-charcoal-800/80 p-4 rounded-lg border border-heritage-sandstone/15 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-heritage-gold-300 font-semibold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Carrying Capacity Governance</span>
              </div>
              <p className="text-[11px] text-heritage-charcoal-300 leading-relaxed">
                Crowd occupancy quotas, hourly distribution curves, and advisory alerts are engineered to protect fragile monument fabric and regulate timed visitor access.
              </p>
            </div>

            {/* Outreach Channels */}
            <div className="mt-4 pt-2">
              <span className="text-[10px] uppercase font-bold text-heritage-sandstone-400 tracking-wider block mb-2">
                Heritage Awareness Channels
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded bg-heritage-charcoal-800 border border-heritage-sandstone/15 text-heritage-sandstone-300">
                  X / Twitter
                </span>
                <span className="px-2.5 py-1 rounded bg-heritage-charcoal-800 border border-heritage-sandstone/15 text-heritage-sandstone-300">
                  Instagram
                </span>
                <span className="px-2.5 py-1 rounded bg-heritage-charcoal-800 border border-heritage-sandstone/15 text-heritage-sandstone-300">
                  YouTube
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright & Rights Bar */}
      <div className="border-t border-heritage-sandstone/10 bg-heritage-charcoal-900 py-6 text-xs text-heritage-charcoal-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>
            &copy; {currentYear} <strong className="text-white font-semibold">ANVAYA</strong>. All rights reserved. Where Heritage Connects Generations.
          </p>
          <p className="text-[11px] font-mono text-heritage-sandstone-400">
            Adheres to Indian Architectural Heritage & Smart Governance Standards
          </p>
        </div>
      </div>
    </footer>
  );
}
