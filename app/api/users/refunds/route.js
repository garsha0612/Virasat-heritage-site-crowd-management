import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Refund from '@/models/Refund';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/refunds
 * Returns all refund requests belonging to the authenticated visitor.
 */
export async function GET(request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const refunds = await Refund.find({ user: session.id })
      .sort({ createdAt: -1 })
      .populate('booking', 'siteName visitDate totalTickets totalAmount paymentMethod');

    return NextResponse.json(
      {
        success: true,
        data: {
          refunds,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch visitor refunds error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error retrieving visitor refunds.', error: error.message },
      { status: 500 }
    );
  }
}
