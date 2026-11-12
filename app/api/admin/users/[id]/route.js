import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { requireAdmin } from '@/lib/adminAuth';
import User from '@/models/User';
import Booking from '@/models/Booking';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users/[id]
 * Fetch single visitor dossier with complete booking history.
 */
export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ success: false, message: 'Invalid user ID.' }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const user = await User.findById(params.id).select(
      'name email role phone nationality isActive lastLogin createdAt updatedAt'
    );

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    const bookings = await Booking.find({ user: user._id })
      .sort({ createdAt: -1 })
      .select('bookingReference siteSlug siteName visitDate totalTickets totalAmount bookingStatus paymentStatus createdAt');

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || '',
          nationality: user.nationality || 'Indian',
          isActive: user.isActive !== false,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
        bookings,
        totalBookings: bookings.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve visitor profile.', error: error.message },
      { status: 500 }
    );
  }
}
