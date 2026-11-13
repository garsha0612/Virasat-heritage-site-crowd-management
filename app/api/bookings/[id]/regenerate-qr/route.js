import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getSessionUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { ensureBookingQRCode } from '@/lib/tickets';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings/[id]/regenerate-qr
 * 
 * Provides a dedicated, retryable QR code generation path for confirmed bookings
 * where initial QR generation was interrupted, without requiring a second payment.
 */
export async function POST(request, { params }) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
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

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { bookingReference: id.toUpperCase().trim() };

    const booking = await Booking.findOne(query);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking reservation not found.' },
        { status: 404 }
      );
    }

    // Verify ownership or admin privileges
    const isOwner = booking.user?.toString() === session.id;
    const isAdmin = session.role === 'admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied: You do not own this reservation.' },
        { status: 403 }
      );
    }

    const isPaid = booking.paymentStatus === 'paid' || booking.paymentStatus === 'completed';
    if (booking.bookingStatus !== 'confirmed' || !isPaid) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot generate QR pass for booking with status '${booking.bookingStatus}' and payment status '${booking.paymentStatus}'.`,
        },
        { status: 400 }
      );
    }

    const result = await ensureBookingQRCode(booking._id.toString());
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error || 'Failed to generate QR pass.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Digital QR entry pass generated successfully.',
        data: {
          bookingId: result.booking._id.toString(),
          bookingReference: result.booking.bookingReference,
          ticketCode: result.booking.ticketCode,
          qrCodeDataUrl: result.booking.qrCodeDataUrl,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('QR regeneration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while generating QR code.', error: error.message },
      { status: 500 }
    );
  }
}
