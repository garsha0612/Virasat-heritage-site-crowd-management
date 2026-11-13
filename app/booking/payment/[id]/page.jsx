'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Calendar,
  Ticket,
  LayoutDashboard,
  CreditCard,
  ShieldCheck,
  Loader,
  RefreshCw,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';

/**
 * Payment Page — /booking/payment/[id]
 *
 * Integrated with Cashfree Payment Gateway (SANDBOX mode).
 *
 * Flow:
 * 1. Load booking details and verify pending payment status
 * 2. Create Cashfree payment order (server-side with server-verified amount)
 * 3. Initialize Cashfree Web SDK v3 (SANDBOX mode)
 * 4. Open Cashfree hosted checkout modal / redirect
 * 5. Verify payment status server-side on confirmation page
 *
 * Security:
 * - SANDBOX environment only (no live payments, test mode)
 * - Server-side order creation with strict user ownership
 * - Payment verification via server API and Cashfree Webhooks
 * - Client cannot forge payment confirmation
 */
export default function PaymentPage({ params }) {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const bookingId = params.id;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const [verifyingStatus, setVerifyingStatus] = useState(false);

  // Load booking details
  const loadBooking = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings/${bookingId}`);
      const data = await res.json();

      if (res.ok && data.success) {
        const b = data.data.booking;

        // Already paid → go straight to confirmation
        if (['completed', 'paid'].includes(b.paymentStatus) && b.bookingStatus === 'confirmed') {
          router.replace(`/booking/confirmation/${b.bookingReference}`);
          return;
        }

        // Cancelled → redirect to dashboard
        if (b.bookingStatus === 'cancelled') {
          router.replace('/dashboard');
          return;
        }

        setBooking(b);
      } else {
        setError(data.message || 'Unable to retrieve reservation details.');
      }
    } catch {
      setError('Network error occurred while loading booking.');
    } finally {
      setLoading(false);
    }
  }, [bookingId, router]);

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId, loadBooking]);

  // Initiate Cashfree payment
  async function initiateCashfreePayment(isRetry = false) {
    try {
      setPaymentLoading(true);
      setPaymentError('');

      // Step 1: Create Cashfree order (server-side)
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId: booking.id || booking._id,
          retry: isRetry 
        })
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || 'Failed to create payment order');
      }

      const { paymentSessionId } = orderData.data;

      // Step 2: Verify Cashfree JS SDK is loaded
      if (typeof window === 'undefined' || !window.Cashfree) {
        throw new Error('Cashfree SDK is initializing. Please try again in a moment.');
      }

      // Step 3: Initialize Cashfree SDK in sandbox mode
      const cashfree = window.Cashfree({
        mode: 'sandbox' // Enforced SANDBOX test mode
      });

      // Step 4: Open Cashfree checkout modal
      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: '_modal'
      };

      cashfree.checkout(checkoutOptions).then((result) => {
        if (result && result.error) {
          console.warn('Cashfree checkout modal notice:', result.error.message);
          setPaymentError(result.error.message || 'Payment window closed or cancelled.');
          setPaymentLoading(false);
        } else if (result && result.redirect) {
          console.log('Payment redirection triggered');
        } else {
          // If modal closed, prompt user to check verification
          setPaymentLoading(false);
        }
      }).catch((checkoutErr) => {
        console.error('Checkout error:', checkoutErr);
        setPaymentError(checkoutErr.message || 'Could not launch payment gateway.');
        setPaymentLoading(false);
      });

    } catch (err) {
      console.error('Payment initialization error:', err);
      setPaymentError(err.message || 'Failed to initialize payment. Please try again.');
      setPaymentLoading(false);
    }
  }

  // Manual payment verification check
  async function checkPaymentStatus() {
    if (!booking) return;
    try {
      setVerifyingStatus(true);
      setPaymentError('');
      const verifyRes = await fetch(
        `/api/payments/verify?bookingReference=${booking.bookingReference}`
      );
      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.success) {
        if (verifyData.data.paymentStatus === 'completed') {
          router.push(`/booking/confirmation/${booking.bookingReference}`);
        } else {
          setPaymentError('Payment is still pending. If you completed payment, please wait a moment and try again.');
        }
      } else {
        setPaymentError(verifyData.message || 'Payment not completed.');
      }
    } catch (err) {
      setPaymentError('Unable to reach verification service. Please try again.');
    } finally {
      setVerifyingStatus(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <Container size="md" className="py-20 space-y-6">
        <Skeleton variant="title" className="w-64 h-8 mx-auto" />
        <Skeleton variant="card" className="h-72" />
      </Container>
    );
  }

  // ── Booking not found / access error ──────────────────────────────────────
  if (error || !booking) {
    return (
      <Container size="md" className="py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-heritage-charcoal">
          Reservation Unavailable
        </h1>
        <p className="text-xs text-heritage-charcoal-500 max-w-sm mx-auto">
          {error || 'The requested booking reservation could not be found or access was restricted.'}
        </p>
        <div className="pt-4">
          <Button href="/dashboard" variant="outline" leftIcon={LayoutDashboard}>
            Return to Dashboard
          </Button>
        </div>
      </Container>
    );
  }

  // ── Payment checkout page ──────────────────────────────────────────────────
  return (
    <>
      {/* Load Cashfree Web SDK v3 */}
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        onLoad={() => {
          console.log('✅ Cashfree Web SDK v3 loaded');
          setCashfreeLoaded(true);
        }}
        onError={() => {
          console.error('❌ Failed to load Cashfree SDK');
          setError('Failed to load payment gateway. Please check internet connectivity.');
        }}
      />

      <div className="py-10 sm:py-16 bg-heritage-ivory min-h-screen">
        <Container size="lg">
          {/* Back navigation */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-heritage-charcoal-600 hover:text-heritage-green transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ── Left: Payment section (7 cols) ── */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 sm:p-8">
                {/* Payment header */}
                <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-heritage-sandstone/20">
                  <div className="w-16 h-16 rounded-full bg-heritage-green/10 text-heritage-green flex items-center justify-center border-2 border-heritage-green/20">
                    <ShieldCheck className="w-8 h-8" />
                  </div>

                  <div className="space-y-2 max-w-md">
                    <h1 className="font-serif text-2xl font-bold text-heritage-charcoal">
                      Secure Payment Checkout
                    </h1>
                    <p className="text-sm text-heritage-charcoal-500 font-sans leading-relaxed">
                      Complete payment to finalize your heritage site reservation
                    </p>
                  </div>
                </div>

                {/* Secure Gateway Assurance */}
                <div className="mt-6 p-4 rounded-2xl bg-heritage-ivory/80 border border-heritage-sandstone/30 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-heritage-green shrink-0 mt-0.5" />
                  <div className="text-xs text-heritage-charcoal-600 font-sans space-y-1">
                    <p className="font-bold text-heritage-charcoal">Bank-Grade Payment Security</p>
                    <p>
                      Transactions are processed securely via Cashfree Payment Gateway with end-to-end 256-bit SSL encryption.
                    </p>
                  </div>
                </div>

                {/* Payment error message */}
                {paymentError && (
                  <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-900 font-sans">
                      <p className="font-bold">Payment Notification</p>
                      <p className="mt-1">{paymentError}</p>
                    </div>
                  </div>
                )}

                {/* Booking reference banner */}
                <div className="mt-6 p-4 rounded-2xl bg-heritage-sandstone-50 border border-heritage-sandstone/25">
                  <p className="text-[10px] uppercase font-bold text-heritage-charcoal-400 font-sans text-center">
                    Reservation Reference
                  </p>
                  <p className="font-mono text-lg font-bold text-heritage-green tracking-wider text-center mt-1 select-all">
                    {booking.bookingReference}
                  </p>
                  <div className="flex justify-center mt-2">
                    <Badge variant="pending" size="sm">Awaiting Payment</Badge>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-6 space-y-3">
                  <Button
                    onClick={() => initiateCashfreePayment(false)}
                    variant="primary"
                    size="lg"
                    className="w-full justify-center"
                    leftIcon={paymentLoading ? Loader : CreditCard}
                    disabled={paymentLoading || !cashfreeLoaded}
                  >
                    {paymentLoading ? 'Opening Cashfree Gateway...' : `Pay ₹${booking.totalAmount} via Cashfree`}
                  </Button>

                  {/* Verification Check & Retry */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      onClick={checkPaymentStatus}
                      variant="outline"
                      size="sm"
                      className="w-full justify-center text-xs"
                      leftIcon={verifyingStatus ? Loader : RefreshCw}
                      disabled={verifyingStatus}
                    >
                      {verifyingStatus ? 'Verifying...' : 'Check Payment Status'}
                    </Button>
                    <Button
                      onClick={() => initiateCashfreePayment(true)}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-center text-xs text-heritage-charcoal-600 hover:text-heritage-green"
                    >
                      Retry New Session
                    </Button>
                  </div>
                  
                  {!cashfreeLoaded && (
                    <p className="text-[11px] text-heritage-charcoal-400 font-sans text-center">
                      Connecting to secure payment gateway...
                    </p>
                  )}

                  <p className="text-[11px] text-heritage-charcoal-400 font-sans text-center">
                    Secured by Cashfree Payments • 256-bit SSL Encryption
                  </p>
                </div>
              </div>
            </div>

            {/* ── Right: Booking dossier panel (5 cols) ── */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-md p-6 sm:p-8 space-y-6">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-heritage-sandstone-800 bg-heritage-sandstone-100 px-2.5 py-0.5 rounded">
                    Ref: {booking.bookingReference}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-heritage-charcoal mt-2">
                    {booking.siteName}
                  </h3>
                  <p className="text-xs text-heritage-charcoal-400 font-sans">
                    {booking.siteLocation}
                  </p>
                </div>

                {/* Booking specifications */}
                <div className="p-4 rounded-2xl bg-heritage-sandstone-50 border border-heritage-sandstone/20 space-y-2 text-xs font-sans">
                  <p className="flex items-center gap-2 text-heritage-charcoal">
                    <Calendar className="w-3.5 h-3.5 text-heritage-green" />
                    <span>
                      Visit Date: <strong>{booking.visitDate}</strong>
                    </span>
                  </p>
                  <p className="flex items-center gap-2 text-heritage-charcoal">
                    <Clock className="w-3.5 h-3.5 text-heritage-sandstone-600" />
                    <span>
                      Entry Window:{' '}
                      <strong>
                        {booking.timeSlot?.startTime} – {booking.timeSlot?.endTime}
                      </strong>
                    </span>
                  </p>
                  <p className="flex items-center gap-2 text-heritage-charcoal">
                    <Ticket className="w-3.5 h-3.5 text-heritage-gold-600" />
                    <span>
                      Visitor Passes: <strong>{booking.totalTickets}</strong>
                    </span>
                  </p>
                </div>

                {/* Itemised tickets */}
                <div className="space-y-2.5 text-xs">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-heritage-charcoal-400">
                    Official Tariff Breakdown
                  </p>
                  <div className="divide-y divide-heritage-sandstone/15">
                    {booking.tickets?.map((t, idx) => (
                      <div key={idx} className="py-2 flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-heritage-charcoal">{t.categoryName}</span>
                          <span className="text-[11px] text-heritage-charcoal-400 ml-1.5 font-mono">
                            × {t.quantity}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-heritage-charcoal">
                          {t.subtotal === 0 ? 'FREE' : `₹${t.subtotal}`}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t-2 border-heritage-sandstone/30 flex justify-between items-end">
                    <p className="font-serif font-bold text-lg text-heritage-charcoal">Total Amount</p>
                    <span className="font-serif font-bold text-2xl text-heritage-green">
                      ₹{booking.totalAmount}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-center text-heritage-charcoal-400 font-mono border-t border-heritage-sandstone/15 pt-4">
                  Official ASI Heritage Tariff • Verified Slot Capacity
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
