/**
 * ANVAYA Brand Tagline Component
 * Refined editorial tagline.
 */
export default function BrandTagline({ className = '' }) {
  return (
    <p
      className={`text-xs text-heritage-charcoal-400 font-medium tracking-wider uppercase font-sans ${className}`}
    >
      Where Heritage Connects Generations
    </p>
  );
}
