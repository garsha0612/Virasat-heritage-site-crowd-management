/**
 * ANVAYA Layout Container Primitive
 * Provides responsive horizontal gutters and max-width constraints.
 */
export default function Container({
  children,
  size = 'xl',
  className = '',
  as: Component = 'div',
  ...props
}) {
  const sizeMap = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <Component
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${sizeMap[size] || sizeMap.xl} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
