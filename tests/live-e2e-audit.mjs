import mongoose from 'mongoose';

const BASE_URL = 'http://127.0.0.1:3010';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/heritageDB';

async function runLiveAudit() {
  console.log('================================================================');
  console.log('VIRASAT PHASE 4: FULL LIVE END-TO-END DATABASE & API AUDIT');
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

  // Connect to MongoDB directly for verification & cleanup
  const conn = await mongoose.connect(MONGO_URI);
  const usersCollection = conn.connection.db.collection('users');

  // Clean any previous test accounts
  await usersCollection.deleteMany({
    email: { $in: ['siddharth@virasat.gov.in', 'sneha@virasat.gov.in'] },
  });

  let sessionCookie = '';

  // -------------------------------------------------------------
  // TEST 1: Registration with valid data
  // -------------------------------------------------------------
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Siddharth Rao',
      email: 'siddharth@virasat.gov.in',
      password: 'TestPassword123!',
      phone: '+919876543210',
      nationality: 'Indian',
    }),
  });

  const regData = await regRes.json();
  const setCookieHeader = regRes.headers.get('set-cookie') || '';
  sessionCookie = setCookieHeader.split(';')[0]; // Extract token=...

  assert(regRes.status === 201, 'TEST 1.1: Registration returns HTTP 201 Created');
  assert(regData.success === true, 'TEST 1.2: Registration returns success: true');
  assert(regData.data.user.role === 'visitor', 'TEST 1.3: User role is assigned as "visitor"');
  assert(regData.data.user.password === undefined, 'TEST 1.4: Password hash is NOT exposed in registration response');
  assert(setCookieHeader.includes('HttpOnly'), 'TEST 1.5: Set-Cookie includes HttpOnly flag');
  assert(setCookieHeader.toLowerCase().includes('samesite=lax'), 'TEST 1.6: Set-Cookie includes SameSite=lax flag');

  // Verify in MongoDB directly
  const dbUser = await usersCollection.findOne({ email: 'siddharth@virasat.gov.in' });
  assert(dbUser !== null, 'TEST 1.7: User document actually persisted in MongoDB Atlas / local');
  assert(dbUser.password.startsWith('$2a$12$') || dbUser.password.startsWith('$2b$12$'), 'TEST 1.8: Stored password in DB is 12-round bcrypt hash');

  // -------------------------------------------------------------
  // TEST 2: Duplicate Email Registration
  // -------------------------------------------------------------
  const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Imposter',
      email: 'siddharth@virasat.gov.in',
      password: 'DifferentPassword123!',
    }),
  });
  const dupData = await dupRes.json();
  assert(dupRes.status === 409, 'TEST 2.1: Duplicate email returns HTTP 409 Conflict');
  assert(dupData.message.includes('already exists'), 'TEST 2.2: Conflict error message clearly explains email is taken');

  // -------------------------------------------------------------
  // TEST 3: Privilege Escalation Attack (Attempting admin role)
  // -------------------------------------------------------------
  const adminAttemptRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Sneha Patel',
      email: 'sneha@virasat.gov.in',
      password: 'SnehaPassword123!',
      role: 'admin', // Maliciously trying to create admin
    }),
  });
  const adminAttemptData = await adminAttemptRes.json();
  assert(adminAttemptRes.status === 201, 'TEST 3.1: Account creation succeeds');
  assert(adminAttemptData.data.user.role === 'visitor', 'TEST 3.2: Submitted role "admin" was rejected/overridden to "visitor"');
  const dbSneha = await usersCollection.findOne({ email: 'sneha@virasat.gov.in' });
  assert(dbSneha.role === 'visitor', 'TEST 3.3: Database confirms role is strictly "visitor"');

  // -------------------------------------------------------------
  // TEST 4: Login with correct credentials
  // -------------------------------------------------------------
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'siddharth@virasat.gov.in',
      password: 'TestPassword123!',
    }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200, 'TEST 4.1: Valid login returns HTTP 200 OK');
  assert(loginData.data.user.email === 'siddharth@virasat.gov.in', 'TEST 4.2: Login returns authenticated user');
  assert(loginData.data.user.password === undefined, 'TEST 4.3: Login response excludes password hash');

  // -------------------------------------------------------------
  // TEST 5 & 6: Anti-Enumeration Generic Login Errors
  // -------------------------------------------------------------
  const wrongPwdRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'siddharth@virasat.gov.in',
      password: 'IncorrectPassword999!',
    }),
  });
  const wrongPwdData = await wrongPwdRes.json();

  const nonExistentRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'doesnotexist@virasat.gov.in',
      password: 'AnyPassword123!',
    }),
  });
  const nonExistentData = await nonExistentRes.json();

  assert(wrongPwdRes.status === 401, 'TEST 5.1: Wrong password returns HTTP 401 Unauthorized');
  assert(nonExistentRes.status === 401, 'TEST 6.1: Non-existent email returns HTTP 401 Unauthorized');
  assert(
    wrongPwdData.message === nonExistentData.message && wrongPwdData.message === 'Invalid email or password.',
    'TEST 6.2: Error message is identical for wrong password and non-existent email (prevents user enumeration)'
  );

  // -------------------------------------------------------------
  // TEST 7: Current User Session Endpoint (GET /api/auth/me)
  // -------------------------------------------------------------
  const meWithCookie = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: sessionCookie },
  });
  const meData = await meWithCookie.json();
  assert(meWithCookie.status === 200, 'TEST 7.1: /api/auth/me with valid cookie returns HTTP 200');
  assert(meData.data.user.email === 'siddharth@virasat.gov.in', 'TEST 7.2: Returns authenticated user profile');
  assert(meData.data.user.password === undefined, 'TEST 7.3: Excludes password hash');

  const meNoCookie = await fetch(`${BASE_URL}/api/auth/me`);
  assert(meNoCookie.status === 401, 'TEST 7.4: /api/auth/me without cookie returns HTTP 401');

  // -------------------------------------------------------------
  // TEST 8: Profile Update (PATCH /api/users/profile)
  // -------------------------------------------------------------
  const updateRes = await fetch(`${BASE_URL}/api/users/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      name: 'Siddharth R. Sharma',
      phone: '+919999988888',
      nationality: 'International',
    }),
  });
  const updateData = await updateRes.json();
  assert(updateRes.status === 200, 'TEST 8.1: Profile update returns HTTP 200 OK');
  assert(updateData.data.user.name === 'Siddharth R. Sharma', 'TEST 8.2: Name updated');
  assert(updateData.data.user.phone === '+919999988888', 'TEST 8.3: Phone updated');
  assert(updateData.data.user.nationality === 'International', 'TEST 8.4: Nationality updated');

  // Verify in MongoDB
  const updatedDbUser = await usersCollection.findOne({ email: 'siddharth@virasat.gov.in' });
  assert(updatedDbUser.name === 'Siddharth R. Sharma', 'TEST 8.5: MongoDB confirms updated name');

  // -------------------------------------------------------------
  // TEST 9: Password Change with Correct & Incorrect Current Password
  // -------------------------------------------------------------
  // Wrong current password
  const badPwdChangeRes = await fetch(`${BASE_URL}/api/users/password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      currentPassword: 'WrongOldPassword!',
      newPassword: 'BrandNewPassword2026!',
      confirmPassword: 'BrandNewPassword2026!',
    }),
  });
  assert(badPwdChangeRes.status === 400, 'TEST 9.1: Incorrect current password rejected with HTTP 400');

  // Correct current password
  const goodPwdChangeRes = await fetch(`${BASE_URL}/api/users/password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      currentPassword: 'TestPassword123!',
      newPassword: 'BrandNewPassword2026!',
      confirmPassword: 'BrandNewPassword2026!',
    }),
  });
  assert(goodPwdChangeRes.status === 200, 'TEST 9.2: Correct password change returns HTTP 200 OK');

  // Verify login with new password
  const loginNewPwdRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'siddharth@virasat.gov.in',
      password: 'BrandNewPassword2026!',
    }),
  });
  assert(loginNewPwdRes.status === 200, 'TEST 9.3: Login with newly changed password succeeds');

  // Verify login with old password fails
  const loginOldPwdRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'siddharth@virasat.gov.in',
      password: 'TestPassword123!',
    }),
  });
  assert(loginOldPwdRes.status === 401, 'TEST 9.4: Login with old password now rejected (401)');

  // -------------------------------------------------------------
  // TEST 10: Inactive Account Access
  // -------------------------------------------------------------
  await usersCollection.updateOne(
    { email: 'siddharth@virasat.gov.in' },
    { $set: { isActive: false } }
  );

  const inactiveLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'siddharth@virasat.gov.in',
      password: 'BrandNewPassword2026!',
    }),
  });
  assert(inactiveLoginRes.status === 403, 'TEST 10.1: Inactive account login returns HTTP 403 Forbidden');

  const inactiveMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: sessionCookie },
  });
  assert(inactiveMeRes.status === 403, 'TEST 10.2: Inactive account /api/auth/me returns HTTP 403 Forbidden');

  // Reactivate user
  await usersCollection.updateOne(
    { email: 'siddharth@virasat.gov.in' },
    { $set: { isActive: true } }
  );

  // -------------------------------------------------------------
  // TEST 11: Logout & Cookie Invalidation
  // -------------------------------------------------------------
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: sessionCookie },
  });
  const logoutSetCookie = logoutRes.headers.get('set-cookie') || '';
  assert(logoutRes.status === 200, 'TEST 11.1: Logout returns HTTP 200 OK');
  assert(
    logoutSetCookie.includes('Max-Age=0') || logoutSetCookie.includes('expires='),
    'TEST 11.2: Logout clears cookie by expiring it in response header'
  );

  // Clean up test documents from MongoDB
  await usersCollection.deleteMany({
    email: { $in: ['siddharth@virasat.gov.in', 'sneha@virasat.gov.in'] },
  });
  await mongoose.disconnect();

  console.log('\n================================================================');
  console.log(`LIVE DATABASE & API AUDIT RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runLiveAudit().catch((err) => {
  console.error('Live audit execution failed:', err);
  process.exit(1);
});
