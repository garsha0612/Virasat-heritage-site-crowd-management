import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAdmin } from '@/lib/adminAuth';
import { withDatabaseTransaction } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { releaseSlotCapacity } from '@/lib/slots';

export const dynamic = 'force-dynamic';

function getBookingQuery(idOrRef) {
  if (mongoose.Types.ObjectId.isValid(idOrRef)) {
    return { _id: idOrRef };
  }
  return { bookingReference: idOrRef };
}

/**
 * POST /api/admin/bookings/[id]/cancel
 * Administrative cancellation protected by native multi-document ACID transaction.
 * Restores reserved capacity and logs administrative justification.
 */
export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const reason = (body.reason || 'Administrative cancellation requested by supervisor').trim();

    const result = await withDatabaseTransaction(async (session) => {
      // 1. Fetch booking with active status guard
      const booking = await Booking.findOne(getBookingQuery(params.id)).session(session);

      if (!booking) {
        const error = new Error('Booking not found.');
        error.statusCode = 404;
        throw error;
      }

      if (booking.bookingStatus === 'cancelled') {
        const error = new Error('This booking is already cancelled.');
        error.statusCode = 400;
        error.code = 'ALREADY_CANCELLED';
        throw error;
      }

      // 2. Transition status to cancelled
      const priorStatus = booking.bookingStatus;
      booking.bookingStatus = 'cancelled';
      booking.cancellation = {
        cancelledAt: new Date(),
        reason: `[ADMIN: ${auth.adminUser.email}] ${reason}`,
        slotRestored: true,
        refundStatus: booking.paymentStatus === 'paid' ? 'refund_pending' : 'none',
        refundAmount: booking.paymentStatus === 'paid' ? booking.totalAmount : 0,
      };

      await booking.save({ session });

      // 3. Atomically restore slot inventory
      if (booking.timeSlot?.slotId) {
        await releaseSlotCapacity(booking.timeSlot.slotId, booking.totalTickets, session);
      }

      return {
        bookingReference: booking.bookingReference,
        priorStatus,
        refundStatus: booking.cancellation.refundStatus,
        refundAmount: booking.cancellation.refundAmount,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Booking "${result.bookingReference}" was successfully cancelled by administrator.`,
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        code: error.code || 'CANCELLATION_FAILED',
        message: error.message || 'Administrative cancellation failed.',
      },
      { status: statusCode }
    );
  }
}
