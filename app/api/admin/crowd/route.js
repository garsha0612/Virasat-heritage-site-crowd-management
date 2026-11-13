import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { requireAdmin } from '@/lib/adminAuth';
import HeritageSite from '@/models/HeritageSite';
import TimeSlot from '@/models/TimeSlot';
import { crowdConfigSchema } from '@/lib/validations/admin';
import { ensureHeritageSitesSeeded } from '@/lib/seedSites';

export const dynamic = 'force-dynamic';

// In-memory configurable demonstration parameters for the current application lifecycle
let activeCrowdConfig = {
  lowMax: 40,
  moderateMax: 70,
  highMax: 100,
  simulationMultiplier: 1.0,
};

function getClassification(percentage, config) {
  if (percentage <= config.lowMax) {
    return {
      key: 'low',
      label: 'Low Crowd',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      color: '#10B981',
      advisory: 'Optimal window for unhurried exploration and minimal turnstile waiting.',
    };
  }
  if (percentage <= config.moderateMax) {
    return {
      key: 'moderate',
      label: 'Moderate Crowd',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
      color: '#F59E0B',
      advisory: 'Steady visitor throughput. Minor security check queuing expected.',
    };
  }
  return {
    key: 'high',
    label: 'High Density',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-300',
    color: '#EF4444',
    advisory: 'Approaching peak visitor threshold. Timed entry strictly enforced.',
  };
}

/**
 * GET /api/admin/crowd
 * Aggregates site-by-site crowd metrics and demonstration occupancy telemetry.
 */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    await connectToDatabase();
    await ensureHeritageSitesSeeded();

    const todayStr = new Date().toISOString().slice(0, 10);
    const sites = await HeritageSite.find({ isActive: true }).sort({ name: 1 });

    const siteTelemetries = await Promise.all(
      sites.map(async (site) => {
        const slots = await TimeSlot.find({
          heritageSite: site.slug,
          date: todayStr,
        }).sort({ startTime: 1 });

        const totalCapacity = slots.reduce((sum, s) => sum + s.capacity, 0);
        const totalReserved = slots.reduce((sum, s) => sum + s.reservedCount, 0);

        // Occupancy calculation with demonstration multiplier
        const baseOccupancy = totalCapacity > 0 ? (totalReserved / totalCapacity) * 100 : 25;
        const adjustedOccupancy = Math.min(100, Math.round(baseOccupancy * activeCrowdConfig.simulationMultiplier));

        const classification = getClassification(adjustedOccupancy, activeCrowdConfig);

        // Slot timeline breakdown for hourly chart
        const hourlyTimeline = slots.map((s) => ({
          time: s.startTime,
          slotLabel: s.slotLabel,
          capacity: s.capacity,
          reserved: s.reservedCount,
          occupancy: s.capacity > 0 ? Math.round((s.reservedCount / s.capacity) * 100) : 0,
        }));

        // Peak hour identification
        let peakSlot = null;
        if (slots.length > 0) {
          peakSlot = [...slots].sort((a, b) => b.reservedCount - a.reservedCount)[0];
        }

        return {
          id: site._id.toString(),
          slug: site.slug,
          name: site.name,
          city: site.city,
          state: site.state,
          demonstrationCapacity: site.demonstrationCapacity,
          todayTotalCapacity: totalCapacity,
          todayTotalReserved: totalReserved,
          occupancyPercentage: adjustedOccupancy,
          classification,
          peakHour: peakSlot ? `${peakSlot.startTime} – ${peakSlot.endTime}` : '10:00 – 12:00',
          slotsActive: slots.length,
          hourlyTimeline,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        thresholds: activeCrowdConfig,
        sites: siteTelemetries,
        activeDate: todayStr,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve crowd metrics.', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/crowd
 * Updates demonstration crowd thresholds and simulation multiplier.
 */
export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();

    const validation = crowdConfigSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.errors[0]?.message || 'Invalid configuration.',
        },
        { status: 400 }
      );
    }

    const { lowMax, moderateMax, highMax, simulationMultiplier } = validation.data;

    if (lowMax >= moderateMax) {
      return NextResponse.json(
        {
          success: false,
          message: 'Low threshold maximum must be strictly less than Moderate threshold maximum.',
        },
        { status: 400 }
      );
    }

    if (moderateMax >= highMax) {
      return NextResponse.json(
        {
          success: false,
          message: 'Moderate threshold maximum must be strictly less than High threshold maximum.',
        },
        { status: 400 }
      );
    }

    activeCrowdConfig = {
      lowMax,
      moderateMax,
      highMax,
      simulationMultiplier,
    };

    return NextResponse.json({
      success: true,
      message: 'Demonstration crowd thresholds updated successfully.',
      data: {
        thresholds: activeCrowdConfig,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update crowd configuration.', error: error.message },
      { status: 500 }
    );
  }
}
