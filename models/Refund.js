import mongoose from 'mongoose';

/**
 * ANVAYA – Refund Model
 * Tracks administrator-governed refund requests, approval lifecycle, and Cashfree gateway dispatch.
 */
const RefundAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'REQUEST_SUBMITTED',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'GATEWAY_INITIATED',
        'GATEWAY_CONFIRMED',
        'GATEWAY_FAILED',
        'RETRY_INITIATED',
      ],
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorName: {
      type: String,
      default: 'System',
    },
    actorRole: {
      type: String,
      default: 'system',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: false }
);

const RefundSchema = new mongoose.Schema(
  {
    refundId: {
      type: String,
      required: [true, 'Refund tracking identifier is required.'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Refund must reference an active booking.'],
      index: true,
    },
    bookingReference: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Refund must belong to an authenticated visitor.'],
      index: true,
    },
    requestedAmount: {
      type: Number,
      required: true,
      min: [0, 'Requested refund amount cannot be negative.'],
    },
    approvedAmount: {
      type: Number,
      default: null,
      min: 0,
    },
    status: {
      type: String,
      enum: {
        values: [
          'NOT_REQUESTED',
          'REQUESTED',
          'UNDER_REVIEW',
          'APPROVED',
          'REJECTED',
          'PROCESSING',
          'REFUNDED',
          'FAILED',
        ],
        message: '{VALUE} is not a recognized refund status.',
      },
      default: 'REQUESTED',
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason for refund request is required.'],
      trim: true,
    },
    supportingDetails: {
      type: String,
      trim: true,
      default: '',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    adminReview: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      adminNote: {
        type: String,
        default: '',
      },
      action: {
        type: String,
        enum: ['APPROVED', 'REJECTED', 'UNDER_REVIEW', null],
        default: null,
      },
    },
    gateway: {
      provider: {
        type: String,
        default: 'cashfree',
      },
      cashfreeRefundId: {
        type: String,
        default: null,
        index: true,
      },
      cfRefundId: {
        type: String,
        default: null,
      },
      gatewayStatus: {
        type: String,
        default: null, // SUCCESS, PENDING, CANCELLED, FAILED
      },
      responsePayload: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      processedAt: {
        type: Date,
        default: null,
      },
      failureReason: {
        type: String,
        default: null,
      },
      retryCount: {
        type: Number,
        default: 0,
      },
      lastRetryAt: {
        type: Date,
        default: null,
      },
    },
    auditLog: [RefundAuditLogSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for visitor history queries
RefundSchema.index({ user: 1, createdAt: -1 });

// Compound index for admin operations
RefundSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Refund || mongoose.model('Refund', RefundSchema);
