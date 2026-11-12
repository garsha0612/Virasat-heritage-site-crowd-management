import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAdmin } from '@/lib/adminAuth';
import Booking from '@/models/Booking';
import HeritageSite from '@/models/HeritageSite';
import User from '@/models/User';
import { ensureHeritageSitesSeeded } from '@/lib/seedSites';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/overview
 * Returns real-time, database-derived dashboard KPI statistics and chart telemetry.
 */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    await connectToDatabase();
    await ensureHeritageSitesSeeded();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d'; // 7d, 30d, 90d, all

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Compute date cutoff
    let cutoffDate = new Date();
    if (range === '7d') cutoffDate.setDate(now.getDate() - 7);
    else if (range === '30d') cutoffDate.setDate(now.getDate() - 30);
    else if (range === '90d') cutoffDate.setDate(now.getDate() - 90);
    else cutoffDate = new Date(0); // all-time

    // 1. Core KPIs
    const [
      totalSites,
      totalVisitors,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      revenueResult,
      todayBookings,
      upcomingVisits,
    ] = await Promise.all([
      HeritageSite.countDocuments(),
      User.countDocuments({ role: 'visitor' }),
      Booking.countDocuments(),
      Booking.countDocuments({ bookingStatus: 'confirmed' }),
      Booking.countDocuments({ bookingStatus: 'pending' }),
      Booking.countDocuments({ bookingStatus: 'cancelled' }),
      Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Booking.countDocuments({ visitDate: todayStr }),
      Booking.countDocuments({
        visitDate: { $gte: todayStr },
        bookingStatus: 'confirmed',
      }),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    // 2. Booking and Revenue Trends by Day
    const trendAgg = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: cutoffDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalCount: { $sum: 1 },
          confirmedCount: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'confirmed'] }, 1, 0] },
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0] },
          },
          revenue: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const bookingTrends = trendAgg.map((item) => ({
      date: item._id,
      bookings: item.totalCount,
      confirmed: item.confirmedCount,
      cancelled: item.cancelledCount,
      revenue: item.revenue,
    }));

    // 3. Bookings by Heritage Site
    const siteAgg = await Booking.aggregate([
      {
        $group: {
          _id: '$siteSlug',
          siteName: { $first: '$siteName' },
          count: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] },
          },
          visitors: { $sum: '$totalTickets' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const bookingsBySite = siteAgg.map((item) => ({
      slug: item._id,
      name: item.siteName || item._id,
      bookings: item.count,
      revenue: item.revenue,
      visitors: item.visitors,
    }));

    // 4. Booking Status Distribution
    const statusDistribution = [
      { name: 'Confirmed', value: confirmedBookings, color: '#1E3F20' }, // Forest Green
      { name: 'Pending', value: pendingBookings, color: '#C89D4B' },   // Antique Gold
      { name: 'Cancelled', value: cancelledBookings, color: '#888478' }, // Sandstone Muted
    ];

    // 5. Visitor Registration Activity (Last 14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(now.getDate() - 14);

    const userActivityAgg = await User.aggregate([
      {
        $match: {
          role: 'visitor',
          createdAt: { $gte: twoWeeksAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          registrations: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const visitorActivity = userActivityAgg.map((u) => ({
      date: u._id,
      registrations: u.registrations,
    }));

    // 6. Recent 5 Bookings Feed
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('bookingReference siteName visitDate totalTickets totalAmount bookingStatus paymentStatus createdAt');

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalSites,
          totalVisitors,
          totalBookings,
          confirmedBookings,
          pendingBookings,
          cancelledBookings,
          totalRevenue,
          todayBookings,
          upcomingVisits,
        },
        charts: {
          bookingTrends,
          bookingsBySite,
          statusDistribution,
          visitorActivity,
        },
        recentBookings,
        generatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve administrative overview metrics.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
