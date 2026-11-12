import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireVisitor } from '@/lib/rbac';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { changePasswordSchema } from '@/lib/validations/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/users/password
 * Changes the authenticated visitor's password after verifying their current password.
 * Enforces visitor role: administrators must use /api/admin/settings/password.
 */
export async function POST(request) {
  try {
    const auth = await requireVisitor(request);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const validationResult = changePasswordSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map((e) => e.message);
      return NextResponse.json(
        {
          success: false,
          message: errorMessages[0] || 'Invalid password payload.',
          errors: errorMessages,
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validationResult.data;

    await connectToDatabase();

    const user = await User.findById(auth.visitorUser.id).select('+password');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User record not found.' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
      return NextResponse.json(
        {
          success: false,
          message: 'Current password does not match our records.',
        },
        { status: 400 }
      );
    }

    // Hash new password with 12 rounds
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Password has been changed successfully.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update account password.' },
      { status: 500 }
    );
  }
}
