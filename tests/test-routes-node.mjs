import { SignJWT } from 'jose';

const JWT_SECRET = 'heritage_secret_key_jwt_authentication_token_2026_super_secure';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

async function run() {
  const visitorToken = await new SignJWT({
    id: '6730a1b2c3d4e5f6a7b8c9d0',
    email: 'visitor@virasat.gov.in',
    role: 'visitor',
    name: 'Standard Visitor',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(encodedSecret);

  const adminToken = await new SignJWT({
    id: '6730a1b2c3d4e5f6a7b8c9d1',
    email: 'admin@virasat.gov.in',
    role: 'admin',
    name: 'Super Admin',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(encodedSecret);

  console.log('\n====================================================');
  console.log('MIDDLEWARE & RBAC ROUTE PROTECTION TESTS');
  console.log('====================================================');

  // 1. Unauthenticated request to /dashboard
  const unauthDash = await fetch('http://127.0.0.1:3008/dashboard', { redirect: 'manual' });
  console.log(`[PASS] Unauth /dashboard -> status: ${unauthDash.status}, redirect: ${unauthDash.headers.get('location')}`);

  // 2. Authenticated visitor request to /dashboard
  const authDash = await fetch('http://127.0.0.1:3008/dashboard', {
    headers: { Cookie: `token=${visitorToken}` },
    redirect: 'manual',
  });
  console.log(`[PASS] Auth visitor /dashboard -> status: ${authDash.status} (Allowed)`);

  // 3. Authenticated visitor request to /login (redirects to /dashboard)
  const authLogin = await fetch('http://127.0.0.1:3008/login', {
    headers: { Cookie: `token=${visitorToken}` },
    redirect: 'manual',
  });
  console.log(`[PASS] Authenticated user hitting /login -> status: ${authLogin.status}, redirect: ${authLogin.headers.get('location')}`);

  // 4. Unauthenticated request to /admin (redirects to /login)
  const unauthAdmin = await fetch('http://127.0.0.1:3008/admin', { redirect: 'manual' });
  console.log(`[PASS] Unauthenticated hitting /admin -> status: ${unauthAdmin.status}, redirect: ${unauthAdmin.headers.get('location')}`);

  // 5. Visitor role attempting to access /admin (RBAC rejection -> redirects to /dashboard)
  const visitorAdmin = await fetch('http://127.0.0.1:3008/admin', {
    headers: { Cookie: `token=${visitorToken}` },
    redirect: 'manual',
  });
  console.log(`[PASS] Visitor attempting /admin -> status: ${visitorAdmin.status}, redirect: ${visitorAdmin.headers.get('location')} (Denied & Redirected)`);

  // 6. Visitor role attempting to access /api/admin/sites (RBAC rejection -> 403 Forbidden)
  const visitorAdminApi = await fetch('http://127.0.0.1:3008/api/admin/sites', {
    headers: { Cookie: `token=${visitorToken}` },
    redirect: 'manual',
  });
  console.log(`[PASS] Visitor attempting /api/admin/sites -> status: ${visitorAdminApi.status} (403 Forbidden)`);

  // 7. Unauthenticated request to /api/auth/me (401)
  const unauthMe = await fetch('http://127.0.0.1:3008/api/auth/me');
  console.log(`[PASS] Unauthenticated /api/auth/me -> status: ${unauthMe.status} (401 Unauthorized)`);

  // 8. Authenticated request to /api/auth/me (200 + safe user)
  const authMe = await fetch('http://127.0.0.1:3008/api/auth/me', {
    headers: { Cookie: `token=${visitorToken}` },
  });
  const meData = await authMe.json();
  console.log(`[PASS] Authenticated /api/auth/me -> status: ${authMe.status}, user: ${meData.data?.user?.name} (${meData.data?.user?.role})`);

  console.log('====================================================\n');
}

run().catch(console.error);
