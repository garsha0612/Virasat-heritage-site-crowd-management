import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { requireAdmin } from '@/lib/adminAuth';
import Booking from '@/models/Booking';
import { ensureBookingQRCode } from '@/lib/tickets';

export const dynamic = 'force-dynamic';

function getBookingQuery(idOrRef) {
  if (mongoose.Types.ObjectId.isValid(idOrRef)) {
    return { _id: idOrRef };
  }
  return { bookingReference: idOrRef };
}

/**
 * GET /api/admin/bookings/[id]
 * Fetch complete booking dossier with digital pass verification for administration.
 */
export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    await connectToDatabase();

    const booking = await Booking.findOne(getBookingQuery(params.id));
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking reservation not found.' },
        { status: 404 }
      );
    }

    // Lazy QR generation for confirmed passes if missing
    await ensureBookingQRCode(booking);

    return NextResponse.json({
      success: true,
      data: {
        booking: {
          id: booking._id.toString(),
          bookingReference: booking.bookingReference,
          ticketCode: booking.ticketCode,
          siteSlug: booking.siteSlug,
          siteName: booking.siteName,
          siteLocation: booking.siteLocation,
          visitDate: booking.visitDate,
          timeSlot: booking.timeSlot,
          tickets: booking.tickets,
          totalTickets: booking.totalTickets,
          totalAmount: booking.totalAmount,
          currency: booking.currency || 'INR',
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.paymentStatus,
          paymentMethod: booking.paymentMethod,
          paidAt: booking.paidAt,
          visitorDetails: booking.visitorDetails,
          qrCodeDataUrl: booking.qrCodeDataUrl,
          cancellation: booking.cancellation,
          idempotencyKey: booking.idempotencyKey,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve booking dossier.', error: error.message },
      { status: 500 }
    );
  }
}
