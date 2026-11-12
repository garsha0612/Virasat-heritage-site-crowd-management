import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { requireAdmin } from '@/lib/rbac';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/users/[id]/toggle-status
 * Toggles or updates user isActive status.
 * Safeguards:
 * 1. Prevents administrators from disabling their own currently authenticated account.
 * 2. Prevents deactivation of the last remaining active administrator.
 */
export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ success: false, message: 'Invalid user ID.' }, { status: 400 });
  }

  // Prevent self-deactivation
  if (auth.adminUser.id === params.id) {
    return NextResponse.json(
      {
        success: false,
        code: 'CANNOT_DEACTIVATE_SELF',
        message: 'Security safeguard: Administrators cannot deactivate their own active account.',
      },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    // Prevent deactivating the last active administrator
    if (user.role === 'admin' && user.isActive === true) {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            code: 'CANNOT_REMOVE_LAST_ADMIN',
            message: 'Security safeguard: Cannot deactivate or remove the last active administrator in the system.',
          },
          { status: 400 }
        );
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    return NextResponse.json({
      success: true,
      message: `User account "${user.email}" is now ${user.isActive ? 'Active' : 'Suspended'}.`,
      data: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update user status.', error: error.message },
      { status: 500 }
    );
  }
}
