import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { requireAdmin } from '@/lib/adminAuth';
import TimeSlot from '@/models/TimeSlot';
import { slotUpdateSchema } from '@/lib/validations/admin';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/slots/[id]
 * Updates slot capacity or active status.
 * Strictly guarantees that capacity can never be set below already reserved tickets.
 */
export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ success: false, message: 'Invalid slot ID.' }, { status: 400 });
  }

  try {
    const body = await request.json();

    const validation = slotUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.errors[0]?.message || 'Invalid parameters.',
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const slot = await TimeSlot.findById(params.id);
    if (!slot) {
      return NextResponse.json({ success: false, message: 'Time slot not found.' }, { status: 404 });
    }

    // Invariant: Capacity must NEVER be set below already reserved count
    if (validation.data.capacity !== undefined) {
      if (validation.data.capacity < slot.reservedCount) {
        return NextResponse.json(
          {
            success: false,
            code: 'CAPACITY_LESS_THAN_RESERVED',
            message: `Capacity (${validation.data.capacity}) cannot be set below the ${slot.reservedCount} already reserved tickets for this slot.`,
          },
          { status: 400 }
        );
      }
      slot.capacity = validation.data.capacity;
    }

    if (validation.data.isActive !== undefined) {
      slot.isActive = validation.data.isActive;
    }

    await slot.save();

    return NextResponse.json({
      success: true,
      message: 'Time slot updated successfully.',
      data: {
        id: slot._id.toString(),
        capacity: slot.capacity,
        reservedCount: slot.reservedCount,
        remainingCapacity: Math.max(0, slot.capacity - slot.reservedCount),
        isActive: slot.isActive,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update time slot.', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/slots/[id]
 * Deletes a time slot ONLY if no tickets have been reserved.
 */
export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ success: false, message: 'Invalid slot ID.' }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const slot = await TimeSlot.findById(params.id);
    if (!slot) {
      return NextResponse.json({ success: false, message: 'Time slot not found.' }, { status: 404 });
    }

    if (slot.reservedCount > 0) {
      return NextResponse.json(
        {
          success: false,
          code: 'CANNOT_DELETE_RESERVED_SLOT',
          message: `Cannot delete time slot because ${slot.reservedCount} visitor(s) are already booked into this window. Deactivate the slot instead.`,
        },
        { status: 409 }
      );
    }

    await TimeSlot.deleteOne({ _id: slot._id });

    return NextResponse.json({
      success: true,
      message: 'Unreserved time slot deleted successfully.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete time slot.', error: error.message },
      { status: 500 }
    );
  }
}
