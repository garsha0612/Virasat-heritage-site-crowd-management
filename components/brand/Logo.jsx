/**
 * ANVAYA Primary Brand Logo
 * Custom architectural emblem representing connection, continuity and Indian heritage.
 */
export default function Logo({ size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${sizeMap[size] || sizeMap.md} ${className}`}
      aria-label="ANVAYA"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer architectural frame - representing heritage structure */}
        <rect
          x="15"
          y="15"
          width="70"
          height="70"
          rx="4"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          className="text-heritage-green"
        />
        
        {/* Inner connecting paths - representing continuity and lineage */}
        <path
          d="M 30 50 L 50 30 L 70 50 L 50 70 Z"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          className="text-heritage-gold"
        />
        
        {/* Central connection point */}
        <circle
          cx="50"
          cy="50"
          r="6"
          fill="currentColor"
          className="text-heritage-gold"
        />
        
        {/* Corner accent dots - representing generations/connections */}
        <circle cx="25" cy="25" r="2.5" fill="currentColor" className="text-heritage-green" />
        <circle cx="75" cy="25" r="2.5" fill="currentColor" className="text-heritage-green" />
        <circle cx="25" cy="75" r="2.5" fill="currentColor" className="text-heritage-green" />
        <circle cx="75" cy="75" r="2.5" fill="currentColor" className="text-heritage-green" />
      </svg>
    </div>
  );
}
