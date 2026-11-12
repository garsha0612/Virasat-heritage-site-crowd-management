import { getCrowdClassification } from '@/constants/heritageSites';

/**
 * ANVAYA Real-time Crowd Occupancy Gauge
 * Renders circular radial SVG meter or compact linear bar.
 */
export default function CrowdGauge({
  percentage = 0,
  variant = 'circular',
  size = 'md',
  showLabel = true,
  className = '',
}) {
  const normalizedPercentage = Math.min(100, Math.max(0, percentage));
  const classification = getCrowdClassification(normalizedPercentage);

  if (variant === 'linear') {
    return (
      <div className={`w-full font-sans ${className}`}>
        {showLabel && (
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-heritage-charcoal-600 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${classification.dotColor}`} />
              {classification.label}
            </span>
            <span className="font-mono text-heritage-charcoal font-semibold">
              {Math.round(normalizedPercentage)}%
            </span>
          </div>
        )}
        <div className="w-full h-2.5 bg-heritage-sandstone-100 rounded-full overflow-hidden border border-heritage-sandstone/30">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${normalizedPercentage}%`,
              backgroundColor: classification.color,
            }}
            role="progressbar"
            aria-valuenow={normalizedPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Occupancy level: ${Math.round(normalizedPercentage)}%`}
          />
        </div>
      </div>
    );
  }

  // Circular SVG Gauge
  const dimensions = {
    sm: { size: 64, stroke: 5, radius: 26, fontSize: 'text-xs' },
    md: { size: 96, stroke: 7, radius: 40, fontSize: 'text-lg' },
    lg: { size: 128, stroke: 9, radius: 52, fontSize: 'text-2xl' },
  };

  const config = dimensions[size] || dimensions.md;
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (normalizedPercentage / 100) * circumference;

  return (
    <div className={`inline-flex flex-col items-center justify-center font-sans ${className}`}>
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={config.size}
          height={config.size}
          viewBox={`0 0 ${config.size} ${config.size}`}
          className="transform -rotate-90"
          aria-hidden="true"
        >
          {/* Background Track Circle */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={config.radius}
            stroke="#EFE9DC"
            strokeWidth={config.stroke}
            fill="transparent"
          />
          {/* Active Value Progress Circle */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={config.radius}
            stroke={classification.color}
            strokeWidth={config.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`font-mono font-bold text-heritage-charcoal ${config.fontSize} leading-none`}>
            {Math.round(normalizedPercentage)}%
          </span>
          {size !== 'sm' && (
            <span className="text-[9px] uppercase tracking-wider text-heritage-charcoal-400 font-semibold mt-0.5">
              Capacity
            </span>
          )}
        </div>
      </div>

      {showLabel && (
        <span
          className="mt-2 text-xs font-semibold tracking-wide uppercase"
          style={{ color: classification.color }}
        >
          {classification.label}
        </span>
      )}
    </div>
  );
}
