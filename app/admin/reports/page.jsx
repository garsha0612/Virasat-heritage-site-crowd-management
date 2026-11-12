'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  IndianRupee,
  Ticket,
  TrendingUp,
  XCircle,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

export default function AdminReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('30d');

  const fetchReports = async (selectedRange = range) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/admin/reports?range=${selectedRange}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Unable to retrieve report metrics.');
      }
    } catch {
      setError('Network communication error while loading reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(range);
  }, [range]);

  const summary = data?.summary || {};
  const sitePopularity = data?.sitePopularity || [];
  const dailyTimeline = data?.dailyTimeline || [];

  return (
    <div className="space-y-8">
      {/* Title & CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-heritage-sandstone/30">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal">
            Operational & Financial Reports
          </h1>
          <p className="text-xs text-heritage-charcoal-400 font-sans mt-1">
            Database-derived analytics on reservation turnover, revenue realization, and monument popularity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Range Buttons */}
          <div className="inline-flex p-1 rounded-2xl bg-white border border-heritage-sandstone/30 shadow-heritage-sm text-xs font-sans">
            {['7d', '30d', '90d', '365d', 'all'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  range === r
                    ? 'bg-heritage-green text-white font-bold shadow-sm'
                    : 'text-heritage-charcoal-600 hover:text-heritage-charcoal'
                }`}
              >
                {r === '7d'
                  ? '7 Days'
                  : r === '30d'
                  ? '30 Days'
                  : r === '90d'
                  ? '90 Days'
                  : r === '365d'
                  ? '1 Year'
                  : 'All Time'}
              </button>
            ))}
          </div>

          <a
            href="/api/admin/reports/export"
            target="_blank"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-heritage-green hover:bg-heritage-green-800 text-white text-xs font-semibold shadow-heritage-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Financial & Operational KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="card" className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-heritage-charcoal-400 font-semibold">
              Gross Realized Revenue
            </span>
            <p className="font-serif text-2xl font-bold text-heritage-green">
              ₹{(summary.totalRevenue || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-heritage-charcoal-400">
              From {summary.paidBookings || 0} successfully settled bookings
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-heritage-charcoal-400 font-semibold">
              Average Order Value (AOV)
            </span>
            <p className="font-serif text-2xl font-bold text-heritage-charcoal">
              ₹{summary.avgOrderValue || 0}
            </p>
            <p className="text-[11px] text-heritage-charcoal-400">Per paying reservation order</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-heritage-charcoal-400 font-semibold">
              Total Booking Count
            </span>
            <p className="font-serif text-2xl font-bold text-heritage-charcoal">
              {summary.totalBookings || 0}
            </p>
            <p className="text-[11px] text-heritage-charcoal-400">During {range.toUpperCase()} window</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-heritage-charcoal-400 font-semibold">
              Cancellation Ratio
            </span>
            <p className="font-serif text-2xl font-bold text-rose-700">
              {summary.cancellationRate || 0}%
            </p>
            <p className="text-[11px] text-heritage-charcoal-400">
              {summary.cancelledBookings || 0} cancellations recorded
            </p>
          </div>
        </div>
      )}

      {/* Revenue & Booking Timeline Trend */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-6">
        <div>
          <h2 className="font-serif text-lg font-bold text-heritage-charcoal">
            Daily Financial Generation Realization
          </h2>
          <p className="text-xs text-heritage-charcoal-400 font-sans">
            Revenue trajectory plotted against daily booking turnover
          </p>
        </div>

        <div className="h-72 w-full">
          {dailyTimeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTimeline}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3F20" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1E3F20" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EAE1" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7C786F' }} />
                <YAxis tick={{ fontSize: 10, fill: '#7C786F' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E5DEC9',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1E3F20"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-heritage-charcoal-400 font-sans">
              No daily revenue timeline data in the selected window.
            </div>
          )}
        </div>
      </div>

      {/* Monument Popularity Leaderboard */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-heritage-charcoal">
            Monument Realization & Popularity Leaderboard
          </h2>
          <p className="text-xs text-heritage-charcoal-400 font-sans">
            Detailed booking and revenue breakdown per destination
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-heritage-sandstone-50/60 border-b border-heritage-sandstone/20 text-heritage-charcoal-500 uppercase tracking-wider text-[10px] font-mono font-semibold">
              <tr>
                <th className="py-3 px-6">Monument</th>
                <th className="py-3 px-4 text-center">Total Orders</th>
                <th className="py-3 px-4 text-center">Total Visitors Booked</th>
                <th className="py-3 px-6 text-right">Realized Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-heritage-sandstone/15">
              {sitePopularity.map((s, idx) => (
                <tr key={s.slug} className="hover:bg-heritage-sandstone-50/40">
                  <td className="py-3.5 px-6 font-semibold text-heritage-charcoal">
                    {idx + 1}. {s.name}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">{s.bookings}</td>
                  <td className="py-3.5 px-4 text-center font-mono">{s.visitors}</td>
                  <td className="py-3.5 px-6 text-right font-mono font-bold text-heritage-green">
                    ₹{s.revenue.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
