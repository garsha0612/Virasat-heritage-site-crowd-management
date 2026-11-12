/**
 * ANVAYA Brand Title Component
 * Elegant serif typography with balanced letter spacing.
 */
export default function BrandName({ size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'text-base font-bold tracking-wider',
    md: 'text-xl font-bold tracking-widest',
    lg: 'text-3xl font-extrabold tracking-widest',
  };

  return (
    <span
      className={`font-serif text-heritage-charcoal uppercase select-none ${sizeMap[size] || sizeMap.md} ${className}`}
    >
      ANVAYA
    </span>
  );
}
