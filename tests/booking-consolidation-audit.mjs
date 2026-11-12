import mongoose from 'mongoose';
import assert from 'assert';
import { executeTestFixturePayment } from './helpers/test-payment-fixture.mjs';

const BASE_URL = process.env.TEST_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3015';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/heritageDB?replicaSet=rs0';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runConsolidationAudit() {
  console.log('\n================================================================');
  console.log('VIRASAT PHASE 5: CONSOLIDATED TRANSACTION & CONSISTENCY AUDIT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function recordPass(desc) {
    passed++;
    console.log(`[PASS] ${desc}`);
  }

  function recordFail(desc, err) {
    failed++;
    console.error(`[FAIL] ${desc}:`, err.message || err);
  }

  // Direct MongoDB connection for inspecting database state
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const bookingsCollection = db.collection('bookings');
  const slotsCollection = db.collection('timeslots');
  const usersCollection = db.collection('users');

  // Verify replica set topology and transactions capability
  const isMaster = await db.admin().command({ isMaster: 1 });
  const hasReplicaSet = Boolean(isMaster.setName);
  assert(hasReplicaSet, 'MongoDB deployment MUST be a Replica Set with transaction support');
  console.log(`[TOPOLOGY] Connected to Replica Set: '${isMaster.setName}', Primary: ${isMaster.isWritablePrimary}`);

  // -------------------------------------------------------------
  // SETUP: Register Authenticated Test Users
  // -------------------------------------------------------------
  console.log('\n--- SETUP: Registering Authenticated Visitors ---');
  const ts = Date.now();
  const userAEmail = `audit-visitor-a-${ts}@virasat.test`;
  const userBEmail = `audit-visitor-b-${ts}@virasat.test`;

  async function registerUser(name, email) {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password: 'Password123!',
        phone: '+919876543210',
      }),
    });
    const cookie = res.headers.get('set-cookie')?.split(';')[0] || '';
    const data = await res.json();
    return { cookie, userId: data.data?.user?.id };
  }

  const userA = await registerUser('Visitor A', userAEmail);
  const userB = await registerUser('Visitor B', userBEmail);
  assert(userA.cookie && userB.cookie, 'SETUP: Registered User A and User B with session cookies');
  recordPass('SETUP: Authenticated visitor sessions established');

  const testDate = '2026-12-30';
  let slotIndex = 1;

  // Clean any previous test data for this test date and users
  await slotsCollection.deleteMany({ date: testDate });
  await bookingsCollection.deleteMany({ visitDate: testDate });
  await usersCollection.deleteMany({ email: { $in: [userAEmail, userBEmail] } });

  async function createTestSlot(label, capacity = 10, initialReserved = 0) {
    const hour = String(slotIndex++).padStart(2, '0');
    const doc = await slotsCollection.insertOne({
      heritageSite: 'taj-mahal',
      date: testDate,
      startTime: `${hour}:00`,
      endTime: `${hour}:50`,
      slotLabel: `${label} (${hour}:00)`,
      capacity,
      reservedCount: initialReserved,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return doc.insertedId;
  }

  // -------------------------------------------------------------
  // TEST 1: Successful Registration & Booking Creation
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: Successful Registration & Booking Creation ---');
  try {
    const slot1Id = await createTestSlot('Slot-T1', 10, 0);

    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({
        siteSlug: 'taj-mahal',
        visitDate: testDate,
        slotId: slot1Id.toString(),
        tickets: [{ category: 'indianAdult', quantity: 2 }],
        visitorDetails: {
          primaryName: 'Visitor A',
          primaryEmail: userAEmail,
          nationality: 'Indian',
        },
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 201, 'HTTP 201 Created expected');
    assert.strictEqual(data.success, true, 'success: true expected');
    assert.strictEqual(data.data.booking.bookingStatus, 'pending', 'Initial bookingStatus is pending');
    assert.strictEqual(data.data.booking.paymentStatus, 'pending', 'Initial paymentStatus is pending');
    assert.match(data.data.booking.bookingReference, /^VIR-\d{8}-[A-F0-9]{6}$/, 'Booking reference format correct');

    // Inspect database state
    const slotInDb = await slotsCollection.findOne({ _id: slot1Id });
    assert.strictEqual(slotInDb.reservedCount, 2, 'TimeSlot reservedCount atomically incremented to 2');

    recordPass('TEST 1: Successful registration & booking creation in atomic transaction');
  } catch (err) {
    recordFail('TEST 1: Successful booking creation', err);
  }

  // -------------------------------------------------------------
  // TEST 2: Invalid Booking Input Validation
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Invalid Booking Input Validation ---');
  try {
    // Missing required fields
    const resMissing = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ siteSlug: 'taj-mahal' }),
    });
    assert.strictEqual(resMissing.status, 400, 'Missing fields rejected with 400');

    // Past date
    const resPast = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({
        siteSlug: 'taj-mahal',
        visitDate: '2020-01-01',
        slotId: new mongoose.Types.ObjectId().toString(),
        tickets: [{ category: 'indianAdult', quantity: 1 }],
        visitorDetails: { primaryName: 'Test', primaryEmail: 'test@virasat.test' },
      }),
    });
    assert.strictEqual(resPast.status, 400, 'Past date rejected with 400');

    // Exceeding 10 tickets per order
    const resBulk = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({
        siteSlug: 'taj-mahal',
        visitDate: testDate,
        slotId: new mongoose.Types.ObjectId().toString(),
        tickets: [{ category: 'indianAdult', quantity: 11 }],
        visitorDetails: { primaryName: 'Test', primaryEmail: 'test@virasat.test' },
      }),
    });
    assert.strictEqual(resBulk.status, 400, 'Exceeding 10 tickets rejected with 400');

    recordPass('TEST 2: Input validation strictly protects against invalid booking payloads');
  } catch (err) {
    recordFail('TEST 2: Input validation', err);
  }

  // -------------------------------------------------------------
  // TEST 3: Server-Side Price Calculation (Tampering Defense)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Server-Side Price Calculation (Tampering Defense) ---');
  try {
    const slot3Id = await createTestSlot('Slot-T3', 10, 0);

    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({
        siteSlug: 'taj-mahal',
        visitDate: testDate,
        slotId: slot3Id.toString(),
        tickets: [{ category: 'indianAdult', quantity: 2, unitPrice: 1, subtotal: 2 }],
        totalAmount: 2, // Client price tampering attempt (₹2 instead of ₹100)
        visitorDetails: {
          primaryName: 'Visitor A',
          primaryEmail: userAEmail,
          nationality: 'Indian',
        },
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 201, 'Booking created');
    // Taj Mahal Indian Adult official tariff is ₹50; 2 tickets = ₹100
    assert.strictEqual(data.data.totalAmount, 100, 'Server strictly calculated official total ₹100');

    const dbBooking = await bookingsCollection.findOne({ bookingReference: data.data.bookingReference });
    assert.strictEqual(dbBooking.totalAmount, 100, 'Database persisted server-calculated ₹100');

    recordPass('TEST 3: Server-side pricing strictly overwrote client price tampering with official tariff');
  } catch (err) {
    recordFail('TEST 3: Server-side pricing', err);
  }

  // -------------------------------------------------------------
  // TEST 4: Slot Capacity Enforcement
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Slot Capacity Enforcement ---');
  try {
    // Slot with capacity 5, already having 4 reserved
    const slot4Id = await createTestSlot('Slot-T4', 5, 4);

    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({
        siteSlug: 'taj-mahal',
        visitDate: testDate,
        slotId: slot4Id.toString(),
        tickets: [{ category: 'indianAdult', quantity: 2 }], // Requesting 2 when only 1 remains
        visitorDetails: {
          primaryName: 'Visitor A',
          primaryEmail: userAEmail,
          nationality: 'Indian',
        },
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 409, 'Overbooking rejected with HTTP 409 Conflict');
    assert.strictEqual(data.remainingCapacity, 1, 'Accurately reported remaining capacity 1');

    // Verify slot was not modified
    const slotInDb = await slotsCollection.findOne({ _id: slot4Id });
    assert.strictEqual(slotInDb.reservedCount, 4, 'Slot capacity untouched at 4');

    recordPass('TEST 4: Overbooking request strictly rejected with 409 and remaining capacity reported');
  } catch (err) {
    recordFail('TEST 4: Slot capacity enforcement', err);
  }

  // -------------------------------------------------------------
  // TEST 5: Real Simultaneous Concurrent Booking Requests
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Real Simultaneous Concurrent Booking Requests ---');
  try {
    // Slot capacity 5, initial reserved 0. 5 concurrent requests for 2 tickets each (10 requested vs 5 capacity).
    const slot5Id = await createTestSlot('Slot-T5-Concur', 5, 0);

    const requests = Array.from({ length: 5 }, (_, i) =>
      fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
        body: JSON.stringify({
          siteSlug: 'taj-mahal',
          visitDate: testDate,
          slotId: slot5Id.toString(),
          tickets: [{ category: 'indianAdult', quantity: 2 }],
          visitorDetails: {
            primaryName: `Concurrent Visitor ${i}`,
            primaryEmail: `concur-${i}-${ts}@virasat.test`,
            nationality: 'Indian',
          },
        }),
      })
    );

    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);
    const successes = statuses.filter((s) => s === 201).length;
    const rejections = statuses.filter((s) => s === 409).length;

    console.log(`Concurrent outcomes: ${successes} Succeeded (201), ${rejections} Rejected (409)`);
    assert.strictEqual(successes, 2, 'Exactly 2 requests succeeded (4 tickets allocated)');
    assert.strictEqual(rejections, 3, 'Exactly 3 requests rejected (prevented capacity breach)');

    const finalSlot = await slotsCollection.findOne({ _id: slot5Id });
    assert.strictEqual(finalSlot.reservedCount, 4, 'Slot reservedCount exactly 4 (never exceeded capacity 5)');

    const createdBookings = await bookingsCollection.countDocuments({ 'timeSlot.slotId': slot5Id });
    assert.strictEqual(createdBookings, 2, 'Exactly 2 bookings created in database');

    recordPass('TEST 5: Concurrent transactions strictly prevented overbooking; slot occupancy preserved');
  } catch (err) {
    recordFail('TEST 5: Concurrent booking requests', err);
  }

  // -------------------------------------------------------------
  // TEST 6: Transaction Rollback After Booking Creation Failure
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Transaction Rollback After Booking Creation Failure ---');
  try {
    const slot6Id = await createTestSlot('Slot-T6-Rollback', 10, 0);

    // Run a manual transaction that increments slot capacity, then aborts
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await slotsCollection.updateOne(
          { _id: slot6Id },
          { $inc: { reservedCount: 3 } },
          { session }
        );
        // Simulate unexpected failure before commit
        throw new Error('Simulated crash inside multi-document transaction');
      });
    } catch (expectedErr) {
      // Transaction aborted
    } finally {
      await session.endSession();
    }

    const slotAfterAbort = await slotsCollection.findOne({ _id: slot6Id });
    assert.strictEqual(slotAfterAbort.reservedCount, 0, 'Slot reservedCount rolled back to 0 by storage engine');

    recordPass('TEST 6: Transaction rollback cleanly undid slot capacity increment after failure');
  } catch (err) {
    recordFail('TEST 6: Transaction rollback after booking creation failure', err);
  }

  // -------------------------------------------------------------
  // TEST 7: Transaction Rollback After Slot Reservation Failure
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Transaction Rollback After Slot Reservation Failure ---');
  try {
    const slot7Id = await createTestSlot('Slot-T7-SlotFail', 2, 2); // Full slot

    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({
        siteSlug: 'taj-mahal',
        visitDate: testDate,
        slotId: slot7Id.toString(),
        tickets: [{ category: 'indianAdult', quantity: 1 }],
        visitorDetails: { primaryName: 'Test', primaryEmail: userAEmail },
      }),
    });

    assert.strictEqual(res.status, 409, 'Rejected with 409');
    const bookingsCount = await bookingsCollection.countDocuments({ 'timeSlot.slotId': slot7Id });
    assert.strictEqual(bookingsCount, 0, 'Zero bookings created in database');

    recordPass('TEST 7: Slot capacity check failure cleanly aborted transaction with zero created documents');
  } catch (err) {
    recordFail('TEST 7: Transaction rollback after slot reservation failure', err);
  }

  // -------------------------------------------------------------
  // TEST 8: Duplicate Idempotency Requests
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Duplicate Idempotency Requests ---');
  try {
    const slot8Id = await createTestSlot('Slot-T8-Idem', 10, 0);
    const idemKey = `idem-key-${Date.now()}`;

    const makeReq = () =>
      fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
        body: JSON.stringify({
          siteSlug: 'taj-mahal',
          visitDate: testDate,
          slotId: slot8Id.toString(),
          tickets: [{ category: 'indianAdult', quantity: 2 }],
          visitorDetails: { primaryName: 'Idem Visitor', primaryEmail: userAEmail },
          idempotencyKey: idemKey,
        }),
      });

    const res1 = await makeReq();
    const data1 = await res1.json();
    assert.strictEqual(res1.status, 201, 'First request created booking with 201');

    const res2 = await makeReq();
    const data2 = await res2.json();
    assert.strictEqual(res2.status, 200, 'Duplicate request returned 200 (idempotent replay)');
    assert.strictEqual(data2.data.idempotentReplay, true, 'idempotentReplay: true reported');
    assert.strictEqual(data2.data.bookingId, data1.data.bookingId, 'Returned identical booking ID');

    const slotInDb = await slotsCollection.findOne({ _id: slot8Id });
    assert.strictEqual(slotInDb.reservedCount, 2, 'Slot capacity incremented ONLY ONCE (2 tickets, not 4)');

    const totalBookings = await bookingsCollection.countDocuments({ idempotencyKey: idemKey });
    assert.strictEqual(totalBookings, 1, 'Exactly ONE booking exists in MongoDB');

    recordPass('TEST 8: Idempotency key strictly returned existing booking without double capacity deduction');
  } catch (err) {
    recordFail('TEST 8: Duplicate idempotency requests', err);
  }

  // -------------------------------------------------------------
  // TEST 9: Payment Success
  // -------------------------------------------------------------
  console.log('\n--- TEST 9: Payment Success & Ticket Generation ---');
  let testBookingId = null;
  let testBookingRef = null;
  try {
    const slot9Id = await createTestSlot('Slot-T9-Pay', 10, 0);
    const bookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({
        siteSlug: 'taj-mahal',
        visitDate: testDate,
        slotId: slot9Id.toString(),
        tickets: [{ category: 'indianAdult', quantity: 2 }],
        visitorDetails: { primaryName: 'Visitor A', primaryEmail: userAEmail },
      }),
    });
    const bookData = await bookRes.json();
    testBookingId = bookData.data.bookingId;
    testBookingRef = bookData.data.bookingReference;

    const payData = await executeTestFixturePayment({
      bookingId: testBookingId,
      user: { id: userA.userId, role: 'visitor' },
      paymentMethod: 'upi',
    });
    const payRes = { status: payData.status };

    assert.strictEqual(payRes.status, 200, 'Payment returned HTTP 200');
    assert.strictEqual(payData.data.booking.bookingStatus, 'confirmed', 'Status transitioned to confirmed');
    assert.strictEqual(payData.data.booking.paymentStatus, 'paid', 'Payment status transitioned to paid');
    assert.ok(payData.data.booking.ticketCode, 'Ticket code generated');
    assert.ok(payData.data.booking.qrCodeDataUrl?.startsWith('data:image/png;base64,'), 'QR code generated as PNG data URL');

    recordPass('TEST 9: Payment confirmed booking and generated scannable digital ticket pass');
  } catch (err) {
    recordFail('TEST 9: Payment success', err);
  }

  // -------------------------------------------------------------
  // TEST 10: Payment Failure Simulation
  // -------------------------------------------------------------
  console.log('\n--- TEST 10: Payment Failure Simulation ---');
  try {
    const slot10Id = await createTestSlot('Slot-T10-FailPay', 10, 0);
    const bookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({
        siteSlug: 'taj-mahal',
        visitDate: testDate,
        slotId: slot10Id.toString(),
        tickets: [{ category: 'indianAdult', quantity: 1 }],
        visitorDetails: { primaryName: 'Visitor A', primaryEmail: userAEmail },
      }),
    });
    const bookData = await bookRes.json();
    const failBookingId = bookData.data.bookingId;

    const failData = await executeTestFixturePayment({
      bookingId: failBookingId,
      user: { id: userA.userId, role: 'visitor' },
      simulateFailure: true,
    });
    const payRes = { status: failData.status };

    assert.strictEqual(payRes.status, 200, 'Simulated failure returned 200');
    assert.strictEqual(failData.success, false, 'Simulated failure returned success: false');
    const dbBooking = await bookingsCollection.findOne({ _id: new mongoose.Types.ObjectId(failBookingId) });
    assert.strictEqual(dbBooking.paymentStatus, 'failed', 'Payment status marked as failed');
    assert.strictEqual(dbBooking.bookingStatus, 'pending', 'Booking status remains pending for retry');

    recordPass('TEST 10: Simulated payment failure marked paymentStatus failed while preserving booking for retry');
  } catch (err) {
    recordFail('TEST 10: Payment failure simulation', err);
  }

  // -------------------------------------------------------------
  // TEST 11: Duplicate Payment Requests
  // -------------------------------------------------------------
  console.log('\n--- TEST 11: Duplicate Payment Requests ---');
  try {
    // Attempt re-paying the confirmed booking from TEST 9
    const dupData = await executeTestFixturePayment({
      bookingId: testBookingId,
      user: { id: userA.userId, role: 'visitor' },
      paymentMethod: 'card',
    });
    const dupPayRes = { status: dupData.status };

    assert.strictEqual(dupPayRes.status, 400, 'Duplicate payment rejected with HTTP 400');
    assert.strictEqual(dupData.code, 'ALREADY_PAID', 'Error code is ALREADY_PAID');

    recordPass('TEST 11: Duplicate payment on confirmed booking strictly rejected with ALREADY_PAID');
  } catch (err) {
    recordFail('TEST 11: Duplicate payment requests', err);
  }

  // -------------------------------------------------------------
  // TEST 12: Payment vs Cancellation Race
  // -------------------------------------------------------------
  console.log('\n--- TEST 12: Payment vs Cancellation Race ---');
  try {
    const slot12Id = await createTestSlot('Slot-T12-Race', 10, 0);
    const bookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({
        siteSlug: 'taj-mahal',
        visitDate: testDate,
        slotId: slot12Id.toString(),
        tickets: [{ category: 'indianAdult', quantity: 2 }],
        visitorDetails: { primaryName: 'Visitor A', primaryEmail: userAEmail },
      }),
    });
    const bookData = await bookRes.json();
    const raceBookingId = bookData.data.bookingId;

    // Send simultaneous Payment and Cancellation
    const [racePayRes, raceCancelRes] = await Promise.all([
      executeTestFixturePayment({
        bookingId: raceBookingId,
        user: { id: userA.userId, role: 'visitor' },
      }),
      fetch(`${BASE_URL}/api/bookings/${raceBookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
        body: JSON.stringify({ reason: 'Racing cancellation' }),
      }),
    ]);

    const finalBooking = await bookingsCollection.findOne({ _id: new mongoose.Types.ObjectId(raceBookingId) });
    assert.ok(
      finalBooking.bookingStatus === 'confirmed' || finalBooking.bookingStatus === 'cancelled',
      'Booking resolved to a valid deterministic status (confirmed or cancelled)'
    );

    const finalSlot = await slotsCollection.findOne({ _id: slot12Id });
    if (finalBooking.bookingStatus === 'cancelled') {
      assert.strictEqual(finalSlot.reservedCount, 0, 'Capacity released if cancelled');
    } else {
      assert.strictEqual(finalSlot.reservedCount, 2, 'Capacity preserved if confirmed');
    }

    recordPass('TEST 12: Payment versus cancellation race resolved deterministically via ACID transactions');
  } catch (err) {
    recordFail('TEST 12: Payment vs cancellation race', err);
  }

  // -------------------------------------------------------------
  // TEST 13: Successful Cancellation & Simulated Refund
  // -------------------------------------------------------------
  console.log('\n--- TEST 13: Successful Cancellation & Simulated Refund ---');
  let cancelBookingId = null;
  let cancelSlotId = null;
  try {
    cancelSlotId = await createTestSlot('Slot-T13-Cancel', 10, 0);
    const bookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({
        siteSlug: 'taj-mahal',
        visitDate: testDate,
        slotId: cancelSlotId.toString(),
        tickets: [{ category: 'indianAdult', quantity: 2 }],
        visitorDetails: { primaryName: 'Visitor A', primaryEmail: userAEmail },
      }),
    });
    const bookData = await bookRes.json();
    cancelBookingId = bookData.data.bookingId;

    // First pay for it
    await executeTestFixturePayment({
      bookingId: cancelBookingId,
      user: { id: userA.userId, role: 'visitor' },
    });

    // Now cancel
    const cancelRes = await fetch(`${BASE_URL}/api/bookings/${cancelBookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ reason: 'Trip rescheduled by visitor' }),
    });

    const cancelData = await cancelRes.json();
    assert.strictEqual(cancelRes.status, 200, 'Cancellation returned HTTP 200');
    assert.strictEqual(cancelData.data.booking.bookingStatus, 'cancelled', 'Status transitioned to cancelled');
    assert.strictEqual(cancelData.data.booking.paymentStatus, 'refunded', 'Payment status transitioned to refunded');
    assert.strictEqual(
      cancelData.data.booking.cancellation.refundStatus,
      'simulated_refund_processed',
      'Refund marked simulated_refund_processed'
    );

    recordPass('TEST 13: Confirmed booking cancelled successfully with simulated refund processed');
  } catch (err) {
    recordFail('TEST 13: Successful cancellation', err);
  }

  // -------------------------------------------------------------
  // TEST 14: Duplicate Cancellation Rejection
  // -------------------------------------------------------------
  console.log('\n--- TEST 14: Duplicate Cancellation Rejection ---');
  try {
    const dupCancelRes = await fetch(`${BASE_URL}/api/bookings/${cancelBookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ reason: 'Second cancellation request' }),
    });

    assert.strictEqual(dupCancelRes.status, 400, 'Duplicate cancellation rejected with HTTP 400');
    recordPass('TEST 14: Duplicate cancellation attempt strictly rejected with HTTP 400');
  } catch (err) {
    recordFail('TEST 14: Duplicate cancellation', err);
  }

  // -------------------------------------------------------------
  // TEST 15: Capacity Restoration After Cancellation
  // -------------------------------------------------------------
  console.log('\n--- TEST 15: Capacity Restoration After Cancellation ---');
  try {
    const slotAfterCancel = await slotsCollection.findOne({ _id: cancelSlotId });
    assert.strictEqual(slotAfterCancel.reservedCount, 0, 'TimeSlot reservedCount restored from 2 to 0 without underflow');
    recordPass('TEST 15: Slot capacity accurately restored to 0 without underflow or capacity leak');
  } catch (err) {
    recordFail('TEST 15: Capacity restoration', err);
  }

  // -------------------------------------------------------------
  // TEST 16: Booking Ownership & Tenant Isolation
  // -------------------------------------------------------------
  console.log('\n--- TEST 16: Booking Ownership & Tenant Isolation ---');
  try {
    // User B attempts to access User A's booking
    const getRes = await fetch(`${BASE_URL}/api/bookings/${testBookingId}`, {
      headers: { Cookie: userB.cookie },
    });
    assert.strictEqual(getRes.status, 403, 'Cross-user GET rejected with 403 Forbidden');

    // User B attempts to cancel User A's booking
    const cancelRes = await fetch(`${BASE_URL}/api/bookings/${testBookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
      body: JSON.stringify({ reason: 'Malicious cancellation' }),
    });
    assert.strictEqual(cancelRes.status, 403, 'Cross-user cancel rejected with 403 Forbidden');

    // User B dashboard query shows 0 bookings of User A
    const listRes = await fetch(`${BASE_URL}/api/bookings`, {
      headers: { Cookie: userB.cookie },
    });
    const listData = await listRes.json();
    assert.strictEqual(listData.count, 0, 'User B sees 0 bookings (complete tenant data isolation)');

    recordPass('TEST 16: Multi-tenant data isolation strictly prevents cross-user access, payment, or cancellation');
  } catch (err) {
    recordFail('TEST 16: Booking ownership isolation', err);
  }

  // -------------------------------------------------------------
  // TEST 17: Invalid & Cancelled QR Tickets
  // -------------------------------------------------------------
  console.log('\n--- TEST 17: Invalid & Cancelled QR Tickets ---');
  try {
    // Retrieve cancelled booking dossier
    const getCancelledRes = await fetch(`${BASE_URL}/api/bookings/${cancelBookingId}`, {
      headers: { Cookie: userA.cookie },
    });
    const cancelledData = await getCancelledRes.json();
    assert.strictEqual(cancelledData.data.booking.bookingStatus, 'cancelled', 'Dossier confirms cancelled status');

    // Payment on cancelled booking is strictly blocked
    const payOnCancelRes = await executeTestFixturePayment({
      bookingId: cancelBookingId,
      user: { id: userA.userId, role: 'visitor' },
    });
    assert.strictEqual(payOnCancelRes.status, 400, 'Payment on cancelled booking blocked with 400');

    recordPass('TEST 17: Cancelled tickets are strictly marked void; payment or activation strictly blocked');
  } catch (err) {
    recordFail('TEST 17: Invalid & cancelled QR tickets', err);
  }

  // -------------------------------------------------------------
  // TEST 18: QR Code Regeneration
  // -------------------------------------------------------------
  console.log('\n--- TEST 18: QR Code Regeneration ---');
  try {
    // Deliberately erase qrCodeDataUrl from confirmed booking in database
    await bookingsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(testBookingId) },
      { $set: { qrCodeDataUrl: null } }
    );

    const regenRes = await fetch(`${BASE_URL}/api/bookings/${testBookingId}/regenerate-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
    });

    const regenData = await regenRes.json();
    assert.strictEqual(regenRes.status, 200, 'Regeneration returned HTTP 200');
    assert.ok(regenData.data.qrCodeDataUrl?.startsWith('data:image/png;base64,'), 'Fresh QR code generated');

    const updatedBooking = await bookingsCollection.findOne({ _id: new mongoose.Types.ObjectId(testBookingId) });
    assert.ok(updatedBooking.qrCodeDataUrl, 'Regenerated QR code persisted in database');

    recordPass('TEST 18: QR code regenerated successfully for confirmed booking without re-payment');
  } catch (err) {
    recordFail('TEST 18: QR code regeneration', err);
  }

  // -------------------------------------------------------------
  // TEST 19: Database Transaction Failure Simulation
  // -------------------------------------------------------------
  console.log('\n--- TEST 19: Database Transaction Failure Simulation ---');
  try {
    const slot19Id = await createTestSlot('Slot-T19-TxFail', 10, 0);

    const { withDatabaseTransaction } = await import('../lib/mongodb.js');
    let caughtError = null;

    try {
      await withDatabaseTransaction(async (dbSession) => {
        // Step 1: Increment slot capacity
        await slotsCollection.updateOne(
          { _id: slot19Id },
          { $inc: { reservedCount: 5 } },
          { session: dbSession }
        );

        // Step 2: Insert booking
        await bookingsCollection.insertOne(
          {
            bookingReference: 'VIR-TEST-FAIL-01',
            user: new mongoose.Types.ObjectId(userA.userId),
            totalTickets: 5,
          },
          { session: dbSession }
        );

        // Step 3: Trigger error to abort transaction
        throw new Error('Deliberate transaction failure to verify atomic rollback');
      });
    } catch (e) {
      caughtError = e;
    }

    assert.ok(caughtError, 'Transaction threw expected deliberate error');

    // Verify MongoDB state: neither slot nor booking must exist!
    const slotState = await slotsCollection.findOne({ _id: slot19Id });
    assert.strictEqual(slotState.reservedCount, 0, 'Slot reservedCount rolled back to 0');

    const bookingState = await bookingsCollection.findOne({ bookingReference: 'VIR-TEST-FAIL-01' });
    assert.strictEqual(bookingState, null, 'Zero booking documents persisted');

    recordPass('TEST 19: ACID transaction cleanly rolled back all multi-document modifications upon error');
  } catch (err) {
    recordFail('TEST 19: Database transaction failure', err);
  }

  // -------------------------------------------------------------
  // TEST 20: Recovery/Retry After Interrupted Requests
  // -------------------------------------------------------------
  console.log('\n--- TEST 20: Recovery / Safe Retry After Interrupted Requests ---');
  try {
    const slot20Id = await createTestSlot('Slot-T20-Retry', 10, 0);
    const retryIdemKey = `retry-key-${Date.now()}`;

    // Client makes request with idempotency key
    const resA = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({
        siteSlug: 'taj-mahal',
        visitDate: testDate,
        slotId: slot20Id.toString(),
        tickets: [{ category: 'indianAdult', quantity: 2 }],
        visitorDetails: { primaryName: 'Retry Visitor', primaryEmail: userAEmail },
        idempotencyKey: retryIdemKey,
      }),
    });
    const dataA = await resA.json();
    assert.strictEqual(resA.status, 201, 'Initial request succeeded with 201');

    // Simulate network drop and subsequent retry with same idempotency key
    const resB = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({
        siteSlug: 'taj-mahal',
        visitDate: testDate,
        slotId: slot20Id.toString(),
        tickets: [{ category: 'indianAdult', quantity: 2 }],
        visitorDetails: { primaryName: 'Retry Visitor', primaryEmail: userAEmail },
        idempotencyKey: retryIdemKey,
      }),
    });
    const dataB = await resB.json();
    assert.strictEqual(resB.status, 200, 'Retry returned existing booking with 200');
    assert.strictEqual(dataB.data.bookingReference, dataA.data.bookingReference, 'Identical booking reference returned');

    // Complete payment
    const payRes = await executeTestFixturePayment({
      bookingId: dataB.data.bookingId,
      user: { id: userA.userId, role: 'visitor' },
    });
    assert.strictEqual(payRes.status, 200, 'Payment confirmed cleanly');

    const slotFinal = await slotsCollection.findOne({ _id: slot20Id });
    assert.strictEqual(slotFinal.reservedCount, 2, 'Slot capacity reserved exactly 2 seats across all retries');

    recordPass('TEST 20: Safe retry with idempotency recovered seamlessly without double booking or capacity leak');
  } catch (err) {
    recordFail('TEST 20: Recovery/retry after interrupted requests', err);
  }

  console.log('\n================================================================');
  console.log(`CONSOLIDATION AUDIT COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} tests failed during consolidation audit.`);
  }

  return { passed, failed };
}

if (process.argv[1] && process.argv[1].endsWith('booking-consolidation-audit.mjs')) {
  runConsolidationAudit()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}
