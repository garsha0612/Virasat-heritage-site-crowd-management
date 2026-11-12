/**
 * ANVAYA – Refund Lifecycle, Admin Governance & Cashfree Integration Audit
 *
 * Verifies:
 * 1. Visitor refund request submission & financial eligibility
 * 2. Strict visitor ownership enforcement (Visitor B cannot touch Visitor A's refund)
 * 3. Duplicate refund request prevention
 * 4. Status workflow: REQUESTED -> UNDER_REVIEW -> APPROVED -> REJECTED -> PROCESSING -> REFUNDED -> FAILED
 * 5. Admin-only authorization on all refund action endpoints
 * 6. Admin review, approval, and rejection
 * 7. Genuine Cashfree refund dispatch & error resilience (no false successes)
 * 8. Fencing & idempotency against double refunds
 * 9. Cashfree webhook refund event processing
 */

import assert from 'assert';
import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/mongodb.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import TimeSlot from '../models/TimeSlot.js';
import Refund from '../models/Refund.js';
import { signJwt } from '../lib/auth.js';

let passed = 0;
let failed = 0;

function it(desc, fn) {
  return async () => {
    try {
      await fn();
      console.log(`  ✓ ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${desc}:`, err.message);
      failed++;
      throw err;
    }
  };
}

export async function runRefundAudit() {
  console.log('\n======================================================================');
  console.log('  RUNNING SUITE 13: ANVAYA REFUND LIFECYCLE & GOVERNANCE AUDIT');
  console.log('======================================================================\n');

  const appUrl = process.env.TEST_APP_URL || 'http://127.0.0.1:3015';
  await connectToDatabase();

  const timestamp = Date.now();

  // Create Test Users
  const visitorA = await User.create({
    name: 'Visitor Alice',
    email: `alice.refund.${timestamp}@anvaya.test`,
    password: 'SecurePassword123!',
    role: 'visitor',
    isActive: true,
  });

  const visitorB = await User.create({
    name: 'Visitor Bob',
    email: `bob.refund.${timestamp}@anvaya.test`,
    password: 'SecurePassword123!',
    role: 'visitor',
    isActive: true,
  });

  const adminUser = await User.create({
    name: 'Admin Supervisor',
    email: `admin.refund.${timestamp}@anvaya.test`,
    password: 'SecurePassword123!',
    role: 'admin',
    isActive: true,
  });

  const tokenVisitorA = await signJwt({ id: visitorA._id.toString(), email: visitorA.email, role: 'visitor' });
  const tokenVisitorB = await signJwt({ id: visitorB._id.toString(), email: visitorB.email, role: 'visitor' });
  const tokenAdmin = await signJwt({ id: adminUser._id.toString(), email: adminUser.email, role: 'admin' });

  // Create Test Slot & Paid Booking for Alice
  const testSlot = await TimeSlot.create({
    heritageSite: 'taj-mahal',
    date: '2026-12-25',
    startTime: '09:00',
    endTime: '11:00',
    capacity: 100,
    reservedCount: 10,
    isActive: true,
  });

  const bookingRefA = `VIR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-RF${String(timestamp).slice(-4)}`;
  const bookingA = await Booking.create({
    bookingReference: bookingRefA,
    user: visitorA._id,
    heritageSite: 'taj-mahal',
    siteName: 'Taj Mahal',
    siteLocation: 'Agra, Uttar Pradesh',
    visitDate: '2026-12-25',
    timeSlot: {
      slotId: testSlot._id,
      startTime: '09:00',
      endTime: '11:00',
      slotLabel: 'Morning Slot',
    },
    tickets: [{ category: 'adult', categoryName: 'Adult Entry', quantity: 2, unitPrice: 50, subtotal: 100 }],
    totalTickets: 2,
    totalAmount: 100,
    currency: 'INR',
    bookingStatus: 'confirmed',
    paymentStatus: 'completed',
    paymentMethod: 'cashfree',
    payment: {
      cashfreeOrderId: `order_${bookingRefA}`,
      cfPaymentId: `cf_pay_${timestamp}`,
      paymentStatus: 'SUCCESS',
      paidAt: new Date(),
    },
    visitorDetails: {
      primaryName: 'Alice Visitor',
      primaryEmail: visitorA.email,
      primaryPhone: '9876543210',
    },
    refund: {
      status: 'NOT_REQUESTED',
    },
  });

  // Second booking (Unpaid / Pending)
  const unpaidBooking = await Booking.create({
    bookingReference: `VIR-UNPAID-${String(timestamp).slice(-4)}`,
    user: visitorA._id,
    heritageSite: 'taj-mahal',
    siteName: 'Taj Mahal',
    visitDate: '2026-12-25',
    timeSlot: { slotId: testSlot._id, startTime: '09:00', endTime: '11:00' },
    tickets: [{ category: 'adult', categoryName: 'Adult', quantity: 1, unitPrice: 50, subtotal: 50 }],
    totalTickets: 1,
    totalAmount: 50,
    bookingStatus: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'none',
    visitorDetails: { primaryName: 'Alice', primaryEmail: visitorA.email },
    refund: { status: 'NOT_REQUESTED' },
  });

  let createdRefundId = null;
  let createdRefundMongoId = null;

  try {
    // 1. Unpaid booking cannot request refund
    await it('Reject refund request on unpaid or pending reservations', async () => {
      const res = await fetch(`${appUrl}/api/bookings/${unpaidBooking._id}/refund-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${tokenVisitorA}`,
        },
        body: JSON.stringify({ reason: 'Trip cancelled' }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /verified payment/i);
    })();

    // 2. Ownership enforcement: Visitor B cannot request refund for Visitor A's booking
    await it('Enforce visitor tenant isolation: Visitor B cannot request refund for Visitor A booking', async () => {
      const res = await fetch(`${appUrl}/api/bookings/${bookingA._id}/refund-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${tokenVisitorB}`,
        },
        body: JSON.stringify({ reason: 'Malicious refund request attempt' }),
      });
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Access denied/i);
    })();

    // 3. Visitor A successfully submits refund request for paid booking
    await it('Allow visitor to submit valid refund request, creating Refund entity and releasing slot', async () => {
      const slotBefore = await TimeSlot.findById(testSlot._id);
      const initialBookings = slotBefore.reservedCount;

      const res = await fetch(`${appUrl}/api/bookings/${bookingA._id}/refund-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${tokenVisitorA}`,
        },
        body: JSON.stringify({
          reason: 'Family emergency, travel cancelled',
          supportingDetails: 'Flight cancelled by airline.',
        }),
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.status, 'REQUESTED');
      assert.strictEqual(data.data.requestedAmount, 100);
      assert.match(data.data.refundId, /^REF-\d{8}-[A-Z0-9]{6}$/);

      createdRefundId = data.data.refundId;

      // Verify DB status
      const updatedBooking = await Booking.findById(bookingA._id);
      assert.strictEqual(updatedBooking.bookingStatus, 'cancelled');
      assert.strictEqual(updatedBooking.refund.status, 'REQUESTED');
      assert.strictEqual(updatedBooking.refund.refundId, createdRefundId);

      const refundDoc = await Refund.findOne({ refundId: createdRefundId });
      assert.ok(refundDoc);
      assert.strictEqual(refundDoc.status, 'REQUESTED');
      assert.strictEqual(refundDoc.requestedAmount, 100);
      assert.strictEqual(refundDoc.auditLog.length, 1);
      assert.strictEqual(refundDoc.auditLog[0].action, 'REQUEST_SUBMITTED');
      createdRefundMongoId = refundDoc._id.toString();

      // Verify slot capacity restoration
      const slotAfter = await TimeSlot.findById(testSlot._id);
      assert.strictEqual(slotAfter.reservedCount, initialBookings - 2);
    })();

    // 4. Duplicate request prevention
    await it('Block duplicate refund request on booking with active refund in progress', async () => {
      const res = await fetch(`${appUrl}/api/bookings/${bookingA._id}/refund-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${tokenVisitorA}`,
        },
        body: JSON.stringify({ reason: 'Duplicate attempt' }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.code, 'REFUND_ALREADY_ACTIVE');
    })();

    // 5. Visitor can inspect refund history
    await it('Allow visitor to fetch their refund status and tracking history', async () => {
      const res = await fetch(`${appUrl}/api/bookings/${bookingA._id}/refund`, {
        headers: { Cookie: `token=${tokenVisitorA}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.refundStatus, 'REQUESTED');
      assert.strictEqual(data.data.refund.refundId, createdRefundId);

      // Also check /api/users/refunds
      const listRes = await fetch(`${appUrl}/api/users/refunds`, {
        headers: { Cookie: `token=${tokenVisitorA}` },
      });
      assert.strictEqual(listRes.status, 200);
      const listData = await listRes.json();
      assert.ok(listData.data.refunds.length >= 1);
    })();

    // 6. Security: Non-admin cannot access admin refund endpoints
    await it('Reject regular visitor trying to access admin refund management API', async () => {
      const res = await fetch(`${appUrl}/api/admin/refunds`, {
        headers: { Cookie: `token=${tokenVisitorA}` },
      });
      assert.strictEqual(res.status, 403);
    })();

    // 7. Admin can query refund list and filter
    await it('Allow administrator to query refunds with status aggregation and search', async () => {
      const res = await fetch(`${appUrl}/api/admin/refunds?status=REQUESTED`, {
        headers: { Cookie: `token=${tokenAdmin}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.data.refunds.length >= 1);
      assert.ok(data.data.counts.REQUESTED >= 1);
    })();

    // 8. Admin moves refund to UNDER_REVIEW
    await it('Administrator marks refund request as UNDER_REVIEW with administrative justification', async () => {
      const res = await fetch(`${appUrl}/api/admin/refunds/${createdRefundMongoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${tokenAdmin}`,
        },
        body: JSON.stringify({ action: 'review', adminNote: 'Checking entry turnstile logs at Taj Mahal' }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.refund.status, 'UNDER_REVIEW');

      const refundDoc = await Refund.findById(createdRefundMongoId);
      assert.strictEqual(refundDoc.status, 'UNDER_REVIEW');
      assert.strictEqual(refundDoc.auditLog[refundDoc.auditLog.length - 1].action, 'UNDER_REVIEW');
    })();

    // 9. Unauthorized visitor cannot approve refund
    await it('Reject non-admin attempt to approve or transition refund request', async () => {
      const res = await fetch(`${appUrl}/api/admin/refunds/${createdRefundMongoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${tokenVisitorA}`,
        },
        body: JSON.stringify({ action: 'approve', adminNote: 'Self-approval attempt' }),
      });
      assert.strictEqual(res.status, 403);
    })();

    // 10. Admin approves refund
    await it('Administrator approves refund request and stages for gateway settlement', async () => {
      const res = await fetch(`${appUrl}/api/admin/refunds/${createdRefundMongoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${tokenAdmin}`,
        },
        body: JSON.stringify({ action: 'approve', adminNote: 'Verified zero gate passage on turnstiles. Approved.' }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.refund.status, 'APPROVED');
      assert.strictEqual(data.data.refund.approvedAmount, 100);

      const bookingState = await Booking.findById(bookingA._id);
      assert.strictEqual(bookingState.refund.status, 'APPROVED');
    })();

    // 11. Admin gateway dispatch: Genuine Cashfree call (sandbox resilience)
    await it('Execute genuine Cashfree gateway refund without false simulation', async () => {
      const res = await fetch(`${appUrl}/api/admin/refunds/${createdRefundMongoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${tokenAdmin}`,
        },
        body: JSON.stringify({ action: 'process-gateway' }),
      });

      // Depending on whether order exists on live Cashfree Sandbox, returns 200 (SUCCESS/PENDING) or 502 (error recorded cleanly)
      const data = await res.json();
      const refundState = await Refund.findById(createdRefundMongoId);

      if (res.status === 200) {
        assert.ok(['REFUNDED', 'PROCESSING'].includes(refundState.status));
        console.log(`     Cashfree refund response accepted: status = ${refundState.status}`);
      } else {
        assert.strictEqual(res.status, 502);
        assert.strictEqual(refundState.status, 'FAILED');
        assert.ok(refundState.gateway.failureReason);
        console.log(`     Cashfree gateway error handled safely without false success: ${refundState.gateway.failureReason}`);
      }

      // Verify audit log has the gateway action recorded
      const lastAudit = refundState.auditLog[refundState.auditLog.length - 1];
      assert.ok(['GATEWAY_CONFIRMED', 'GATEWAY_INITIATED', 'GATEWAY_FAILED'].includes(lastAudit.action));
    })();

    // 12. Idempotency test: Cannot re-approve an already processed or failed refund without reset
    await it('Block invalid state transition: Cannot re-approve a refund in non-pending status', async () => {
      const res = await fetch(`${appUrl}/api/admin/refunds/${createdRefundMongoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${tokenAdmin}`,
        },
        body: JSON.stringify({ action: 'approve', adminNote: 'Invalid second approval attempt' }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    })();

    // 13. Cashfree Refund Webhook Processing
    await it('Process Cashfree refund settlement webhook idempotently', async () => {
      // Simulate incoming verified refund webhook
      const webhookPayload = {
        type: 'REFUND_STATUS_WEBHOOK',
        data: {
          refund: {
            cf_refund_id: `cf_ref_${timestamp}`,
            refund_id: createdRefundId,
            order_id: bookingA.payment.cashfreeOrderId,
            refund_status: 'SUCCESS',
            refund_amount: 100,
          },
        },
      };

      const crypto = await import('crypto');
      const ts = String(Math.floor(Date.now() / 1000));
      const rawBody = JSON.stringify(webhookPayload);
      const secret = process.env.CASHFREE_CLIENT_SECRET;
      const signature = crypto.createHmac('sha256', secret).update(ts + rawBody).digest('base64');

      const res = await fetch(`${appUrl}/api/webhooks/cashfree`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': signature,
          'x-webhook-timestamp': ts,
        },
        body: rawBody,
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);

      // Verify DB state
      const finalRefund = await Refund.findById(createdRefundMongoId);
      assert.strictEqual(finalRefund.status, 'REFUNDED');
      assert.strictEqual(finalRefund.gateway.gatewayStatus, 'SUCCESS');

      const finalBooking = await Booking.findById(bookingA._id);
      assert.strictEqual(finalBooking.paymentStatus, 'refunded');
      assert.strictEqual(finalBooking.refund.status, 'REFUNDED');
    })();

    // 14. Admin Rejection Workflow on a fresh refund
    await it('Administrator successfully rejects an ineligible refund request with reason', async () => {
      const rejectRef = `VIR-REJECT-${String(timestamp).slice(-4)}`;
      const rejectBooking = await Booking.create({
        bookingReference: rejectRef,
        user: visitorB._id,
        heritageSite: 'red-fort',
        siteName: 'Red Fort',
        visitDate: '2026-12-25',
        timeSlot: { slotId: testSlot._id, startTime: '09:00', endTime: '11:00' },
        tickets: [{ category: 'adult', categoryName: 'Adult', quantity: 1, unitPrice: 35, subtotal: 35 }],
        totalTickets: 1,
        totalAmount: 35,
        bookingStatus: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'cashfree',
        visitorDetails: { primaryName: 'Bob', primaryEmail: visitorB.email },
        refund: { status: 'NOT_REQUESTED' },
      });

      // Submit refund
      const reqRes = await fetch(`${appUrl}/api/bookings/${rejectBooking._id}/refund-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${tokenVisitorB}`,
        },
        body: JSON.stringify({ reason: 'Entered monument but did not enjoy rain' }),
      });
      assert.strictEqual(reqRes.status, 201);
      const reqData = await reqRes.json();
      const refundDoc = await Refund.findOne({ refundId: reqData.data.refundId });

      // Admin Rejection
      const rejectRes = await fetch(`${appUrl}/api/admin/refunds/${refundDoc._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${tokenAdmin}`,
        },
        body: JSON.stringify({ action: 'reject', reason: 'Weather conditions do not qualify for pass refund per ASI regulations.' }),
      });
      assert.strictEqual(rejectRes.status, 200);
      const rejectData = await rejectRes.json();
      assert.strictEqual(rejectData.success, true);
      assert.strictEqual(rejectData.data.refund.status, 'REJECTED');

      const updatedDoc = await Refund.findById(refundDoc._id);
      assert.strictEqual(updatedDoc.status, 'REJECTED');
      assert.strictEqual(updatedDoc.adminReview.adminNote, 'Weather conditions do not qualify for pass refund per ASI regulations.');
    })();

    console.log('\n======================================================================');
    console.log(`  ALL ${passed} REFUND LIFECYCLE & GOVERNANCE TESTS PASSED`);
    console.log(`  Passed: ${passed} assertions`);
    console.log(`  Failed: ${failed} assertions`);
    console.log('======================================================================\n');
  } finally {
    // Clean up test data
    await User.deleteMany({ _id: { $in: [visitorA._id, visitorB._id, adminUser._id] } });
    await Booking.deleteMany({ _id: { $in: [bookingA._id, unpaidBooking._id] } });
    await TimeSlot.deleteOne({ _id: testSlot._id });
    if (createdRefundMongoId) {
      await Refund.deleteMany({ user: { $in: [visitorA._id, visitorB._id] } });
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith('refund-lifecycle-audit.mjs')) {
  runRefundAudit()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
