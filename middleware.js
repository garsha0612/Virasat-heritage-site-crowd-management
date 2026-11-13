import { NextResponse } from 'next/server';
import { verifyJwt, AUTH_COOKIE_NAME } from './lib/auth';

/**
 * Next.js Edge Middleware for Strict Role-Based Access Control (RBAC) and Route Protection.
 * 
 * Enforces strict separation between Administrator and Visitor enclaves:
 * 1. Admin Enclave (/admin, /api/admin/*): Exclusively for role === 'admin'. Regular users redirected or rejected.
 * 2. Visitor Enclave (/dashboard, /profile, /account/*): Exclusively for role === 'visitor'. Admins redirected to /admin.
 * 3. Guest Routes (/login, /register): Authenticated visitors redirected to /dashboard; authenticated admins redirected to /admin.
 */
export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const payload = token ? await verifyJwt(token) : null;
  const isAuthenticated = Boolean(payload && payload.id);
  const userRole = payload?.role || 'visitor';

  function createRedirect(path) {
    return NextResponse.redirect(new URL(path, request.url));
  }

  // 1. Guard Admin Enclave: /admin, /api/admin/*
  const isAdminProtected =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  if (isAdminProtected) {
    if (!isAuthenticated) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { 
            success: false, 
            code: 'UNAUTHENTICATED', 
            message: 'Authentication required to access administrator endpoints.' 
          },
          { status: 401 }
        );
      }
      return createRedirect(`/login?redirect=${encodeURIComponent(`${pathname}${search}`)}`);
    }

    if (userRole !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { 
            success: false, 
            code: 'FORBIDDEN_ROLE', 
            message: 'Access denied: Exclusive administrator privileges required.' 
          },
          { status: 403 }
        );
      }
      return createRedirect('/dashboard');
    }

    return NextResponse.next();
  }

  // 2. Guard Visitor Enclave: /dashboard, /profile, /account/*
  const isVisitorProtected =
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/profile') || 
    pathname.startsWith('/account');

  if (isVisitorProtected) {
    if (!isAuthenticated) {
      return createRedirect(`/login?redirect=${encodeURIComponent(`${pathname}${search}`)}`);
    }

    // Role Separation: Administrators cannot access visitor account portals
    if (userRole === 'admin') {
      return createRedirect('/admin');
    }

    return NextResponse.next();
  }

  // 3. Guard Visitor Personal APIs: /api/users/*
  const isVisitorApiProtected = pathname.startsWith('/api/users');
  if (isVisitorApiProtected) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHENTICATED', message: 'Authentication required to access visitor account endpoints.' },
        { status: 401 }
      );
    }
    if (userRole === 'admin') {
      return NextResponse.json(
        { success: false, code: 'ADMIN_NOT_PERMITTED_AS_VISITOR', message: 'Access denied: Administrators cannot access visitor personal endpoints.' },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/account/:path*',
    '/api/users/:path*',
  ],
};
