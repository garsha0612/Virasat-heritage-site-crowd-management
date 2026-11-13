'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Activity,
  Ticket,
  User,
  ShieldCheck,
  Calendar,
  LogOut,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  CreditCard,
  QrCode,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';

export default function VisitorDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingError, setBookingError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'

  // Cancellation Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of travel plans');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedRefundBooking, setSelectedRefundBooking] = useState(null);
  const [refundReason, setRefundReason] = useState('Personal emergency or illness');
  const [refundDetails, setRefundDetails] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [refundSuccessMsg, setRefundSuccessMsg] = useState('');

  // Fetch bookings whenever user is verified
  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      setBookingError('');
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (res.ok && data.success) {
        setBookings(data.data.bookings || []);
      } else {
        setBookingError(data.message || 'Unable to retrieve reservations.');
      }
    } catch (err) {
      setBookingError('Network connectivity error while retrieving bookings.');
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.replace('/admin');
        return;
      }
      fetchBookings();
    }
  }, [user, router]);

  // Open Cancel Modal
  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
    setCancelReason('Change of travel plans');
    setCancelError('');
    setIsCancelModalOpen(true);
  };

  // Confirm Cancellation
  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;
    try {
      setCancelling(true);
      setCancelError('');
      const res = await fetch(`/api/bookings/${selectedBooking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Update booking in local state
        setBookings((prev) =>
          prev.map((b) =>
            b.id === selectedBooking.id
              ? {
                  ...b,
                  bookingStatus: 'cancelled',
                  cancellation: {
                    cancelledAt: new Date().toISOString(),
                    reason: cancelReason,
                    refundStatus: 'processed',
                  },
                }
              : b
          )
        );
        setIsCancelModalOpen(false);
        setCancelSuccessMsg(`Reservation ${selectedBooking.bookingReference} has been cancelled successfully.`);
        setTimeout(() => setCancelSuccessMsg(''), 6000);
      } else {
        setCancelError(data.message || 'Failed to cancel reservation.');
      }
    } catch (err) {
      setCancelError('Network error while processing cancellation.');
    } finally {
      setCancelling(false);
    }
  };

  // Open Refund Modal
  const openRefundModal = (booking) => {
    setSelectedRefundBooking(booking);
    setRefundReason('Personal emergency or illness');
    setRefundDetails('');
    setRefundError('');
    setIsRefundModalOpen(true);
  };

  // Submit Refund Request
  const handleConfirmRefundRequest = async () => {
    if (!selectedRefundBooking) return;
    try {
      setSubmittingRefund(true);
      setRefundError('');
      const res = await fetch(`/api/bookings/${selectedRefundBooking.id}/refund-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: refundReason,
          supportingDetails: refundDetails,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === selectedRefundBooking.id
              ? {
                  ...b,
                  refund: {
                    status: 'REQUESTED',
                    refundId: data.data.refundId,
                    requestedAt: new Date().toISOString(),
                    reason: refundReason,
                    requestedAmount: selectedRefundBooking.totalAmount,
                  },
                }
              : b
          )
        );
        setIsRefundModalOpen(false);
        setRefundSuccessMsg(
          `Refund request ${data.data.refundId} submitted successfully. An administrator will review your request.`
        );
        setTimeout(() => setRefundSuccessMsg(''), 8000);
      } else {
        setRefundError(data.message || 'Failed to submit refund request.');
      }
    } catch (err) {
      setRefundError('Network error submitting refund request.');
    } finally {
      setSubmittingRefund(false);
    }
  };

  if (authLoading) {
    return (
      <div className="py-12 sm:py-16">
        <Container size="xl" className="space-y-8">
          <Skeleton variant="title" className="w-80 h-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton variant="card" className="h-40" />
            <Skeleton variant="card" className="h-40" />
            <Skeleton variant="card" className="h-40" />
          </div>
          <Skeleton variant="card" className="h-80" />
        </Container>
      </div>
    );
  }

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Recently Joined';

  // Categorize bookings
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingBookings = bookings.filter(
    (b) => b.visitDate >= todayStr && b.bookingStatus !== 'cancelled'
  );
  const pastOrCancelledBookings = bookings.filter(
    (b) => b.visitDate < todayStr || b.bookingStatus === 'cancelled'
  );
  const refundBookings = bookings.filter(
    (b) => b.refund?.status && b.refund.status !== 'NOT_REQUESTED'
  );

  const displayedBookings =
    activeTab === 'upcoming'
      ? upcomingBookings
      : activeTab === 'past'
      ? pastOrCancelledBookings
      : refundBookings;

  return (
    <div className="py-10 sm:py-16 bg-heritage-ivory min-h-[calc(100vh-160px)]">
      <Container size="xl">
        {/* Welcome Banner */}
        <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 sm:p-10 mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-heritage-green/10 text-heritage-green border border-heritage-green/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified {user?.role === 'admin' ? 'Administrator' : 'Visitor'}
                </span>
                <span className="text-xs text-heritage-charcoal-400 font-mono">
                  ID: {user?.id?.slice(-8) || 'SESSION'}
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-4xl font-bold text-heritage-charcoal">
                Namaste, {user?.name || 'Visitor'}
              </h1>
              <p className="text-xs sm:text-sm text-heritage-charcoal-500 font-sans max-w-xl">
                Welcome to your personal ANVAYA portal. Monitor real-time monument crowd densities, plan historical itineraries, and manage entry passes.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button href="/profile" variant="outline" size="sm" leftIcon={User}>
                Account Settings
              </Button>
              <Button variant="secondary" size="sm" onClick={logout} leftIcon={LogOut}>
                Sign Out
              </Button>
            </div>
          </div>

          {/* Account Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-heritage-sandstone/15 text-xs">
            <div>
              <p className="text-heritage-charcoal-400 uppercase tracking-wider text-[10px] font-bold">
                Registered Email
              </p>
              <p className="font-semibold text-heritage-charcoal mt-1 truncate">
                {user?.email}
              </p>
            </div>
            <div>
              <p className="text-heritage-charcoal-400 uppercase tracking-wider text-[10px] font-bold">
                Visitor Nationality
              </p>
              <p className="font-semibold text-heritage-charcoal mt-1">
                {user?.nationality || 'Indian'}
              </p>
            </div>
            <div>
              <p className="text-heritage-charcoal-400 uppercase tracking-wider text-[10px] font-bold">
                Registered Contact
              </p>
              <p className="font-semibold text-heritage-charcoal mt-1">
                {user?.phone || 'Not Specified'}
              </p>
            </div>
            <div>
              <p className="text-heritage-charcoal-400 uppercase tracking-wider text-[10px] font-bold">
                Member Since
              </p>
              <p className="font-semibold text-heritage-charcoal mt-1">
                {joinDate}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Portal Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Explore */}
          <Link
            href="/explore"
            className="group block bg-white rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 hover:shadow-heritage-md hover:border-heritage-sandstone transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-heritage-sandstone-100 text-heritage-green flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-heritage-charcoal group-hover:text-heritage-green transition-colors flex items-center justify-between">
              Explore Destinations
              <ArrowRight className="w-4 h-4 text-heritage-sandstone-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-heritage-charcoal-500 mt-2 font-sans leading-relaxed">
              Browse 6 pilot archaeological wonders, architectural styles, and visiting guidelines.
            </p>
          </Link>

          {/* Card 2: Crowd Status */}
          <Link
            href="/crowd-status"
            className="group block bg-white rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 hover:shadow-heritage-md hover:border-heritage-green transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-heritage-green flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-heritage-charcoal group-hover:text-heritage-green transition-colors flex items-center justify-between">
              Live Crowd Telemetry
              <ArrowRight className="w-4 h-4 text-heritage-sandstone-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-heritage-charcoal-500 mt-2 font-sans leading-relaxed">
              Check real-time monument occupancy meters and historical peak time indicators.
            </p>
          </Link>

          {/* Card 3: Profile Settings */}
          <Link
            href="/profile"
            className="group block bg-white rounded-2xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 hover:shadow-heritage-md hover:border-heritage-gold transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-heritage-sandstone-100 text-heritage-gold flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <User className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-heritage-charcoal group-hover:text-heritage-green transition-colors flex items-center justify-between">
              Profile & Security
              <ArrowRight className="w-4 h-4 text-heritage-sandstone-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-heritage-charcoal-500 mt-2 font-sans leading-relaxed">
              Update personal details, nationality tiers, and modify account credentials.
            </p>
          </Link>
        </div>

        {/* Global Action Notifications */}
        {cancelSuccessMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cancelSuccessMsg}</span>
          </div>
        )}
        {refundSuccessMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{refundSuccessMsg}</span>
          </div>
        )}

        {/* Booking History Section */}
        <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-heritage-sandstone/20">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-heritage-charcoal">
                Ticket Reservations & Passes
              </h2>
              <p className="text-xs text-heritage-charcoal-500 mt-1 font-sans">
                Active time-slots, digital gate passes, and historical visit records.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchBookings}
                leftIcon={RotateCcw}
                className="text-xs text-heritage-charcoal-500 hover:text-heritage-charcoal"
              >
                Refresh
              </Button>
              <Button href="/explore" variant="primary" size="sm" leftIcon={Ticket}>
                Book New Pass
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-4 mt-6 border-b border-heritage-sandstone/15">
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`pb-3 text-xs font-semibold font-sans tracking-wide transition-colors relative flex items-center gap-2 ${
                activeTab === 'upcoming'
                  ? 'text-heritage-green border-b-2 border-heritage-green'
                  : 'text-heritage-charcoal-500 hover:text-heritage-charcoal'
              }`}
            >
              <span>Active & Upcoming Visits</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'upcoming'
                    ? 'bg-heritage-green/15 text-heritage-green'
                    : 'bg-heritage-sandstone-100 text-heritage-charcoal-500'
                }`}
              >
                {upcomingBookings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('past')}
              className={`pb-3 text-xs font-semibold font-sans tracking-wide transition-colors relative flex items-center gap-2 ${
                activeTab === 'past'
                  ? 'text-heritage-green border-b-2 border-heritage-green'
                  : 'text-heritage-charcoal-500 hover:text-heritage-charcoal'
              }`}
            >
              <span>Past & Cancelled Passes</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'past'
                    ? 'bg-heritage-green/15 text-heritage-green'
                    : 'bg-heritage-sandstone-100 text-heritage-charcoal-500'
                }`}
              >
                {pastOrCancelledBookings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('refunds')}
              className={`pb-3 text-xs font-semibold font-sans tracking-wide transition-colors relative flex items-center gap-2 ${
                activeTab === 'refunds'
                  ? 'text-heritage-green border-b-2 border-heritage-green'
                  : 'text-heritage-charcoal-500 hover:text-heritage-charcoal'
              }`}
            >
              <span>Refund Requests</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'refunds'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-heritage-sandstone-100 text-heritage-charcoal-500'
                }`}
              >
                {refundBookings.length}
              </span>
            </button>
          </div>

          {/* Content Area */}
          <div className="mt-8">
            {loadingBookings ? (
              <div className="space-y-4">
                <Skeleton variant="card" className="h-32" />
                <Skeleton variant="card" className="h-32" />
              </div>
            ) : bookingError ? (
              <div className="p-8 text-center bg-red-50/50 rounded-2xl border border-red-200">
                <p className="text-xs text-red-600 font-semibold">{bookingError}</p>
                <Button
                  onClick={fetchBookings}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Retry Loading
                </Button>
              </div>
            ) : displayedBookings.length === 0 ? (
              /* Empty State */
              <div className="py-14 sm:py-16 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-heritage-sandstone-100 text-heritage-sandstone-600 flex items-center justify-center mx-auto mb-4 border border-heritage-sandstone/30">
                  <Ticket className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-bold text-heritage-charcoal">
                  {activeTab === 'upcoming'
                    ? 'No Active Reservations'
                    : activeTab === 'refunds'
                    ? 'No Active Refund Requests'
                    : 'No Historical or Cancelled Passes'}
                </h3>
                <p className="text-xs text-heritage-charcoal-500 mt-2 leading-relaxed font-sans">
                  {activeTab === 'upcoming'
                    ? 'You have no upcoming monument visits scheduled. Explore our 6 pilot heritage destinations to reserve guaranteed entry permits.'
                    : activeTab === 'refunds'
                    ? 'You do not have any pending or historical refund requests. Completed payments are eligible for refund review prior to scheduled visit dates.'
                    : 'You do not have any past visits or cancelled reservations on record.'}
                </p>
                {activeTab === 'upcoming' && (
                  <div className="mt-6">
                    <Button href="/explore" variant="primary" size="md" leftIcon={Compass}>
                      Explore Destinations to Book
                    </Button>
                  </div>
                )}
                {activeTab === 'refunds' && (
                  <div className="mt-6">
                    <Button href="/account/refunds" variant="outline" size="sm" leftIcon={RotateCcw}>
                      View Refund Audit History
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Bookings List */
              <div className="space-y-4">
                {displayedBookings.map((b) => {
                  const isConfirmed = b.bookingStatus === 'confirmed';
                  const isPending = b.bookingStatus === 'pending';
                  const isCancelled = b.bookingStatus === 'cancelled';

                  return (
                    <div
                      key={b.id}
                      className="border border-heritage-sandstone/30 rounded-2xl p-5 sm:p-6 bg-white hover:border-heritage-sandstone/60 transition-all shadow-sm"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                        {/* Left: Monument & Timing */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2.5">
                            {isConfirmed && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Confirmed Pass
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="w-3 h-3" /> Payment Pending
                              </span>
                            )}
                            {isCancelled && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                <XCircle className="w-3 h-3" /> Cancelled
                              </span>
                            )}

                            <span className="text-xs font-mono font-bold text-heritage-charcoal bg-heritage-sandstone-100 px-2 py-0.5 rounded border border-heritage-sandstone/30">
                              {b.bookingReference}
                            </span>
                          </div>

                          <h3 className="font-serif text-lg sm:text-xl font-bold text-heritage-charcoal">
                            {b.siteName}
                          </h3>

                          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-heritage-charcoal-500 font-sans">
                            <span className="flex items-center gap-1.5 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-heritage-green" />
                              {b.visitDate}
                            </span>
                            <span className="flex items-center gap-1.5 font-mono">
                              <Clock className="w-3.5 h-3.5 text-heritage-terracotta" />
                              {b.timeSlot?.startTime} – {b.timeSlot?.endTime} ({b.timeSlot?.slotLabel})
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Ticket className="w-3.5 h-3.5 text-heritage-sandstone-500" />
                              {b.totalTickets} Visitor(s)
                            </span>
                          </div>

                          {/* Refund & Cancellation Status Alert */}
                          {b.refund?.status && b.refund.status !== 'NOT_REQUESTED' ? (
                            <div className="mt-2.5 p-3 rounded-xl border text-[11px] font-sans flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-heritage-ivory/60 border-heritage-sandstone/30">
                              <div>
                                <div className="flex items-center gap-1.5 font-bold text-heritage-charcoal">
                                  <RotateCcw className="w-3.5 h-3.5 text-heritage-green shrink-0" />
                                  <span>Refund Request: {b.refund.refundId || 'In Progress'}</span>
                                </div>
                                <p className="text-heritage-charcoal-500 mt-0.5">
                                  Reason: "{b.refund.reason}"
                                  {b.refund.adminNote && ` — Note: ${b.refund.adminNote}`}
                                </p>
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                {b.refund.status === 'REQUESTED' && <Badge variant="warning">Under Review</Badge>}
                                {b.refund.status === 'UNDER_REVIEW' && <Badge variant="info">Under Review</Badge>}
                                {b.refund.status === 'APPROVED' && <Badge variant="primary">Approved (Queued)</Badge>}
                                {b.refund.status === 'PROCESSING' && <Badge variant="info">Processing via Gateway</Badge>}
                                {b.refund.status === 'REFUNDED' && <Badge variant="success">Refunded (₹{b.refund.approvedAmount || b.totalAmount})</Badge>}
                                {b.refund.status === 'REJECTED' && <Badge variant="danger">Rejected</Badge>}
                                {b.refund.status === 'FAILED' && <Badge variant="danger">Gateway Failed</Badge>}
                              </div>
                            </div>
                          ) : isCancelled && b.cancellation ? (
                            <p className="text-[11px] text-red-700 bg-red-50/60 px-3 py-1.5 rounded-lg border border-red-100 mt-2">
                              Cancelled on {new Date(b.cancellation.cancelledAt).toLocaleDateString('en-IN')}: {b.cancellation.reason}.
                            </p>
                          ) : null}
                        </div>

                        {/* Right: Tariff & Action CTAs */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-heritage-sandstone/15">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] uppercase font-bold text-heritage-charcoal-400 block">
                              Total Tariff
                            </span>
                            <span className="font-mono text-base sm:text-lg font-bold text-heritage-charcoal">
                              ₹{b.totalAmount}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {isConfirmed && (
                              <>
                                <Button
                                  href={`/tickets/${b.bookingReference}`}
                                  variant="primary"
                                  size="sm"
                                  leftIcon={QrCode}
                                >
                                  Digital Pass & QR
                                </Button>
                                {b.visitDate >= todayStr && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openCancelModal(b)}
                                    className="text-red-700 border-red-200 hover:bg-red-50 hover:border-red-300"
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </>
                            )}

                            {isPending && (
                              <>
                                <Button
                                  href={`/booking/payment/${b.id}`}
                                  variant="primary"
                                  size="sm"
                                  leftIcon={CreditCard}
                                >
                                  Complete Payment
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openCancelModal(b)}
                                  className="text-red-700 border-red-200 hover:bg-red-50"
                                >
                                  Cancel
                                </Button>
                              </>
                            )}

                            {/* Request Refund Action for eligible bookings */}
                            {(b.paymentStatus === 'completed' || b.paymentStatus === 'paid') &&
                              (!b.refund?.status || ['NOT_REQUESTED', 'FAILED'].includes(b.refund.status)) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRefundModal(b)}
                                  leftIcon={RotateCcw}
                                  className="text-amber-800 border-amber-300 hover:bg-amber-50"
                                >
                                  Request Refund
                                </Button>
                              )}

                            {/* Track Refund Action for bookings with active/historical refund */}
                            {b.refund?.status && !['NOT_REQUESTED', 'FAILED'].includes(b.refund.status) && (
                              <Button
                                href="/account/refunds"
                                variant="outline"
                                size="sm"
                                leftIcon={RotateCcw}
                                className="text-amber-800 border-amber-300 hover:bg-amber-50"
                              >
                                Track Refund
                              </Button>
                            )}

                            {isCancelled && (
                              <Button
                                href={`/tickets/${b.bookingReference}`}
                                variant="outline"
                                size="sm"
                                leftIcon={Ticket}
                              >
                                View Void Pass
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Cancellation Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => !cancelling && setIsCancelModalOpen(false)}
        title="Cancel Monument Reservation"
        description="Cancelling this reservation will void your entry pass and release the time slot back to monument public inventory."
      >
        {selectedBooking && (
          <div className="space-y-4 text-xs font-sans">
            {cancelError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold">
                {cancelError}
              </div>
            )}

            <div className="bg-heritage-ivory p-4 rounded-xl border border-heritage-sandstone/30 space-y-2">
              <div className="flex justify-between">
                <span className="text-heritage-charcoal-500">Monument:</span>
                <strong className="text-heritage-charcoal">{selectedBooking.siteName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-heritage-charcoal-500">Booking Reference:</span>
                <span className="font-mono font-bold text-heritage-green">
                  {selectedBooking.bookingReference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-heritage-charcoal-500">Scheduled Visit:</span>
                <span className="font-semibold text-heritage-charcoal">
                  {selectedBooking.visitDate} ({selectedBooking.timeSlot?.startTime} – {selectedBooking.timeSlot?.endTime})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-heritage-charcoal-500">Reserved Passes:</span>
                <span className="font-semibold text-heritage-charcoal">
                  {selectedBooking.totalTickets} Visitor(s)
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-heritage-sandstone/20">
                <span className="text-heritage-charcoal-500">Total Tariff:</span>
                <strong className="text-heritage-green font-mono text-sm">
                  ₹{selectedBooking.totalAmount}
                </strong>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-heritage-charcoal-600 uppercase tracking-wider mb-1.5">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                disabled={cancelling}
                className="w-full px-3 py-2 text-xs rounded-xl border border-heritage-sandstone/40 bg-white focus:outline-none focus:ring-2 focus:ring-heritage-sandstone text-heritage-charcoal"
              >
                <option value="Change of travel plans">Change of travel plans</option>
                <option value="Emergency or personal reasons">Emergency or personal reasons</option>
                <option value="Booked incorrect date or monument">Booked incorrect date or monument</option>
                <option value="Inclement weather expected">Inclement weather expected</option>
                <option value="Other reasons">Other reasons</option>
              </select>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-heritage-sandstone/15">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={cancelling}
              >
                Keep Reservation
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmCancel}
                isLoading={cancelling}
                className="bg-red-700 hover:bg-red-800 text-white border-red-700"
              >
                {cancelling ? 'Processing...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Request Refund Modal */}
      <Modal
        isOpen={isRefundModalOpen}
        onClose={() => !submittingRefund && setIsRefundModalOpen(false)}
        title="Request Monument Pass Refund"
        description="All refunds are submitted for administrative review and verified against monument entry records before genuine Cashfree gateway settlement."
      >
        {selectedRefundBooking && (
          <div className="space-y-4 text-xs font-sans">
            {refundError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold">
                {refundError}
              </div>
            )}

            <div className="bg-heritage-ivory p-4 rounded-xl border border-heritage-sandstone/30 space-y-2">
              <div className="flex justify-between">
                <span className="text-heritage-charcoal-500">Monument:</span>
                <strong className="text-heritage-charcoal">{selectedRefundBooking.siteName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-heritage-charcoal-500">Booking Reference:</span>
                <span className="font-mono font-bold text-heritage-green">
                  {selectedRefundBooking.bookingReference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-heritage-charcoal-500">Visit Date:</span>
                <span className="font-semibold text-heritage-charcoal">
                  {selectedRefundBooking.visitDate}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-heritage-sandstone/20">
                <span className="text-heritage-charcoal-500">Eligible Refund Amount:</span>
                <strong className="text-heritage-green font-mono text-sm">
                  ₹{selectedRefundBooking.totalAmount}
                </strong>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-heritage-charcoal-600 uppercase tracking-wider mb-1.5">
                Reason for Refund Request *
              </label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                disabled={submittingRefund}
                className="w-full px-3 py-2 text-xs rounded-xl border border-heritage-sandstone/40 bg-white focus:outline-none focus:ring-2 focus:ring-heritage-sandstone text-heritage-charcoal"
              >
                <option value="Personal emergency or illness">Personal emergency or illness</option>
                <option value="Travel cancellation or reschedule">Travel cancellation or reschedule</option>
                <option value="Accidental duplicate reservation">Accidental duplicate reservation</option>
                <option value="Monument closure or severe weather">Monument closure or severe weather</option>
                <option value="Other valid justification">Other valid justification</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-heritage-charcoal-600 uppercase tracking-wider mb-1.5">
                Supporting Details (Optional)
              </label>
              <textarea
                value={refundDetails}
                onChange={(e) => setRefundDetails(e.target.value)}
                placeholder="Provide additional context for the administrator to verify..."
                rows={3}
                disabled={submittingRefund}
                className="w-full px-3 py-2 text-xs rounded-xl border border-heritage-sandstone/40 bg-white focus:outline-none focus:ring-2 focus:ring-heritage-sandstone text-heritage-charcoal"
              />
            </div>

            <p className="text-[11px] text-heritage-charcoal-400 italic">
              * Note: Submitting a refund request places your booking under administrator review. Upon approval, your reservation is cancelled, slot capacity returned to quota, and the refund settled via Cashfree. If rejected, your reservation remains active and valid.
            </p>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-heritage-sandstone/15">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRefundModalOpen(false)}
                disabled={submittingRefund}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRefundRequest}
                isLoading={submittingRefund}
                className="bg-amber-800 hover:bg-amber-900 text-white border-amber-800"
              >
                {submittingRefund ? 'Submitting...' : 'Submit Refund Request'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
