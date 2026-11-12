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
 * POST /api/admin/refunds/[id]/review
 * Marks an eligible refund request as UNDER_REVIEW with administrative notes.
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
        { success: false, message: 'Refund request not found.' },
        { status: 404 }
      );
    }

    if (!['REQUESTED', 'UNDER_REVIEW'].includes(refund.status)) {
      return NextResponse.json(
        { success: false, message: `Cannot move refund to UNDER_REVIEW from status "${refund.status}".` },
        { status: 400 }
      );
    }

    const updated = await withDatabaseTransaction(async (dbSession) => {
      refund.status = 'UNDER_REVIEW';
      refund.adminReview = {
        reviewedBy: auth.adminUser.id,
        reviewedAt: new Date(),
        adminNote: adminNote || refund.adminReview?.adminNote || '',
        action: 'UNDER_REVIEW',
      };
      refund.auditLog.push({
        action: 'UNDER_REVIEW',
        actor: auth.adminUser.id,
        actorName: auth.adminUser.name || auth.adminUser.email,
        actorRole: 'admin',
        timestamp: new Date(),
        note: adminNote || 'Moved to under review by administrator.',
      });

      await refund.save({ session: dbSession });

      await Booking.findByIdAndUpdate(
        refund.booking,
        {
          $set: {
            'refund.status': 'UNDER_REVIEW',
            'refund.adminNote': adminNote,
            'refund.reviewedAt': new Date(),
          },
        },
        { session: dbSession }
      );

      return refund;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Refund request status updated to UNDER_REVIEW.',
        data: { refund: updated },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin review refund error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error updating refund status.', error: error.message },
      { status: 500 }
    );
  }
}
