import { getCrowdClassification } from '@/constants/heritageSites';

/**
 * ANVAYA Crowd Status Badge
 * Visual status indicator for real-time and simulated visitor density.
 */
export default function CrowdBadge({
  percentage = 0,
  status,
  size = 'md',
  showPercentage = true,
  className = '',
}) {
  const classification = getCrowdClassification(percentage);
  const label = status || classification.label;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold font-sans rounded-full border tracking-wide select-none ${classification.badgeBg} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      title={`${label} – ${percentage}% of carrying capacity (Simulated Data)`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${classification.dotColor} ${
          classification.key === 'high' ? 'animate-pulse' : ''
        }`}
        aria-hidden="true"
      />
      <span>{label}</span>
      {showPercentage && (
        <span className="font-mono opacity-80 font-normal">
          ({Math.round(percentage)}%)
        </span>
      )}
    </span>
  );
}
