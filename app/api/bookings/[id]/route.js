import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getSessionUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { ensureBookingQRCode } from '@/lib/tickets';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings/[id]
 * 
 * Retrieves full booking dossier and digital ticket payload.
 * Strictly verifies caller ownership or administrator privileges.
 */
export async function GET(request, { params }) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to view this booking.' },
        { status: 401 }
      );
    }

    const { id } = params;

    try {
      await connectToDatabase();
    } catch (dbErr) {
      return NextResponse.json(
        { success: false, message: 'Database service is currently unreachable.' },
        { status: 503 }
      );
    }

    // Allow lookup by MongoDB ObjectId or human-readable bookingReference
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { bookingReference: id.toUpperCase() };

    const booking = await Booking.findOne(query).lean();
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking reservation not found.' },
        { status: 404 }
      );
    }

    // Ownership Authorization Check
    const isOwner = booking.user.toString() === session.id;
    const isAdmin = session.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied: You do not have permission to view this reservation.' },
        { status: 403 }
      );
    }

    // Automatic QR Recovery: If confirmed and paid, but QR data URL is missing
    let activeQrCodeDataUrl = booking.qrCodeDataUrl;
    let activeTicketCode = booking.ticketCode;
    const isPaid = booking.paymentStatus === 'paid' || booking.paymentStatus === 'completed';
    if (booking.bookingStatus === 'confirmed' && isPaid && !booking.qrCodeDataUrl) {
      try {
        const qrRes = await ensureBookingQRCode(booking._id.toString());
        if (qrRes.success) {
          activeQrCodeDataUrl = qrRes.booking.qrCodeDataUrl;
          activeTicketCode = qrRes.booking.ticketCode;
        }
      } catch (lazyErr) {
        console.warn('Lazy QR recovery failed on read:', lazyErr.message);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          booking: {
            id: booking._id.toString(),
            bookingReference: booking.bookingReference,
            heritageSite: booking.heritageSite,
            siteName: booking.siteName,
            siteLocation: booking.siteLocation,
            visitDate: booking.visitDate,
            timeSlot: booking.timeSlot,
            tickets: booking.tickets,
            totalTickets: booking.totalTickets,
            totalAmount: booking.totalAmount,
            currency: booking.currency,
            bookingStatus: booking.bookingStatus,
            paymentStatus: booking.paymentStatus,
            paymentMethod: booking.paymentMethod,
            paymentDetails: booking.paymentDetails,
            visitorDetails: booking.visitorDetails,
            ticketCode: activeTicketCode,
            qrCodeDataUrl: activeQrCodeDataUrl,
            cancellation: booking.cancellation,
            createdAt: booking.createdAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving booking dossier:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve booking dossier.', error: error.message },
      { status: 500 }
    );
  }
}
