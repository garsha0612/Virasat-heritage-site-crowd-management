import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import SiteImage from './SiteImage';
import SiteLocation from './SiteLocation';
import SiteCategory from './SiteCategory';
import SiteRating from './SiteRating';
import CrowdBadge from '@/components/crowd/CrowdBadge';

/**
 * ANVAYA Heritage Destination Card Component
 * Editorial monument card presenting imagery, crowd density, and visiting essentials.
 */
export default function SiteCard({ site, className = '' }) {
  if (!site) return null;

  const {
    slug,
    name,
    location,
    state,
    category,
    rating = 4.8,
    reviewCount = 1200,
    shortDescription,
    image,
    visitingHours,
    ticketPricing,
    capacity,
  } = site;

  const occupancy = capacity?.occupancyPercentage || 0;
  const statusLabel = capacity?.status;
  const startingPrice = ticketPricing?.indian !== undefined ? ticketPricing.indian : 50;

  return (
    <article
      className={`group bg-white rounded-xl border border-heritage-sandstone/30 shadow-heritage-sm hover:shadow-heritage-md hover:border-heritage-sandstone/60 transition-all duration-300 flex flex-col justify-between overflow-hidden ${className}`}
    >
      <div>
        {/* Visual Header with Image & Badges */}
        <div className="relative">
          <Link href={`/sites/${slug}`} tabIndex={-1} aria-hidden="true">
            <SiteImage src={image} alt={name} />
          </Link>

          {/* Top Overlays */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
            <SiteCategory category={category} />
            <div className="pointer-events-auto">
              <CrowdBadge percentage={occupancy} status={statusLabel} size="sm" />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <SiteLocation city={location} state={state} />
            <SiteRating rating={rating} reviewCount={reviewCount} />
          </div>

          <h3 className="font-serif text-xl sm:text-2xl font-bold text-heritage-charcoal tracking-tight group-hover:text-heritage-green transition-colors duration-200">
            <Link href={`/sites/${slug}`} className="focus:outline-none focus:underline">
              {name}
            </Link>
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-heritage-charcoal-500 font-sans leading-relaxed line-clamp-3">
            {shortDescription}
          </p>

          {/* Operational Fast Facts */}
          <div className="mt-4 pt-3 border-t border-heritage-sandstone/15 flex items-center justify-between text-xs text-heritage-charcoal-500">
            <span className="flex items-center gap-1.5" title="Standard Visiting Hours">
              <Clock className="w-3.5 h-3.5 text-heritage-sandstone-600 shrink-0" aria-hidden="true" />
              <span>{visitingHours?.open || '06:00'} – {visitingHours?.close || '18:30'}</span>
            </span>

            <span className="font-medium text-heritage-charcoal-700">
              Passes from <strong className="text-heritage-green font-semibold">₹{startingPrice}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="px-5 sm:px-6 py-3.5 bg-heritage-sandstone-50/50 border-t border-heritage-sandstone/15 flex items-center justify-between text-xs font-sans">
        <span className="text-[11px] font-mono text-heritage-charcoal-400">
          Capacity: {capacity?.maxInstantaneous?.toLocaleString() || '5,000'}
        </span>

        <Link
          href={`/sites/${slug}`}
          className="inline-flex items-center gap-1 font-semibold text-heritage-sandstone-800 hover:text-heritage-green group-hover:translate-x-0.5 transition-all focus:outline-none focus:underline"
          aria-label={`Explore details and visitor guidelines for ${name}`}
        >
          <span>Explore Details</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
