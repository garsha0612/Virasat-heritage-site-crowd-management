import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Clears the session HTTP-only cookie by setting its expiration to the past epoch.
 */
export async function POST() {
  const response = NextResponse.json(
    {
      success: true,
      message: 'Logged out successfully.',
    },
    { status: 200 }
  );

  clearAuthCookie(response);
  return response;
}
