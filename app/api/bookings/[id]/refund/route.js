import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Refund from '@/models/Refund';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function getBookingQuery(idOrRef) {
  if (mongoose.Types.ObjectId.isValid(idOrRef)) {
    return { _id: idOrRef };
  }
  return { bookingReference: idOrRef.toUpperCase().trim() };
}

/**
 * GET /api/bookings/[id]/refund
 * Returns refund tracking and activity history for a specific booking.
 */
export async function GET(request, { params }) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { id } = params;
    await connectToDatabase();

    const booking = await Booking.findOne(getBookingQuery(id));
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking reservation not found.' },
        { status: 404 }
      );
    }

    // Ownership Enforcement
    const isOwner = booking.user.toString() === session.id;
    const isAdmin = session.role === 'admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied: You cannot view this refund information.' },
        { status: 403 }
      );
    }

    const refund = await Refund.findOne({ booking: booking._id }).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: {
          bookingReference: booking.bookingReference,
          refundStatus: refund?.status || booking.refund?.status || 'NOT_REQUESTED',
          refund: refund || null,
          bookingRefundSummary: booking.refund || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch booking refund error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error retrieving refund data.', error: error.message },
      { status: 500 }
    );
  }
}
