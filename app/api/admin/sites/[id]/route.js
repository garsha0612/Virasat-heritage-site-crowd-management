import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { requireAdmin } from '@/lib/adminAuth';
import HeritageSite from '@/models/HeritageSite';
import Booking from '@/models/Booking';
import TimeSlot from '@/models/TimeSlot';
import { siteUpdateSchema } from '@/lib/validations/admin';

export const dynamic = 'force-dynamic';

function getSiteQuery(idOrSlug) {
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    return { _id: idOrSlug };
  }
  return { slug: idOrSlug };
}

/**
 * GET /api/admin/sites/[id]
 * Fetch detailed heritage site dossier with operational statistics.
 */
export async function GET(request, { params }) {
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

    const [totalBookings, confirmedBookings, activeSlots] = await Promise.all([
      Booking.countDocuments({ siteSlug: site.slug }),
      Booking.countDocuments({ siteSlug: site.slug, bookingStatus: 'confirmed' }),
      TimeSlot.countDocuments({ heritageSite: site.slug, isActive: true }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        site: {
          id: site._id.toString(),
          name: site.name,
          slug: site.slug,
          tagline: site.tagline,
          description: site.description,
          historicalBackground: site.historicalBackground,
          state: site.state,
          city: site.city,
          address: site.address,
          latitude: site.latitude,
          longitude: site.longitude,
          category: site.category,
          openingHours: site.openingHours,
          weeklyClosingDay: site.weeklyClosingDay,
          entryFee: site.entryFee,
          visitorInstructions: site.visitorInstructions,
          websiteUrl: site.websiteUrl,
          isFeatured: site.isFeatured,
          isActive: site.isActive,
          images: site.images,
          demonstrationCapacity: site.demonstrationCapacity,
          createdAt: site.createdAt,
          updatedAt: site.updatedAt,
        },
        stats: {
          totalBookings,
          confirmedBookings,
          activeSlots,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve site dossier.', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/sites/[id]
 * Updates an existing heritage monument.
 */
export async function PUT(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();

    const validation = siteUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.errors[0]?.message || 'Validation failed.',
          errors: validation.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const site = await HeritageSite.findOne(getSiteQuery(params.id));

    if (!site) {
      return NextResponse.json(
        { success: false, message: 'Heritage site not found.' },
        { status: 404 }
      );
    }

    // If slug is changing, verify uniqueness
    if (validation.data.slug && validation.data.slug !== site.slug) {
      const slugConflict = await HeritageSite.findOne({
        slug: validation.data.slug,
        _id: { $ne: site._id },
      });
      if (slugConflict) {
        return NextResponse.json(
          {
            success: false,
            code: 'SLUG_EXISTS',
            message: `A heritage site with slug "${validation.data.slug}" already exists.`,
          },
          { status: 409 }
        );
      }
    }

    Object.assign(site, validation.data);
    await site.save();

    return NextResponse.json({
      success: true,
      message: `Heritage site "${site.name}" updated successfully.`,
      data: {
        id: site._id.toString(),
        slug: site.slug,
        name: site.name,
        isActive: site.isActive,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update heritage site.', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sites/[id]
 * Safe deletion guard: Blocks deletion if dependent bookings or reserved slots exist.
 */
export async function DELETE(request, { params }) {
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

    // Check dependent bookings
    const dependentBookingsCount = await Booking.countDocuments({ siteSlug: site.slug });
    if (dependentBookingsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          code: 'CANNOT_DELETE_ACTIVE_RECORDS',
          message:
            `Cannot delete "${site.name}" because it has ${dependentBookingsCount} existing booking record(s). ` +
            'To remove it from public booking while preserving auditing integrity, deactivate the site instead.',
        },
        { status: 409 }
      );
    }

    // Check dependent slots with reserved capacity
    const slotsWithReservations = await TimeSlot.countDocuments({
      heritageSite: site.slug,
      reservedCount: { $gt: 0 },
    });
    if (slotsWithReservations > 0) {
      return NextResponse.json(
        {
          success: false,
          code: 'CANNOT_DELETE_ACTIVE_RECORDS',
          message:
            `Cannot delete "${site.name}" because time slots contain reserved tickets. ` +
            'Deactivate the site instead to prevent public booking.',
        },
        { status: 409 }
      );
    }

    // Clean up empty slots and remove site
    await TimeSlot.deleteMany({ heritageSite: site.slug });
    await HeritageSite.deleteOne({ _id: site._id });

    return NextResponse.json({
      success: true,
      message: `Heritage site "${site.name}" and associated unreserved slots were safely deleted.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete heritage site.', error: error.message },
      { status: 500 }
    );
  }
}
