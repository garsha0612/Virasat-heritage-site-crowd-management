'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  Printer,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Building2,
  Info,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

export default function DigitalTicketPage({ params }) {
  const reference = params.reference;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTicket() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/bookings/${reference}`);
        const data = await res.json();
        if (res.ok && data.success) {
          const bookingData = data.data.booking;
          
          // Check if payment is completed
          if (bookingData.paymentStatus !== 'completed' || bookingData.bookingStatus !== 'confirmed') {
            setError('Ticket not available. Payment must be completed before accessing your digital ticket.');
            setBooking(bookingData); // Still set booking for reference info
          } else if (!bookingData.qrCodeDataUrl || !bookingData.ticketCode) {
            setError('QR ticket is being generated. Please refresh in a moment.');
            setBooking(bookingData);
          } else {
            setBooking(bookingData);
          }
        } else {
          setError(data.message || 'Unable to retrieve ticket pass.');
        }
      } catch (err) {
        setError('Network connectivity error. Could not retrieve ticket.');
      } finally {
        setLoading(false);
      }
    }

    if (reference) {
      loadTicket();
    }
  }, [reference]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="py-16 sm:py-24 bg-heritage-ivory min-h-screen">
        <Container size="md" className="space-y-6">
          <Skeleton variant="title" className="w-64 h-8 mx-auto" />
          <Skeleton variant="card" className="h-96" />
        </Container>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="py-16 sm:py-24 bg-heritage-ivory min-h-screen">
        <Container size="md" className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-200">
            <XCircle className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal">
            Electronic Pass Not Found
          </h1>
          <p className="text-xs sm:text-sm text-heritage-charcoal-500 max-w-md mx-auto">
            {error || 'The requested ticket reservation could not be verified in the national database.'}
          </p>
          <div className="pt-2">
            <Button href="/dashboard" variant="primary" leftIcon={ArrowLeft}>
              Return to Visitor Dashboard
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  const isConfirmed = booking.bookingStatus === 'confirmed';
  const isCancelled = booking.bookingStatus === 'cancelled';
  const isPending = booking.bookingStatus === 'pending';

  return (
    <div className="py-8 sm:py-16 bg-heritage-ivory min-h-screen">
      <Container size="md">
        {/* Top Actions Bar (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 print:hidden">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-heritage-green hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={Printer}
              className="bg-white hover:bg-heritage-sandstone-50"
            >
              Print / Save PDF
            </Button>
            {isPending && (
              <Button
                href={`/booking/payment/${booking.id}`}
                variant="primary"
                size="sm"
                leftIcon={Ticket}
              >
                Complete Payment
              </Button>
            )}
          </div>
        </div>

        {/* Official Ticket Card Container */}
        <div
          id="printable-ticket"
          className="bg-white rounded-3xl border-2 border-heritage-sandstone/40 shadow-heritage-md overflow-hidden print:border-none print:shadow-none print:rounded-none print:m-0"
        >
          {/* Top Security Ribbon */}
          <div className="bg-heritage-ivory text-heritage-charcoal-700 px-6 py-2 text-[10px] sm:text-xs font-mono font-semibold text-center border-b border-heritage-sandstone/30">
            OFFICIAL DIGITAL PASS • ARCHAEOLOGICAL SURVEY & HERITAGE MANAGEMENT GATEWAY
          </div>

          {/* Pass Header */}
          <div className="bg-heritage-charcoal text-white p-6 sm:p-8 border-b-4 border-heritage-gold">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase font-mono tracking-widest text-heritage-gold font-bold">
                  ANVAYA Smart Heritage Management System
                </p>
                <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                  Digital Monument Entry Pass
                </h1>
                <p className="text-xs text-heritage-sandstone-300 font-sans mt-0.5">
                  Electronic ticket dossier — retain for gate verification reference
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-mono tracking-wider text-heritage-sandstone-300 block">
                  Pass Reference
                </span>
                <span className="font-mono text-lg sm:text-xl font-bold tracking-wider text-heritage-gold">
                  {booking.bookingReference}
                </span>
              </div>
            </div>
          </div>

          {/* Status Ribbon */}
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
              isConfirmed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : isCancelled
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {isConfirmed && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {isCancelled && <XCircle className="w-4 h-4 text-red-600" />}
              {isPending && <AlertTriangle className="w-4 h-4 text-amber-600" />}
              <span className="uppercase tracking-wider font-mono text-[11px]">
                Status: {booking.bookingStatus}
              </span>
            </div>
            <span className="text-[11px] font-sans">
              {isConfirmed && 'Confirmed Pass — Entry Slot Secured'}
              {isCancelled && 'RESERVATION CANCELLED — PASS VOIDED'}
              {isPending && 'Awaiting Payment'}
            </span>
          </div>

          {/* Monument & Slot Information */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-heritage-sandstone/20">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-heritage-charcoal-500 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-heritage-terracotta" />
                  <span>{booking.siteLocation}</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal">
                  {booking.siteName}
                </h2>
                <p className="text-xs text-heritage-charcoal-400 font-mono">
                  Monument ID: {booking.heritageSite}
                </p>
              </div>

              {/* Slot & Date Badge */}
              <div className="bg-heritage-ivory border border-heritage-sandstone/30 rounded-2xl p-4 sm:text-right shrink-0 min-w-[200px]">
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-heritage-charcoal-400 block font-sans">
                      Date of Visit
                    </span>
                    <span className="font-sans font-bold text-heritage-charcoal text-sm flex items-center sm:justify-end gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-heritage-green" />
                      {booking.visitDate}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-heritage-sandstone/15">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-heritage-charcoal-400 block font-sans">
                      Entry Window
                    </span>
                    <span className="font-mono font-bold text-heritage-green text-sm flex items-center sm:justify-end gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      {booking.timeSlot?.startTime} – {booking.timeSlot?.endTime}
                    </span>
                    <span className="text-[10px] text-heritage-charcoal-400 block mt-0.5">
                      {booking.timeSlot?.slotLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Section: QR Code and Visitor Dossier */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pb-6 border-b border-heritage-sandstone/20">
              {/* QR Code Presentation */}
              <div className="md:col-span-5 flex flex-col items-center text-center p-4 bg-heritage-ivory/60 rounded-2xl border border-heritage-sandstone/25 relative overflow-hidden">
                {isCancelled && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 text-center">
                    <XCircle className="w-12 h-12 text-red-600 mb-2" />
                    <span className="font-mono font-bold text-red-700 text-sm tracking-wider">
                      VOID / CANCELLED
                    </span>
                    <span className="text-[10px] text-red-600 mt-1">
                      This QR pass has been permanently deactivated in the demonstration database.
                    </span>
                  </div>
                )}

                {booking.qrCodeDataUrl ? (
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-heritage-sandstone/30">
                    <img
                      src={booking.qrCodeDataUrl}
                      alt={`QR Code Pass for ${booking.bookingReference}`}
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-heritage-sandstone-100 rounded-xl flex items-center justify-center text-heritage-charcoal-400">
                    QR Code Not Generated
                  </div>
                )}

                <div className="mt-3">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-heritage-charcoal-400 block font-bold">
                    Turnstile Verification Hash
                  </span>
                  <span className="font-mono text-xs font-bold text-heritage-charcoal mt-0.5 block select-all">
                    {booking.ticketCode || 'ASI-VERIFIED'}
                  </span>
                  <p className="text-[10px] text-heritage-charcoal-500 mt-1 max-w-[220px]">
                    Scannable 2D barcode for gate turnstile ingress verification.
                  </p>
                </div>
              </div>

              {/* Visitor Details & Ticket Breakdown */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <h3 className="text-xs uppercase font-mono font-bold text-heritage-charcoal-400 tracking-wider">
                    Primary Pass Holder
                  </h3>
                  <div className="mt-2 bg-heritage-ivory/40 p-3.5 rounded-xl border border-heritage-sandstone/20 text-xs font-sans space-y-1">
                    <div className="flex justify-between">
                      <span className="text-heritage-charcoal-500">Name:</span>
                      <strong className="text-heritage-charcoal font-semibold">
                        {booking.visitorDetails?.primaryName || booking.visitorDetails?.fullName || 'Registered Visitor'}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-heritage-charcoal-500">Email:</span>
                      <span className="text-heritage-charcoal font-mono">
                        {booking.visitorDetails?.primaryEmail || booking.visitorDetails?.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-heritage-charcoal-500">Phone:</span>
                      <span className="text-heritage-charcoal font-mono">
                        {booking.visitorDetails?.primaryPhone || booking.visitorDetails?.phone || 'Not Provided'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-heritage-charcoal-500">Nationality Category:</span>
                      <span className="text-heritage-charcoal font-semibold">
                        {booking.visitorDetails?.nationality || 'Indian'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ticket Itemization */}
                <div>
                  <h3 className="text-xs uppercase font-mono font-bold text-heritage-charcoal-400 tracking-wider">
                    Admitted Visitors ({booking.totalTickets} Total)
                  </h3>
                  <div className="mt-2 border border-heritage-sandstone/20 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-heritage-sandstone-100 text-heritage-charcoal-600 font-sans">
                        <tr>
                          <th className="py-2 px-3 font-semibold">Category</th>
                          <th className="py-2 px-3 text-center font-semibold">Qty</th>
                          <th className="py-2 px-3 text-right font-semibold">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-heritage-sandstone/15 font-sans">
                        {booking.tickets?.map((t, idx) => (
                          <tr key={idx} className="hover:bg-heritage-ivory/50">
                            <td className="py-2 px-3 text-heritage-charcoal font-medium">
                              {t.categoryName || t.category}
                            </td>
                            <td className="py-2 px-3 text-center text-heritage-charcoal-600 font-mono">
                              {t.quantity}
                            </td>
                            <td className="py-2 px-3 text-right text-heritage-charcoal font-mono">
                              {t.subtotal === 0 ? 'FREE' : `₹${t.subtotal}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-heritage-ivory/80 font-bold border-t border-heritage-sandstone/20">
                        <tr>
                          <td colSpan="2" className="py-2 px-3 text-heritage-charcoal">
                            Total Admission Tariff
                          </td>
                          <td className="py-2 px-3 text-right text-heritage-green font-mono text-sm">
                            ₹{booking.totalAmount}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Notice if Cancelled */}
            {isCancelled && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>RESERVATION CANCELLED & VOIDED</span>
                </div>
                <p>
                  This reservation was cancelled on{' '}
                  {booking.cancellation?.cancelledAt
                    ? new Date(booking.cancellation.cancelledAt).toLocaleString('en-IN')
                    : 'record'}
                  . Reason: {booking.cancellation?.cancellationReason || booking.cancellation?.reason || 'Visitor request'}.
                </p>
                <p className="text-[11px] text-red-700">
                  Refund Status: {booking.cancellation?.refundStatus || 'none'}.
                  Reserved slot capacity has been restored to the availability pool.
                </p>
              </div>
            )}

            {/* Statutory Regulations & Visiting Rules */}
            <div className="bg-heritage-sandstone-50/70 border border-heritage-sandstone/20 rounded-2xl p-5 text-xs text-heritage-charcoal-500 font-sans space-y-2">
              <div className="flex items-center gap-2 text-heritage-charcoal font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-heritage-green" />
                <span>ASI Visiting Guidelines & Important Notices</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
                <li>
                  <strong>Official Entry:</strong> Real-world entry into protected heritage monuments requires valid admission passes obtained exclusively from official ASI counters or approved ministry web portals.
                </li>
                <li>
                  <strong>Original Identity Proof:</strong> At physical monuments, visitors must present valid government photo identification (Aadhaar, Passport, Driving Licence, or Voter ID).
                </li>
                <li>
                  <strong>Conservation Rules:</strong> Do not touch, deface, or lean on ancient stone carvings or inscribed monuments. Defacing heritage property is an offence under the AMASR Act.
                </li>
                <li>
                  <strong>Payment Pending:</strong> This pass is only valid for entry after payment has been confirmed. Unpaid reservations will not be honoured at the gate.
                </li>
              </ul>
            </div>

            {/* Security Verification Footer */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-heritage-charcoal-400 font-mono border-t border-heritage-sandstone/15">
              <span>SECURITY HASH: {booking.ticketCode?.slice(-16) || 'SEC-VALID'}</span>
              <span>ISSUED BY: ANVAYA SMART HERITAGE MANAGEMENT SYSTEM</span>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
