import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAdmin } from '@/lib/adminAuth';
import Booking from '@/models/Booking';

export const dynamic = 'force-dynamic';

/**
 * Escapes a cell value for CSV output.
 * Mitigates CSV Formula Injection (DDE attacks) by prefixing dangerous formula
 * triggers (=, +, -, @, \t, \r) with an apostrophe (').
 *
 * @param {any} value
 * @returns {string} Escaped and quoted CSV cell string
 */
export function escapeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // CSV Formula Injection mitigation
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.some((p) => str.startsWith(p))) {
    str = `'${str}`;
  }

  // Escape inner double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * GET /api/admin/reports/export
 * Generates an audit-safe CSV export of booking records.
 */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const siteSlug = searchParams.get('siteSlug');
    const bookingStatus = searchParams.get('bookingStatus');
    const paymentStatus = searchParams.get('paymentStatus');

    const query = {};
    if (siteSlug && siteSlug !== 'all') query.siteSlug = siteSlug;
    if (bookingStatus && bookingStatus !== 'all') query.bookingStatus = bookingStatus;
    if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus;

    const bookings = await Booking.find(query).sort({ createdAt: -1 }).limit(5000);

    const headers = [
      'Booking Reference',
      'Monument Name',
      'Monument Slug',
      'Visit Date',
      'Time Slot',
      'Total Visitors',
      'Total Amount (INR)',
      'Booking Status',
      'Payment Status',
      'Payment Method',
      'Booked At',
      'Refund Status',
    ];

    const rows = [headers.map(escapeCsvCell).join(',')];

    for (const b of bookings) {
      const slotTime = b.timeSlot?.startTime ? `${b.timeSlot.startTime} - ${b.timeSlot.endTime}` : 'Standard';
      const bookedDateStr = b.createdAt ? new Date(b.createdAt).toISOString() : '';

      rows.push(
        [
          escapeCsvCell(b.bookingReference),
          escapeCsvCell(b.siteName),
          escapeCsvCell(b.siteSlug),
          escapeCsvCell(b.visitDate),
          escapeCsvCell(slotTime),
          escapeCsvCell(b.totalTickets),
          escapeCsvCell(b.totalAmount),
          escapeCsvCell(b.bookingStatus),
          escapeCsvCell(b.paymentStatus),
          escapeCsvCell(b.paymentMethod || 'N/A'),
          escapeCsvCell(bookedDateStr),
          escapeCsvCell(b.cancellation?.refundStatus || 'none'),
        ].join(',')
      );
    }

    const csvContent = rows.join('\r\n');
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `anvaya-bookings-report-${timestamp}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to generate CSV export.', error: error.message },
      { status: 500 }
    );
  }
}
