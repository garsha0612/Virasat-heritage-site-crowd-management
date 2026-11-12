/**
 * ANVAYA Editorial Status Badge Primitive
 * Clean status indicator with color tokens for categories and crowd states.
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) {
  const variants = {
    default: 'bg-heritage-sandstone-100 text-heritage-charcoal-700 border-heritage-sandstone-300',
    sandstone: 'bg-heritage-sandstone-50 text-heritage-sandstone-800 border-heritage-sandstone-200',
    green: 'bg-heritage-green-50 text-heritage-green border-heritage-green-200',
    gold: 'bg-heritage-gold-50 text-heritage-gold-800 border-heritage-gold-300',
    outline: 'bg-transparent text-heritage-charcoal-600 border-heritage-sandstone/60',
    // Crowd specific states
    low: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    moderate: 'bg-amber-50 text-amber-800 border-amber-300',
    high: 'bg-rose-50 text-rose-800 border-rose-300',
  };

  const dotColors = {
    default: 'bg-heritage-charcoal-400',
    sandstone: 'bg-heritage-sandstone',
    green: 'bg-heritage-green',
    gold: 'bg-heritage-gold',
    outline: 'bg-heritage-charcoal-300',
    low: 'bg-emerald-500',
    moderate: 'bg-amber-500',
    high: 'bg-rose-500',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-medium font-sans rounded-full border tracking-wide uppercase select-none ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || dotColors.default}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
