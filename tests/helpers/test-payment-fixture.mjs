/**
 * ANVAYA – Automated Test Fixture Helper for ACID & Concurrency Scenarios
 * 
 * Location: tests/helpers/test-payment-fixture.mjs
 * 
 * Purely an automated test helper located in tests/.
 * NOT an application route. Not included in Next.js production build.
 */

import mongoose from 'mongoose';
import { ensureBookingQRCode } from '../../lib/tickets.js';

export async function executeTestFixturePayment({
  bookingId,
  user,
  outcome = 'success',
  simulateFailure = false,
  paymentMethod = 'card',
}) {
  if (!bookingId) {
    return { status: 400, success: false, message: 'Booking ID is required.' };
  }

  const db = mongoose.connection.db;
  const bookingsCollection = db.collection('bookings');

  const query = mongoose.Types.ObjectId.isValid(bookingId)
    ? { _id: new mongoose.Types.ObjectId(bookingId) }
    : { bookingReference: String(bookingId).toUpperCase().trim() };

  const booking = await bookingsCollection.findOne(query);
  if (!booking) {
    return { status: 404, success: false, message: 'Booking reservation not found.' };
  }

  // Enforce ownership
  if (user && booking.user.toString() !== (user.id || user._id?.toString()) && user.role !== 'admin') {
    return { status: 403, success: false, message: 'Access denied: You do not own this booking.' };
  }

  // Check if cancelled
  if (booking.bookingStatus === 'cancelled') {
    return { status: 400, success: false, code: 'BOOKING_CANCELLED', message: 'Cannot process payment on cancelled booking.' };
  }

  // Check if already paid
  if (
    booking.bookingStatus === 'confirmed' &&
    (booking.paymentStatus === 'paid' || booking.paymentStatus === 'completed')
  ) {
    return { status: 400, success: false, code: 'ALREADY_PAID', message: 'Payment already completed for this booking.' };
  }

  const isFailure = outcome === 'failure' || Boolean(simulateFailure);

  if (isFailure) {
    await bookingsCollection.updateOne(
      { _id: booking._id },
      {
        $set: {
          paymentStatus: 'failed',
          bookingStatus: 'pending',
          'payment.failureReason': 'Payment transaction was declined by bank',
          updatedAt: new Date(),
        },
      }
    );

    return {
      status: 200,
      success: false,
      message: 'Payment simulation failed.',
      data: {
        booking: {
          id: booking._id.toString(),
          bookingReference: booking.bookingReference,
          bookingStatus: 'pending',
          paymentStatus: 'failed',
        },
      },
    };
  }

  // Success
  await bookingsCollection.updateOne(
    { _id: booking._id },
    {
      $set: {
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: paymentMethod === 'mock_upi' ? 'upi' : (paymentMethod === 'mock_card' ? 'card' : paymentMethod),
        'payment.paidAt': new Date(),
        'payment.transactionId': `TXN-${Date.now()}`,
        'payment.paymentStatus': 'SUCCESS',
        'payment.paymentMethod': paymentMethod,
        updatedAt: new Date(),
      },
    }
  );

  const qrRes = await ensureBookingQRCode(booking._id.toString());
  const updatedDoc = await bookingsCollection.findOne({ _id: booking._id });

  return {
    status: 200,
    success: true,
    message: 'Payment processed successfully.',
    data: {
      booking: {
        id: updatedDoc._id.toString(),
        bookingReference: updatedDoc.bookingReference,
        bookingStatus: updatedDoc.bookingStatus,
        paymentStatus: updatedDoc.paymentStatus,
        paymentMethod: updatedDoc.paymentMethod,
        ticketCode: updatedDoc.ticketCode,
        qrCodeDataUrl: updatedDoc.qrCodeDataUrl,
      },
    },
  };
}
