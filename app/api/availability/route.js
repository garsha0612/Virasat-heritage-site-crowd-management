import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getOrInitializeSlotsForDate } from '@/lib/slots';
import { getSiteBySlug } from '@/constants/heritageSites';
import { availabilityQuerySchema } from '@/lib/validations/booking';

export const dynamic = 'force-dynamic';

/**
 * GET /api/availability
 * Queries real-time time slot availability and capacity for a destination on a given date.
 * Automatically seeds 4 demonstration booking intervals if none exist for this calendar date.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const site = searchParams.get('site') || searchParams.get('siteSlug');
    const date = searchParams.get('date');

    const validation = availabilityQuerySchema.safeParse({ site, date });
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.errors[0]?.message || 'Invalid query parameters.',
        },
        { status: 400 }
      );
    }

    const { site: validatedSite, date: validatedDate } = validation.data;
    const monument = getSiteBySlug(validatedSite);
    if (!monument) {
      return NextResponse.json(
        { success: false, message: `Destination "${validatedSite}" not recognized.` },
        { status: 404 }
      );
    }

    // Prevent querying past dates
    const todayStr = new Date().toISOString().slice(0, 10);
    if (validatedDate < todayStr) {
      return NextResponse.json(
        {
          success: false,
          message: 'Historical or past dates cannot be reserved. Please select today or a future date.',
        },
        { status: 400 }
      );
    }

    try {
      await connectToDatabase();
    } catch (dbErr) {
      return NextResponse.json(
        { success: false, message: 'Database service is currently unreachable.' },
        { status: 503 }
      );
    }

    // Retrieve or seed demo intervals for this date
    const slots = await getOrInitializeSlotsForDate(monument.slug, validatedDate);

    const formattedSlots = slots.map((s) => {
      const remaining = Math.max(0, s.capacity - s.reservedCount);
      const occupancyPercentage = Math.min(100, Math.round((s.reservedCount / s.capacity) * 100));

      return {
        id: s._id.toString(),
        startTime: s.startTime,
        endTime: s.endTime,
        slotLabel: s.slotLabel || `${s.startTime} – ${s.endTime}`,
        capacity: s.capacity,
        reservedCount: s.reservedCount,
        remainingCapacity: remaining,
        occupancyPercentage,
        isFullyBooked: remaining <= 0,
        isAvailable: s.isActive && remaining > 0,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          site: {
            slug: monument.slug,
            name: monument.name,
            location: monument.location,
            state: monument.state,
          },
          date: validatedDate,
          slots: formattedSlots,
          isSimulatedSchedule: true,
          disclaimer:
            'ANVAYA is an educational demonstration. Slot intervals and capacity quotas are configured demo parameters for academic simulation and do not represent official ASI turnstile slots.',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Availability query error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve slot availability.' },
      { status: 500 }
    );
  }
}
