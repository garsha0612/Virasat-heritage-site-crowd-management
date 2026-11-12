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
 * POST /api/admin/refunds/[id]/approve
 * Administrator approves a refund request and stages it for gateway execution.
 */
export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const adminNote = (body.adminNote || '').trim();

    await connectToDatabase();

    const refund = await Refund.findOne(getRefundQuery(id));
    if (!refund) {
      return NextResponse.json(
        { success: false, message: 'Refund request record not found.' },
        { status: 404 }
      );
    }

    // Guard: Only allow approval from REQUESTED or UNDER_REVIEW
    if (!['REQUESTED', 'UNDER_REVIEW'].includes(refund.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot approve refund in current status "${refund.status}". Only REQUESTED or UNDER_REVIEW can be approved.`,
        },
        { status: 400 }
      );
    }

    const updated = await withDatabaseTransaction(async (dbSession) => {
      refund.status = 'APPROVED';
      refund.approvedAmount = refund.requestedAmount;
      refund.adminReview = {
        reviewedBy: auth.adminUser.id,
        reviewedAt: new Date(),
        adminNote: adminNote || 'Approved for gateway processing by administrator',
        action: 'APPROVED',
      };
      refund.auditLog.push({
        action: 'APPROVED',
        actor: auth.adminUser.id,
        actorName: auth.adminUser.name || auth.adminUser.email,
        actorRole: 'admin',
        timestamp: new Date(),
        note: adminNote || 'Refund approved by administrator.',
        metadata: {
          approvedAmount: refund.requestedAmount,
        },
      });

      await refund.save({ session: dbSession });

      await Booking.findByIdAndUpdate(
        refund.booking,
        {
          $set: {
            'refund.status': 'APPROVED',
            'refund.approvedAmount': refund.requestedAmount,
            'refund.adminNote': adminNote || 'Approved by administrator',
            'refund.reviewedAt': new Date(),
            'cancellation.refundStatus': 'refund_approved',
          },
        },
        { session: dbSession }
      );

      return refund;
    });

    return NextResponse.json(
      {
        success: true,
        message: `Refund ${updated.refundId} has been approved. You can now initiate gateway settlement.`,
        data: { refund: updated },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin approve refund error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error approving refund.', error: error.message },
      { status: 500 }
    );
  }
}
