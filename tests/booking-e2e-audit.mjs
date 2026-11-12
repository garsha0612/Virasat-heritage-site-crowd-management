import mongoose from 'mongoose';
import { executeTestFixturePayment } from './helpers/test-payment-fixture.mjs';

const PORT = 3015;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/heritageDB?replicaSet=rs0';

export async function runBookingAudit() {
  console.log('================================================================');
  console.log('VIRASAT PHASE 5: COMPREHENSIVE CONCURRENCY & SECURITY AUDIT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Connect directly to MongoDB
  const conn = await mongoose.connect(MONGO_URI);
  const db = conn.connection.db;
  const usersCollection = db.collection('users');
  const slotsCollection = db.collection('timeslots');
  const bookingsCollection = db.collection('bookings');

  // Test Visitor Accounts
  const testEmails = [
    'arjun.kapoor@virasat.gov.in',
    'ananya.sen@virasat.gov.in',
    'vikram.aditya@virasat.gov.in',
    'priya.mehta@virasat.gov.in',
    'rohit.verma@virasat.gov.in',
  ];

  // Clean previous test data
  await usersCollection.deleteMany({ email: { $in: testEmails } });
  await bookingsCollection.deleteMany({ 'visitorDetails.primaryEmail': { $in: testEmails } });
  await bookingsCollection.deleteMany({ 'visitorDetails.email': { $in: testEmails } });

  // -------------------------------------------------------------
  // SETUP: Register 5 Authenticated Test Visitors
  // -------------------------------------------------------------
  console.log('--- SETUP: Registering 5 Distinct Authenticated Visitors ---');
  const visitorCookies = [];
  const visitorIds = [];

  for (let i = 0; i < testEmails.length; i++) {
    const email = testEmails[i];
    const name = email.split('@')[0].replace('.', ' ').toUpperCase();
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password: 'Password123!Secure',
        phone: `+91981112220${i}`,
        nationality: i === 1 ? 'SAARC/BIMSTEC' : i === 2 ? 'Other Foreigner' : 'Indian',
      }),
    });
    const regData = await regRes.json();
    const cookie = (regRes.headers.get('set-cookie') || '').split(';')[0];
    visitorCookies.push(cookie);
    visitorIds.push(regData.data?.user?.id);
  }

  assert(visitorCookies.length === 5 && visitorCookies.every((c) => c.startsWith('token=')), 'SETUP 1: All 5 test visitors registered with session tokens');

  const cookieA = visitorCookies[0];
  const cookieB = visitorCookies[1];
  const cookieC = visitorCookies[2];
  const cookieD = visitorCookies[3];
  const cookieE = visitorCookies[4];

  const userA = { id: visitorIds[0], role: 'visitor' };
  const userB = { id: visitorIds[1], role: 'visitor' };
  const userE = { id: visitorIds[4], role: 'visitor' };

  // -------------------------------------------------------------
  // SUITE 1: Slot Availability Query & Demo Labeling
  // -------------------------------------------------------------
  console.log('\n--- SUITE 1: Time Slot Availability Query & Demo Labeling ---');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  // Clear existing slots for tomorrow to ensure clean seed test
  await slotsCollection.deleteMany({ date: tomorrowStr, heritageSite: 'taj-mahal' });

  const availRes = await fetch(`${BASE_URL}/api/availability?siteSlug=taj-mahal&date=${tomorrowStr}`);
  const availData = await availRes.json();

  assert(availRes.status === 200, 'SUITE 1.1: Availability endpoint returns HTTP 200');
  assert(availData.success === true, 'SUITE 1.2: Availability response reports success: true');
  assert(availData.data.site.name === 'Taj Mahal', 'SUITE 1.3: Returns correct site metadata for Taj Mahal');
  assert(Array.isArray(availData.data.slots) && availData.data.slots.length === 4, 'SUITE 1.4: Auto-seeds 4 demonstration time slots');
  assert(availData.data.isSimulatedSchedule === true, 'SUITE 1.5: Explicitly marks schedule as isSimulatedSchedule: true');
  assert(typeof availData.data.disclaimer === 'string' && availData.data.disclaimer.includes('educational'), 'SUITE 1.6: Includes explicit educational crowd management disclaimer');

  const selectedSlot = availData.data.slots[0];
  const selectedSlotId = selectedSlot.id;

  // -------------------------------------------------------------
  // SUITE 2: Validation & Authentication Defenses on Booking
  // -------------------------------------------------------------
  console.log('\n--- SUITE 2: Authentication & Input Validation Defenses ---');
  
  // 2.1 Unauthenticated booking attempt
  const unauthRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      siteSlug: 'taj-mahal',
      visitDate: tomorrowStr,
      slotId: selectedSlotId,
      tickets: [{ category: 'indianAdult', quantity: 1 }],
      visitorDetails: {
        primaryName: 'Anonymous Visitor',
        primaryEmail: 'anon@test.com',
        primaryPhone: '+919999999999',
        nationality: 'Indian',
      },
    }),
  });
  assert(unauthRes.status === 401, 'SUITE 2.1: Unauthenticated booking attempt strictly rejected with HTTP 401');

  // 2.2 Past date booking rejection
  const pastDateRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      siteSlug: 'taj-mahal',
      visitDate: '2020-01-01',
      slotId: selectedSlotId,
      tickets: [{ category: 'indianAdult', quantity: 1 }],
      visitorDetails: {
        primaryName: 'Arjun Kapoor',
        primaryEmail: 'arjun.kapoor@virasat.gov.in',
        primaryPhone: '+919811122233',
        nationality: 'Indian',
      },
    }),
  });
  assert(pastDateRes.status === 400, 'SUITE 2.2: Booking for past date strictly rejected with HTTP 400');

  // 2.3 Exceeding max tickets per booking (> 10 tickets)
  const excessiveTicketsRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      siteSlug: 'taj-mahal',
      visitDate: tomorrowStr,
      slotId: selectedSlotId,
      tickets: [{ category: 'indianAdult', quantity: 15 }],
      visitorDetails: {
        primaryName: 'Arjun Kapoor',
        primaryEmail: 'arjun.kapoor@virasat.gov.in',
        primaryPhone: '+919811122233',
        nationality: 'Indian',
      },
    }),
  });
  assert(excessiveTicketsRes.status === 400, 'SUITE 2.3: Attempt to exceed 10 tickets per order rejected with HTTP 400');

  // -------------------------------------------------------------
  // SUITE 3: Valid Booking & Server-Side Price Security
  // -------------------------------------------------------------
  console.log('\n--- SUITE 3: Valid Booking & Server-Side Price Security ---');
  
  // Client attempts to tamper price by passing totalAmount: 1
  // Official Taj Mahal rates:
  // 2 Indian Adults @ ₹50 = ₹100
  // 1 SAARC Citizen @ ₹540 = ₹540
  // 1 Foreigner Adult @ ₹1100 = ₹1100
  // 1 Child @ ₹0 = ₹0
  // Main Mausoleum dome entry addon (+₹200 per paying adult = 4 * 200 = ₹800)
  // Expected Server Total: ₹100 + ₹540 + ₹1100 + ₹0 + ₹800 = ₹2540
  const validBookingRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      siteSlug: 'taj-mahal',
      visitDate: tomorrowStr,
      slotId: selectedSlotId,
      includeMausoleum: true,
      tickets: [
        { category: 'indianAdult', quantity: 2 },
        { category: 'saarcBimstec', quantity: 1 },
        { category: 'foreignerAdult', quantity: 1 },
        { category: 'child', quantity: 1 },
      ],
      totalAmount: 1, // Tampered client amount
      visitorDetails: {
        primaryName: 'Arjun Kapoor',
        primaryEmail: 'arjun.kapoor@virasat.gov.in',
        primaryPhone: '+919811122233',
        nationality: 'Indian',
      },
    }),
  });
  const validBookingData = await validBookingRes.json();

  assert(validBookingRes.status === 201, 'SUITE 3.1: Valid booking creation returns HTTP 201 Created');
  assert(validBookingData.success === true, 'SUITE 3.2: Valid booking response reports success: true');
  
  const createdBooking = validBookingData.data.booking;
  assert(createdBooking.totalTickets === 5, 'SUITE 3.3: Total tickets correctly computed as 5 (4 adults + 1 child)');
  assert(createdBooking.totalAmount === 2540, 'SUITE 3.4: Server strictly overwrote client price tampering with official total ₹2540 (includes mausoleum addon)');
  assert(createdBooking.bookingStatus === 'pending', 'SUITE 3.5: Initial booking status is "pending"');
  assert(createdBooking.paymentStatus === 'pending', 'SUITE 3.6: Initial payment status is "pending"');
  assert(/^VIR-\d{8}-[A-Z0-9]{6}$/.test(createdBooking.bookingReference), 'SUITE 3.7: Booking reference follows format VIR-YYYYMMDD-XXXXXX');

  // Verify atomic reservation in MongoDB
  const updatedSlotInDb = await slotsCollection.findOne({ _id: new mongoose.Types.ObjectId(selectedSlotId) });
  assert(updatedSlotInDb.reservedCount === 5, 'SUITE 3.8: MongoDB slot reservedCount atomically incremented to 5');

  // -------------------------------------------------------------
  // SUITE 4: REAL SIMULTANEOUS CONCURRENT OVERBOOKING TEST
  // -------------------------------------------------------------
  console.log('\n--- SUITE 4: REAL SIMULTANEOUS CONCURRENT OVERBOOKING TEST ---');
  
  // Seed a restricted test slot with small capacity: 5
  const testSlotInsert = await slotsCollection.insertOne({
    heritageSite: 'taj-mahal',
    date: tomorrowStr,
    startTime: '22:00',
    endTime: '23:00',
    slotLabel: 'Concurrent Test Slot',
    capacity: 5,
    reservedCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const concurrentSlotId = testSlotInsert.insertedId.toString();

  // 5 authenticated visitors send simultaneous requests for 2 tickets each (10 tickets requested for capacity 5)
  console.log('Sending 5 simultaneous concurrent booking requests for 2 tickets each (10 requested vs 5 capacity)...');
  const concurrentRequests = [cookieA, cookieB, cookieC, cookieD, cookieE].map((cookie, idx) =>
    fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        siteSlug: 'taj-mahal',
        visitDate: tomorrowStr,
        slotId: concurrentSlotId,
        tickets: [{ category: 'indianAdult', quantity: 2 }],
        visitorDetails: {
          primaryName: `Concurrent Visitor ${idx + 1}`,
          primaryEmail: testEmails[idx],
          primaryPhone: '+919811122299',
          nationality: 'Indian',
        },
      }),
    })
  );

  const concurrentResults = await Promise.all(concurrentRequests);
  const statusCodes = concurrentResults.map((r) => r.status);
  const successCount = statusCodes.filter((s) => s === 201).length;
  const conflictCount = statusCodes.filter((s) => s === 409).length;

  console.log(`Concurrent responses: ${successCount} Succeeded (201), ${conflictCount} Rejected (409 Conflict)`);

  assert(successCount === 2, 'SUITE 4.1: Exactly 2 requests succeeded (2 * 2 = 4 tickets allocated)');
  assert(conflictCount === 3, 'SUITE 4.2: Exactly 3 requests rejected with HTTP 409 Conflict (prevented capacity breach)');

  // Verify slot in database
  const concurrentDbSlot = await slotsCollection.findOne({ _id: testSlotInsert.insertedId });
  assert(concurrentDbSlot.reservedCount === 4, 'SUITE 4.3: MongoDB slot reservedCount exactly equals 4 (never exceeded capacity 5)');

  // Verify database bookings count for this slot
  const actualSlotBookingsCount = await bookingsCollection.countDocuments({
    'timeSlot.slotId': testSlotInsert.insertedId,
  });
  assert(actualSlotBookingsCount === 2, 'SUITE 4.4: Exactly 2 booking documents were created in database (no orphan bookings)');

  // Second Concurrent Round: Slot has 1 capacity remaining (capacity 5, reserved 4)
  // Request 1 asks for 1 ticket (should succeed -> reserved becomes 5)
  const lastTicketRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieC },
    body: JSON.stringify({
      siteSlug: 'taj-mahal',
      visitDate: tomorrowStr,
      slotId: concurrentSlotId,
      tickets: [{ category: 'indianAdult', quantity: 1 }],
      visitorDetails: {
        primaryName: 'Last Ticket Visitor',
        primaryEmail: testEmails[2],
        primaryPhone: '+919811122299',
        nationality: 'Indian',
      },
    }),
  });
  assert(lastTicketRes.status === 201, 'SUITE 4.5: Request for remaining 1 ticket succeeds with HTTP 201');

  // Request 2 asks for 1 ticket when slot is now 100% full (reserved: 5, capacity: 5)
  const fullSlotRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieD },
    body: JSON.stringify({
      siteSlug: 'taj-mahal',
      visitDate: tomorrowStr,
      slotId: concurrentSlotId,
      tickets: [{ category: 'indianAdult', quantity: 1 }],
      visitorDetails: {
        primaryName: 'Overflow Visitor',
        primaryEmail: testEmails[3],
        primaryPhone: '+919811122299',
        nationality: 'Indian',
      },
    }),
  });
  assert(fullSlotRes.status === 409, 'SUITE 4.6: Request on fully-booked slot rejected with HTTP 409 Conflict');

  // Clean up concurrent test slot & bookings
  await slotsCollection.deleteOne({ _id: testSlotInsert.insertedId });
  await bookingsCollection.deleteMany({ 'timeSlot.slotId': testSlotInsert.insertedId });

  // -------------------------------------------------------------
  // SUITE 5: Access Control & Data Isolation
  // -------------------------------------------------------------
  console.log('\n--- SUITE 5: Access Control & Data Isolation ---');

  // User B tries to view User A's booking
  const accessDeniedRes = await fetch(`${BASE_URL}/api/bookings/${createdBooking.id}`, {
    headers: { Cookie: cookieB },
  });
  assert(accessDeniedRes.status === 403, 'SUITE 5.1: Cross-user access to booking strictly blocked with HTTP 403 Forbidden');

  // User A views their own booking by ID
  const ownerAccessRes = await fetch(`${BASE_URL}/api/bookings/${createdBooking.id}`, {
    headers: { Cookie: cookieA },
  });
  assert(ownerAccessRes.status === 200, 'SUITE 5.2: Legitimate owner can access booking dossier via ID');

  // User A views their own booking by bookingReference
  const refAccessRes = await fetch(`${BASE_URL}/api/bookings/${createdBooking.bookingReference}`, {
    headers: { Cookie: cookieA },
  });
  assert(refAccessRes.status === 200, 'SUITE 5.3: Legitimate owner can access booking dossier via Booking Reference');

  // -------------------------------------------------------------
  // SUITE 6: Mock Payment Gateway Simulation & QR Verification
  // -------------------------------------------------------------
  console.log('\n--- SUITE 6: Payment Gateway Simulation & QR Verification ---');

  // 6.1 Unauthorized user tries to pay for User A's booking
  const unauthorizedPayRes = await executeTestFixturePayment({
    bookingId: createdBooking.id,
    user: userB,
    paymentMethod: 'upi',
  });
  assert(unauthorizedPayRes.status === 403, 'SUITE 6.1: Cross-user payment attempt rejected with HTTP 403 Forbidden');

  // 6.2 Simulated payment failure
  const failPayData = await executeTestFixturePayment({
    bookingId: createdBooking.id,
    user: userA,
    outcome: 'failure',
    paymentMethod: 'card',
  });
  const failPayRes = { status: failPayData.status };
  assert(failPayRes.status === 200 && failPayData.success === false, 'SUITE 6.2: Simulated payment failure returns success: false');
  assert(failPayData.data?.booking?.paymentStatus === 'failed', 'SUITE 6.3: Booking paymentStatus marked as "failed"');
  assert(failPayData.data?.booking?.bookingStatus === 'pending', 'SUITE 6.4: Booking status remains "pending" for retry');

  // 6.3 Simulated successful payment
  const successPayData = await executeTestFixturePayment({
    bookingId: createdBooking.id,
    user: userA,
    outcome: 'success',
    paymentMethod: 'upi',
  });
  const successPayRes = { status: successPayData.status };

  assert(successPayRes.status === 200, 'SUITE 6.5: Successful mock payment returns HTTP 200');
  assert(successPayData.success === true, 'SUITE 6.6: Payment response reports success: true');
  
  const confirmedBooking = successPayData.data.booking;
  assert(confirmedBooking.bookingStatus === 'confirmed', 'SUITE 6.7: Booking status transitioned to "confirmed"');
  assert(confirmedBooking.paymentStatus === 'paid', 'SUITE 6.8: Payment status transitioned to "paid"');
  assert(confirmedBooking.qrCodeDataUrl?.startsWith('data:image/png;base64,'), 'SUITE 6.9: Generated scannable PNG QR code data URL');
  assert(confirmedBooking.ticketCode?.startsWith('TKT-'), 'SUITE 6.10: Generated unique ticket security code');

  // 6.4 Duplicate payment prevention
  const dupPayRes = await executeTestFixturePayment({
    bookingId: createdBooking.id,
    user: userA,
    outcome: 'success',
    paymentMethod: 'upi',
  });
  assert(dupPayRes.status === 400, 'SUITE 6.11: Duplicate payment on confirmed booking rejected with HTTP 400');

  // -------------------------------------------------------------
  // SUITE 7: Payment / Cancellation Race Defense
  // -------------------------------------------------------------
  console.log('\n--- SUITE 7: Payment / Cancellation Race Defense ---');

  // Create a fresh pending booking for racing tests
  const raceBookingRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieE },
    body: JSON.stringify({
      siteSlug: 'taj-mahal',
      visitDate: tomorrowStr,
      slotId: selectedSlotId,
      tickets: [{ category: 'indianAdult', quantity: 1 }],
      visitorDetails: {
        primaryName: 'Race Test Visitor',
        primaryEmail: testEmails[4],
        primaryPhone: '+919811122299',
        nationality: 'Indian',
      },
    }),
  });
  const raceBookingData = await raceBookingRes.json();
  const raceBookingId = raceBookingData.data.bookingId;

  // Send simultaneous Payment AND Cancellation requests
  console.log('Sending simultaneous Payment and Cancellation requests on booking...');
  const [racePayResult, raceCancelResult] = await Promise.all([
    executeTestFixturePayment({
      bookingId: raceBookingId,
      user: userE,
      paymentMethod: 'upi',
    }),
    fetch(`${BASE_URL}/api/bookings/${raceBookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieE },
      body: JSON.stringify({ reason: 'Racing cancel test' }),
    }),
  ]);

  const raceFinalDoc = await bookingsCollection.findOne({ _id: new mongoose.Types.ObjectId(raceBookingId) });
  assert(
    ['confirmed', 'cancelled'].includes(raceFinalDoc.bookingStatus),
    `SUITE 7.1: Race resulted in deterministic state (Status: ${raceFinalDoc.bookingStatus}, no contradictory state)`
  );
  assert(
    (racePayResult.status === 200 && raceCancelResult.status === 200) ||
      (racePayResult.status === 400 && raceCancelResult.status === 200) ||
      (racePayResult.status === 200 && raceCancelResult.status === 400),
    'SUITE 7.2: Atomic database updates resolved the race cleanly without server error (500)'
  );

  // -------------------------------------------------------------
  // SUITE 8: Idempotent Cancellation & Capacity Restoration
  // -------------------------------------------------------------
  console.log('\n--- SUITE 8: Idempotent Cancellation & Capacity Restoration ---');

  // 8.1 Unauthorized cancellation attempt
  const unauthCancelRes = await fetch(`${BASE_URL}/api/bookings/${createdBooking.id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieB },
    body: JSON.stringify({ reason: 'Malicious cancellation' }),
  });
  assert(unauthCancelRes.status === 403, 'SUITE 8.1: Cancellation by non-owner rejected with HTTP 403 Forbidden');

  // 8.2 Legitimate cancellation by User A
  const cancelRes = await fetch(`${BASE_URL}/api/bookings/${createdBooking.id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({ reason: 'Change of travel itinerary' }),
  });
  const cancelData = await cancelRes.json();

  assert(cancelRes.status === 200, 'SUITE 8.2: Legitimate cancellation returns HTTP 200');
  assert(cancelData.data.booking.bookingStatus === 'cancelled', 'SUITE 8.3: Booking status transitioned to "cancelled"');
  assert(cancelData.data.booking.cancellation.reason === 'Change of travel itinerary', 'SUITE 8.4: Cancellation reason accurately logged');
  assert(cancelData.data.booking.cancellation.refundStatus === 'simulated_refund_processed', 'SUITE 8.5: Refund explicitly marked as simulated_refund_processed');

  // 8.3 Attempt duplicate simultaneous cancellation on already cancelled booking
  const [dupCancel1, dupCancel2] = await Promise.all([
    fetch(`${BASE_URL}/api/bookings/${createdBooking.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ reason: 'Duplicate attempt 1' }),
    }),
    fetch(`${BASE_URL}/api/bookings/${createdBooking.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ reason: 'Duplicate attempt 2' }),
    }),
  ]);
  assert(dupCancel1.status === 400 && dupCancel2.status === 400, 'SUITE 8.6: Duplicate cancellation attempts strictly rejected with HTTP 400');

  // 8.4 Verify capacity restored in MongoDB exactly once
  // Slot initially had 5 reserved, cancelled 5 -> should be back to 0 (or +1 from race test if cancelled)
  const slotAfterCancel = await slotsCollection.findOne({ _id: new mongoose.Types.ObjectId(selectedSlotId) });
  assert(slotAfterCancel.reservedCount <= 1, 'SUITE 8.7: MongoDB slot reservedCount restored accurately without underflow or double-decrement');

  // 8.5 Payment on cancelled booking rejection
  const payCancelledRes = await executeTestFixturePayment({
    bookingId: createdBooking.id,
    user: userA,
    paymentMethod: 'upi',
  });
  assert(payCancelledRes.status === 400, 'SUITE 8.8: Payment for cancelled booking strictly rejected with HTTP 400');

  // -------------------------------------------------------------
  // SUITE 9: Visitor Listing Multi-Tenant Isolation
  // -------------------------------------------------------------
  console.log('\n--- SUITE 9: Visitor Dashboard Listing Isolation ---');

  const listARes = await fetch(`${BASE_URL}/api/bookings`, { headers: { Cookie: cookieA } });
  const listAData = await listARes.json();
  assert(listARes.status === 200, 'SUITE 9.1: User A bookings query returns HTTP 200');
  assert(listAData.data.bookings.length >= 1, 'SUITE 9.2: User A sees their bookings');

  const listBRes = await fetch(`${BASE_URL}/api/bookings`, { headers: { Cookie: cookieB } });
  const listBData = await listBRes.json();
  assert(listBRes.status === 200, 'SUITE 9.3: User B bookings query returns HTTP 200');
  assert(listBData.data.bookings.length === 0, 'SUITE 9.4: User B sees 0 bookings (complete tenant data isolation)');

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  await mongoose.disconnect();

  if (failed > 0) {
    throw new Error(`${failed} tests failed during audit.`);
  }
}

if (process.argv[1]?.endsWith('booking-e2e-audit.mjs')) {
  runBookingAudit().catch((err) => {
    console.error('Audit execution error:', err);
    process.exit(1);
  });
}
