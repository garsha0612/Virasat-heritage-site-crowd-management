import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'heritage_secret_key_jwt_authentication_token_2026_super_secure';

const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export const AUTH_COOKIE_NAME = 'token';
export const TOKEN_EXPIRATION = '24h';
export const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

/**
 * Sign a new JWT token using jose HS256 algorithm.
 * Edge-runtime and Node.js runtime compatible.
 *
 * @param {Object} payload
 * @param {string} expiresIn
 * @returns {Promise<string>}
 */
export async function signJwt(payload, expiresIn = TOKEN_EXPIRATION) {
  const iat = Math.floor(Date.now() / 1000);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(expiresIn)
    .sign(encodedSecret);
}

/**
 * Verify and decode a JWT token using jose.
 * Returns decoded payload if valid, or null if expired/tampered.
 *
 * @param {string} token
 * @returns {Promise<Object|null>}
 */
export async function verifyJwt(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Get cookie configuration attributes for secure session storage.
 *
 * @param {number} maxAgeInSeconds
 * @returns {Object}
 */
export function getAuthCookieOptions(maxAgeInSeconds = COOKIE_MAX_AGE) {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    name: AUTH_COOKIE_NAME,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeInSeconds,
  };
}

/**
 * Set the session authentication cookie on a NextResponse object.
 *
 * @param {NextResponse} response
 * @param {string} token
 */
export function setAuthCookie(response, token) {
  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions(COOKIE_MAX_AGE));
}

/**
 * Invalidate the session authentication cookie on a NextResponse object.
 *
 * @param {NextResponse} response
 */
export function clearAuthCookie(response) {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    ...getAuthCookieOptions(0),
    expires: new Date(0),
  });
}

/**
 * Extract authenticated user session from Next.js server context or request.
 *
 * @param {Request} [request]
 * @returns {Promise<Object|null>}
 */
export async function getSessionUser(request) {
  let token = null;

  if (request && typeof request.cookies?.get === 'function') {
    token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  } else {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      // Not in a server component / route handler with cookies()
    }
  }

  if (!token) return null;

  const payload = await verifyJwt(token);
  if (!payload || !payload.id) return null;

  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    role: payload.role || 'visitor',
  };
}
