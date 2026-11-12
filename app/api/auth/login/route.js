import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { loginSchema } from '@/lib/validations/auth';
import { signJwt, setAuthCookie } from '@/lib/auth';

/**
 * POST /api/auth/login
 * Authenticates user credentials with bcrypt comparison and issues HTTP-only session cookie.
 * Employs generic error responses to prevent account enumeration / user enumeration attacks.
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // 1. Zod Input Validation
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password format.',
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

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

    // 3. User Lookup (Explicitly selecting hidden password hash)
    const user = await User.findOne({ email }).select('+password');

    // 4. Generic Credential Verification
    // Prevents account enumeration by returning identical message whether email exists or not
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password.',
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password.',
        },
        { status: 401 }
      );
    }

    // 5. Account Active Check
    if (user.isActive === false) {
      return NextResponse.json(
        {
          success: false,
          message:
            'This account has been deactivated. Please contact the heritage administration.',
        },
        { status: 403 }
      );
    }

    // 6. Record Timestamp
    user.lastLogin = new Date();
    await user.save();

    const safeUser = User.toSafeUser(user);

    // 7. Generate Signed JWT Session Token
    const token = await signJwt({
      id: safeUser.id,
      email: safeUser.email,
      name: safeUser.name,
      role: safeUser.role,
    });

    // 8. Issue HTTP-Only Cookie in Response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful.',
        data: { user: safeUser },
      },
      { status: 200 }
    );

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Login route error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected internal error occurred during login.',
      },
      { status: 500 }
    );
  }
}
