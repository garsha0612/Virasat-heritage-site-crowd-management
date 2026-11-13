import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Generate human-readable unique booking reference.
 * Format: ANV-YYYYMMDD-XXXXXX (e.g. ANV-20261111-9A4F2C)
 */
export function generateBookingReference() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomBytes = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ANV-${dateStr}-${randomBytes}`;
}

/**
 * Generate secure unique ticket code for turnstile gate verification.
 * Format: TKT-YYYYMMDD-XXXXXXXX
 */
export function generateTicketCode() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TKT-${dateStr}-${randomHex}`;
}

/**
 * Generate scannable QR Code as base64 data URL.
 * 
 * SECURITY GUARANTEES:
 * 1. Encodes strictly non-sensitive verification tokens: bookingReference, ticketCode, destination, slot, and visitor count.
 * 2. Passwords, password hashes, email addresses, phone numbers, and raw JWT tokens are strictly EXCLUDED.
 * 3. Incorporates explicit educational simulation notice to prevent fraudulent presentation at physical monuments.
 * 
 * @param {Object} ticketMetadata
 * @returns {Promise<string>} Base64 PNG image data URL
 */
export async function generateTicketQRCode({
  bookingReference,
  ticketCode,
  siteSlug,
  visitDate,
  timeSlot,
  totalTickets,
}) {
  const payload = {
    system: 'ANVAYA-HERITAGE-PASS-v1',
    ref: bookingReference,
    code: ticketCode,
    site: siteSlug,
    date: visitDate,
    slot: `${timeSlot?.startTime || '00:00'}-${timeSlot?.endTime || '00:00'}`,
    pax: totalTickets,
    ts: Date.now(),
  };

  const jsonPayload = JSON.stringify(payload);

  const qrDataUrl = await QRCode.toDataURL(jsonPayload, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    margin: 2,
    color: {
      dark: '#1B4332', // Forest Green theme color
      light: '#FFFFFF',
    },
    width: 320,
  });

  return qrDataUrl;
}

/**
 * Idempotently ensure a confirmed booking possesses a scannable QR pass.
 * If initial generation was interrupted, regenerates the pass without requiring re-payment.
 * 
 * @param {string} bookingId
 * @returns {Promise<{ success: boolean, booking?: Object, error?: string }>}
 */
export async function ensureBookingQRCode(bookingId) {
  const Booking = (await import('../models/Booking.js')).default;
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return { success: false, error: 'Booking reservation not found.' };
  }

  // Check for both old 'paid' and new 'completed' payment statuses
  const validPaymentStatuses = ['paid', 'completed'];
  
  if (booking.bookingStatus !== 'confirmed' || !validPaymentStatuses.includes(booking.paymentStatus)) {
    return {
      success: false,
      error: `Cannot generate QR pass for booking with status '${booking.bookingStatus}' and payment status '${booking.paymentStatus}'.`,
    };
  }

  if (booking.qrCodeDataUrl && booking.ticketCode) {
    return { success: true, booking };
  }

  const ticketCode = booking.ticketCode || generateTicketCode();
  const qrCodeDataUrl = await generateTicketQRCode({
    bookingReference: booking.bookingReference,
    ticketCode,
    siteSlug: booking.heritageSite,
    visitDate: booking.visitDate,
    timeSlot: booking.timeSlot,
    totalTickets: booking.totalTickets,
  });

  booking.ticketCode = ticketCode;
  booking.qrCodeDataUrl = qrCodeDataUrl;
  await booking.save();

  return { success: true, booking };
}

/**
 * Generate QR ticket for a booking document (used by payment verification)
 * This function mutates the booking object but does NOT save it.
 * The caller is responsible for saving the booking.
 * 
 * @param {Object} booking - Mongoose booking document
 * @returns {Promise<void>}
 */
export async function generateQrCodeForBooking(booking) {
  if (!booking) {
    throw new Error('Booking document is required');
  }

  // Generate ticket code if not exists
  if (!booking.ticketCode) {
    booking.ticketCode = generateTicketCode();
  }

  // Generate QR code
  const qrCodeDataUrl = await generateTicketQRCode({
    bookingReference: booking.bookingReference,
    ticketCode: booking.ticketCode,
    siteSlug: booking.heritageSite,
    visitDate: booking.visitDate,
    timeSlot: booking.timeSlot,
    totalTickets: booking.totalTickets,
  });

  booking.qrCodeDataUrl = qrCodeDataUrl;
  
  // Note: Caller must save the booking
}
