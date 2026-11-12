/**
 * ANVAYA – Payment Verification API
 * 
 * GET /api/payments/verify?bookingId=xxx or ?bookingReference=xxx
 * 
 * Authoritative server-side payment verification endpoint that:
 * 1. Fetches order status & transaction records directly from Cashfree API
 * 2. Verifies expected payment amount and currency matches database booking
 * 3. Enforces user data isolation and ownership
 * 4. Idempotently updates booking status
 * 5. Generates digital QR ticket only after verified payment
 * 
 * Security:
 * - Requires authentication
 * - Server-side verification only (client cannot fake payment confirmation)
 * - Verifies amount and currency against database booking records
 */

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { getSessionUser } from '@/lib/auth';
import { 
  fetchCashfreeOrder, 
  normalizePaymentStatus, 
  isPaymentSuccessful 
} from '@/lib/cashfree';
import { ensureBookingQRCode } from '@/lib/tickets';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // 1. Authentication check
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required to verify payment.' 
        },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // 2. Get booking identifier from query params
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const bookingReference = searchParams.get('bookingReference');

    if (!bookingId && !bookingReference) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Booking ID or reference is required for payment verification.' 
        },
        { status: 400 }
      );
    }

    // 3. Fetch booking from database
    const query = bookingId && mongoose.Types.ObjectId.isValid(bookingId)
      ? { _id: bookingId } 
      : { bookingReference: (bookingReference || bookingId).toUpperCase().trim() };

    const booking = await Booking.findOne(query);

    if (!booking) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Booking reservation not found.' 
        },
        { status: 404 }
      );
    }

    // 4. Verify booking ownership (User data isolation)
    const isOwner = booking.user.toString() === sessionUser.id;
    const isAdmin = sessionUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unauthorized: You can only verify your own bookings.' 
        },
        { status: 403 }
      );
    }

    // 5. Prevent duplicate confirmation (Idempotency)
    if (booking.paymentStatus === 'completed' && booking.bookingStatus === 'confirmed') {
      let qrCodeUrl = booking.qrCodeDataUrl;
      let ticketCode = booking.ticketCode;

      if (!qrCodeUrl || !ticketCode) {
        try {
          const qrRes = await ensureBookingQRCode(booking._id.toString());
          if (qrRes.success) {
            qrCodeUrl = qrRes.booking.qrCodeDataUrl;
            ticketCode = qrRes.booking.ticketCode;
          }
        } catch (e) {
          console.warn('QR ensure warning on already verified booking:', e.message);
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Payment already verified and confirmed.',
          data: {
            bookingReference: booking.bookingReference,
            paymentStatus: 'completed',
            bookingStatus: 'confirmed',
            alreadyVerified: true,
            hasQrTicket: Boolean(qrCodeUrl),
            ticketCode: ticketCode,
            ticketUrl: `/tickets/${booking.bookingReference}`
          }
        },
        { status: 200 }
      );
    }

    // 6. Check if Cashfree order exists
    if (!booking.payment?.cashfreeOrderId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No payment order found for this booking. Please initiate checkout first.' 
        },
        { status: 400 }
      );
    }

    // 7. Authoritative fetch from Cashfree Sandbox API
    let cashfreeOrder;
    try {
      cashfreeOrder = await fetchCashfreeOrder(booking.payment.cashfreeOrderId);
    } catch (cashfreeError) {
      console.error('Cashfree order fetch failed:', cashfreeError.message);
      
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to verify payment status with payment gateway.',
          error: cashfreeError.message
        },
        { status: 500 }
      );
    }

    const orderData = cashfreeOrder.data;
    const orderStatus = orderData.orderStatus; // ACTIVE, PAID, EXPIRED
    const latestPayment = orderData.latestPayment;

    // 8. Amount and Currency Integrity Check
    if (Number(orderData.orderAmount) !== Number(booking.totalAmount)) {
      console.error(`🚨 Payment amount mismatch for ${booking.bookingReference}: expected ${booking.totalAmount}, gateway reported ${orderData.orderAmount}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Payment amount mismatch detected. Security alert triggered.'
        },
        { status: 400 }
      );
    }

    if (orderData.orderCurrency !== (booking.currency || 'INR')) {
      console.error(`🚨 Payment currency mismatch for ${booking.bookingReference}: expected ${booking.currency}, gateway reported ${orderData.orderCurrency}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Payment currency mismatch detected.'
        },
        { status: 400 }
      );
    }

    // 9. Check payment success condition
    const paymentSuccess = isPaymentSuccessful(orderStatus, latestPayment?.payment_status);

    const normalizedStatus = normalizePaymentStatus(
      latestPayment?.payment_status || orderStatus
    );

    // Update payment metadata on booking
    booking.payment.orderStatus = orderStatus;
    booking.paymentStatus = normalizedStatus;

    if (latestPayment) {
      booking.payment.cfPaymentId = latestPayment.cf_payment_id;
      booking.payment.paymentStatus = latestPayment.payment_status;
      booking.payment.paymentMethod = latestPayment.payment_group;
      booking.payment.paymentAmount = latestPayment.payment_amount;
      booking.payment.paymentTime = latestPayment.payment_time 
        ? new Date(latestPayment.payment_time) 
        : new Date();
      booking.payment.bankReference = latestPayment.bank_reference;
      booking.payment.paymentMessage = latestPayment.payment_message;
    }

    // 10. Handle Successful Payment
    if (paymentSuccess) {
      booking.bookingStatus = 'confirmed';
      booking.paymentStatus = 'completed';
      booking.paymentMethod = 'cashfree';
      booking.payment.paidAt = new Date();

      await booking.save();

      // Issue digital QR ticket pass
      let qrCodeDataUrl = booking.qrCodeDataUrl;
      let ticketCode = booking.ticketCode;
      try {
        const qrRes = await ensureBookingQRCode(booking._id.toString());
        if (qrRes.success) {
          qrCodeDataUrl = qrRes.booking.qrCodeDataUrl;
          ticketCode = qrRes.booking.ticketCode;
        }
      } catch (qrError) {
        console.error('QR ticket generation error during verification:', qrError.message);
      }

      console.log(`✅ Payment verified & confirmed for ${booking.bookingReference}`);

      return NextResponse.json(
        {
          success: true,
          message: 'Payment verified successfully. Your booking reservation is confirmed!',
          data: {
            bookingReference: booking.bookingReference,
            paymentStatus: 'completed',
            bookingStatus: 'confirmed',
            paymentMethod: booking.payment.paymentMethod || 'cashfree',
            paymentAmount: booking.totalAmount,
            paymentTime: booking.payment.paymentTime,
            cfPaymentId: booking.payment.cfPaymentId,
            hasQrTicket: Boolean(qrCodeDataUrl),
            ticketCode: ticketCode,
            ticketUrl: `/tickets/${booking.bookingReference}`
          }
        },
        { status: 200 }
      );
    }

    // 11. Handle Failed / Cancelled / Expired Payments
    if (normalizedStatus === 'failed' || normalizedStatus === 'cancelled' || normalizedStatus === 'expired') {
      booking.bookingStatus = 'failed';
      booking.payment.failureReason = latestPayment?.payment_message || `Payment ${normalizedStatus}`;
      
      await booking.save();

      console.log(`❌ Payment ${normalizedStatus} for ${booking.bookingReference}`);

      return NextResponse.json(
        {
          success: false,
          message: `Payment ${normalizedStatus}. Please retry payment or select another time slot.`,
          data: {
            bookingReference: booking.bookingReference,
            paymentStatus: normalizedStatus,
            bookingStatus: 'failed',
            failureReason: booking.payment.failureReason
          }
        },
        { status: 200 }
      );
    }

    // 12. Payment still Pending
    await booking.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Payment is currently pending with the payment gateway.',
        data: {
          bookingReference: booking.bookingReference,
          paymentStatus: 'pending',
          bookingStatus: booking.bookingStatus,
          orderStatus: orderStatus
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Payment verification error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error while verifying payment.',
        error: error.message
      },
      { status: 500 }
    );
  }
}
