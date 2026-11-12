'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Ticket,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Download,
  LayoutDashboard,
  Compass,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

export default function BookingConfirmationPage({ params }) {
  const reference = params.reference;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [paymentVerified, setPaymentVerified] = useState(false);

  useEffect(() => {
    async function loadAndVerifyConfirmation() {
      try {
        setLoading(true);

        // Step 1: Load booking details
        const res = await fetch(`/api/bookings/${reference}`);
        const data = await res.json();
        
        if (!res.ok || !data.success) {
          setError(data.message || 'Unable to load confirmation.');
          setLoading(false);
          return;
        }

        const bookingData = data.data.booking;
        setBooking(bookingData);

        // Step 2: Verify payment if not already completed
        if (bookingData.paymentStatus !== 'completed') {
          setVerifying(true);
          
          try {
            const verifyRes = await fetch(
              `/api/payments/verify?bookingReference=${reference}`
            );
            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              // Payment verified successfully
              if (verifyData.data.paymentStatus === 'completed') {
                setPaymentVerified(true);
                // Reload booking to get updated data with QR ticket
                const updatedRes = await fetch(`/api/bookings/${reference}`);
                const updatedData = await updatedRes.json();
                if (updatedData.success) {
                  setBooking(updatedData.data.booking);
                }
              } else {
                // Payment not completed yet
                setPaymentVerified(false);
              }
            }
          } catch (verifyErr) {
            console.error('Payment verification error:', verifyErr);
            // Continue showing page even if verification fails
          }
          
          setVerifying(false);
        } else {
          // Payment already completed
          setPaymentVerified(true);
        }

      } catch (err) {
        console.error('Confirmation load error:', err);
        setError('Network error occurred.');
      } finally {
        setLoading(false);
      }
    }

    if (reference) {
      loadAndVerifyConfirmation();
    }
  }, [reference]);

  if (loading) {
    return (
      <Container size="md" className="py-20 space-y-6">
        <Skeleton variant="circular" className="w-16 h-16 mx-auto" />
        <Skeleton variant="title" className="w-72 h-8 mx-auto" />
        <Skeleton variant="card" className="h-80" />
        {verifying && (
          <p className="text-xs text-center text-heritage-charcoal-500">
            Verifying payment status...
          </p>
        )}
      </Container>
    );
  }

  if (error || !booking) {
    return (
      <Container size="md" className="py-20 text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold text-heritage-charcoal">Confirmation Unavailable</h1>
        <p className="text-xs text-heritage-charcoal-500">{error || 'Reservation could not be retrieved.'}</p>
        <Button href="/dashboard" variant="outline">Return to Dashboard</Button>
      </Container>
    );
  }

  // Show payment pending message if not verified
  if (!paymentVerified && booking.paymentStatus === 'pending') {
    return (
      <div className="py-12 sm:py-20 bg-heritage-ivory min-h-screen">
        <Container size="md">
          <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-md p-8 sm:p-12 text-center space-y-8">
            <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border-2 border-amber-200">
              <Clock className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-heritage-charcoal">
                Payment Verification Pending
              </h1>
              <p className="text-xs sm:text-sm text-heritage-charcoal-500 font-sans max-w-md mx-auto">
                Your booking reservation is created, but payment verification is still in progress.
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 max-w-md mx-auto text-left">
              <p className="text-xs text-amber-900 font-sans space-y-2">
                <strong>What's happening:</strong>
                <br />
                Your payment is being processed. This usually takes a few moments. Once verified, your QR ticket will be generated automatically.
              </p>
            </div>

            <div className="bg-heritage-sandstone-50 border border-heritage-sandstone/25 rounded-2xl p-5 max-w-sm mx-auto">
              <p className="text-[10px] uppercase font-bold text-heritage-charcoal-400 font-sans">
                Booking Reference
              </p>
              <p className="font-mono text-xl sm:text-2xl font-bold text-heritage-green tracking-wider mt-1 select-all">
                {booking.bookingReference}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                onClick={() => window.location.reload()}
                variant="primary"
                size="lg"
                className="w-full justify-center"
              >
                Refresh Status
              </Button>
              <Button
                href="/dashboard"
                variant="outline"
                size="md"
                className="w-full justify-center"
                leftIcon={LayoutDashboard}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Show failed payment message
  if (booking.paymentStatus === 'failed' || booking.bookingStatus === 'failed') {
    return (
      <div className="py-12 sm:py-20 bg-heritage-ivory min-h-screen">
        <Container size="md">
          <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-md p-8 sm:p-12 text-center space-y-8">
            <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border-2 border-rose-200">
              <ShieldCheck className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-heritage-charcoal">
                Payment Not Completed
              </h1>
              <p className="text-xs sm:text-sm text-heritage-charcoal-500 font-sans max-w-md mx-auto">
                Your booking reservation exists, but payment was not completed successfully.
              </p>
            </div>

            <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-5 max-w-md mx-auto text-left">
              <p className="text-xs text-rose-900 font-sans">
                <strong>Reason:</strong> {booking.payment?.failureReason || 'Payment was not completed'}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                href={`/booking/payment/${booking.id}`}
                variant="primary"
                size="lg"
                className="w-full justify-center"
              >
                Retry Payment
              </Button>
              <Button
                href="/dashboard"
                variant="outline"
                size="md"
                className="w-full justify-center"
                leftIcon={LayoutDashboard}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Show confirmed booking (payment verified)
  return (
    <div className="py-12 sm:py-20 bg-heritage-ivory min-h-screen">
      <Container size="md">
        <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-md p-8 sm:p-12 text-center space-y-8">
          {/* Celebratory Icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-heritage-green flex items-center justify-center mx-auto border-2 border-emerald-200">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-heritage-green bg-heritage-green/10 px-3 py-1 rounded-full border border-heritage-green/20">
              Verified Electronic Pass Issued
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-heritage-charcoal">
              Reservation Confirmed!
            </h1>
            <p className="text-xs sm:text-sm text-heritage-charcoal-500 font-sans max-w-md mx-auto">
              Your visit permit to <strong>{booking.siteName}</strong> has been secured with guaranteed entry slot allocation.
            </p>
          </div>

          {/* Reference Banner */}
          <div className="bg-heritage-sandstone-50 border border-heritage-sandstone/25 rounded-2xl p-5 max-w-sm mx-auto">
            <p className="text-[10px] uppercase font-bold text-heritage-charcoal-400 font-sans">
              Official Booking Reference
            </p>
            <p className="font-mono text-xl sm:text-2xl font-bold text-heritage-green tracking-wider mt-1 select-all">
              {booking.bookingReference}
            </p>
            <p className="text-[11px] text-heritage-charcoal-400 mt-1">
              Verification Code: {booking.ticketCode || 'TKT-CONFIRMED'}
            </p>
          </div>

          {/* Dossier Card */}
          <div className="border border-heritage-sandstone/20 rounded-2xl p-6 text-left space-y-3 text-xs font-sans bg-heritage-ivory/40">
            <div className="flex justify-between items-center pb-3 border-b border-heritage-sandstone/15">
              <span className="text-heritage-charcoal-500">Destination:</span>
              <strong className="text-heritage-charcoal font-semibold">{booking.siteName}</strong>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-heritage-sandstone/15">
              <span className="text-heritage-charcoal-500">Scheduled Date:</span>
              <strong className="text-heritage-charcoal font-semibold">{booking.visitDate}</strong>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-heritage-sandstone/15">
              <span className="text-heritage-charcoal-500">Entry Slot:</span>
              <strong className="text-heritage-charcoal font-semibold">
                {booking.timeSlot?.startTime} – {booking.timeSlot?.endTime} ({booking.timeSlot?.slotLabel})
              </strong>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-heritage-sandstone/15">
              <span className="text-heritage-charcoal-500">Admitted Visitors:</span>
              <strong className="text-heritage-charcoal font-semibold">{booking.totalTickets} Visitor Pass(es)</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-heritage-charcoal-500">Total Tariff Paid:</span>
              <strong className="text-heritage-green font-bold text-sm">₹{booking.totalAmount}</strong>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <Button
              href={`/tickets/${booking.bookingReference}`}
              variant="primary"
              size="lg"
              className="w-full justify-center"
              rightIcon={Ticket}
            >
              View Scannable Digital Entry Pass & QR
            </Button>

            <Button
              href="/dashboard"
              variant="outline"
              size="md"
              className="w-full justify-center"
              leftIcon={LayoutDashboard}
            >
              Return to Visitor Dashboard
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
