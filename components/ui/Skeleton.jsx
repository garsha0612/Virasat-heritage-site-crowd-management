/**
 * ANVAYA Loading Skeleton Primitive
 * Provides accessible pulse animation for content placeholders.
 */
export default function Skeleton({
  variant = 'text',
  className = '',
  width,
  height,
}) {
  const baseClasses = 'animate-pulse bg-heritage-sandstone-200/50';

  const variants = {
    text: 'h-4 rounded-md w-full my-1',
    title: 'h-7 rounded-md w-3/4 mb-2',
    circular: 'rounded-full shrink-0',
    rectangular: 'rounded-lg w-full',
    card: 'h-72 rounded-xl w-full',
  };

  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={`${baseClasses} ${variants[variant] || variants.text} ${className}`}
      style={style}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
