import { NextResponse } from 'next/server';
import { requireVisitor } from '@/lib/rbac';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { updateProfileSchema } from '@/lib/validations/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/profile
 * Retrieves full profile of authenticated visitor.
 * Enforces visitor role: administrators must use /api/admin/settings.
 */
export async function GET(request) {
  try {
    const auth = await requireVisitor(request);
    if (auth.errorResponse) return auth.errorResponse;

    await connectToDatabase();

    const user = await User.findById(auth.visitorUser.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { user: User.toSafeUser(user) },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve profile details.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/profile
 * Updates permitted profile fields (name, phone, nationality) for authenticated visitor.
 * Enforces visitor role: administrators must use /api/admin/settings.
 */
export async function PATCH(request) {
  try {
    const auth = await requireVisitor(request);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map((e) => e.message);
      return NextResponse.json(
        {
          success: false,
          message: errorMessages[0] || 'Invalid profile data provided.',
          errors: errorMessages,
        },
        { status: 400 }
      );
    }

    const { name, phone, nationality } = validationResult.data;

    await connectToDatabase();

    const user = await User.findById(auth.visitorUser.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User record not found.' },
        { status: 404 }
      );
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (nationality !== undefined) user.nationality = nationality;

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully.',
        data: { user: User.toSafeUser(user) },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update profile details.' },
      { status: 500 }
    );
  }
}
