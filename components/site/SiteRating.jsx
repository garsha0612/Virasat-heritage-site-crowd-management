import { Star } from 'lucide-react';

/**
 * ANVAYA Monument Visitor Rating Component
 * Renders rating star in antique gold with review count.
 */
export default function SiteRating({ rating = 4.8, reviewCount, className = '' }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs text-heritage-charcoal font-sans select-none ${className}`}
      title={`${rating} out of 5 stars (${reviewCount ? `${reviewCount.toLocaleString()} reviews` : 'Verified reviews'})`}
    >
      <div className="flex items-center text-heritage-gold-600">
        <Star className="w-3.5 h-3.5 fill-heritage-gold stroke-heritage-gold-600" />
      </div>
      <span className="font-semibold text-heritage-charcoal-800">{rating.toFixed(1)}</span>
      {reviewCount && (
        <span className="text-heritage-charcoal-400 font-normal">
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}
