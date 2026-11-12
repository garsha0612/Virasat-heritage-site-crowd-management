import mongoose from 'mongoose';

const TicketItemSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1.'],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative.'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative.'],
    },
  },
  { _id: false }
);

const AdditionalVisitorSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    age: { type: Number, min: 0, default: null },
    idType: { type: String, trim: true, default: 'ID Proof at Gate' },
  },
  { _id: false }
);

const BookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: [true, 'Booking reference is required.'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must be associated with an authenticated visitor.'],
      index: true,
    },
    heritageSite: {
      type: String,
      required: [true, 'Heritage site identifier is required.'],
      trim: true,
      lowercase: true,
      index: true,
    },
    siteName: {
      type: String,
      required: [true, 'Heritage site name is required.'],
      trim: true,
    },
    siteLocation: {
      type: String,
      trim: true,
      default: '',
    },
    visitDate: {
      type: String,
      required: [true, 'Visit date is required (YYYY-MM-DD).'],
      trim: true,
      index: true,
    },
    timeSlot: {
      slotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TimeSlot',
      },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      slotLabel: { type: String, default: '' },
    },
    tickets: {
      type: [TicketItemSchema],
      required: [true, 'At least one ticket category must be selected.'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A booking must contain at least one ticket.',
      },
    },
    totalTickets: {
      type: Number,
      required: true,
      min: [1, 'Total tickets must be at least 1.'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative.'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    bookingStatus: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled', 'failed'],
        message: '{VALUE} is not a valid booking status.',
      },
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'completed', 'failed', 'refunded', 'cancelled', 'expired'],
        message: '{VALUE} is not a valid payment status.',
      },
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cashfree', 'card', 'upi', 'netbanking', 'none'],
      default: 'none',
    },
    payment: {
      // Cashfree payment gateway fields
      cashfreeOrderId: { type: String, default: null, index: true },
      paymentSessionId: { type: String, default: null },
      orderCreatedAt: { type: Date, default: null },
      orderStatus: { type: String, default: null }, // ACTIVE, PAID, EXPIRED
      
      // Payment transaction details
      cfPaymentId: { type: String, default: null, index: true },
      paymentStatus: { type: String, default: null }, // SUCCESS, FAILED, etc.
      paymentMethod: { type: String, default: null }, // card, upi, netbanking, etc.
      paymentAmount: { type: Number, default: null },
      paymentTime: { type: Date, default: null },
      bankReference: { type: String, default: null },
      paymentMessage: { type: String, default: null },
      
      // Webhook processing
      lastWebhookAt: { type: Date, default: null },
      webhookEventType: { type: String, default: null },
      
      // Legacy/fallback fields
      transactionId: { type: String, default: null },
      gatewayOrderId: { type: String, default: null },
      paidAt: { type: Date, default: null },
      gatewayProvider: { type: String, default: 'cashfree' },
      failureReason: { type: String, default: null },
    },
    visitorDetails: {
      primaryName: { type: String, required: true, trim: true },
      primaryEmail: { type: String, required: true, trim: true, lowercase: true },
      primaryPhone: { type: String, trim: true, default: '' },
      nationality: { type: String, trim: true, default: 'Indian' },
      additionalVisitors: [AdditionalVisitorSchema],
    },
    ticketCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    qrCodeDataUrl: {
      type: String,
      default: null,
    },
    cancellation: {
      cancelledAt: { type: Date, default: null },
      cancellationReason: { type: String, default: null },
      refundAmount: { type: Number, default: 0 },
      refundStatus: {
        type: String,
        enum: ['none', 'simulated_refund_processed', 'refund_pending', 'refund_failed'],
        default: 'none',
      },
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user dashboard queries
BookingSchema.index({ user: 1, createdAt: -1 });

// Compound index for monument operational queries
BookingSchema.index({ heritageSite: 1, visitDate: 1, bookingStatus: 1 });

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
