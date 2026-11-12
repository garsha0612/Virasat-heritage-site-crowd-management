import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAdmin } from '@/lib/adminAuth';
import Booking from '@/models/Booking';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/bookings
 * Queries bookings with search, status filtering, site filtering, date filtering, and pagination.
 */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const siteSlug = searchParams.get('siteSlug')?.trim() || '';
    const bookingStatus = searchParams.get('bookingStatus')?.trim() || '';
    const paymentStatus = searchParams.get('paymentStatus')?.trim() || '';
    const visitDate = searchParams.get('visitDate')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const query = {};

    if (search) {
      query.$or = [
        { bookingReference: { $regex: search, $options: 'i' } },
        { 'visitorDetails.primaryName': { $regex: search, $options: 'i' } },
        { 'visitorDetails.primaryEmail': { $regex: search, $options: 'i' } },
        { 'visitorDetails.email': { $regex: search, $options: 'i' } },
        { 'visitorDetails.primaryPhone': { $regex: search, $options: 'i' } },
      ];
    }

    if (siteSlug && siteSlug !== 'all') {
      query.siteSlug = siteSlug;
    }

    if (bookingStatus && bookingStatus !== 'all') {
      query.bookingStatus = bookingStatus;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    if (visitDate) {
      query.visitDate = visitDate;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .select(
          'bookingReference siteSlug siteName siteLocation visitDate timeSlot totalTickets totalAmount bookingStatus paymentStatus visitorDetails createdAt cancellation'
        ),
      Booking.countDocuments(query),
    ]);

    const formattedBookings = bookings.map((b) => ({
      id: b._id.toString(),
      bookingReference: b.bookingReference,
      siteSlug: b.siteSlug,
      siteName: b.siteName,
      siteLocation: b.siteLocation,
      visitDate: b.visitDate,
      timeSlot: b.timeSlot,
      totalTickets: b.totalTickets,
      totalAmount: b.totalAmount,
      bookingStatus: b.bookingStatus,
      paymentStatus: b.paymentStatus,
      visitorName: b.visitorDetails?.primaryName || b.visitorDetails?.name || 'Visitor',
      visitorEmail: b.visitorDetails?.primaryEmail || b.visitorDetails?.email || '',
      visitorPhone: b.visitorDetails?.primaryPhone || b.visitorDetails?.phone || '',
      createdAt: b.createdAt,
      cancellation: b.cancellation,
    }));

    return NextResponse.json({
      success: true,
      data: {
        bookings: formattedBookings,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve bookings.', error: error.message },
      { status: 500 }
    );
  }
}
