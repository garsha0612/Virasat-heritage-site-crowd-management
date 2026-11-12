'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  Landmark,
  Sliders,
  AlertTriangle,
  Clock,
  TrendingUp,
  RefreshCw,
  Save,
  CheckCircle2,
  Info,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

export default function AdminCrowdPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMsg, setConfigMsg] = useState(null);

  const [thresholds, setThresholds] = useState({
    lowMax: 40,
    moderateMax: 70,
    highMax: 100,
    simulationMultiplier: 1.0,
  });

  const fetchCrowd = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/crowd');
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
        if (json.data.thresholds) {
          setThresholds(json.data.thresholds);
        }
      } else {
        setError(json.message || 'Unable to retrieve crowd metrics.');
      }
    } catch {
      setError('Network communication error while loading crowd telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrowd();
  }, []);

  const handleUpdateThresholds = async (e) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      setConfigMsg(null);
      const res = await fetch('/api/admin/crowd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thresholds),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setConfigMsg({ type: 'success', text: 'Demonstration crowd thresholds updated successfully.' });
        fetchCrowd();
      } else {
        setConfigMsg({ type: 'error', text: json.message || 'Failed to update thresholds.' });
      }
    } catch {
      setConfigMsg({ type: 'error', text: 'Network communication error while saving.' });
    } finally {
      setSavingConfig(false);
    }
  };

  const sites = data?.sites || [];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-heritage-sandstone/30">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal">
            Crowd Management & Capacity Telemetry
          </h1>
          <p className="text-xs text-heritage-charcoal-400 font-sans mt-1">
            Real-time algorithmic occupancy calculation, peak hour identification, and threshold tuning.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCrowd}
          disabled={loading}
          className="p-2 rounded-xl bg-white border border-heritage-sandstone/30 hover:border-heritage-green text-heritage-charcoal-600 hover:text-heritage-green transition-all shadow-heritage-sm"
          title="Refresh telemetry"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Mandatory Academic Simulation Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-heritage-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="font-sans leading-relaxed space-y-1">
          <p className="font-bold text-amber-950 uppercase tracking-wide text-[11px]">
            Academic Project Simulation Notice
          </p>
          <p>
            {data?.disclaimer ||
              'Simulated crowd data – not connected to official sensors or live government systems.'}
          </p>
          <p className="text-[11px] text-amber-800">
            Occupancy estimates are derived algorithmically from time-slot booking volumes and configurable
            demonstration parameters for evaluating academic crowd-dispersal mechanisms.
          </p>
        </div>
      </div>

      {/* Threshold Configuration Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-heritage-sandstone/20">
          <Sliders className="w-4 h-4 text-heritage-green" />
          <h2 className="font-serif text-base font-bold text-heritage-charcoal">
            Configure Demonstration Thresholds & Simulation Inputs
          </h2>
        </div>

        <form onSubmit={handleUpdateThresholds} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
            <div>
              <label className="block font-semibold text-emerald-800 mb-1">
                Low Threshold Max (0 – {thresholds.lowMax}%)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={thresholds.lowMax}
                onChange={(e) => setThresholds({ ...thresholds, lowMax: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-1 focus:ring-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-amber-800 mb-1">
                Moderate Max ({thresholds.lowMax + 1} – {thresholds.moderateMax}%)
              </label>
              <input
                type="number"
                min={thresholds.lowMax + 1}
                max="99"
                value={thresholds.moderateMax}
                onChange={(e) =>
                  setThresholds({ ...thresholds, moderateMax: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-1 focus:ring-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-rose-800 mb-1">
                High Density Threshold (Over {thresholds.moderateMax}%)
              </label>
              <input
                type="number"
                min={thresholds.moderateMax + 1}
                max="100"
                value={thresholds.highMax}
                onChange={(e) => setThresholds({ ...thresholds, highMax: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-1 focus:ring-heritage-green"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Simulation Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5.0"
                value={thresholds.simulationMultiplier}
                onChange={(e) =>
                  setThresholds({ ...thresholds, simulationMultiplier: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-heritage-sandstone/30 font-mono focus:outline-none focus:ring-1 focus:ring-heritage-green"
              />
            </div>
          </div>

          {configMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-sans ${
                configMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {configMsg.text}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={savingConfig}
              leftIcon={Save}
              className="bg-heritage-green hover:bg-heritage-green-800"
            >
              {savingConfig ? 'Saving Settings...' : 'Apply Simulation Parameters'}
            </Button>
          </div>
        </form>
      </div>

      {/* Site-by-Site Density Status Cards */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-bold text-heritage-charcoal">
          Live Monument Density Indicators (Today: {data?.activeDate})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-56" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sites.map((st) => (
              <div
                key={st.id}
                className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-heritage-charcoal">
                      {st.name}
                    </h3>
                    <p className="text-xs text-heritage-charcoal-400 font-sans">
                      {st.city}, {st.state}
                    </p>
                  </div>

                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${st.classification?.badgeBg}`}
                  >
                    {st.classification?.label}
                  </span>
                </div>

                {/* Occupancy Indicator */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs font-sans">
                    <span className="text-heritage-charcoal-500 font-medium">Estimated Occupancy</span>
                    <span className="font-mono font-bold text-base text-heritage-charcoal">
                      {st.occupancyPercentage}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-heritage-sandstone-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all`}
                      style={{
                        width: `${st.occupancyPercentage}%`,
                        backgroundColor: st.classification?.color || '#10B981',
                      }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-heritage-sandstone/15 text-xs font-sans">
                  <div>
                    <span className="text-[10px] text-heritage-charcoal-400 block uppercase font-mono">
                      Today Reserved
                    </span>
                    <p className="font-mono font-bold text-heritage-charcoal">
                      {st.todayTotalReserved} / {st.todayTotalCapacity}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-heritage-charcoal-400 block uppercase font-mono">
                      Peak Visiting Hour
                    </span>
                    <p className="font-mono font-bold text-heritage-charcoal">{st.peakHour}</p>
                  </div>
                </div>

                {/* Advisory */}
                <p className="text-[11px] text-heritage-charcoal-500 font-sans italic pt-2 border-t border-heritage-sandstone/15">
                  &ldquo;{st.classification?.advisory}&rdquo;
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
