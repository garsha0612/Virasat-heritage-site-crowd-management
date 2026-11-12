import { MapPin } from 'lucide-react';

/**
 * ANVAYA Monument Location Component
 * Displays geographic location in editorial typography with map pin icon.
 */
export default function SiteLocation({ city, state, country = 'India', className = '' }) {
  const locationString = [city, state].filter(Boolean).join(', ');

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs text-heritage-charcoal-500 font-sans ${className}`}
      title={`${locationString}, ${country}`}
    >
      <MapPin className="w-3.5 h-3.5 text-heritage-sandstone-600 shrink-0" aria-hidden="true" />
      <span className="truncate">{locationString}</span>
    </div>
  );
}
