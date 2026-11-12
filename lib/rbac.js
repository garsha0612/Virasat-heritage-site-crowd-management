/**
 * ANVAYA – Server-Enforced Role-Based Access Control (RBAC) Module
 * 
 * Strict separation between Administrator and Visitor/User privileges.
 * 
 * Rules:
 * - ADMIN: Exclusive access to /admin, /api/admin/*, site management, user controls, reports.
 *   Administrators do not receive visitor privileges or personal visitor endpoints.
 * - VISITOR: Access to public routes, their own bookings, tickets, and profile.
 *   Strictly denied access to administrative tools or other visitors' records.
 * - STAFF: Scoped access for field check-in and validation, strictly isolated from admin settings.
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

/**
 * Base authentication check: requires valid JWT, existing MongoDB document, and active status.
 * 
 * @param {Request} request
 * @returns {Promise<{ user?: Object, errorResponse?: NextResponse }>}
 */
export async function requireAuth(request) {
  const session = await getSessionUser(request);

  if (!session || !session.id) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          code: 'UNAUTHENTICATED',
          message: 'Authentication required. Please sign in to continue.',
        },
        { status: 401 }
      ),
    };
  }

  try {
    await connectToDatabase();
  } catch (err) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database service is temporarily unreachable.',
        },
        { status: 503 }
      ),
    };
  }

  const dbUser = await User.findById(session.id).select('+role +isActive');

  if (!dbUser) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'User account record was not found.',
        },
        { status: 401 }
      ),
    };
  }

  if (dbUser.isActive === false) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          code: 'ACCOUNT_SUSPENDED',
          message: 'This account has been deactivated. Please contact administration.',
        },
        { status: 403 }
      ),
    };
  }

  return {
    user: {
      id: dbUser._id.toString(),
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      phone: dbUser.phone || '',
      nationality: dbUser.nationality || 'Indian',
      createdAt: dbUser.createdAt,
    },
  };
}

/**
 * Enforces exclusive Administrator privileges.
 * Regular visitors and staff are strictly rejected with HTTP 403.
 * 
 * @param {Request} request
 * @returns {Promise<{ adminUser?: Object, errorResponse?: NextResponse }>}
 */
export async function requireAdmin(request) {
  const auth = await requireAuth(request);
  if (auth.errorResponse) return auth;

  if (auth.user.role !== 'admin') {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN_ADMIN_REQUIRED',
          message: 'Access denied: Exclusive administrator privileges required.',
        },
        { status: 403 }
      ),
    };
  }

  return { adminUser: auth.user };
}

/**
 * Enforces Visitor / User privileges.
 * Administrators are strictly prohibited from acting as regular visitors or
 * manipulating personal visitor profiles (must use /admin and /api/admin/* instead).
 * 
 * @param {Request} request
 * @returns {Promise<{ visitorUser?: Object, errorResponse?: NextResponse }>}
 */
export async function requireVisitor(request) {
  const auth = await requireAuth(request);
  if (auth.errorResponse) return auth;

  if (auth.user.role === 'admin') {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          code: 'ADMIN_NOT_PERMITTED_AS_VISITOR',
          message: 'Access denied: Administrators must use administrative portals (/admin) and cannot modify or access visitor endpoints.',
        },
        { status: 403 }
      ),
    };
  }

  return { visitorUser: auth.user };
}

// Alias for requireVisitor
export const requireUser = requireVisitor;

/**
 * Enforces Staff or Admin privileges (e.g., ticket verification and entrance checkpoints).
 * 
 * @param {Request} request
 * @returns {Promise<{ staffUser?: Object, errorResponse?: NextResponse }>}
 */
export async function requireStaff(request) {
  const auth = await requireAuth(request);
  if (auth.errorResponse) return auth;

  if (auth.user.role !== 'staff' && auth.user.role !== 'admin') {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          code: 'STAFF_PRIVILEGES_REQUIRED',
          message: 'Access denied: Staff or administrator privileges required.',
        },
        { status: 403 }
      ),
    };
  }

  return { staffUser: auth.user };
}

/**
 * Enforces user data isolation.
 * Verifies that the target resource belongs to the currently authenticated user,
 * or that the caller is an authorized administrator.
 * 
 * @param {string|mongoose.Types.ObjectId} resourceUserId - User ID attached to target document
 * @param {Object} sessionUser - Authenticated user payload
 * @returns {boolean} True if authorized
 */
export function isResourceOwnerOrAdmin(resourceUserId, sessionUser) {
  if (!resourceUserId || !sessionUser || !sessionUser.id) return false;
  const isOwner = resourceUserId.toString() === sessionUser.id.toString();
  const isAdmin = sessionUser.role === 'admin';
  return isOwner || isAdmin;
}

export default {
  requireAuth,
  requireAdmin,
  requireVisitor,
  requireUser,
  requireStaff,
  isResourceOwnerOrAdmin,
};
