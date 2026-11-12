import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAdmin } from '@/lib/adminAuth';
import Booking from '@/models/Booking';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/reports
 * Returns aggregated financial and operational intelligence metrics over specified date window.
 */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d'; // 7d, 30d, 90d, 365d, all

    const now = new Date();
    let startDate = new Date();
    if (range === '7d') startDate.setDate(now.getDate() - 7);
    else if (range === '30d') startDate.setDate(now.getDate() - 30);
    else if (range === '90d') startDate.setDate(now.getDate() - 90);
    else if (range === '365d') startDate.setDate(now.getDate() - 365);
    else startDate = new Date(0);

    const matchQuery = { createdAt: { $gte: startDate } };

    // 1. Overall Summary
    const [totalBookings, paidBookings, cancelledBookings, revenueAgg] = await Promise.all([
      Booking.countDocuments(matchQuery),
      Booking.countDocuments({ ...matchQuery, paymentStatus: 'paid' }),
      Booking.countDocuments({ ...matchQuery, bookingStatus: 'cancelled' }),
      Booking.aggregate([
        { $match: { ...matchQuery, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const avgOrderValue = paidBookings > 0 ? Math.round(totalRevenue / paidBookings) : 0;
    const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;

    // 2. Site Popularity Aggregation
    const sitePopularity = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$siteSlug',
          siteName: { $first: '$siteName' },
          bookingsCount: { $sum: 1 },
          visitorsCount: { $sum: '$totalTickets' },
          revenue: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] },
          },
        },
      },
      { $sort: { bookingsCount: -1 } },
    ]);

    // 3. Daily Timeline Trend
    const dailyTimeline = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalBookings: { $sum: 1 },
          paidBookings: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] },
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0] },
          },
          revenue: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalBookings,
          paidBookings,
          cancelledBookings,
          totalRevenue,
          avgOrderValue,
          cancellationRate,
          range,
        },
        sitePopularity: sitePopularity.map((s) => ({
          slug: s._id,
          name: s.siteName || s._id,
          bookings: s.bookingsCount,
          visitors: s.visitorsCount,
          revenue: s.revenue,
        })),
        dailyTimeline: dailyTimeline.map((d) => ({
          date: d._id,
          bookings: d.totalBookings,
          paid: d.paidBookings,
          cancelled: d.cancelledBookings,
          revenue: d.revenue,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to generate reports.', error: error.message },
      { status: 500 }
    );
  }
}
