import { NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectToDatabase, withDatabaseTransaction } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Refund from '@/models/Refund';
import { getSessionUser } from '@/lib/auth';
import { releaseSlotCapacity } from '@/lib/slots';

export const dynamic = 'force-dynamic';

function getBookingQuery(idOrRef) {
  if (mongoose.Types.ObjectId.isValid(idOrRef)) {
    return { _id: idOrRef };
  }
  return { bookingReference: idOrRef.toUpperCase().trim() };
}

/**
 * POST /api/bookings/[id]/refund-request
 * Allows a visitor to submit an admin-approved refund request on their own eligible paid reservation.
 */
export async function POST(request, { params }) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to submit a refund request.' },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Booking identifier is required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const reason = (body.reason || '').trim();
    const supportingDetails = (body.supportingDetails || '').trim();

    if (!reason) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid reason for the refund request.' },
        { status: 400 }
      );
    }

    const booking = await Booking.findOne(getBookingQuery(id));
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking reservation not found.' },
        { status: 404 }
      );
    }

    // Ownership Enforcement: Visitors can only request refunds for their own reservations
    const isOwner = booking.user.toString() === session.id;
    const isAdmin = session.role === 'admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied: You cannot request a refund for another visitor\'s booking.' },
        { status: 403 }
      );
    }

    // Financial Validation: Booking must be paid or completed
    const isPaid = booking.paymentStatus === 'completed' || booking.paymentStatus === 'paid';
    if (!isPaid || booking.totalAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'This booking has no verified payment captured. Only successfully paid bookings are eligible for refund.',
        },
        { status: 400 }
      );
    }

    // Duplicate Request Guard: Check current refund status
    const activeStatuses = ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING', 'REFUNDED'];
    if (booking.refund?.status && activeStatuses.includes(booking.refund.status)) {
      return NextResponse.json(
        {
          success: false,
          code: 'REFUND_ALREADY_ACTIVE',
          message: `A refund request is already in progress with status: ${booking.refund.status}.`,
        },
        { status: 400 }
      );
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const refundId = `REF-${dateStr}-${randomHex}`;

    // Execute atomic refund registration and slot release in a single transaction
    const result = await withDatabaseTransaction(async (dbSession) => {
      // 1. If booking was confirmed, mark cancelled and restore slot capacity
      const wasConfirmed = booking.bookingStatus === 'confirmed';
      if (wasConfirmed && booking.timeSlot?.slotId && booking.totalTickets > 0) {
        await releaseSlotCapacity(booking.timeSlot.slotId, booking.totalTickets, dbSession);
      }

      // 2. Create official Refund tracking entity
      const newRefund = new Refund({
        refundId,
        booking: booking._id,
        bookingReference: booking.bookingReference,
        user: booking.user,
        requestedAmount: booking.totalAmount,
        status: 'REQUESTED',
        reason,
        supportingDetails,
        requestedAt: new Date(),
        auditLog: [
          {
            action: 'REQUEST_SUBMITTED',
            actor: session.id,
            actorName: session.name || session.email,
            actorRole: session.role || 'visitor',
            timestamp: new Date(),
            note: reason,
            metadata: {
              bookingReference: booking.bookingReference,
              amount: booking.totalAmount,
            },
          },
        ],
      });

      await newRefund.save({ session: dbSession });

      // 3. Atomically update Booking
      booking.bookingStatus = 'cancelled';
      booking.cancellation = {
        cancelledAt: booking.cancellation?.cancelledAt || new Date(),
        cancellationReason: reason,
        reason,
        refundAmount: booking.totalAmount,
        refundStatus: 'refund_requested',
      };
      booking.refund = {
        status: 'REQUESTED',
        refundId,
        refundRef: newRefund._id,
        requestedAt: new Date(),
        reason,
        supportingDetails,
        requestedAmount: booking.totalAmount,
        approvedAmount: null,
      };

      await booking.save({ session: dbSession });

      return {
        refundId: newRefund.refundId,
        status: newRefund.status,
        requestedAmount: newRefund.requestedAmount,
        bookingReference: booking.bookingReference,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Your refund request has been submitted for administrator review.',
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Refund request submission error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing refund request.', error: error.message },
      { status: 500 }
    );
  }
}
