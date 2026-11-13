import { NextResponse } from 'next/server';
import { connectToDatabase, withDatabaseTransaction } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import TimeSlot from '@/models/TimeSlot';
import { getSessionUser } from '@/lib/auth';
import { getSiteBySlug } from '@/constants/heritageSites';
import { calculateBookingTotal } from '@/constants/pricing';
import { generateBookingReference } from '@/lib/tickets';
import { reserveSlotCapacity } from '@/lib/slots';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings
 * 
 * Reserves slot capacity and creates a booking record inside a single atomic
 * MongoDB transaction. If capacity is exceeded or booking creation fails,
 * the transaction is aborted with zero leaked capacity.
 */
export async function POST(request) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to reserve tickets.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const { siteSlug, visitDate, slotId, tickets, visitorDetails } = body;
    const idempotencyKey =
      body.idempotencyKey ||
      request.headers.get('x-idempotency-key') ||
      null;

    // 1. Mandatory Input Validation
    if (!siteSlug || !visitDate || !slotId) {
      return NextResponse.json(
        { success: false, message: 'Site slug, visit date, and time slot identifier are required.' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
      return NextResponse.json(
        { success: false, message: 'Visit date must be formatted as YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // Verify date is not in the past
    const todayStr = new Date().toISOString().slice(0, 10);
    if (visitDate < todayStr) {
      return NextResponse.json(
        { success: false, message: 'Ticket reservations cannot be made for past dates.' },
        { status: 400 }
      );
    }

    // Validate site exists
    const monument = getSiteBySlug(siteSlug);
    if (!monument) {
      return NextResponse.json(
        { success: false, message: `Heritage monument '${siteSlug}' is not recognized in the system.` },
        { status: 404 }
      );
    }

    // Validate visitor details
    if (!visitorDetails || !visitorDetails.primaryName || !visitorDetails.primaryEmail) {
      return NextResponse.json(
        { success: false, message: 'Primary visitor name and valid email address are required.' },
        { status: 400 }
      );
    }

    // Validate tickets array
    if (!Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one ticket must be selected.' },
        { status: 400 }
      );
    }

    // 2. Server-Side Price Calculation (Enforce official tariffs; client prices are NEVER trusted)
    const mausoleumAddon = Boolean(body.includeMausoleum || body.mausoleumAddon);
    let pricing;
    try {
      pricing = calculateBookingTotal(siteSlug, tickets, { includeMausoleum: mausoleumAddon });
    } catch (pricingErr) {
      return NextResponse.json(
        { success: false, message: pricingErr.message || 'Invalid ticket configuration or zero quantity.' },
        { status: 400 }
      );
    }

    const { totalTickets, totalAmount, currency, itemizedTickets } = pricing;

    // Enforce max tickets per booking order (prevent bulk hoarding)
    if (totalTickets > 10) {
      return NextResponse.json(
        { success: false, message: 'Maximum 10 tickets allowed per order to prevent scalping and ensure equitable access.' },
        { status: 400 }
      );
    }

    // 3. Fast-Path Idempotency Check
    if (idempotencyKey) {
      const existingBooking = await Booking.findOne({ idempotencyKey }).lean();
      if (existingBooking) {
        return NextResponse.json(
          {
            success: true,
            message: 'Existing reservation returned (idempotent replay).',
            data: {
              booking: {
                id: existingBooking._id.toString(),
                bookingReference: existingBooking.bookingReference,
                siteName: existingBooking.siteName,
                visitDate: existingBooking.visitDate,
                timeSlot: existingBooking.timeSlot?.slotLabel,
                totalTickets: existingBooking.totalTickets,
                totalAmount: existingBooking.totalAmount,
                currency: existingBooking.currency,
                bookingStatus: existingBooking.bookingStatus,
                paymentStatus: existingBooking.paymentStatus,
                checkoutUrl: `/booking/payment/${existingBooking._id.toString()}`,
              },
              bookingId: existingBooking._id.toString(),
              bookingReference: existingBooking.bookingReference,
              totalAmount: existingBooking.totalAmount,
              totalTickets: existingBooking.totalTickets,
              currency: existingBooking.currency,
              checkoutUrl: `/booking/payment/${existingBooking._id.toString()}`,
              idempotentReplay: true,
            },
          },
          { status: 200 }
        );
      }
    }

    // 4. Verify slot exists
    const slot = await TimeSlot.findById(slotId);
    if (!slot || !slot.isActive) {
      return NextResponse.json(
        { success: false, message: 'The requested time slot was not found or is currently inactive.' },
        { status: 404 }
      );
    }

    // 5. Execute MongoDB Multi-Document Transaction
    try {
      const newBooking = await withDatabaseTransaction(async (session) => {
        // Step A: Conditionally reserve slot capacity
        const updatedSlot = await reserveSlotCapacity(slot._id, totalTickets, session);
        if (!updatedSlot) {
          const freshSlot = await TimeSlot.findById(slot._id).session(session);
          const remaining = freshSlot ? Math.max(0, freshSlot.capacity - freshSlot.reservedCount) : 0;
          const capacityErr = new Error(`Insufficient slot capacity. Only ${remaining} ticket(s) remaining for this time window.`);
          capacityErr.statusCode = 409;
          capacityErr.remainingCapacity = remaining;
          throw capacityErr;
        }

        // Step B: Create booking document
        const bookingReference = generateBookingReference();
        const [doc] = await Booking.create(
          [
            {
              bookingReference,
              user: sessionUser.id,
              heritageSite: monument.slug,
              siteName: monument.name,
              siteLocation: `${monument.location}, ${monument.state}`,
              visitDate,
              timeSlot: {
                slotId: updatedSlot._id,
                startTime: updatedSlot.startTime,
                endTime: updatedSlot.endTime,
                slotLabel: updatedSlot.slotLabel || `${updatedSlot.startTime} – ${updatedSlot.endTime}`,
              },
              tickets: itemizedTickets,
              totalTickets,
              totalAmount,
              currency,
              bookingStatus: 'pending',
              paymentStatus: 'pending',
              paymentMethod: 'none',
              visitorDetails: {
                primaryName: visitorDetails.primaryName,
                primaryEmail: visitorDetails.primaryEmail,
                primaryPhone: visitorDetails.primaryPhone || '',
                nationality: visitorDetails.nationality || 'Indian',
                additionalVisitors: visitorDetails.additionalVisitors || [],
              },
              ...(idempotencyKey ? { idempotencyKey } : {}),
            },
          ],
          session ? { session } : {}
        );

        return doc;
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Reservation created successfully. Please complete payment to confirm your pass.',
          data: {
            booking: {
              id: newBooking._id.toString(),
              bookingReference: newBooking.bookingReference,
              siteName: monument.name,
              visitDate,
              timeSlot: `${slot.startTime} – ${slot.endTime}`,
              totalTickets,
              totalAmount,
              currency,
              bookingStatus: newBooking.bookingStatus,
              paymentStatus: newBooking.paymentStatus,
              checkoutUrl: `/booking/payment/${newBooking._id.toString()}`,
            },
            bookingId: newBooking._id.toString(),
            bookingReference: newBooking.bookingReference,
            totalAmount,
            totalTickets,
            currency,
            checkoutUrl: `/booking/payment/${newBooking._id.toString()}`,
          },
        },
        { status: 201 }
      );
    } catch (txErr) {
      // Handle racing concurrent requests with identical idempotencyKey
      if (txErr.code === 11000 && idempotencyKey) {
        const existing = await Booking.findOne({ idempotencyKey }).lean();
        if (existing) {
          return NextResponse.json(
            {
              success: true,
              message: 'Existing reservation returned (concurrent idempotency resolution).',
              data: {
                booking: {
                  id: existing._id.toString(),
                  bookingReference: existing.bookingReference,
                  totalTickets: existing.totalTickets,
                  totalAmount: existing.totalAmount,
                  bookingStatus: existing.bookingStatus,
                  paymentStatus: existing.paymentStatus,
                  currency: existing.currency,
                  checkoutUrl: `/booking/payment/${existing._id.toString()}`,
                },
                bookingId: existing._id.toString(),
                bookingReference: existing.bookingReference,
                totalAmount: existing.totalAmount,
                totalTickets: existing.totalTickets,
                currency: existing.currency,
                checkoutUrl: `/booking/payment/${existing._id.toString()}`,
                idempotentReplay: true,
              },
            },
            { status: 200 }
          );
        }
      }

      if (txErr.statusCode === 409) {
        return NextResponse.json(
          {
            success: false,
            message: txErr.message,
            remainingCapacity: txErr.remainingCapacity,
          },
          { status: 409 }
        );
      }

      if (txErr.code === 'TRANSACTIONS_UNSUPPORTED') {
        return NextResponse.json(
          {
            success: false,
            code: 'TRANSACTIONS_UNSUPPORTED',
            message: txErr.message,
          },
          { status: 503 }
        );
      }

      console.error('Booking transaction failure:', txErr);
      return NextResponse.json(
        {
          success: false,
          message: 'An error occurred while processing your booking. Transaction aborted cleanly.',
          error: txErr.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Booking route unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating booking.', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings
 * 
 * Retrieve booking history for the authenticated visitor.
 */
export async function GET(request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const bookings = await Booking.find({ user: session.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        count: bookings.length,
        data: {
          bookings: bookings.map((b) => ({
            id: b._id.toString(),
            bookingReference: b.bookingReference,
            heritageSite: b.heritageSite,
            siteName: b.siteName,
            siteLocation: b.siteLocation,
            visitDate: b.visitDate,
            timeSlot: b.timeSlot,
            totalTickets: b.totalTickets,
            totalAmount: b.totalAmount,
            currency: b.currency,
            bookingStatus: b.bookingStatus,
            paymentStatus: b.paymentStatus,
            paymentMethod: b.paymentMethod,
            visitorDetails: b.visitorDetails,
            ticketCode: b.ticketCode,
            hasQrPass: Boolean(b.qrCodeDataUrl),
            cancellation: b.cancellation,
            createdAt: b.createdAt,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve bookings.' },
      { status: 500 }
    );
  }
}
