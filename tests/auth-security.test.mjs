import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../lib/validations/auth.js';
import User from '../models/User.js';

const JWT_SECRET = 'heritage_secret_key_jwt_authentication_token_2026_super_secure';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

async function runSecurityTests() {
  console.log('====================================================');
  console.log('VIRASAT AUTHENTICATION & SECURITY VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: Password Hashing with bcryptjs (12 salt rounds)
  // ----------------------------------------------------
  const rawPassword = 'HeritagePassword2026!';
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(rawPassword, salt);

  assert(hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$'), 'bcrypt uses 12 salt rounds');
  assert(await bcrypt.compare(rawPassword, hash), 'bcrypt validates correct password');
  assert(!(await bcrypt.compare('WrongPassword999!', hash)), 'bcrypt rejects incorrect password');

  // ----------------------------------------------------
  // TEST 2: JWT Stateless Token Handling with jose
  // ----------------------------------------------------
  const userPayload = {
    id: '6730a1b2c3d4e5f6a7b8c9d0',
    email: 'tourist@virasat.gov.in',
    role: 'visitor',
    name: 'Priya Patel',
  };

  const token = await new SignJWT(userPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(encodedSecret);

  assert(typeof token === 'string' && token.split('.').length === 3, 'JWT is properly signed as a 3-part token');

  const { payload: verifiedPayload } = await jwtVerify(token, encodedSecret);
  assert(verifiedPayload.id === userPayload.id, 'JWT payload ID verified');
  assert(verifiedPayload.role === 'visitor', 'JWT payload role is visitor');
  assert(verifiedPayload.email === userPayload.email, 'JWT payload email verified');

  // Verify expired token rejection
  try {
    const expiredToken = await new SignJWT(userPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime('0s') // immediately expired
      .sign(encodedSecret);

    await jwtVerify(expiredToken, encodedSecret);
    assert(false, 'Expired JWT should be rejected');
  } catch (err) {
    assert(true, 'Expired JWT was correctly rejected by jose');
  }

  // ----------------------------------------------------
  // TEST 3: Zod Registration Validation & Role Injection Prevention
  // ----------------------------------------------------
  const validReg = registerSchema.safeParse({
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    password: 'SecurePassword123!',
    phone: '+919876543210',
    nationality: 'Indian',
  });
  assert(validReg.success, 'Valid registration payload accepted');

  const invalidEmailReg = registerSchema.safeParse({
    name: 'Aarav Sharma',
    email: 'not-an-email',
    password: 'SecurePassword123!',
  });
  assert(!invalidEmailReg.success, 'Invalid email format rejected');

  const shortPasswordReg = registerSchema.safeParse({
    name: 'Aarav Sharma',
    email: 'valid@example.com',
    password: 'short',
  });
  assert(!shortPasswordReg.success, 'Password under 8 characters rejected');

  const noNumberPasswordReg = registerSchema.safeParse({
    name: 'Aarav Sharma',
    email: 'valid@example.com',
    password: 'PasswordWithoutNumbers',
  });
  assert(!noNumberPasswordReg.success, 'Password without numbers rejected');

  // Verify that if role: "admin" is passed to register, it is stripped by schema
  const maliciousReg = registerSchema.safeParse({
    name: 'Hacker',
    email: 'hacker@example.com',
    password: 'Password12345!',
    role: 'admin', // Attempted role escalation
  });
  assert(maliciousReg.success && maliciousReg.data.role === undefined, 'Client-submitted admin role is stripped from registration data');

  // ----------------------------------------------------
  // TEST 4: Password Change Validation
  // ----------------------------------------------------
  const validPwdChange = changePasswordSchema.safeParse({
    currentPassword: 'OldPassword123!',
    newPassword: 'NewPassword999!',
    confirmPassword: 'NewPassword999!',
  });
  assert(validPwdChange.success, 'Valid password change payload accepted');

  const mismatchPwdChange = changePasswordSchema.safeParse({
    currentPassword: 'OldPassword123!',
    newPassword: 'NewPassword999!',
    confirmPassword: 'DifferentPassword123!',
  });
  assert(!mismatchPwdChange.success, 'Mismatched new password and confirmation rejected');

  // ----------------------------------------------------
  // TEST 5: User Model Data Sanitization (toSafeUser)
  // ----------------------------------------------------
  const mockUserDoc = {
    _id: '6730a1b2c3d4e5f6a7b8c9d0',
    name: 'Ananya Verma',
    email: 'ananya@example.com',
    password: '$2a$12$someSecureHashedPasswordThatMustNeverLeak',
    role: 'visitor',
    phone: '+919876543210',
    nationality: 'Indian',
    isActive: true,
    createdAt: new Date(),
    __v: 0,
  };

  const safeUser = User.toSafeUser(mockUserDoc);
  assert(safeUser.password === undefined, 'Password hash is completely omitted from safe user payload');
  assert(safeUser.__v === undefined, 'Internal Mongoose __v omitted from safe user payload');
  assert(safeUser.id === '6730a1b2c3d4e5f6a7b8c9d0', 'Safe user has proper string id');
  assert(safeUser.email === 'ananya@example.com', 'Safe user preserves email');

  console.log(`\n====================================================`);
  console.log(`SECURITY TESTS RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
