import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { requireAdmin } from '@/lib/adminAuth';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/settings
 * Returns administrator profile dossier and safe environment metadata.
 * Strictly avoids leaking database credentials or JWT secrets.
 */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    await connectToDatabase();

    const admin = await User.findById(auth.adminUser.id).select(
      'name email role phone nationality createdAt updatedAt'
    );

    const isMaster = await mongoose.connection.db.admin().command({ isMaster: 1 });

    const systemInfo = {
      applicationName: 'ANVAYA Smart Crowd Management & Ticketing',
      platformVersion: 'v1.0.0 (Production Master)',
      framework: 'Next.js 14 App Router (React 18)',
      nodeVersion: process.version,
      databaseTopology: isMaster.setName ? `Replica Set ('${isMaster.setName}')` : 'Standalone MongoDB',
      transactionSupport: Boolean(isMaster.setName),
      environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          role: admin.role,
          phone: admin.phone || '',
          nationality: admin.nationality || 'Indian',
          createdAt: admin.createdAt,
        },
        systemInfo,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve settings.', error: error.message },
      { status: 500 }
    );
  }
}
