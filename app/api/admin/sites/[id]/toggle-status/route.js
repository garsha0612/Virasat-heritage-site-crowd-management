import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { requireAdmin } from '@/lib/adminAuth';
import HeritageSite from '@/models/HeritageSite';

export const dynamic = 'force-dynamic';

function getSiteQuery(idOrSlug) {
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    return { _id: idOrSlug };
  }
  return { slug: idOrSlug };
}

/**
 * PATCH /api/admin/sites/[id]/toggle-status
 * Toggles the isActive status of a heritage site without affecting historical bookings.
 */
export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    await connectToDatabase();
    const site = await HeritageSite.findOne(getSiteQuery(params.id));

    if (!site) {
      return NextResponse.json(
        { success: false, message: 'Heritage site not found.' },
        { status: 404 }
      );
    }

    site.isActive = !site.isActive;
    await site.save();

    return NextResponse.json({
      success: true,
      message: `Heritage site "${site.name}" is now ${site.isActive ? 'Active' : 'Deactivated'}.`,
      data: {
        id: site._id.toString(),
        slug: site.slug,
        name: site.name,
        isActive: site.isActive,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update site status.', error: error.message },
      { status: 500 }
    );
  }
}
