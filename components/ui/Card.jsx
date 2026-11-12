/**
 * ANVAYA Composable Card Primitives
 * Styled according to the editorial Indian Heritage design system.
 */

export function Card({ children, hover = false, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-xl border border-heritage-sandstone/30 shadow-heritage-sm transition-all duration-300 ${
        hover ? 'hover:shadow-heritage-md hover:border-heritage-sandstone/60 hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-6 pb-4 border-b border-heritage-sandstone/15 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3
      className={`font-serif text-xl font-bold text-heritage-charcoal tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs text-heritage-charcoal-500 font-sans mt-1 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`px-6 py-4 bg-heritage-sandstone-50/40 border-t border-heritage-sandstone/15 rounded-b-xl flex items-center justify-between text-xs text-heritage-charcoal-500 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
