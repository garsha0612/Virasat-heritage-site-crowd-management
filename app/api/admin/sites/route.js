import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAdmin } from '@/lib/adminAuth';
import HeritageSite from '@/models/HeritageSite';
import Booking from '@/models/Booking';
import TimeSlot from '@/models/TimeSlot';
import { siteCreateSchema } from '@/lib/validations/admin';
import { ensureHeritageSitesSeeded } from '@/lib/seedSites';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/sites
 * List all heritage sites with optional search, filtering, and booking statistics.
 */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    await connectToDatabase();
    await ensureHeritageSitesSeeded();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const state = searchParams.get('state')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const activeFilter = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'name'; // name, createdAt, state
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    if (state && state !== 'all') {
      query.state = state;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (activeFilter !== null && activeFilter !== undefined && activeFilter !== 'all') {
      query.isActive = activeFilter === 'true';
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const sites = await HeritageSite.find(query).sort(sortOptions);

    // Compute dependent booking & slot counts for each site
    const enrichedSites = await Promise.all(
      sites.map(async (site) => {
        const [bookingCount, slotCount] = await Promise.all([
          Booking.countDocuments({ siteSlug: site.slug }),
          TimeSlot.countDocuments({ heritageSite: site.slug }),
        ]);

        return {
          id: site._id.toString(),
          name: site.name,
          slug: site.slug,
          tagline: site.tagline,
          category: site.category,
          state: site.state,
          city: site.city,
          openingHours: site.openingHours,
          weeklyClosingDay: site.weeklyClosingDay,
          entryFee: site.entryFee,
          isFeatured: site.isFeatured,
          isActive: site.isActive,
          images: site.images,
          demonstrationCapacity: site.demonstrationCapacity,
          bookingCount,
          slotCount,
          createdAt: site.createdAt,
          updatedAt: site.updatedAt,
        };
      })
    );

    // Get unique categories and states for filters
    const [allStates, allCategories] = await Promise.all([
      HeritageSite.distinct('state'),
      HeritageSite.distinct('category'),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sites: enrichedSites,
        total: enrichedSites.length,
        filterOptions: {
          states: allStates.sort(),
          categories: allCategories.sort(),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve heritage sites.', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sites
 * Creates a new heritage monument entry with strict Zod validation.
 */
export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();

    const validation = siteCreateSchema.safeParse(body);
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

    // Check duplicate slug
    const existingSlug = await HeritageSite.findOne({ slug: validation.data.slug });
    if (existingSlug) {
      return NextResponse.json(
        {
          success: false,
          code: 'SLUG_EXISTS',
          message: `A heritage site with slug "${validation.data.slug}" already exists. Slugs must be unique.`,
        },
        { status: 409 }
      );
    }

    const createdSite = await HeritageSite.create(validation.data);

    return NextResponse.json(
      {
        success: true,
        message: `Heritage site "${createdSite.name}" registered successfully.`,
        data: {
          id: createdSite._id.toString(),
          slug: createdSite.slug,
          name: createdSite.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create heritage site.', error: error.message },
      { status: 500 }
    );
  }
}
