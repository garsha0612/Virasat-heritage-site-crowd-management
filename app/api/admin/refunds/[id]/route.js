import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAdmin } from '@/lib/adminAuth';
import { connectToDatabase, withDatabaseTransaction } from '@/lib/mongodb';
import Refund from '@/models/Refund';
import Booking from '@/models/Booking';
import { createCashfreeRefund } from '@/lib/cashfree';
import { releaseSlotCapacity } from '@/lib/slots';

export const dynamic = 'force-dynamic';

function getRefundQuery(idOrRefundId) {
  if (mongoose.Types.ObjectId.isValid(idOrRefundId)) {
    return { _id: idOrRefundId };
  }
  return { refundId: idOrRefundId.toUpperCase().trim() };
}

/**
 * GET /api/admin/refunds/[id]
 * Fetch detailed view of a refund request, its parent booking, payment info, and audit history.
 */
export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { id } = params;
    await connectToDatabase();

    const refund = await Refund.findOne(getRefundQuery(id))
      .populate('user', 'name email phone nationality createdAt')
      .populate('booking')
      .populate('adminReview.reviewedBy', 'name email');

    if (!refund) {
      return NextResponse.json(
        { success: false, message: 'Refund request record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          refund,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin refund fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error retrieving refund record.', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/refunds/[id]
 * Unified administrative action controller for refund lifecycle:
 * Actions: 'review' | 'approve' | 'reject' | 'process-gateway' | 'retry'
 */
export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const action = (body.action || '').toLowerCase().trim();
    const adminNote = (body.adminNote || '').trim();
    const reason = (body.reason || adminNote || '').trim();

    await connectToDatabase();

    const refund = await Refund.findOne(getRefundQuery(id)).populate('booking');
    if (!refund) {
      return NextResponse.json(
        { success: false, message: 'Refund request record not found.' },
        { status: 404 }
      );
    }

    // ── ACTION 1: REVIEW (UNDER_REVIEW) ──
    if (action === 'review' || action === 'under_review') {
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
          refund.booking._id,
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
    }

    // ── ACTION 2: APPROVE ──
    if (action === 'approve') {
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

        // Cancel booking and restore slot capacity exactly once upon approval
        const booking = await Booking.findById(refund.booking._id || refund.booking).session(dbSession);
        if (booking) {
          if (!booking.cancellation?.slotRestored && booking.timeSlot?.slotId && booking.totalTickets > 0) {
            await releaseSlotCapacity(booking.timeSlot.slotId, booking.totalTickets, dbSession);
          }

          booking.bookingStatus = 'cancelled';
          booking.cancellation = {
            cancelledAt: booking.cancellation?.cancelledAt || new Date(),
            cancellationReason: refund.reason || 'Refund approved by administrator',
            reason: refund.reason || 'Refund approved by administrator',
            slotRestored: true,
            refundAmount: refund.requestedAmount,
            refundStatus: 'refund_approved',
          };
          booking.refund = {
            ...(booking.refund?.toObject ? booking.refund.toObject() : booking.refund || {}),
            status: 'APPROVED',
            approvedAmount: refund.requestedAmount,
            adminNote: adminNote || 'Approved by administrator',
            reviewedAt: new Date(),
          };

          await booking.save({ session: dbSession });
        }

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
    }

    // ── ACTION 3: REJECT ──
    if (action === 'reject') {
      if (!reason) {
        return NextResponse.json(
          { success: false, message: 'Please provide an administrative reason for rejecting this refund request.' },
          { status: 400 }
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
          refund.booking._id || refund.booking,
          {
            $set: {
              bookingStatus: 'confirmed',
              'refund.status': 'REJECTED',
              'refund.adminNote': reason,
              'refund.reviewedAt': new Date(),
              'cancellation.refundStatus': 'refund_rejected',
              'cancellation.cancelledAt': null,
              'cancellation.slotRestored': false,
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
    }

    // ── ACTION 4: PROCESS GATEWAY / RETRY ──
    if (action === 'process-gateway' || action === 'process_gateway' || action === 'retry') {
      if (!['APPROVED', 'FAILED'].includes(refund.status)) {
        return NextResponse.json(
          {
            success: false,
            message: `Cannot dispatch refund in status "${refund.status}". The refund must first be approved by an administrator.`,
          },
          { status: 400 }
        );
      }

      const booking = refund.booking;
      if (!booking) {
        return NextResponse.json(
          { success: false, message: 'Associated booking reservation record missing.' },
          { status: 400 }
        );
      }

      const isPaid = booking.paymentStatus === 'completed' || booking.paymentStatus === 'paid';
      if (!isPaid) {
        return NextResponse.json(
          { success: false, message: 'Cannot refund a booking that has no verified payment captured.' },
          { status: 400 }
        );
      }

      const refundAmount = refund.approvedAmount || refund.requestedAmount;
      if (refundAmount <= 0 || refundAmount > booking.totalAmount) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid refund amount ₹${refundAmount}. Cannot exceed original captured amount of ₹${booking.totalAmount}.`,
          },
          { status: 400 }
        );
      }

      // Concurrency claim
      const claim = await Refund.findOneAndUpdate(
        {
          _id: refund._id,
          status: { $in: ['APPROVED', 'FAILED'] },
        },
        {
          $set: {
            status: 'PROCESSING',
            'gateway.lastRetryAt': new Date(),
          },
          $inc: { 'gateway.retryCount': 1 },
        },
        { new: true }
      );

      if (!claim) {
        return NextResponse.json(
          { success: false, message: 'Refund is currently being processed by another worker or has already settled.' },
          { status: 409 }
        );
      }

      const cashfreeOrderId = booking.payment?.cashfreeOrderId || booking.bookingReference;

      const gatewayResult = await createCashfreeRefund({
        orderId: cashfreeOrderId,
        refundAmount,
        refundId: refund.refundId,
        refundNote: refund.adminReview?.adminNote || adminNote || 'Approved by administrator',
        refundSpeed: 'STANDARD',
      });

      if (gatewayResult.success) {
        const gwData = gatewayResult.data;
        const isInstantSuccess = gwData.refundStatus === 'SUCCESS';
        const finalStatus = isInstantSuccess ? 'REFUNDED' : 'PROCESSING';

        claim.status = finalStatus;
        claim.gateway = {
          ...claim.gateway,
          provider: 'cashfree',
          cashfreeRefundId: gwData.cfRefundId || gwData.refundId,
          cfRefundId: gwData.cfRefundId,
          gatewayStatus: gwData.refundStatus,
          responsePayload: gwData.raw || gwData,
          processedAt: new Date(),
          failureReason: null,
        };
        claim.auditLog.push({
          action: isInstantSuccess ? 'GATEWAY_CONFIRMED' : 'GATEWAY_INITIATED',
          actor: auth.adminUser.id,
          actorName: auth.adminUser.name || auth.adminUser.email,
          actorRole: 'admin',
          timestamp: new Date(),
          note: `Cashfree gateway returned ${gwData.refundStatus}. CF Refund ID: ${gwData.cfRefundId || gwData.refundId}`,
          metadata: gwData,
        });

        await claim.save();

        await Booking.findByIdAndUpdate(booking._id, {
          $set: {
            bookingStatus: 'cancelled',
            paymentStatus: isInstantSuccess ? 'refunded' : booking.paymentStatus,
            'refund.status': finalStatus,
            'refund.processedAt': new Date(),
            'refund.cashfreeRefundId': gwData.cfRefundId || gwData.refundId,
            'cancellation.refundStatus': isInstantSuccess ? 'refund_processed' : 'refund_pending',
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: isInstantSuccess
              ? `Refund of ₹${refundAmount} has been successfully settled via Cashfree.`
              : `Refund has been initiated with Cashfree (Status: ${gwData.refundStatus}). Awaiting gateway settlement.`,
            data: {
              refund: claim,
              gatewayResponse: gwData,
            },
          },
          { status: 200 }
        );
      } else {
        const failureReason = gatewayResult.error || 'Gateway returned non-success response';
        claim.status = 'FAILED';
        claim.gateway = {
          ...claim.gateway,
          provider: 'cashfree',
          gatewayStatus: 'FAILED',
          failureReason,
          responsePayload: gatewayResult.rawError || null,
        };
        claim.auditLog.push({
          action: 'GATEWAY_FAILED',
          actor: auth.adminUser.id,
          actorName: auth.adminUser.name || auth.adminUser.email,
          actorRole: 'admin',
          timestamp: new Date(),
          note: `Gateway dispatch failed: ${failureReason}`,
        });

        await claim.save();

        await Booking.findByIdAndUpdate(booking._id, {
          $set: {
            'refund.status': 'FAILED',
            'refund.failureReason': failureReason,
            'cancellation.refundStatus': 'refund_failed',
          },
        });

        return NextResponse.json(
          {
            success: false,
            code: 'GATEWAY_DISPATCH_FAILED',
            message: `Cashfree gateway rejected refund: ${failureReason}`,
            data: {
              refundId: claim.refundId,
              status: 'FAILED',
              failureReason,
            },
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: `Unrecognized action "${action}". Valid actions: review, approve, reject, process-gateway, retry.` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Process refund action error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing refund action.', error: error.message },
      { status: 500 }
    );
  }
}
