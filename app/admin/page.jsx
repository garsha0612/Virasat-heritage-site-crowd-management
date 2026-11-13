'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Landmark,
  Users,
  Ticket,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
  Calendar,
  TrendingUp,
  Activity,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Info,
  ShieldCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

export default function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('30d');

  const fetchOverview = async (selectedRange = range) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/admin/overview?range=${selectedRange}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Unable to retrieve administrative overview.');
      }
    } catch (err) {
      setError('Network communication error while loading overview telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(range);
  }, [range]);

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const recentBookings = data?.recentBookings || [];

  return (
    <div className="space-y-8">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-heritage-sandstone/30">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal">
            Operational Overview
          </h1>
          <p className="text-xs text-heritage-charcoal-400 font-sans mt-1">
            Real-time MongoDB telemetry across heritage monuments, verified bookings, and visitor throughput.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Range Filter Buttons */}
          <div className="inline-flex p-1 rounded-2xl bg-white border border-heritage-sandstone/30 shadow-heritage-sm text-xs">
            {['7d', '30d', '90d', 'all'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  range === r
                    ? 'bg-heritage-green text-white font-bold shadow-sm'
                    : 'text-heritage-charcoal-600 hover:text-heritage-charcoal'
                }`}
              >
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchOverview(range)}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-heritage-sandstone/30 hover:border-heritage-green text-heritage-charcoal-600 hover:text-heritage-green transition-all shadow-heritage-sm"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Platform Operational Status Strip */}
      <div className="p-3.5 rounded-2xl bg-white border border-heritage-sandstone/30 text-heritage-charcoal-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-heritage-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-heritage-green shrink-0" />
          <span className="font-semibold text-heritage-charcoal">
            Administrative Operations Console:
          </span>
          <span className="text-heritage-charcoal-500">
            Real-time transactional monitoring, time slot carrying capacities, and visitor reservation governance.
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Systems Operational
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Metrics Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} variant="card" className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* 1. Monuments */}
          <div className="bg-white p-5 rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-2">
            <div className="flex items-center justify-between text-heritage-charcoal-400">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Heritage Sites</span>
              <Landmark className="w-4 h-4 text-heritage-green" />
            </div>
            <p className="font-serif text-2xl font-bold text-heritage-charcoal">
              {metrics.totalSites ?? 0}
            </p>
            <p className="text-[11px] text-heritage-charcoal-400">Configured Monuments</p>
          </div>

          {/* 2. Registered Visitors */}
          <div className="bg-white p-5 rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-2">
            <div className="flex items-center justify-between text-heritage-charcoal-400">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Registered Visitors</span>
              <Users className="w-4 h-4 text-heritage-sandstone-600" />
            </div>
            <p className="font-serif text-2xl font-bold text-heritage-charcoal">
              {metrics.totalVisitors ?? 0}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium">Verified Accounts</p>
          </div>

          {/* 3. Total Bookings */}
          <div className="bg-white p-5 rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-2">
            <div className="flex items-center justify-between text-heritage-charcoal-400">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Total Bookings</span>
              <Ticket className="w-4 h-4 text-heritage-gold-600" />
            </div>
            <p className="font-serif text-2xl font-bold text-heritage-charcoal">
              {metrics.totalBookings ?? 0}
            </p>
            <p className="text-[11px] text-heritage-charcoal-400">
              {metrics.confirmedBookings ?? 0} confirmed
            </p>
          </div>

          {/* 4. Total Paid Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-2">
            <div className="flex items-center justify-between text-heritage-charcoal-400">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Paid Revenue</span>
              <IndianRupee className="w-4 h-4 text-heritage-green" />
            </div>
            <p className="font-serif text-2xl font-bold text-heritage-green">
              ₹{(metrics.totalRevenue ?? 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-heritage-charcoal-400">Official ASI Tariffs</p>
          </div>

          {/* 5. Today's Bookings */}
          <div className="bg-white p-5 rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-2">
            <div className="flex items-center justify-between text-heritage-charcoal-400">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Today's Visits</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <p className="font-serif text-2xl font-bold text-heritage-charcoal">
              {metrics.todayBookings ?? 0}
            </p>
            <p className="text-[11px] text-heritage-charcoal-400">Current calendar date</p>
          </div>

          {/* 6. Upcoming Visits */}
          <div className="bg-white p-5 rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-2">
            <div className="flex items-center justify-between text-heritage-charcoal-400">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Upcoming Visits</span>
              <TrendingUp className="w-4 h-4 text-heritage-gold" />
            </div>
            <p className="font-serif text-2xl font-bold text-heritage-charcoal">
              {metrics.upcomingVisits ?? 0}
            </p>
            <p className="text-[11px] text-heritage-charcoal-400">Future reservations</p>
          </div>
        </div>
      )}

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Booking & Revenue Trend Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-heritage-charcoal">
                Booking Trends Over Time
              </h2>
              <p className="text-xs text-heritage-charcoal-400 font-sans">
                Daily transaction volume and revenue generation ({range.toUpperCase()})
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-heritage-green" />
                <span>Bookings</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-heritage-gold" />
                <span>Revenue (₹)</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            {charts.bookingTrends?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.bookingTrends}>
                  <defs>
                    <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E3F20" stopOpacity={0.25} />
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
                    dataKey="bookings"
                    stroke="#1E3F20"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#bookingGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-heritage-charcoal-400 font-sans">
                No booking records found for the selected time window.
              </div>
            )}
          </div>
        </div>

        {/* Booking Status Distribution Donut Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-6">
          <div>
            <h2 className="font-serif text-lg font-bold text-heritage-charcoal">
              Booking Status Distribution
            </h2>
            <p className="text-xs text-heritage-charcoal-400 font-sans">
              Confirmed, pending, and cancelled proportions
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {metrics.totalBookings > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.statusDistribution}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {charts.statusDistribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E5DEC9',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-heritage-charcoal-400">No status records.</div>
            )}
          </div>

          {/* Status Breakdown Legend */}
          <div className="space-y-2 pt-2 border-t border-heritage-sandstone/20 text-xs">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-heritage-charcoal">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E3F20]" />
                <span>Confirmed Passes</span>
              </span>
              <span className="font-mono font-bold text-heritage-charcoal">
                {metrics.confirmedBookings ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-heritage-charcoal">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C89D4B]" />
                <span>Pending Reservations</span>
              </span>
              <span className="font-mono font-bold text-heritage-charcoal">
                {metrics.pendingBookings ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-heritage-charcoal">
                <span className="w-2.5 h-2.5 rounded-full bg-[#888478]" />
                <span>Cancelled Passes</span>
              </span>
              <span className="font-mono font-bold text-heritage-charcoal">
                {metrics.cancelledBookings ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Bookings by Heritage Site & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bookings by Heritage Site Bar Chart (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-6">
          <div>
            <h2 className="font-serif text-lg font-bold text-heritage-charcoal">
              Bookings by Heritage Monument
            </h2>
            <p className="text-xs text-heritage-charcoal-400 font-sans">
              Relative reservation volumes across cultural destinations
            </p>
          </div>

          <div className="h-64 w-full">
            {charts.bookingsBySite?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.bookingsBySite} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EAE1" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#7C786F' }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tick={{ fontSize: 10, fill: '#2C2A29' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E5DEC9',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="bookings" fill="#C89D4B" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-heritage-charcoal-400">
                No monument booking distribution available yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions Table (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-heritage-charcoal">
                Recent Bookings
              </h2>
              <p className="text-xs text-heritage-charcoal-400 font-sans">
                Latest transactions processed by the ticketing engine
              </p>
            </div>
            <Link
              href="/admin/bookings"
              className="text-xs text-heritage-green hover:underline font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="py-12 text-center text-xs text-heritage-charcoal-400">
              No recent bookings found.
            </div>
          ) : (
            <div className="divide-y divide-heritage-sandstone/20 overflow-x-auto">
              {recentBookings.map((b) => (
                <div key={b._id} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-mono font-bold text-xs text-heritage-charcoal">
                      {b.bookingReference}
                    </p>
                    <p className="text-xs text-heritage-charcoal-500 font-sans">
                      {b.siteName} • {b.visitDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-heritage-charcoal">
                      ₹{b.totalAmount}
                    </span>
                    <Badge
                      variant={
                        b.bookingStatus === 'confirmed'
                          ? 'success'
                          : b.bookingStatus === 'cancelled'
                          ? 'danger'
                          : 'warning'
                      }
                      className="text-[10px]"
                    >
                      {b.bookingStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
