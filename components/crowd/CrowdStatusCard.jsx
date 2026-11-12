import { Users, Info, Sparkles } from 'lucide-react';
import CrowdBadge from './CrowdBadge';
import CrowdGauge from './CrowdGauge';
import { getCrowdClassification } from '@/constants/heritageSites';

/**
 * ANVAYA Monument Crowd Telemetry Status Card
 * Displays instantaneous occupancy statistics with advisory information.
 */
export default function CrowdStatusCard({
  siteName,
  location,
  currentVisitors = 0,
  maxCapacity = 1000,
  occupancyPercentage,
  className = '',
}) {
  const percentage =
    occupancyPercentage !== undefined
      ? occupancyPercentage
      : maxCapacity > 0
      ? (currentVisitors / maxCapacity) * 100
      : 0;

  const classification = getCrowdClassification(percentage);

  return (
    <div
      className={`bg-white rounded-xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-heritage-sandstone-700 bg-heritage-sandstone-50 px-2 py-0.5 rounded border border-heritage-sandstone-200">
              Live-Style Telemetry
            </span>
            <h3 className="font-serif text-lg font-bold text-heritage-charcoal mt-1">
              {siteName}
            </h3>
            {location && (
              <p className="text-xs text-heritage-charcoal-400 font-sans">{location}</p>
            )}
          </div>
          <CrowdBadge percentage={percentage} />
        </div>

        {/* Center Meter & Metric Details */}
        <div className="flex items-center gap-6 py-4 my-2 border-y border-heritage-sandstone/15">
          <CrowdGauge percentage={percentage} size="sm" showLabel={false} />

          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-heritage-charcoal-500">
              <Users className="w-3.5 h-3.5 text-heritage-sandstone-600" />
              <span>
                Active Visitors:{' '}
                <strong className="text-heritage-charcoal font-semibold">
                  {currentVisitors.toLocaleString()}
                </strong>
              </span>
            </div>
            <div className="text-heritage-charcoal-400">
              Site Carrying Capacity: {maxCapacity.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Advisory Context */}
        <p className="text-xs text-heritage-charcoal-600 mt-3 leading-relaxed flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-heritage-sandstone-600 shrink-0 mt-0.5" />
          <span>{classification.advisory}</span>
        </p>
      </div>

      {/* Simulated Telemetry Banner */}
      <div className="mt-5 pt-3 border-t border-heritage-sandstone/15 flex items-center justify-between text-[11px] text-heritage-charcoal-400 font-mono">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-heritage-gold-600" />
          Simulated Data Model
        </span>
        <span>Hourly Calibration</span>
      </div>
    </div>
  );
}
