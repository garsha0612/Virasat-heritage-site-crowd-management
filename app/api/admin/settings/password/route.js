import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import { requireAdmin } from '@/lib/adminAuth';
import User from '@/models/User';
import { adminChangePasswordSchema } from '@/lib/validations/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/settings/password
 * Changes the authenticated administrator's password.
 */
export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();

    const validation = adminChangePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.errors[0]?.message || 'Invalid password parameters.',
          errors: validation.error.errors.map((e) => e.message),
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    await connectToDatabase();

    const admin = await User.findById(auth.adminUser.id).select('+password');
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'User record not found.' },
        { status: 404 }
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_CREDENTIALS',
          message: 'The current password provided is incorrect.',
        },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(12);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    return NextResponse.json({
      success: true,
      message: 'Administrator password changed successfully.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to change password.', error: error.message },
      { status: 500 }
    );
  }
}
