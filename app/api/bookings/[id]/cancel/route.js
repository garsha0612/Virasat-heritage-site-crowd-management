import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase, withDatabaseTransaction } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { getSessionUser } from '@/lib/auth';
import { releaseSlotCapacity } from '@/lib/slots';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings/[id]/cancel
 * 
 * Atomically marks the booking as cancelled and restores the reserved slot capacity
 * inside a single ACID MongoDB transaction.
 */
export async function POST(request, { params }) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to cancel a reservation.' },
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
    const reason = body.reason?.trim() || 'Visitor requested cancellation';

    // Locate booking by Mongo ObjectId or Booking Reference
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { bookingReference: id.toUpperCase().trim() };

    const booking = await Booking.findOne(query);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking reservation not found.' },
        { status: 404 }
      );
    }

    // Access control: Only booking owner or administrator can cancel
    const isOwner = booking.user.toString() === session.id;
    const isAdmin = session.role === 'admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied: You do not have permission to cancel this booking.' },
        { status: 403 }
      );
    }

    // Check if already cancelled
    if (booking.bookingStatus === 'cancelled') {
      return NextResponse.json(
        { success: false, message: 'This reservation has already been cancelled.' },
        { status: 400 }
      );
    }

    // Check if in non-cancellable state
    if (booking.bookingStatus === 'failed') {
      return NextResponse.json(
        { success: false, message: 'Failed reservations cannot be cancelled.' },
        { status: 400 }
      );
    }

    const isPaid = booking.paymentStatus === 'paid';
    const simulatedRefundAmount = isPaid ? booking.totalAmount : 0;

    // Execute atomic cancellation and capacity restoration in a single transaction
    try {
      const cancelledBooking = await withDatabaseTransaction(async (dbSession) => {
        // Step A: Conditionally update booking status from pending/confirmed to cancelled
        const updated = await Booking.findOneAndUpdate(
          {
            _id: booking._id,
            bookingStatus: { $in: ['pending', 'confirmed'] },
          },
          {
            $set: {
              bookingStatus: 'cancelled',
              paymentStatus: isPaid ? 'refunded' : 'failed',
              cancellation: {
                cancelledAt: new Date(),
                reason,
                cancellationReason: reason,
                refundAmount: simulatedRefundAmount,
                refundStatus: isPaid ? 'simulated_refund_processed' : 'none',
              },
            },
          },
          { session: dbSession, new: true }
        );

        if (!updated) {
          const stateErr = new Error('This reservation has already been cancelled or cannot be modified.');
          stateErr.statusCode = 400;
          throw stateErr;
        }

        // Step B: Atomically restore slot capacity in the same transaction
        if (updated.timeSlot?.slotId && updated.totalTickets > 0) {
          await releaseSlotCapacity(updated.timeSlot.slotId, updated.totalTickets, dbSession);
        }

        return updated;
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Reservation cancelled successfully and capacity restored.',
          data: {
            booking: {
              id: cancelledBooking._id.toString(),
              bookingReference: cancelledBooking.bookingReference,
              bookingStatus: cancelledBooking.bookingStatus,
              paymentStatus: cancelledBooking.paymentStatus,
              cancellation: {
                cancelledAt: cancelledBooking.cancellation?.cancelledAt,
                reason: cancelledBooking.cancellation?.cancellationReason || reason,
                cancellationReason: cancelledBooking.cancellation?.cancellationReason || reason,
                refundAmount: cancelledBooking.cancellation?.refundAmount,
                refundStatus: cancelledBooking.cancellation?.refundStatus,
              },
            },
          },
        },
        { status: 200 }
      );
    } catch (txErr) {
      if (txErr.statusCode === 400) {
        return NextResponse.json(
          { success: false, message: txErr.message },
          { status: 400 }
        );
      }

      if (txErr.code === 'TRANSACTIONS_UNSUPPORTED') {
        return NextResponse.json(
          { success: false, code: 'TRANSACTIONS_UNSUPPORTED', message: txErr.message },
          { status: 503 }
        );
      }

      console.error('Cancellation transaction error:', txErr);
      return NextResponse.json(
        { success: false, message: 'Transaction failure during cancellation.', error: txErr.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Cancellation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while cancelling booking.', error: error.message },
      { status: 500 }
    );
  }
}
