'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Landmark } from 'lucide-react';

/**
 * ANVAYA Monument Image Component
 * Features image optimization, graceful error fallback, and subtle hover transition.
 */
export default function SiteImage({
  src,
  alt = 'Indian Heritage Monument',
  aspectRatio = 'aspect-[16/10]',
  priority = false,
  className = '',
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div
      className={`relative w-full ${aspectRatio} overflow-hidden bg-heritage-sandstone-100 ${className}`}
    >
      {/* Fallback Display if image fails to load or no src provided */}
      {(!src || hasError) ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-heritage-sandstone-100 to-heritage-sandstone-200 text-heritage-charcoal-400">
          <div className="w-12 h-12 rounded-full bg-white/70 border border-heritage-sandstone/30 flex items-center justify-center text-heritage-sandstone-600 mb-2 shadow-heritage-subtle">
            <Landmark className="w-6 h-6" />
          </div>
          <span className="text-xs font-serif font-bold text-heritage-charcoal-600 max-w-[200px] truncate">
            {alt}
          </span>
          <span className="text-[10px] text-heritage-charcoal-400 uppercase tracking-widest mt-0.5">
            Architectural Archive
          </span>
        </div>
      ) : (
        <>
          {/* Subtle loading shimmer placeholder */}
          {isLoading && (
            <div className="absolute inset-0 bg-heritage-sandstone-100 animate-pulse z-10" />
          )}

          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className={`object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
        </>
      )}

      {/* Subtle vignette gradient for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-heritage-charcoal-900/40 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
