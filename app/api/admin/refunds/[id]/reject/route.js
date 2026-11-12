import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAdmin } from '@/lib/adminAuth';
import { connectToDatabase, withDatabaseTransaction } from '@/lib/mongodb';
import Refund from '@/models/Refund';
import Booking from '@/models/Booking';

export const dynamic = 'force-dynamic';

function getRefundQuery(idOrRefundId) {
  if (mongoose.Types.ObjectId.isValid(idOrRefundId)) {
    return { _id: idOrRefundId };
  }
  return { refundId: idOrRefundId.toUpperCase().trim() };
}

/**
 * POST /api/admin/refunds/[id]/reject
 * Administrator rejects a refund request with justification.
 */
export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const reason = (body.reason || body.adminNote || '').trim();

    if (!reason) {
      return NextResponse.json(
        { success: false, message: 'Please provide an administrative reason for rejecting this refund request.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const refund = await Refund.findOne(getRefundQuery(id));
    if (!refund) {
      return NextResponse.json(
        { success: false, message: 'Refund request record not found.' },
        { status: 404 }
      );
    }

    if (!['REQUESTED', 'UNDER_REVIEW'].includes(refund.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot reject refund in current status "${refund.status}". Only REQUESTED or UNDER_REVIEW can be rejected.`,
        },
        { status: 400 }
      );
    }

    const updated = await withDatabaseTransaction(async (dbSession) => {
      refund.status = 'REJECTED';
      refund.adminReview = {
        reviewedBy: auth.adminUser.id,
        reviewedAt: new Date(),
        adminNote: reason,
        action: 'REJECTED',
      };
      refund.auditLog.push({
        action: 'REJECTED',
        actor: auth.adminUser.id,
        actorName: auth.adminUser.name || auth.adminUser.email,
        actorRole: 'admin',
        timestamp: new Date(),
        note: reason,
      });

      await refund.save({ session: dbSession });

      await Booking.findByIdAndUpdate(
        refund.booking,
        {
          $set: {
            'refund.status': 'REJECTED',
            'refund.adminNote': reason,
            'refund.reviewedAt': new Date(),
            'cancellation.refundStatus': 'refund_rejected',
          },
        },
        { session: dbSession }
      );

      return refund;
    });

    return NextResponse.json(
      {
        success: true,
        message: `Refund ${updated.refundId} has been rejected.`,
        data: { refund: updated },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin reject refund error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error rejecting refund.', error: error.message },
      { status: 500 }
    );
  }
}
