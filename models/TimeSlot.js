import mongoose from 'mongoose';

const SlotReceiptSchema = new mongoose.Schema(
  {
    opId: { type: String, required: true },
    type: {
      type: String,
      enum: ['reservation', 'cancellation', 'compensation'],
      required: true,
    },
    qty: { type: Number, required: true },
    appliedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TimeSlotSchema = new mongoose.Schema(
  {
    heritageSite: {
      type: String,
      required: [true, 'Heritage site identifier is required.'],
      trim: true,
      lowercase: true,
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Slot date is required (YYYY-MM-DD).'],
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD.'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Slot start time is required (HH:mm).'],
      trim: true,
      match: [/^\d{2}:\d{2}$/, 'Start time must be formatted as HH:mm.'],
    },
    endTime: {
      type: String,
      required: [true, 'Slot end time is required (HH:mm).'],
      trim: true,
      match: [/^\d{2}:\d{2}$/, 'End time must be formatted as HH:mm.'],
    },
    slotLabel: {
      type: String,
      trim: true,
      default: '',
    },
    capacity: {
      type: Number,
      required: [true, 'Slot visitor capacity is required.'],
      min: [1, 'Capacity must be at least 1 visitor.'],
      default: 1000,
    },
    reservedCount: {
      type: Number,
      default: 0,
      min: [0, 'Reserved count cannot be negative.'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    appliedReceipts: {
      type: [SlotReceiptSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound Unique Index to prevent duplicate slots for the same site, date, and start time
TimeSlotSchema.index(
  { heritageSite: 1, date: 1, startTime: 1 },
  { unique: true }
);

// Query optimization index for slot availability lookups
TimeSlotSchema.index({ heritageSite: 1, date: 1, isActive: 1 });

// Fast lookup of applied operation receipts
TimeSlotSchema.index({ 'appliedReceipts.opId': 1 });

// Virtual to calculate remaining visitor capacity dynamically
TimeSlotSchema.virtual('remainingCapacity').get(function () {
  return Math.max(0, this.capacity - this.reservedCount);
});

// Virtual to check if slot is fully booked
TimeSlotSchema.virtual('isFullyBooked').get(function () {
  return this.reservedCount >= this.capacity;
});

export default mongoose.models.TimeSlot || mongoose.model('TimeSlot', TimeSlotSchema);
