import Link from 'next/link';
import { Loader2 } from 'lucide-react';

/**
 * ANVAYA Reusable Button Primitive
 * Supports variants, sizes, loading spinners, icons, and polymorphic Link rendering.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  href,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium font-sans transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-heritage-sandstone disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-heritage-green text-heritage-ivory hover:bg-heritage-green-500 shadow-heritage-sm border border-heritage-green-700 focus:ring-heritage-green',
    secondary:
      'bg-heritage-sandstone text-heritage-charcoal-900 hover:bg-heritage-sandstone-500 shadow-heritage-sm border border-heritage-sandstone-600 focus:ring-heritage-sandstone',
    outline:
      'bg-transparent text-heritage-charcoal border border-heritage-sandstone/60 hover:bg-heritage-sandstone-50 hover:border-heritage-sandstone focus:ring-heritage-sandstone',
    ghost:
      'bg-transparent text-heritage-charcoal hover:bg-heritage-sandstone-100/60 focus:ring-heritage-sandstone',
    danger:
      'bg-rose-700 text-white hover:bg-rose-800 shadow-heritage-sm border border-rose-800 focus:ring-rose-600',
    gold:
      'bg-heritage-gold text-heritage-charcoal-900 hover:bg-heritage-gold-400 shadow-heritage-sm border border-heritage-gold-600 focus:ring-heritage-gold',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-md gap-1.5',
    md: 'text-sm px-4 py-2 rounded-lg gap-2',
    lg: 'text-base px-6 py-3 rounded-lg gap-2.5',
  };

  const combinedClasses = `${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;

  const content = (
    <>
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : LeftIcon ? (
        <LeftIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
      {!isLoading && RightIcon ? (
        <RightIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
      ) : null}
    </>
  );

  if (href && !disabled && !isLoading) {
    return (
      <Link href={href} className={combinedClasses} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-busy={isLoading}
      {...props}
    >
      {content}
    </button>
  );
}
