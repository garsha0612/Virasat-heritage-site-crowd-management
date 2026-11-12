/**
 * ANVAYA – Cashfree Payment Order Creation API
 * 
 * POST /api/payments/create-order
 * 
 * Server-side endpoint for creating Cashfree payment orders.
 * This endpoint MUST be called server-side to protect sensitive credentials.
 * 
 * Flow:
 * 1. Validate caller authentication and active user status
 * 2. Validate booking exists and requires payment
 * 3. Enforce booking ownership (only booking creator can pay)
 * 4. Create Cashfree order with server-verified amount and customer details
 * 5. Store Cashfree order reference and payment session ID in booking
 * 6. Return payment session ID to client for hosted checkout
 * 
 * Security:
 * - SANDBOX environment only (enforced by lib/cashfree.js)
 * - Server-side price validation (client cannot specify amount)
 * - Strict user data isolation
 */

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';
import { createCashfreeOrder } from '@/lib/cashfree';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // 1. Authentication check
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required to initiate payment.' 
        },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Verify database user status
    const dbUser = await User.findById(sessionUser.id).select('isActive role');
    if (!dbUser || dbUser.isActive === false) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Account is inactive or suspended. Cannot initiate payments.' 
        },
        { status: 403 }
      );
    }

    // Role separation: Administrators do not make customer bookings or visitor payments
    if (dbUser.role === 'admin') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Administrators cannot initiate visitor payments. Use admin portals for reservation management.' 
        },
        { status: 403 }
      );
    }

    // 2. Parse request body
    const body = await request.json().catch(() => ({}));
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Booking ID is required to create payment order.' 
        },
        { status: 400 }
      );
    }

    // 3. Fetch booking from database
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Booking not found. Please verify your booking reference.' 
        },
        { status: 404 }
      );
    }

    // 4. Verify booking ownership (User data isolation)
    if (booking.user.toString() !== sessionUser.id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unauthorized: You can only pay for your own bookings.' 
        },
        { status: 403 }
      );
    }

    // 5. Check if payment is already completed
    if (booking.paymentStatus === 'completed' && booking.bookingStatus === 'confirmed') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Payment already completed for this booking.',
          data: {
            bookingReference: booking.bookingReference,
            paymentStatus: 'completed'
          }
        },
        { status: 400 }
      );
    }

    // 6. Check if booking is already cancelled
    if (booking.bookingStatus === 'cancelled') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot create payment for a cancelled booking.' 
        },
        { status: 400 }
      );
    }

    // 7. Check if active Cashfree order already exists for this booking
    const isRetry = Boolean(body.retry);
    if (!isRetry && booking.payment?.cashfreeOrderId && booking.payment?.paymentSessionId) {
      return NextResponse.json(
        {
          success: true,
          message: 'Active payment session available for this booking.',
          data: {
            bookingId: booking._id.toString(),
            bookingReference: booking.bookingReference,
            cashfreeOrderId: booking.payment.cashfreeOrderId,
            paymentSessionId: booking.payment.paymentSessionId,
            orderAmount: booking.totalAmount,
            currency: booking.currency || 'INR',
            existingSession: true
          }
        },
        { status: 200 }
      );
    }

    // 8. Prepare unique order ID and return URL
    const attemptSuffix = isRetry ? `-${Date.now().toString().slice(-4)}` : '';
    const uniqueOrderId = `ANVAYA-${booking.bookingReference}${attemptSuffix}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/booking/confirmation/${booking.bookingReference}`;

    // 9. Create Cashfree Sandbox order
    try {
      const cashfreeOrder = await createCashfreeOrder({
        orderId: uniqueOrderId,
        orderAmount: booking.totalAmount, // Server-side amount only
        customerName: booking.visitorDetails?.primaryName || sessionUser.name,
        customerEmail: booking.visitorDetails?.primaryEmail || sessionUser.email,
        customerPhone: booking.visitorDetails?.primaryPhone || '9999999999',
        returnUrl: returnUrl,
        orderMeta: {
          booking_id: booking._id.toString(),
          booking_reference: booking.bookingReference,
          site_name: booking.siteName,
          visit_date: booking.visitDate,
          total_tickets: String(booking.totalTickets)
        }
      });

      // 10. Update booking with payment session details
      booking.payment = {
        ...(booking.payment ? (booking.payment.toObject ? booking.payment.toObject() : booking.payment) : {}),
        cashfreeOrderId: cashfreeOrder.data.orderId,
        paymentSessionId: cashfreeOrder.data.paymentSessionId,
        orderCreatedAt: new Date(),
        orderStatus: cashfreeOrder.data.orderStatus,
        gatewayProvider: 'cashfree'
      };

      booking.paymentStatus = 'pending';
      booking.paymentMethod = 'cashfree';
      await booking.save();

      console.log(`✅ Cashfree payment order registered for booking ${booking.bookingReference}`);

      // 11. Return payment session details to client
      return NextResponse.json(
        {
          success: true,
          message: 'Payment order created successfully. Proceed to checkout.',
          data: {
            bookingId: booking._id.toString(),
            bookingReference: booking.bookingReference,
            cashfreeOrderId: cashfreeOrder.data.orderId,
            paymentSessionId: cashfreeOrder.data.paymentSessionId,
            orderAmount: booking.totalAmount,
            currency: booking.currency || 'INR',
            siteName: booking.siteName,
            visitDate: booking.visitDate,
            totalTickets: booking.totalTickets
          }
        },
        { status: 201 }
      );

    } catch (cashfreeError) {
      console.error('Cashfree order creation error:', cashfreeError.message);

      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create payment order with payment gateway. Please try again.',
          error: cashfreeError.message
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Payment order creation unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error while creating payment order.',
        error: error.message
      },
      { status: 500 }
    );
  }
}
