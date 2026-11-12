import TimeSlot from '../models/TimeSlot.js';
import { getSiteBySlug } from '../constants/heritageSites.js';

/**
 * ANVAYA Demonstration Booking Intervals
 * 
 * DISCLAIMER & ACADEMIC NOTICE:
 * The time intervals below represent ANVAYA-configured demonstration booking windows
 * engineered to model staggered visitor ingress and crowd smoothing algorithms.
 * They are NOT official ASI turnstile slot designations.
 * In live heritage monuments, visiting schedules are established directly by ASI circle
 * superintendents (e.g., sunrise-to-sunset opening hours).
 */
export const DEMO_SLOT_TEMPLATES = [
  {
    startTime: '06:00',
    endTime: '09:00',
    label: 'Morning Window 1 (06:00 AM – 09:00 AM) [Demo Simulation]',
  },
  {
    startTime: '09:00',
    endTime: '12:00',
    label: 'Morning Window 2 (09:00 AM – 12:00 PM) [Demo Simulation]',
  },
  {
    startTime: '12:00',
    endTime: '15:00',
    label: 'Afternoon Window 1 (12:00 PM – 03:00 PM) [Demo Simulation]',
  },
  {
    startTime: '15:00',
    endTime: '18:00',
    label: 'Afternoon Window 2 (03:00 PM – 06:00 PM) [Demo Simulation]',
  },
];

/**
 * Configurable Demo Capacity Calculator
 * 
 * NOTE:
 * The capacities generated here are configurable demo quotas designed for testing
 * concurrency controls and occupancy meters in an educational setting. They must NOT
 * be described as authoritative carrying capacities set by the Archaeological Survey of India.
 * 
 * @param {string} siteSlug
 * @returns {number} Configured demo quota for interval
 */
export function getConfiguredDemoSlotCapacity(siteSlug) {
  const site = getSiteBySlug(siteSlug);
  if (!site) return 1000;

  // Configurable baseline quota for simulation
  const maxInstant = site.capacity?.maxInstantaneous || 3000;
  return Math.max(500, Math.round(maxInstant * 0.7));
}

/**
 * Retrieve or initialize time slots for a site on a specific date.
 * Automatically seeds 4 demo intervals if none exist for this calendar date.
 * 
 * @param {string} siteSlug
 * @param {string} dateString - Format YYYY-MM-DD
 * @param {Object} [options]
 * @param {number} [options.customCapacity] - Optional override for testing
 * @returns {Promise<Array<Object>>}
 */
export async function getOrInitializeSlotsForDate(siteSlug, dateString, options = {}) {
  const normalizedSlug = siteSlug.toLowerCase().trim();

  // 1. Fetch existing slots
  let slots = await TimeSlot.find({
    heritageSite: normalizedSlug,
    date: dateString,
  }).sort({ startTime: 1 });

  // 2. If slots already exist, return them
  if (slots && slots.length > 0) {
    return slots;
  }

  // 3. Otherwise, initialize demo slots for this day
  const defaultCapacity = options.customCapacity || getConfiguredDemoSlotCapacity(normalizedSlug);
  const slotsToInsert = DEMO_SLOT_TEMPLATES.map((tpl) => ({
    heritageSite: normalizedSlug,
    date: dateString,
    startTime: tpl.startTime,
    endTime: tpl.endTime,
    slotLabel: tpl.label,
    capacity: defaultCapacity,
    reservedCount: 0,
    isActive: true,
  }));

  try {
    await TimeSlot.insertMany(slotsToInsert, { ordered: false });
  } catch (err) {
    // If concurrent request inserted simultaneously, duplicate key error is expected and ignored
  }

  // Refetch ordered slots
  slots = await TimeSlot.find({
    heritageSite: normalizedSlug,
    date: dateString,
  }).sort({ startTime: 1 });

  return slots;
}

/**
 * Atomic reservation of slot capacity.
 * Employs MongoDB conditional query with $expr to ensure reservedCount + requestedQty <= capacity.
 * When called inside a transaction session, aborted transactions automatically undo the increment.
 * 
 * @param {string|mongoose.Types.ObjectId} slotId
 * @param {number} requestedQty
 * @param {mongoose.ClientSession} [session] - Optional transaction session
 * @returns {Promise<Object|null>} Updated slot or null if capacity exceeded
 */
export async function reserveSlotCapacity(slotId, requestedQty, session = null) {
  const qty = Number(requestedQty);
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error('Requested capacity reservation must be a positive integer.');
  }

  const query = {
    _id: slotId,
    isActive: true,
    $expr: {
      $lte: [{ $add: ['$reservedCount', qty] }, '$capacity'],
    },
  };

  const update = {
    $inc: { reservedCount: qty },
  };

  const options = { new: true };
  if (session) {
    options.session = session;
  }

  const updated = await TimeSlot.findOneAndUpdate(query, update, options);
  return updated;
}

/**
 * Atomic release of previously reserved capacity upon cancellation.
 * Guards against underflow by ensuring reservedCount >= qty before decrementing.
 * 
 * @param {string|mongoose.Types.ObjectId} slotId
 * @param {number} qtyToRelease
 * @param {mongoose.ClientSession} [session] - Optional transaction session
 * @returns {Promise<Object|null>} Updated slot or null if underflow
 */
export async function releaseSlotCapacity(slotId, qtyToRelease, session = null) {
  const qty = Number(qtyToRelease);
  if (!Number.isInteger(qty) || qty <= 0) return null;

  const query = {
    _id: slotId,
    reservedCount: { $gte: qty }, // Underflow protection guard
  };

  const update = {
    $inc: { reservedCount: -qty },
  };

  const options = { new: true };
  if (session) {
    options.session = session;
  }

  const updated = await TimeSlot.findOneAndUpdate(query, update, options);
  return updated;
}
