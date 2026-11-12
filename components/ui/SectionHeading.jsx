/**
 * ANVAYA Editorial Section Heading Component
 * Features eyebrow tag, Playfair Display serif title, and contextual description.
 */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
  className = '',
}) {
  const alignment = {
    left: 'text-left items-start',
    center: 'text-center items-center mx-auto',
    right: 'text-right items-end ml-auto',
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12 ${className}`}
    >
      <div className={`max-w-2xl flex flex-col ${alignment[align] || alignment.left}`}>
        {eyebrow && (
          <span className="text-[11px] font-bold uppercase tracking-widest text-heritage-sandstone-700 bg-heritage-sandstone-100/80 px-2.5 py-1 rounded-md mb-2.5 border border-heritage-sandstone-200">
            {eyebrow}
          </span>
        )}
        <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-heritage-charcoal tracking-tight leading-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm sm:text-base text-heritage-charcoal-500 leading-relaxed font-sans">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
