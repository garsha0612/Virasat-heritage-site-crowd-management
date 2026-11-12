import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { registerSchema } from '@/lib/validations/auth';
import { signJwt, setAuthCookie } from '@/lib/auth';

/**
 * POST /api/auth/register
 * Registers a new visitor account with bcrypt password hashing and issues session cookie.
 * Always enforces 'visitor' role; client-submitted roles are strictly disallowed.
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // 1. Zod Input Validation
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map((e) => e.message);
      return NextResponse.json(
        {
          success: false,
          message: errorMessages[0] || 'Invalid registration data.',
          errors: errorMessages,
        },
        { status: 400 }
      );
    }

    const { name, email, password, phone, nationality } = validationResult.data;

    // 2. Connect to Database
    try {
      await connectToDatabase();
    } catch (dbErr) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Database service is currently unreachable. Please check connection settings.',
        },
        { status: 503 }
      );
    }

    // 3. Duplicate Email Check
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'An account with this email address already exists.',
        },
        { status: 409 }
      );
    }

    // 4. Secure Password Hashing (12 salt rounds)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create New Visitor Account (Strict Role Enforcement)
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'visitor', // Hardcoded visitor role to block privilege escalation
      phone: phone || '',
      nationality: nationality || 'Indian',
      isActive: true,
      lastLogin: new Date(),
    });

    const safeUser = User.toSafeUser(newUser);

    // 6. Generate Signed JWT Session Token
    const token = await signJwt({
      id: safeUser.id,
      email: safeUser.email,
      name: safeUser.name,
      role: safeUser.role,
    });

    // 7. Issue HTTP-Only Cookie in Response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Account registered successfully.',
        data: { user: safeUser },
      },
      { status: 201 }
    );

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Registration route error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected internal error occurred during registration.',
      },
      { status: 500 }
    );
  }
}
