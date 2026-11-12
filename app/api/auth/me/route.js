import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * Retrieves the currently authenticated visitor's profile.
 * Verifies HTTP-only JWT cookie on the server.
 */
export async function GET(request) {
  try {
    const session = await getSessionUser(request);

    if (!session || !session.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'No active authentication session found.',
        },
        { status: 401 }
      );
    }

    // Try fetching fresh data from MongoDB if database is accessible
    try {
      await connectToDatabase();
      const user = await User.findById(session.id);
      if (user) {
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
        return NextResponse.json(
          {
            success: true,
            data: { user: User.toSafeUser(user) },
          },
          { status: 200 }
        );
      }
    } catch {
      // If DB is temporarily offline, fallback to validated session payload
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: session.id,
            name: session.name,
            email: session.email,
            role: session.role,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to retrieve session profile.',
      },
      { status: 500 }
    );
  }
}
