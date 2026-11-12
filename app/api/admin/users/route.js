import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAdmin } from '@/lib/adminAuth';
import User from '@/models/User';
import Booking from '@/models/Booking';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users
 * Returns registered users with booking metrics, search, and status filtering.
 * Never exposes credential hashes or tokens.
 */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const role = searchParams.get('role')?.trim() || '';
    const activeFilter = searchParams.get('isActive');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (activeFilter !== null && activeFilter !== undefined && activeFilter !== 'all') {
      query.isActive = activeFilter === 'true';
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .select('name email role phone nationality isActive lastLogin createdAt updatedAt'),
      User.countDocuments(query),
    ]);

    // Aggregate booking counts for each user
    const userIds = users.map((u) => u._id);
    const bookingCountsAgg = await Booking.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', totalBookings: { $sum: 1 } } },
    ]);

    const bookingCountMap = new Map();
    bookingCountsAgg.forEach((b) => {
      bookingCountMap.set(b._id.toString(), b.totalBookings);
    });

    const safeUsers = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone || '',
      nationality: u.nationality || 'Indian',
      isActive: u.isActive !== false,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
      totalBookings: bookingCountMap.get(u._id.toString()) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: safeUsers,
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
      { success: false, message: 'Failed to retrieve visitors.', error: error.message },
      { status: 500 }
    );
  }
}
