import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAdmin } from '@/lib/adminAuth';
import TimeSlot from '@/models/TimeSlot';
import { slotCreateSchema } from '@/lib/validations/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/slots
 * Returns time slots filtered by heritage site and calendar date.
 */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const site = searchParams.get('site')?.trim();
    const date = searchParams.get('date')?.trim();

    const query = {};
    if (site && site !== 'all') {
      query.heritageSite = site;
    }
    if (date) {
      query.date = date;
    }

    const slots = await TimeSlot.find(query).sort({ date: 1, startTime: 1 });

    const formattedSlots = slots.map((s) => ({
      id: s._id.toString(),
      heritageSite: s.heritageSite,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      slotLabel: s.slotLabel || `${s.startTime} – ${s.endTime}`,
      capacity: s.capacity,
      reservedCount: s.reservedCount,
      remainingCapacity: Math.max(0, s.capacity - s.reservedCount),
      occupancyPercentage: s.capacity > 0 ? Math.min(100, Math.round((s.reservedCount / s.capacity) * 100)) : 0,
      isActive: s.isActive !== false,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        slots: formattedSlots,
        total: formattedSlots.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve time slots.', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/slots
 * Creates a new booking interval with demonstration capacity.
 */
export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();

    const validation = slotCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.errors[0]?.message || 'Invalid slot parameters.',
          errors: validation.error.errors.map((e) => e.message),
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const { heritageSite, date, startTime, endTime, capacity, slotLabel, isActive } = validation.data;

    // Check duplicate compound index
    const existing = await TimeSlot.findOne({ heritageSite, date, startTime });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          code: 'SLOT_EXISTS',
          message: `A time slot for ${heritageSite} on ${date} starting at ${startTime} already exists.`,
        },
        { status: 409 }
      );
    }

    const createdSlot = await TimeSlot.create({
      heritageSite,
      date,
      startTime,
      endTime,
      capacity,
      reservedCount: 0,
      slotLabel: slotLabel || `${startTime} – ${endTime}`,
      isActive: isActive !== false,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'New demonstration time slot created successfully.',
        data: {
          id: createdSlot._id.toString(),
          heritageSite: createdSlot.heritageSite,
          date: createdSlot.date,
          startTime: createdSlot.startTime,
          capacity: createdSlot.capacity,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create time slot.', error: error.message },
      { status: 500 }
    );
  }
}
