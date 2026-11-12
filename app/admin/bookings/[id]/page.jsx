'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Ticket,
  Calendar,
  Clock,
  IndianRupee,
  User,
  ShieldCheck,
  AlertCircle,
  QrCode,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';

export default function AdminBookingDetailPage({ params }) {
  const router = useRouter();
  const bookingId = params.id;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cancellation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const fetchBooking = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/admin/bookings/${bookingId}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setBooking(json.data.booking);
      } else {
        setError(json.message || 'Unable to retrieve booking dossier.');
      }
    } catch {
      setError('Network communication error while loading booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) fetchBooking();
  }, [bookingId]);

  const handleAdminCancel = async () => {
    try {
      setCancelling(true);
      setCancelError('');
      const res = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCancelModalOpen(false);
        fetchBooking();
      } else {
        setCancelError(json.message || 'Failed to cancel booking.');
      }
    } catch {
      setCancelError('Network error while processing administrative cancellation.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton variant="title" className="w-64 h-8" />
        <Skeleton variant="card" className="h-96" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="font-serif text-xl font-bold text-heritage-charcoal">
          Booking Dossier Unavailable
        </h2>
        <p className="text-xs text-heritage-charcoal-400 font-sans">
          {error || 'The requested booking reservation could not be found.'}
        </p>
        <Button href="/admin/bookings" variant="outline">
          Back to Bookings Registry
        </Button>
      </div>
    );
  }

  const isCancelled = booking.bookingStatus === 'cancelled';

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-heritage-sandstone/30">
        <div>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-heritage-charcoal-500 hover:text-heritage-green transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Bookings Registry</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal">
              Booking Dossier
            </h1>
            <Badge
              variant={
                booking.bookingStatus === 'confirmed'
                  ? 'success'
                  : isCancelled
                  ? 'danger'
                  : 'warning'
              }
            >
              {booking.bookingStatus}
            </Badge>
          </div>
          <p className="text-xs font-mono text-heritage-charcoal-400 mt-1">
            Ref: {booking.bookingReference}
          </p>
        </div>

        {/* Administrative Actions */}
        {!isCancelled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setCancelReason('');
              setCancelError('');
              setCancelModalOpen(true);
            }}
            className="text-rose-700 border-rose-300 hover:bg-rose-50"
            leftIcon={XCircle}
          >
            Administrative Cancellation
          </Button>
        )}
      </div>

      {/* Cancellation Notice Banner */}
      {isCancelled && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 font-sans">
            <p className="font-bold">Pass Voided / Cancelled</p>
            <p>
              <strong>Cancellation Reason:</strong> {booking.cancellation?.reason || 'Cancelled'}
            </p>
            <p className="text-[11px] text-rose-700">
              Refund Status: {booking.cancellation?.refundStatus} • Timestamp:{' '}
              {booking.cancellation?.cancelledAt
                ? new Date(booking.cancellation.cancelledAt).toLocaleString('en-IN')
                : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Details + Digital Pass */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Order Specifications & Itemized Tariffs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Monument & Slot Information */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-4">
            <h2 className="font-serif text-base font-bold text-heritage-charcoal">
              Destination & Reservation Window
            </h2>

            <div className="space-y-3 text-xs font-sans">
              <div className="flex justify-between items-center py-2 border-b border-heritage-sandstone/15">
                <span className="text-heritage-charcoal-500">Monument</span>
                <span className="font-bold text-heritage-charcoal">{booking.siteName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-heritage-sandstone/15">
                <span className="text-heritage-charcoal-500">Location</span>
                <span className="text-heritage-charcoal-700">{booking.siteLocation}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-heritage-sandstone/15">
                <span className="text-heritage-charcoal-500">Visit Date</span>
                <span className="font-mono font-bold text-heritage-charcoal">{booking.visitDate}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-heritage-sandstone/15">
                <span className="text-heritage-charcoal-500">Entry Window</span>
                <span className="font-mono font-bold text-heritage-green">
                  {booking.timeSlot?.startTime} – {booking.timeSlot?.endTime}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-heritage-charcoal-500">Total Visitors</span>
                <span className="font-mono font-bold text-heritage-charcoal">
                  {booking.totalTickets} Visitor(s)
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Tariff Breakdown */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-4">
            <h2 className="font-serif text-base font-bold text-heritage-charcoal">
              Itemized Official Tariff Calculation
            </h2>

            <div className="space-y-2 text-xs font-sans divide-y divide-heritage-sandstone/15">
              {booking.tickets?.map((t, idx) => (
                <div key={idx} className="flex justify-between items-center pt-2">
                  <div>
                    <span className="font-semibold text-heritage-charcoal">{t.categoryName}</span>
                    <span className="text-[11px] text-heritage-charcoal-400 ml-1.5 font-mono">
                      × {t.quantity}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-heritage-charcoal">₹{t.subtotal}</span>
                </div>
              ))}

              <div className="pt-4 flex justify-between items-end">
                <div>
                  <p className="font-serif font-bold text-base text-heritage-charcoal">Total Amount</p>
                  <p className="text-[10px] text-heritage-charcoal-400 font-mono">
                    Payment Status: {booking.paymentStatus?.toUpperCase()}
                  </p>
                </div>
                <span className="font-serif font-bold text-2xl text-heritage-green">
                  ₹{booking.totalAmount}
                </span>
              </div>
            </div>
          </div>

          {/* Visitor Identification Dossier */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-4 text-xs font-sans">
            <h2 className="font-serif text-base font-bold text-heritage-charcoal">
              Visitor Identity & Contact
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-heritage-charcoal-400 block text-[11px]">Primary Visitor</span>
                <p className="font-bold text-heritage-charcoal mt-0.5">
                  {booking.visitorDetails?.primaryName || booking.visitorDetails?.name}
                </p>
              </div>
              <div>
                <span className="text-heritage-charcoal-400 block text-[11px]">Email Address</span>
                <p className="font-mono text-heritage-charcoal mt-0.5">
                  {booking.visitorDetails?.primaryEmail || booking.visitorDetails?.email}
                </p>
              </div>
              <div>
                <span className="text-heritage-charcoal-400 block text-[11px]">Contact Phone</span>
                <p className="font-mono text-heritage-charcoal mt-0.5">
                  {booking.visitorDetails?.primaryPhone || booking.visitorDetails?.phone || 'Not provided'}
                </p>
              </div>
              <div>
                <span className="text-heritage-charcoal-400 block text-[11px]">Nationality</span>
                <p className="text-heritage-charcoal mt-0.5">
                  {booking.visitorDetails?.nationality || 'Indian'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Scannable Pass & Audit Metadata */}
        <div className="lg:col-span-5 space-y-6">
          {/* Digital Entry Pass Preview */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-md text-center space-y-4 relative overflow-hidden">
            {isCancelled && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <span className="px-6 py-2 rounded-xl bg-rose-600 text-white font-mono font-bold text-base tracking-widest uppercase transform -rotate-12 shadow-lg">
                  VOID / CANCELLED
                </span>
              </div>
            )}

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-heritage-green/10 text-heritage-green text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Electronic Gate Pass</span>
            </div>

            <div className="py-2">
              <h3 className="font-serif text-xl font-bold text-heritage-charcoal">
                {booking.siteName}
              </h3>
              <p className="text-xs font-mono text-heritage-charcoal-400 mt-1">
                Ref: {booking.bookingReference}
              </p>
            </div>

            {/* QR Code Presentation */}
            {booking.qrCodeDataUrl ? (
              <div className="w-48 h-48 mx-auto p-2 bg-white rounded-2xl border-2 border-dashed border-heritage-sandstone/40 shadow-inner flex items-center justify-center">
                <img
                  src={booking.qrCodeDataUrl}
                  alt="Turnstile Gate QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-48 h-48 mx-auto rounded-2xl bg-heritage-sandstone-50 border border-heritage-sandstone/20 flex flex-col items-center justify-center text-heritage-charcoal-400 text-xs">
                <QrCode className="w-8 h-8 mb-2" />
                <span>QR Generated on Payment</span>
              </div>
            )}

            {/* Turnstile Security Code */}
            {booking.ticketCode && (
              <div className="p-3 rounded-2xl bg-heritage-sandstone-50 border border-heritage-sandstone/20">
                <span className="text-[10px] uppercase font-mono tracking-widest text-heritage-charcoal-400 block">
                  Turnstile Optical PIN
                </span>
                <span className="font-mono text-base font-bold tracking-widest text-heritage-charcoal">
                  {booking.ticketCode}
                </span>
              </div>
            )}

            <p className="text-[10px] text-heritage-charcoal-400 font-mono">
              Scannable at automated entry turnstiles and handheld thermal validation terminals.
            </p>
          </div>

          {/* Audit Timestamp Dossier */}
          <div className="bg-white p-6 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-3 text-xs font-mono text-heritage-charcoal-500">
            <h3 className="font-serif text-xs font-bold text-heritage-charcoal uppercase tracking-wider">
              Audit Footprint
            </h3>
            <p>
              Created: {booking.createdAt ? new Date(booking.createdAt).toLocaleString('en-IN') : 'N/A'}
            </p>
            {booking.paidAt && (
              <p>
                Paid: {new Date(booking.paidAt).toLocaleString('en-IN')} via {booking.paymentMethod}
              </p>
            )}
            {booking.idempotencyKey && (
              <p className="truncate">
                Idempotency: {booking.idempotencyKey}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Administrative Cancellation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Administrative Booking Cancellation"
        size="md"
      >
        <div className="space-y-4 text-xs font-sans">
          <p className="text-heritage-charcoal">
            You are about to cancel booking{' '}
            <strong className="font-mono font-bold">{booking.bookingReference}</strong> for{' '}
            <strong>{booking.siteName}</strong>.
          </p>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed">
            <strong>Capacity Restoration Invariant:</strong> Cancellation will atomically release{' '}
            <strong>{booking.totalTickets}</strong> ticket(s) back to the slot inventory using a native
            MongoDB ACID transaction.
          </div>

          <div>
            <label className="block font-semibold text-heritage-charcoal mb-1">
              Cancellation Justification / Reason *
            </label>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Visitor requested phone cancellation due to travel delay..."
              className="w-full px-3 py-2 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-2 focus:ring-heritage-green/20 focus:border-heritage-green font-sans"
            />
          </div>

          {cancelError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
              {cancelError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-heritage-sandstone/20">
            <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(false)}>
              Keep Booking
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={cancelling || !cancelReason.trim()}
              onClick={handleAdminCancel}
              className="bg-rose-700 hover:bg-rose-800 text-white"
            >
              {cancelling ? 'Cancelling in Transaction...' : 'Confirm Cancellation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
