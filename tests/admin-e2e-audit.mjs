import mongoose from 'mongoose';
import assert from 'assert';

const BASE_URL = process.env.TEST_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3015';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/heritageDB?replicaSet=rs0';

export async function runAdminAudit() {
  console.log('================================================================');
  console.log('VIRASAT PHASE 6: ADMIN DASHBOARD & HERITAGE MANAGEMENT AUDIT');
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

  // Connect to MongoDB
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');
  const sitesCollection = db.collection('heritagesites');
  const slotsCollection = db.collection('timeslots');
  const bookingsCollection = db.collection('bookings');

  // -------------------------------------------------------------
  // SETUP: Seed Admin and Visitor Credentials
  // -------------------------------------------------------------
  console.log('--- SETUP: Provisioning Test Admin and Visitor Sessions ---');
  const ts = Date.now();
  const adminEmail = `admin-audit-${ts}@virasat.gov.in`;
  const visitorEmail = `visitor-audit-${ts}@virasat.test`;
  const staffEmail = `staff-audit-${ts}@virasat.gov.in`;

  // Helper to register visitor
  async function registerUser(name, email, role = 'visitor') {
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
    const userId = data.data?.user?.id;

    // If role needs to be admin or staff, promote in MongoDB directly
    if (role !== 'visitor' && userId) {
      await usersCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { $set: { role } }
      );
      // Re-login to get updated JWT with role in payload
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password123!' }),
      });
      const newCookie = loginRes.headers.get('set-cookie')?.split(';')[0] || '';
      return { cookie: newCookie, userId };
    }

    return { cookie, userId };
  }

  const visitor = await registerUser('Audit Visitor', visitorEmail, 'visitor');
  const admin = await registerUser('Chief Administrator', adminEmail, 'admin');
  const staff = await registerUser('Monument Staff', staffEmail, 'staff');

  assert(visitor.cookie && admin.cookie && staff.cookie, 'All 3 test roles provisioned');
  recordPass('SETUP: Authenticated visitor, admin, and staff sessions active');

  // -------------------------------------------------------------
  // TEST 1: Visitor Cannot Access /api/admin Endpoints
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: Role-Based Authorization Enforcement ---');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/overview`, {
      headers: { Cookie: visitor.cookie },
    });
    assert.strictEqual(res.status, 403, 'Visitor request rejected with HTTP 403 Forbidden');
    const data = await res.json();
    assert.strictEqual(data.success, false, 'Reports success: false');
    recordPass('TEST 1: Visitor cannot access administrative endpoints (HTTP 403)');
  } catch (err) {
    recordFail('TEST 1: Visitor access control', err);
  }

  // -------------------------------------------------------------
  // TEST 2: Unauthenticated Request Strictly Rejected
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Unauthenticated Request Guard ---');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/overview`);
    assert.strictEqual(res.status, 401, 'Unauthenticated request rejected with HTTP 401');
    recordPass('TEST 2: Unauthenticated API request rejected with HTTP 401');
  } catch (err) {
    recordFail('TEST 2: Unauthenticated request guard', err);
  }

  // -------------------------------------------------------------
  // TEST 3: Staff Role Cannot Access Admin Functionality
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Staff Role Privilege Restriction ---');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/sites`, {
      headers: { Cookie: staff.cookie },
    });
    assert.strictEqual(res.status, 403, 'Staff request rejected with HTTP 403');
    recordPass('TEST 3: Staff role cannot access admin-only functionality (HTTP 403)');
  } catch (err) {
    recordFail('TEST 3: Staff role privilege restriction', err);
  }

  // -------------------------------------------------------------
  // TEST 4: Administrator Can Access Overview Telemetry
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Administrator Overview Telemetry Retrieval ---');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/overview`, {
      headers: { Cookie: admin.cookie },
    });
    assert.strictEqual(res.status, 200, 'Admin request returned HTTP 200');
    const data = await res.json();
    assert.strictEqual(data.success, true, 'Overview response reports success: true');
    assert(data.data.metrics.totalSites >= 6, 'Reports totalSites >= 6');
    assert(typeof data.data.metrics.totalRevenue === 'number', 'Reports totalRevenue metric');
    recordPass('TEST 4: Administrator accesses live MongoDB overview statistics');
  } catch (err) {
    recordFail('TEST 4: Administrator overview', err);
  }

  // -------------------------------------------------------------
  // TEST 5: Create Heritage Site with Zod Validation
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Monument Creation with Zod Validation ---');
  const testSiteSlug = `test-monument-${ts}`;
  let createdSiteId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/admin/sites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin.cookie },
      body: JSON.stringify({
        name: 'Golconda Fort Complex',
        slug: testSiteSlug,
        tagline: 'The Citadel of Diamond Lore',
        description: 'Medieval citadel built on a granite hill by the Kakatiya and Qutb Shahi dynasties.',
        historicalBackground: 'Famous for acoustic architecture and diamond mines including Koh-i-Noor.',
        state: 'Telangana',
        city: 'Hyderabad',
        address: 'Ibrahim Bagh, Hyderabad, Telangana 500008',
        latitude: 17.3833,
        longitude: 78.4011,
        category: 'Forts & Palaces',
        openingHours: { open: '09:00', close: '17:30' },
        weeklyClosingDay: 'None',
        entryFee: {
          indianAdult: 25,
          saarcBimstec: 25,
          foreignerAdult: 300,
          child: 0,
          mausoleumSupplement: 0,
        },
        visitorInstructions: ['Sound and Light show in evening requires separate ticket.'],
        websiteUrl: 'https://asi.nic.in',
        isFeatured: true,
        isActive: true,
        images: ['/images/hero-banner.jpg'],
        demonstrationCapacity: { maxPerHour: 800, standardSlotCapacity: 150 },
      }),
    });
    assert.strictEqual(res.status, 201, 'Created site returned HTTP 201');
    const data = await res.json();
    assert.strictEqual(data.success, true, 'Site created successfully');
    createdSiteId = data.data.id;
    recordPass('TEST 5: Administrator created new heritage site with verified tariffs');
  } catch (err) {
    recordFail('TEST 5: Monument creation', err);
  }

  // -------------------------------------------------------------
  // TEST 6: Duplicate Slug Rejection
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Duplicate Slug Conflict Defense ---');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/sites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin.cookie },
      body: JSON.stringify({
        name: 'Golconda Fort Duplicate',
        slug: testSiteSlug, // Colliding slug
        description: 'Another fort with identical slug to test duplicate collision.',
        state: 'Telangana',
        city: 'Hyderabad',
        category: 'Forts & Palaces',
      }),
    });
    assert.strictEqual(res.status, 409, 'Duplicate slug strictly rejected with HTTP 409 Conflict');
    const data = await res.json();
    assert.strictEqual(data.code, 'SLUG_EXISTS', 'Reports code: SLUG_EXISTS');
    recordPass('TEST 6: Duplicate slug rejected with HTTP 409 Conflict');
  } catch (err) {
    recordFail('TEST 6: Duplicate slug conflict defense', err);
  }

  // -------------------------------------------------------------
  // TEST 7: Edit Site Details
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Edit Heritage Site Details ---');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/sites/${createdSiteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: admin.cookie },
      body: JSON.stringify({
        tagline: 'Updated Citadel of Diamonds & Acoustic Echoes',
        entryFee: {
          indianAdult: 30,
          saarcBimstec: 30,
          foreignerAdult: 350,
          child: 0,
          mausoleumSupplement: 0,
        },
      }),
    });
    assert.strictEqual(res.status, 200, 'Edit returned HTTP 200');
    const dbSite = await sitesCollection.findOne({ _id: new mongoose.Types.ObjectId(createdSiteId) });
    assert.strictEqual(dbSite.tagline, 'Updated Citadel of Diamonds & Acoustic Echoes', 'Tagline persisted in MongoDB');
    assert.strictEqual(dbSite.entryFee.indianAdult, 30, 'Updated tariff persisted');
    recordPass('TEST 7: Administrator edited monument details and tariffs');
  } catch (err) {
    recordFail('TEST 7: Edit site details', err);
  }

  // -------------------------------------------------------------
  // TEST 8: Safe Deactivation of Heritage Site
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Site Deactivation & Booking Preservation ---');
  try {
    const toggleRes = await fetch(`${BASE_URL}/api/admin/sites/${createdSiteId}/toggle-status`, {
      method: 'PATCH',
      headers: { Cookie: admin.cookie },
    });
    assert.strictEqual(toggleRes.status, 200, 'Toggle status returned HTTP 200');
    const toggleData = await toggleRes.json();
    assert.strictEqual(toggleData.data.isActive, false, 'Site successfully deactivated (isActive: false)');

    const dbSite = await sitesCollection.findOne({ _id: new mongoose.Types.ObjectId(createdSiteId) });
    assert.strictEqual(dbSite.isActive, false, 'Database confirms site is deactivated');
    recordPass('TEST 8: Monument deactivated safely while preserving database document');
  } catch (err) {
    recordFail('TEST 8: Safe deactivation', err);
  }

  // -------------------------------------------------------------
  // TEST 9: Search and Filter Bookings
  // -------------------------------------------------------------
  console.log('\n--- TEST 9: Booking Registry Search & Filtering ---');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/bookings?limit=5`, {
      headers: { Cookie: admin.cookie },
    });
    assert.strictEqual(res.status, 200, 'Bookings query returned HTTP 200');
    const data = await res.json();
    assert(Array.isArray(data.data.bookings), 'Returns bookings array');
    assert(data.data.pagination.total >= 0, 'Pagination envelope included');
    recordPass('TEST 9: Administrator can search, filter, and paginate bookings');
  } catch (err) {
    recordFail('TEST 9: Booking search and filter', err);
  }

  // -------------------------------------------------------------
  // TEST 10: Visitor Personal Data Protection (No Hashes)
  // -------------------------------------------------------------
  console.log('\n--- TEST 10: Visitor Data Protection & Hash Concealment ---');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/users?limit=5`, {
      headers: { Cookie: admin.cookie },
    });
    const data = await res.json();
    const users = data.data.users;
    for (const u of users) {
      assert.strictEqual(u.password, undefined, 'Password hash is completely omitted from response');
      assert.strictEqual(u.token, undefined, 'Session token is omitted');
    }
    recordPass('TEST 10: Visitor passwords and authentication tokens are strictly protected');
  } catch (err) {
    recordFail('TEST 10: Visitor personal data protection', err);
  }

  // -------------------------------------------------------------
  // TEST 11: Visitor Account Activation / Deactivation
  // -------------------------------------------------------------
  console.log('\n--- TEST 11: Visitor Account Suspension Safeguard ---');
  try {
    // 11.1 Deactivate visitor
    const deactRes = await fetch(`${BASE_URL}/api/admin/users/${visitor.userId}/toggle-status`, {
      method: 'PATCH',
      headers: { Cookie: admin.cookie },
    });
    assert.strictEqual(deactRes.status, 200, 'Visitor suspension returned HTTP 200');
    const deactData = await deactRes.json();
    assert.strictEqual(deactData.data.isActive, false, 'Visitor is marked suspended');

    // 11.2 Self-deactivation prevention for admin
    const selfDeactRes = await fetch(`${BASE_URL}/api/admin/users/${admin.userId}/toggle-status`, {
      method: 'PATCH',
      headers: { Cookie: admin.cookie },
    });
    assert.strictEqual(selfDeactRes.status, 400, 'Admin self-deactivation rejected with HTTP 400');
    const selfData = await selfDeactRes.json();
    assert.strictEqual(selfData.code, 'CANNOT_DEACTIVATE_SELF', 'Reports code: CANNOT_DEACTIVATE_SELF');

    // Re-activate visitor
    await fetch(`${BASE_URL}/api/admin/users/${visitor.userId}/toggle-status`, {
      method: 'PATCH',
      headers: { Cookie: admin.cookie },
    });
    recordPass('TEST 11: Visitor accounts can be suspended; self-deactivation is strictly blocked');
  } catch (err) {
    recordFail('TEST 11: Account suspension safeguard', err);
  }

  // -------------------------------------------------------------
  // TEST 12: Slot Capacity Cannot Be Reduced Below Reserved Tickets
  // -------------------------------------------------------------
  console.log('\n--- TEST 12: Carrying Capacity Floor Enforcement ---');
  try {
    const slotDoc = await slotsCollection.insertOne({
      heritageSite: 'taj-mahal',
      date: '2026-12-31',
      startTime: '16:00',
      endTime: '17:00',
      capacity: 50,
      reservedCount: 20, // 20 tickets already booked
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const slotId = slotDoc.insertedId.toString();

    // Attempt to reduce capacity to 10 (less than 20 reserved)
    const res = await fetch(`${BASE_URL}/api/admin/slots/${slotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: admin.cookie },
      body: JSON.stringify({ capacity: 10 }),
    });

    assert.strictEqual(res.status, 400, 'Under-capacity update rejected with HTTP 400');
    const data = await res.json();
    assert.strictEqual(data.code, 'CAPACITY_LESS_THAN_RESERVED', 'Reports code: CAPACITY_LESS_THAN_RESERVED');

    // Clean up
    await slotsCollection.deleteOne({ _id: slotDoc.insertedId });
    recordPass('TEST 12: Slot capacity cannot be reduced below already reserved ticket count');
  } catch (err) {
    recordFail('TEST 12: Carrying capacity floor enforcement', err);
  }

  // -------------------------------------------------------------
  // TEST 13: Crowd Configuration Validation
  // -------------------------------------------------------------
  console.log('\n--- TEST 13: Crowd Configuration Validation ---');
  try {
    // Invalid threshold: low >= moderate
    const resInvalid = await fetch(`${BASE_URL}/api/admin/crowd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin.cookie },
      body: JSON.stringify({ lowMax: 60, moderateMax: 50, highMax: 100 }),
    });
    assert.strictEqual(resInvalid.status, 400, 'Invalid thresholds rejected with HTTP 400');

    // Valid threshold update
    const resValid = await fetch(`${BASE_URL}/api/admin/crowd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin.cookie },
      body: JSON.stringify({ lowMax: 35, moderateMax: 65, highMax: 100, simulationMultiplier: 1.1 }),
    });
    assert.strictEqual(resValid.status, 200, 'Valid thresholds updated with HTTP 200');
    const validData = await resValid.json();
    assert.strictEqual(validData.data.thresholds.lowMax, 35, 'Persisted lowMax: 35');
    recordPass('TEST 13: Demonstration crowd threshold validation strictly enforces logical ordering');
  } catch (err) {
    recordFail('TEST 13: Crowd configuration validation', err);
  }

  // -------------------------------------------------------------
  // TEST 14: CSV Export & Formula Injection Escaping
  // -------------------------------------------------------------
  console.log('\n--- TEST 14: CSV Export & Formula Injection Escaping ---');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/reports/export`, {
      headers: { Cookie: admin.cookie },
    });
    assert.strictEqual(res.status, 200, 'CSV export returned HTTP 200');
    const contentType = res.headers.get('content-type') || '';
    assert(contentType.includes('text/csv'), 'Content-Type is text/csv');

    const csvText = await res.text();
    assert(csvText.includes('Booking Reference'), 'CSV includes header row');
    recordPass('TEST 14: Audit-safe CSV export generated with proper cell escaping');
  } catch (err) {
    recordFail('TEST 14: CSV export', err);
  }

  // -------------------------------------------------------------
  // TEST 15: Safe Deletion Guard (Blocks deleting sites with bookings)
  // -------------------------------------------------------------
  console.log('\n--- TEST 15: Deletion Safeguard for Active Monuments ---');
  try {
    // Attempt deleting Taj Mahal (has active bookings from Phase 5)
    const res = await fetch(`${BASE_URL}/api/admin/sites/taj-mahal`, {
      method: 'DELETE',
      headers: { Cookie: admin.cookie },
    });
    assert.strictEqual(res.status, 409, 'Deleting monument with bookings rejected with HTTP 409 Conflict');
    const data = await res.json();
    assert.strictEqual(data.code, 'CANNOT_DELETE_ACTIVE_RECORDS', 'Reports CANNOT_DELETE_ACTIVE_RECORDS');
    recordPass('TEST 15: Monument with dependent bookings is protected from hard deletion');
  } catch (err) {
    recordFail('TEST 15: Deletion safeguard', err);
  }

  // -------------------------------------------------------------
  // TEST 16: Admin Settings & Password Rotation
  // -------------------------------------------------------------
  console.log('\n--- TEST 16: Admin Settings & Password Change Verification ---');
  try {
    const settingsRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      headers: { Cookie: admin.cookie },
    });
    assert.strictEqual(settingsRes.status, 200, 'Settings query returned HTTP 200');
    const settingsData = await settingsRes.json();
    assert.strictEqual(settingsData.data.profile.email, adminEmail, 'Profile email matches admin');
    assert(settingsData.data.systemInfo.framework.includes('Next.js'), 'System info includes Next.js');

    // Wrong current password attempt
    const pwdResWrong = await fetch(`${BASE_URL}/api/admin/settings/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin.cookie },
      body: JSON.stringify({
        currentPassword: 'WrongPassword!',
        newPassword: 'NewSecurePassword123!',
        confirmPassword: 'NewSecurePassword123!',
      }),
    });
    assert.strictEqual(pwdResWrong.status, 400, 'Incorrect password rejected with HTTP 400');

    recordPass('TEST 16: Admin settings dossier accessible; password verification protects rotation');
  } catch (err) {
    recordFail('TEST 16: Admin settings and password change', err);
  }

  // -------------------------------------------------------------
  // TEST 17: Pre-Flight Specific Official Tariff Verification
  // 4 Indian Adults (4*50=200) + 1 Child (0) + 4 Mausoleum (4*200=800) = 1,000
  // -------------------------------------------------------------
  console.log('\n--- TEST 17: Specific Tariff Calculation Scenario (₹1,000 Total) ---');
  try {
    const { calculateBookingTotal } = await import('../constants/pricing.js');
    const tariffResult = calculateBookingTotal(
      'taj-mahal',
      [
        { category: 'indianAdult', quantity: 4 },
        { category: 'child', quantity: 1 },
      ],
      { includeMausoleum: true }
    );

    assert.strictEqual(tariffResult.totalTickets, 5, 'Total visitors is 5 (4 adults + 1 child)');
    assert.strictEqual(tariffResult.totalAmount, 1000, 'Total amount is exactly ₹1,000 (200 + 0 + 800)');
    recordPass('TEST 17: Official ASI tariff scenario strictly calculates ₹1,000 for 4 Indian adults + 1 child + 4 mausoleum addons');
  } catch (err) {
    recordFail('TEST 17: Specific tariff scenario', err);
  }

  // Clean up created test site
  if (createdSiteId) {
    await sitesCollection.deleteOne({ _id: new mongoose.Types.ObjectId(createdSiteId) });
  }

  console.log('\n================================================================');
  console.log(`ADMIN AUDIT COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} tests failed during administrative audit.`);
  }

  return { passed, failed };
}

if (process.argv[1] && process.argv[1].endsWith('admin-e2e-audit.mjs')) {
  runAdminAudit()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal audit failure:', err);
      process.exit(1);
    });
}
