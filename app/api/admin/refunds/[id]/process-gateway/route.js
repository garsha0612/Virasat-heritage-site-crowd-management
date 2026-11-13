import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAdmin } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import Refund from '@/models/Refund';
import Booking from '@/models/Booking';
import { createCashfreeRefund } from '@/lib/cashfree';

export const dynamic = 'force-dynamic';

function getRefundQuery(idOrRefundId) {
  if (mongoose.Types.ObjectId.isValid(idOrRefundId)) {
    return { _id: idOrRefundId };
  }
  return { refundId: idOrRefundId.toUpperCase().trim() };
}

/**
 * POST /api/admin/refunds/[id]/process-gateway
 * Initiates genuine Cashfree gateway refund for an administrator-approved refund request.
 */
export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { id } = params;
    await connectToDatabase();

    // 1. Locate refund record
    const refund = await Refund.findOne(getRefundQuery(id)).populate('booking');
    if (!refund) {
      return NextResponse.json(
        { success: false, message: 'Refund request record not found.' },
        { status: 404 }
      );
    }

    // 2. Strict status check: only APPROVED or FAILED (for retry) can be processed
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

    // 3. Financial validation: Verify captured payment and refund amount
    const isPaid = booking.paymentStatus === 'completed' || booking.paymentStatus === 'paid';
    if (!isPaid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot refund a booking that has no verified payment captured.',
        },
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

    // 4. Concurrency fencing: Atomically transition status to PROCESSING
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
        {
          success: false,
          message: 'Refund is currently being processed by another worker or has already settled.',
        },
        { status: 409 }
      );
    }

    // 5. Determine Cashfree Order ID
    const cashfreeOrderId = booking.payment?.cashfreeOrderId || booking.bookingReference;

    // 6. Dispatch to Cashfree PG Refund API
    const gatewayResult = await createCashfreeRefund({
      orderId: cashfreeOrderId,
      refundAmount,
      refundId: refund.refundId,
      refundNote: refund.adminReview?.adminNote || 'Approved by administrator',
      refundSpeed: 'STANDARD',
    });

    if (gatewayResult.success) {
      const gwData = gatewayResult.data;
      const isInstantSuccess = gwData.refundStatus === 'SUCCESS';
      const finalStatus = isInstantSuccess ? 'REFUNDED' : 'PROCESSING';

      // Update Refund document
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

      // Update Booking
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
      // Gateway error / rejection
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
  } catch (error) {
    console.error('Process gateway refund error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing gateway refund.', error: error.message },
      { status: 500 }
    );
  }
}
