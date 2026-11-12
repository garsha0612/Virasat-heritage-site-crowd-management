import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import Refund from '@/models/Refund';
import Booking from '@/models/Booking';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/refunds
 * Lists all refund requests with filtering, search, and aggregated counts.
 */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));

    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { bookingReference: searchRegex },
        { refundId: searchRegex },
      ];
    }

    const total = await Refund.countDocuments(filter);
    const refunds = await Refund.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email phone nationality')
      .populate('booking', 'siteName visitDate totalTickets totalAmount payment paymentMethod');

    // Aggregate status counts
    const statusCountsAgg = await Refund.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$requestedAmount' } } },
    ]);

    const counts = {
      TOTAL: 0,
      REQUESTED: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      PROCESSING: 0,
      REFUNDED: 0,
      REJECTED: 0,
      FAILED: 0,
      totalRefundedAmount: 0,
      totalPendingAmount: 0,
    };

    statusCountsAgg.forEach((item) => {
      counts.TOTAL += item.count;
      if (counts[item._id] !== undefined) {
        counts[item._id] = item.count;
      }
      if (item._id === 'REFUNDED') {
        counts.totalRefundedAmount += item.totalAmount || 0;
      } else if (['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING'].includes(item._id)) {
        counts.totalPendingAmount += item.totalAmount || 0;
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          refunds,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
          },
          counts,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin refunds fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error retrieving refunds.', error: error.message },
      { status: 500 }
    );
  }
}
