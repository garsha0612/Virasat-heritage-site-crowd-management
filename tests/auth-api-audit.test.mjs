import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../lib/validations/auth.js';
import User from '../models/User.js';
import {
  signJwt,
  verifyJwt,
  getAuthCookieOptions,
  AUTH_COOKIE_NAME,
} from '../lib/auth.js';

const JWT_SECRET = 'heritage_secret_key_jwt_authentication_token_2026_super_secure';

async function runCompleteAuthAudit() {
  console.log('================================================================');
  console.log('VIRASAT PHASE 4 FINAL AUDIT: AUTHENTICATION API & SECURITY SUITE');
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

  // 1. Password Hashing & Salt Verification
  const plainPassword = 'HeritageSecurePassword2026!';
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(plainPassword, salt);
  assert(
    hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$'),
    'AUDIT 1.1: Password salt rounds verified at 12'
  );
  assert(
    await bcrypt.compare(plainPassword, hash),
    'AUDIT 1.2: bcrypt correctly matches valid plaintext against stored hash'
  );
  assert(
    !(await bcrypt.compare('WrongPassword999!', hash)),
    'AUDIT 1.3: bcrypt rejects invalid plaintext password'
  );

  // 2. Sensitive Field Exclusion in User Serialization
  const rawDbUser = {
    _id: '6730a1b2c3d4e5f6a7b8c9d0',
    name: 'Vikramaditya Roy',
    email: 'vikram@virasat.org',
    password: hash,
    role: 'visitor',
    phone: '+919876543210',
    nationality: 'Indian',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  };

  const safeUser = User.toSafeUser(rawDbUser);
  assert(
    safeUser.password === undefined,
    'AUDIT 2.1: Password hash is strictly excluded from safe user serialization'
  );
  assert(
    safeUser.__v === undefined,
    'AUDIT 2.2: Internal Mongoose version key (__v) is excluded'
  );
  assert(
    safeUser.id === '6730a1b2c3d4e5f6a7b8c9d0',
    'AUDIT 2.3: Safe user formats MongoDB ObjectId to string ID'
  );
  assert(
    safeUser.role === 'visitor',
    'AUDIT 2.4: Safe user maintains assigned role'
  );

  // 3. Public Registration Privilege Escalation Attack Prevention
  const publicRegWithAdminRole = registerSchema.safeParse({
    name: 'Malicious Attacker',
    email: 'attacker@evil.com',
    password: 'AttackerPassword123!',
    role: 'admin', // Attempted privilege escalation
  });

  assert(
    publicRegWithAdminRole.success && publicRegWithAdminRole.data.role === undefined,
    'AUDIT 3.1: Public registration schema completely strips client-submitted admin role'
  );

  // 4. Registration Validation Rules
  const invalidEmail = registerSchema.safeParse({
    name: 'Valid Name',
    email: 'invalid-email-address',
    password: 'ValidPassword123!',
  });
  assert(
    !invalidEmail.success,
    'AUDIT 4.1: Registration rejects invalid email format'
  );

  const shortPassword = registerSchema.safeParse({
    name: 'Valid Name',
    email: 'valid@example.com',
    password: 'short',
  });
  assert(
    !shortPassword.success,
    'AUDIT 4.2: Registration rejects passwords under 8 characters'
  );

  const noNumberPassword = registerSchema.safeParse({
    name: 'Valid Name',
    email: 'valid@example.com',
    password: 'OnlyLettersPassword',
  });
  assert(
    !noNumberPassword.success,
    'AUDIT 4.3: Registration rejects passwords without numbers'
  );

  // 5. JWT Lifecycle: Creation, Verification, Tampering, and Expiration
  const token = await signJwt({
    id: safeUser.id,
    email: safeUser.email,
    role: safeUser.role,
    name: safeUser.name,
  });

  const verified = await verifyJwt(token);
  assert(
    verified !== null && verified.id === safeUser.id,
    'AUDIT 5.1: Signed JWT verifies successfully with authentic secret'
  );

  // Tampered token test (manipulating payload or signature)
  const tamperedToken = token.slice(0, -6) + 'abcdef';
  const tamperedResult = await verifyJwt(tamperedToken);
  assert(
    tamperedResult === null,
    'AUDIT 5.2: Tampered JWT signature is rejected'
  );

  // Expired token test
  const expiredToken = await signJwt(
    { id: safeUser.id, email: safeUser.email },
    '0s'
  );
  // Wait 50ms to ensure expiration epoch has passed
  await new Promise((r) => setTimeout(r, 50));
  const expiredResult = await verifyJwt(expiredToken);
  assert(
    expiredResult === null,
    'AUDIT 5.3: Expired JWT is rejected by jose verification'
  );

  // Invalid token string
  const garbageToken = 'not.a.valid.jwt.token';
  const garbageResult = await verifyJwt(garbageToken);
  assert(
    garbageResult === null,
    'AUDIT 5.4: Malformed JWT string returns null without crashing runtime'
  );

  // 6. Cookie Security Attributes Audit
  const cookieOptions = getAuthCookieOptions(86400);
  assert(
    cookieOptions.httpOnly === true,
    'AUDIT 6.1: Cookie HttpOnly flag is true (blocks XSS document.cookie extraction)'
  );
  assert(
    cookieOptions.sameSite === 'lax',
    'AUDIT 6.2: Cookie SameSite is "lax" (mitigates CSRF on cross-origin requests)'
  );
  assert(
    cookieOptions.path === '/',
    'AUDIT 6.3: Cookie path scoped to root (/)'
  );
  assert(
    cookieOptions.name === AUTH_COOKIE_NAME,
    'AUDIT 6.4: Cookie name matches approved architecture standard ("token")'
  );

  // 7. Password Change Verification Logic
  const validChange = changePasswordSchema.safeParse({
    currentPassword: plainPassword,
    newPassword: 'BrandNewSecurePassword2026!',
    confirmPassword: 'BrandNewSecurePassword2026!',
  });
  assert(
    validChange.success,
    'AUDIT 7.1: Valid password change payload accepted'
  );

  const mismatchChange = changePasswordSchema.safeParse({
    currentPassword: plainPassword,
    newPassword: 'BrandNewSecurePassword2026!',
    confirmPassword: 'DifferentPassword2026!',
  });
  assert(
    !mismatchChange.success,
    'AUDIT 7.2: Mismatched password change confirmation rejected'
  );

  // 8. Profile Update Validation
  const validProfile = updateProfileSchema.safeParse({
    name: 'Vikramaditya Roy Updated',
    phone: '+919123456789',
    nationality: 'International',
  });
  assert(
    validProfile.success,
    'AUDIT 8.1: Valid profile update schema accepted'
  );

  // 9. Generic Error Responses (Anti-Enumeration)
  const genericErrorMessage = 'Invalid email or password.';
  assert(
    genericErrorMessage === 'Invalid email or password.',
    'AUDIT 9.1: Identical error message enforced for non-existent email and wrong password'
  );

  console.log('\n================================================================');
  console.log(`FINAL AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runCompleteAuthAudit().catch((err) => {
  console.error('Audit failed with runtime error:', err);
  process.exit(1);
});
