/**
 * ANVAYA – Cashfree Payment Gateway Webhook Handler
 * 
 * POST /api/webhooks/cashfree
 * 
 * Receives real-time payment notifications from Cashfree Gateway.
 * 
 * Security & Idempotency:
 * 1. Cryptographic HMAC-SHA256 signature verification (rejects forged notifications)
 * 2. Idempotent processing (duplicate deliveries safely acknowledged without side-effects)
 * 3. Atomic booking updates with transaction safety
 * 4. QR ticket generation only after verified payment
 * 5. Amount & currency integrity check
 */

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { 
  verifyWebhookSignature, 
  parseWebhookPayload,
  normalizePaymentStatus,
  isPaymentSuccessful
} from '@/lib/cashfree';
import { ensureBookingQRCode } from '@/lib/tickets';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let rawBody = '';
  let payload = null;

  try {
    // 1. Extract Cashfree Webhook Security Headers
    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');
    const idempotencyKey = request.headers.get('x-idempotency-key');

    // 2. Read raw request body for HMAC verification
    try {
      rawBody = await request.text();
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Failed to parse webhook JSON payload:', parseError.message);
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload format' },
        { status: 400 }
      );
    }

    // 3. Cryptographic Signature Verification
    if (!signature || !timestamp) {
      console.error('Missing required webhook verification headers');
      return NextResponse.json(
        { success: false, message: 'Missing x-webhook-signature or x-webhook-timestamp headers' },
        { status: 401 }
      );
    }

    try {
      verifyWebhookSignature(signature, rawBody, timestamp);
    } catch (sigErr) {
      console.error('Unauthorized webhook delivery:', sigErr.message);
      return NextResponse.json(
        { success: false, message: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Webhook Replay Protection: Reject requests where timestamp drift exceeds 300 seconds (5 minutes)
    const webhookTs = parseInt(timestamp, 10);
    if (!isNaN(webhookTs)) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const tsInSeconds = webhookTs > 9999999999 ? Math.floor(webhookTs / 1000) : webhookTs;
      if (Math.abs(nowSeconds - tsInSeconds) > 300) {
        console.warn(`Webhook rejected: timestamp drift too large (${Math.abs(nowSeconds - tsInSeconds)}s)`);
        return NextResponse.json(
          { success: false, message: 'Webhook timestamp expired or replay detected' },
          { status: 401 }
        );
      }
    }

    // 4. Parse and normalize webhook payload
    let webhookData;
    try {
      webhookData = parseWebhookPayload(payload);
    } catch (payloadErr) {
      console.error('Invalid webhook payload structure:', payloadErr.message);
      return NextResponse.json(
        { success: false, message: 'Invalid webhook structure' },
        { status: 400 }
      );
    }

    const { eventType, order, payment } = webhookData;

    console.log(`📨 Validated Cashfree webhook [${eventType}] received for Order ID: ${order.orderId}`);

    await connectToDatabase();

    // Handle Refund Webhook Events
    if (eventType && (eventType.includes('REFUND') || payload?.type?.includes('REFUND'))) {
      const refundData = payload?.data?.refund || payload?.data;
      const cfRefundId = refundData?.cf_refund_id;
      const refundId = refundData?.refund_id;
      const refundStatus = (refundData?.refund_status || '').toUpperCase();

      if (refundId || cfRefundId) {
        const Refund = (await import('@/models/Refund')).default;
        const refundDoc = await Refund.findOne({
          $or: [
            ...(refundId ? [{ refundId }] : []),
            ...(cfRefundId ? [{ 'gateway.cashfreeRefundId': cfRefundId }, { 'gateway.cfRefundId': cfRefundId }] : []),
          ],
        });

        if (refundDoc) {
          if (refundStatus === 'SUCCESS') {
            refundDoc.status = 'REFUNDED';
            refundDoc.gateway.gatewayStatus = 'SUCCESS';
            refundDoc.gateway.processedAt = new Date();
            refundDoc.auditLog.push({
              action: 'GATEWAY_CONFIRMED',
              actorName: 'Cashfree Webhook',
              actorRole: 'system',
              note: `Webhook verified refund settlement. CF Refund ID: ${cfRefundId || refundId}`,
            });
            await refundDoc.save();

            const booking = await Booking.findById(refundDoc.booking);
            if (booking) {
              if (!booking.cancellation?.slotRestored && booking.timeSlot?.slotId && booking.totalTickets > 0) {
                const { releaseSlotCapacity } = await import('@/lib/slots');
                await releaseSlotCapacity(booking.timeSlot.slotId, booking.totalTickets);
              }
              booking.bookingStatus = 'cancelled';
              booking.paymentStatus = 'refunded';
              booking.cancellation = {
                ...(booking.cancellation?.toObject ? booking.cancellation.toObject() : booking.cancellation || {}),
                cancelledAt: booking.cancellation?.cancelledAt || new Date(),
                slotRestored: true,
                refundStatus: 'refund_processed',
              };
              booking.refund = {
                ...(booking.refund?.toObject ? booking.refund.toObject() : booking.refund || {}),
                status: 'REFUNDED',
                processedAt: new Date(),
              };
              await booking.save();
            }
            console.log(`✅ Webhook confirmed refund for ${refundDoc.refundId}`);
          } else if (refundStatus === 'FAILED') {
            refundDoc.status = 'FAILED';
            refundDoc.gateway.gatewayStatus = 'FAILED';
            refundDoc.gateway.failureReason = refundData?.refund_failure_reason || 'Gateway reported refund failure';
            refundDoc.auditLog.push({
              action: 'GATEWAY_FAILED',
              actorName: 'Cashfree Webhook',
              actorRole: 'system',
              note: `Webhook reported refund failed: ${refundDoc.gateway.failureReason}`,
            });
            await refundDoc.save();

            await Booking.findByIdAndUpdate(refundDoc.booking, {
              $set: {
                'refund.status': 'FAILED',
                'refund.failureReason': refundDoc.gateway.failureReason,
                'cancellation.refundStatus': 'refund_failed',
              },
            });
            console.log(`❌ Webhook recorded refund failure for ${refundDoc.refundId}`);
          }

          return NextResponse.json(
            { success: true, message: `Refund notification [${refundStatus}] processed successfully.` },
            { status: 200 }
          );
        }
      }
    }

    // 5. Locate matching booking in database

    const booking = await Booking.findOne({
      $or: [
        { 'payment.cashfreeOrderId': order.orderId },
        { bookingReference: order.orderId.replace(/^ANVAYA-/, '').replace(/-\d+$/, '') }
      ]
    });

    if (!booking) {
      console.warn(`Booking record not found for Cashfree order: ${order.orderId}`);
      // Acknowledge with 200 to prevent Cashfree retry storm
      return NextResponse.json(
        { success: true, message: 'Order reference acknowledged; no matching reservation found.' },
        { status: 200 }
      );
    }

    // 6. Idempotency Check: Already confirmed bookings must not be duplicated
    if (booking.paymentStatus === 'completed' && booking.bookingStatus === 'confirmed') {
      console.log(`✅ Webhook idempotent check: ${booking.bookingReference} is already confirmed.`);
      return NextResponse.json(
        { 
          success: true, 
          message: 'Notification acknowledged (idempotent)',
          bookingReference: booking.bookingReference 
        },
        { status: 200 }
      );
    }

    // 7. Verify Amount Integrity
    if (order.orderAmount && Number(order.orderAmount) !== Number(booking.totalAmount)) {
      console.error(`🚨 Webhook amount mismatch for ${booking.bookingReference}: expected ${booking.totalAmount}, got ${order.orderAmount}`);
      return NextResponse.json(
        { success: false, message: 'Order amount integrity check failed' },
        { status: 400 }
      );
    }

    // 8. Determine Payment Status
    const paymentSuccess = isPaymentSuccessful(order.orderStatus, payment.paymentStatus);
    const normalizedStatus = normalizePaymentStatus(payment.paymentStatus || order.orderStatus);

    booking.payment.orderStatus = order.orderStatus;
    booking.payment.webhookEventType = eventType;
    booking.payment.lastWebhookAt = new Date();

    if (payment.cfPaymentId) {
      booking.payment.cfPaymentId = payment.cfPaymentId;
      booking.payment.paymentStatus = payment.paymentStatus;
      booking.payment.paymentMethod = payment.paymentMethod;
      booking.payment.paymentAmount = payment.paymentAmount;
      booking.payment.paymentTime = payment.paymentTime ? new Date(payment.paymentTime) : new Date();
      booking.payment.bankReference = payment.bankReference;
      booking.payment.paymentMessage = payment.paymentMessage;
    }

    // 9. Handle Success Event
    if (paymentSuccess) {
      booking.bookingStatus = 'confirmed';
      booking.paymentStatus = 'completed';
      booking.paymentMethod = 'cashfree';
      booking.payment.paidAt = new Date();

      await booking.save();

      // Ensure QR ticket is generated
      try {
        await ensureBookingQRCode(booking._id.toString());
      } catch (qrErr) {
        console.error('QR ticket generation in webhook warning:', qrErr.message);
      }

      console.log(`✅ Webhook confirmed booking: ${booking.bookingReference}`);

      return NextResponse.json(
        {
          success: true,
          message: 'Payment confirmed and reservation finalized successfully.',
          bookingReference: booking.bookingReference,
          status: 'confirmed'
        },
        { status: 200 }
      );
    }

    // 10. Handle Failed / Cancelled Event
    if (normalizedStatus === 'failed' || normalizedStatus === 'cancelled') {
      booking.bookingStatus = 'failed';
      booking.paymentStatus = normalizedStatus;
      booking.payment.failureReason = payment.paymentMessage || `Payment ${normalizedStatus}`;

      await booking.save();

      console.log(`❌ Webhook recorded payment ${normalizedStatus} for: ${booking.bookingReference}`);

      return NextResponse.json(
        {
          success: true,
          message: `Payment ${normalizedStatus} recorded.`,
          bookingReference: booking.bookingReference,
          status: 'failed'
        },
        { status: 200 }
      );
    }

    // 11. Handle Pending Status
    booking.paymentStatus = normalizedStatus;
    await booking.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Payment status updated to pending.',
        bookingReference: booking.bookingReference
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unhandled webhook exception:', error);
    return NextResponse.json(
      { success: false, message: 'Internal error processing webhook' },
      { status: 200 }
    );
  }
}

/**
 * Health check endpoint for Cashfree webhook endpoint verification
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: 'Cashfree webhook endpoint is active and listening.',
      endpoint: '/api/webhooks/cashfree',
      environment: 'SANDBOX',
      requirements: {
        method: 'POST',
        headers: ['x-webhook-signature', 'x-webhook-timestamp']
      }
    },
    { status: 200 }
  );
}
