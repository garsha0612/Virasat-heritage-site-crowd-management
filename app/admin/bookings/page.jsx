'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Ticket,
  Search,
  Filter,
  Eye,
  Calendar,
  IndianRupee,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [siteSlug, setSiteSlug] = useState('all');
  const [bookingStatus, setBookingStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [visitDate, setVisitDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchBookings = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pagination.limit));
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      if (search) params.set('search', search);
      if (siteSlug !== 'all') params.set('siteSlug', siteSlug);
      if (bookingStatus !== 'all') params.set('bookingStatus', bookingStatus);
      if (paymentStatus !== 'all') params.set('paymentStatus', paymentStatus);
      if (visitDate) params.set('visitDate', visitDate);

      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setBookings(json.data.bookings || []);
        setPagination(json.data.pagination);
      } else {
        setError(json.message || 'Unable to retrieve bookings.');
      }
    } catch {
      setError('Network communication error while loading bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1);
  }, [siteSlug, bookingStatus, paymentStatus, visitDate, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings(1);
  };

  return (
    <div className="space-y-8">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-heritage-sandstone/30">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal">
            Booking & Reservation Registry
          </h1>
          <p className="text-xs text-heritage-charcoal-400 font-sans mt-1">
            Audit-grade transaction registry with real-time slot synchronization, payment verification, and pass validation.
          </p>
        </div>

        <a
          href="/api/admin/reports/export"
          target="_blank"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-heritage-sandstone/30 hover:border-heritage-green text-heritage-charcoal-700 hover:text-heritage-green text-xs font-semibold shadow-heritage-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit CSV</span>
        </a>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-heritage-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Reference (ANV-...), visitor name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green font-sans"
            />
          </div>

          <Button type="submit" variant="secondary" size="sm" className="shrink-0">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-heritage-sandstone/20 text-xs font-sans">
          <span className="text-heritage-charcoal-400 flex items-center gap-1.5 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </span>

          {/* Booking Status */}
          <select
            value={bookingStatus}
            onChange={(e) => setBookingStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-heritage-sandstone/30 bg-heritage-sandstone-50/50 text-heritage-charcoal text-xs focus:outline-none focus:ring-1 focus:ring-heritage-green"
          >
            <option value="all">All Booking Statuses</option>
            <option value="confirmed">Confirmed Only</option>
            <option value="pending">Pending Only</option>
            <option value="cancelled">Cancelled Only</option>
          </select>

          {/* Payment Status */}
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-heritage-sandstone/30 bg-heritage-sandstone-50/50 text-heritage-charcoal text-xs focus:outline-none focus:ring-1 focus:ring-heritage-green"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid Only</option>
            <option value="pending">Payment Pending</option>
            <option value="failed">Payment Failed</option>
          </select>

          {/* Visit Date Filter */}
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="px-3 py-1 rounded-xl border border-heritage-sandstone/30 bg-heritage-sandstone-50/50 text-heritage-charcoal text-xs font-mono focus:outline-none focus:ring-1 focus:ring-heritage-green"
          />

          {visitDate && (
            <button
              type="button"
              onClick={() => setVisitDate('')}
              className="text-[11px] text-rose-600 hover:underline"
            >
              Clear Date
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchBookings(pagination.page)}
            className="p-1.5 text-heritage-charcoal-400 hover:text-heritage-green ml-auto"
            title="Refresh bookings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-14" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Ticket className="w-12 h-12 text-heritage-sandstone-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-heritage-charcoal">
              No Booking Records Found
            </h3>
            <p className="text-xs text-heritage-charcoal-400 max-w-sm mx-auto font-sans">
              No bookings matched your search and filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-heritage-sandstone-50/60 border-b border-heritage-sandstone/20 text-heritage-charcoal-500 uppercase tracking-wider text-[10px] font-mono font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Reference</th>
                  <th className="py-3.5 px-4">Visitor</th>
                  <th className="py-3.5 px-4">Monument</th>
                  <th className="py-3.5 px-4">Visit Date & Slot</th>
                  <th className="py-3.5 px-4 text-center">Tickets</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-heritage-sandstone/15">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-heritage-sandstone-50/40 transition-colors">
                    {/* Booking Reference */}
                    <td className="py-4 px-6 font-mono font-bold text-xs text-heritage-charcoal">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="hover:text-heritage-green transition-colors"
                      >
                        {b.bookingReference}
                      </Link>
                    </td>

                    {/* Visitor */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-heritage-charcoal">{b.visitorName}</p>
                        <p className="text-[11px] text-heritage-charcoal-400 font-mono truncate max-w-[160px]">
                          {b.visitorEmail}
                        </p>
                      </div>
                    </td>

                    {/* Monument */}
                    <td className="py-4 px-4 text-heritage-charcoal font-medium">
                      {b.siteName}
                    </td>

                    {/* Visit Date & Slot */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-medium text-heritage-charcoal">{b.visitDate}</span>
                        <p className="text-[11px] text-heritage-charcoal-400 font-mono">
                          {b.timeSlot?.startTime ? `${b.timeSlot.startTime} – ${b.timeSlot.endTime}` : 'Standard'}
                        </p>
                      </div>
                    </td>

                    {/* Total Tickets */}
                    <td className="py-4 px-4 text-center font-mono font-semibold text-heritage-charcoal">
                      {b.totalTickets}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-4 text-right font-mono font-bold text-heritage-charcoal">
                      ₹{b.totalAmount}
                    </td>

                    {/* Status Badges */}
                    <td className="py-4 px-4 text-center space-y-1">
                      <Badge
                        variant={
                          b.bookingStatus === 'confirmed'
                            ? 'success'
                            : b.bookingStatus === 'cancelled'
                            ? 'danger'
                            : 'warning'
                        }
                        className="text-[10px] block"
                      >
                        {b.bookingStatus}
                      </Badge>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="inline-flex items-center gap-1 p-1.5 rounded-lg border border-heritage-sandstone/30 hover:border-heritage-green text-heritage-charcoal-500 hover:text-heritage-green transition-colors"
                        title="View Full Booking Dossier"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-medium hidden sm:inline">Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-heritage-sandstone-50/40 border-t border-heritage-sandstone/20 flex items-center justify-between text-xs font-sans">
            <span className="text-heritage-charcoal-400">
              Showing page <strong>{pagination.page}</strong> of{' '}
              <strong>{pagination.totalPages}</strong> ({pagination.total} total bookings)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchBookings(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-heritage-sandstone/30 hover:bg-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchBookings(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-heritage-sandstone/30 hover:bg-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
