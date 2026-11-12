/**
 * ANVAYA – Cashfree Payment Gateway Configuration
 * 
 * ⚠️  CRITICAL SECURITY: SANDBOX ONLY - NO PRODUCTION PAYMENTS
 * 
 * This module initializes and configures the Cashfree Payment Gateway SDK (v6.x)
 * with strict enforcement of SANDBOX environment for testing purposes only.
 * Production/live payment endpoints are permanently disabled by design.
 * 
 * Features:
 * - Cashfree SDK initialization with sandbox enforcement (CFEnvironment.SANDBOX)
 * - Order creation with customer details and metadata via cashfree.PGCreateOrder()
 * - Order & payment transaction fetching via cashfree.PGFetchOrder() & cashfree.PGOrderFetchPayments()
 * - Webhook signature verification via cashfree.PGVerifyWebhookSignature() + HMAC-SHA256 fallback
 * - Comprehensive error handling and logging (without credential leakage)
 * 
 * Documentation: https://docs.cashfree.com/docs
 * SDK Reference: https://github.com/cashfree/cashfree-pg-sdk-nodejs
 */

import crypto from 'crypto';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { validateCashfreeEnvironment } from './env-validator.js';

let cashfreeConfig = null;
let cashfreeInstance = null;

/**
 * Initialize Cashfree SDK with validated sandbox credentials
 * @returns {Cashfree} Configured Cashfree instance
 * @throws {Error} If environment validation fails or not in SANDBOX mode
 */
export function initializeCashfree() {
  // Validate environment on every initialization
  cashfreeConfig = validateCashfreeEnvironment();

  // Double-check SANDBOX enforcement
  if (cashfreeConfig.environment !== 'SANDBOX') {
    throw new Error(
      'FATAL: Attempted to initialize Cashfree in non-SANDBOX mode. ' +
      'This application only supports test payments. ' +
      'Production payments are disabled.'
    );
  }

  // Initialize Cashfree SDK instance with official CFEnvironment.SANDBOX
  cashfreeInstance = new Cashfree(
    CFEnvironment.SANDBOX, // Official enum: 1 (SANDBOX)
    cashfreeConfig.clientId,
    cashfreeConfig.clientSecret
  );

  // Set API Version (defaults to 2023-08-01 / 2025-01-01)
  if (cashfreeConfig.apiVersion) {
    cashfreeInstance.XApiVersion = cashfreeConfig.apiVersion;
  }

  console.log('✅ Cashfree SDK initialized in SANDBOX mode');
  
  return cashfreeInstance;
}

/**
 * Get initialized Cashfree instance (lazy initialization)
 * @returns {Cashfree} Configured Cashfree instance
 */
export function getCashfreeInstance() {
  if (!cashfreeInstance) {
    initializeCashfree();
  }
  return cashfreeInstance;
}

/**
 * Create a Cashfree payment order
 * 
 * @param {Object} params - Order parameters
 * @param {string} params.orderId - Unique order identifier (from your system)
 * @param {number} params.orderAmount - Order amount in INR
 * @param {string} params.customerName - Customer name
 * @param {string} params.customerEmail - Customer email
 * @param {string} params.customerPhone - Customer phone (10 digits)
 * @param {string} params.returnUrl - URL to redirect after payment
 * @param {Object} [params.orderMeta] - Additional metadata
 * 
 * @returns {Promise<Object>} Order creation response with payment_session_id
 * @throws {Error} If order creation fails
 */
export async function createCashfreeOrder({
  orderId,
  orderAmount,
  customerName,
  customerEmail,
  customerPhone,
  returnUrl,
  orderMeta = {}
}) {
  try {
    const cashfree = getCashfreeInstance();

    // Sanitize phone number (strip spaces, dashes, +91)
    let sanitizedPhone = (customerPhone || '').replace(/\D/g, '');
    if (sanitizedPhone.length > 10) {
      sanitizedPhone = sanitizedPhone.slice(-10);
    }
    if (sanitizedPhone.length < 10) {
      sanitizedPhone = '9999999999'; // Safe fallback for sandbox testing
    }

    // Prepare order request according to Cashfree PG Create Order API
    const orderRequest = {
      order_id: orderId,
      order_amount: Number(orderAmount),
      order_currency: 'INR',
      customer_details: {
        customer_id: `cust_${orderId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(-20)}`,
        customer_name: customerName || 'Valued Visitor',
        customer_email: customerEmail || 'visitor@example.com',
        customer_phone: sanitizedPhone
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/cashfree`,
        ...orderMeta
      },
      order_note: 'ANVAYA Heritage Site Entry Pass - SANDBOX TEST TRANSACTION'
    };

    // Call instance method cashfree.PGCreateOrder
    const response = await cashfree.PGCreateOrder(orderRequest);

    if (!response || !response.data) {
      throw new Error('Invalid or empty response from Cashfree API');
    }

    console.log(`✅ Cashfree order created successfully: ${orderId}`);

    return {
      success: true,
      data: {
        orderId: response.data.order_id,
        paymentSessionId: response.data.payment_session_id,
        orderStatus: response.data.order_status,
        orderAmount: response.data.order_amount,
        orderCurrency: response.data.order_currency
      }
    };

  } catch (error) {
    const errorDetail = error.response?.data?.message || error.message || 'Failed to create payment order';
    console.error('❌ Cashfree order creation failed:', errorDetail);
    throw new Error(`Cashfree order creation failed: ${errorDetail}`);
  }
}

/**
 * Fetch order details and payment transactions from Cashfree
 * 
 * @param {string} orderId - Cashfree order ID
 * @returns {Promise<Object>} Order details with payment status and transactions
 * @throws {Error} If order fetch fails
 */
export async function fetchCashfreeOrder(orderId) {
  try {
    const cashfree = getCashfreeInstance();

    // 1. Fetch order details via instance method
    const orderResponse = await cashfree.PGFetchOrder(orderId);

    if (!orderResponse || !orderResponse.data) {
      throw new Error('Invalid or empty response from Cashfree API');
    }

    const orderData = orderResponse.data;

    // 2. Fetch payment transactions for this order
    let payments = [];
    try {
      const paymentsResponse = await cashfree.PGOrderFetchPayments(orderId);
      if (paymentsResponse && Array.isArray(paymentsResponse.data)) {
        payments = paymentsResponse.data;
      }
    } catch (paymentsErr) {
      // If no payments have been attempted yet, Cashfree might return 404 or empty
      payments = [];
    }

    const latestPayment = payments.length > 0 ? payments[0] : null;

    return {
      success: true,
      data: {
        orderId: orderData.order_id,
        orderStatus: orderData.order_status, // ACTIVE, PAID, EXPIRED
        orderAmount: orderData.order_amount,
        orderCurrency: orderData.order_currency,
        paymentSessionId: orderData.payment_session_id,
        customerDetails: orderData.customer_details,
        orderMeta: orderData.order_meta,
        payments: payments,
        latestPayment: latestPayment
      }
    };

  } catch (error) {
    const errorDetail = error.response?.data?.message || error.message || 'Failed to fetch order details';
    console.error('❌ Cashfree order fetch failed:', errorDetail);
    throw new Error(`Cashfree order fetch failed: ${errorDetail}`);
  }
}

/**
 * Create a Cashfree refund for a paid order
 * 
 * @param {Object} params
 * @param {string} params.orderId - Cashfree order ID
 * @param {number} params.refundAmount - Refund amount in INR
 * @param {string} params.refundId - Unique refund identifier in your system
 * @param {string} [params.refundNote] - Reason or note for refund
 * @param {string} [params.refundSpeed] - 'STANDARD' | 'INSTANT'
 * @returns {Promise<Object>} Cashfree refund response
 */
export async function createCashfreeRefund({
  orderId,
  refundAmount,
  refundId,
  refundNote = 'Approved by administrator',
  refundSpeed = 'STANDARD'
}) {
  try {
    const cashfree = getCashfreeInstance();

    const refundRequest = {
      refund_amount: Number(refundAmount),
      refund_id: String(refundId),
      refund_note: String(refundNote || 'Refund requested by visitor'),
      refund_speed: refundSpeed || 'STANDARD'
    };

    console.log(`[Cashfree Refund] Dispatching refund for Order: ${orderId}, Refund ID: ${refundId}, Amount: ₹${refundAmount}`);

    const response = await cashfree.PGOrderCreateRefund(orderId, refundRequest);

    if (!response || !response.data) {
      throw new Error('Empty response received from Cashfree Refund API');
    }

    const data = response.data;
    console.log(`✅ Cashfree refund initiated successfully: ${data.cf_refund_id || data.refund_id}`);

    return {
      success: true,
      data: {
        cfRefundId: data.cf_refund_id,
        refundId: data.refund_id,
        orderId: data.order_id,
        refundAmount: data.refund_amount,
        refundCurrency: data.refund_currency || 'INR',
        refundStatus: data.refund_status, // SUCCESS, PENDING, CANCELLED, FAILED
        refundArn: data.refund_arn,
        refundNote: data.refund_note,
        createdAt: data.created_at,
        processedAt: data.processed_at,
        raw: data
      }
    };
  } catch (error) {
    const errorDetail = error.response?.data?.message || error.message || 'Failed to initiate Cashfree refund';
    console.error('❌ Cashfree refund creation failed:', errorDetail);
    return {
      success: false,
      error: errorDetail,
      rawError: error.response?.data || null
    };
  }
}

/**
 * Fetch status of a Cashfree refund
 * 
 * @param {string} orderId - Cashfree order ID
 * @param {string} refundId - System refund ID
 * @returns {Promise<Object>}
 */
export async function fetchCashfreeRefund(orderId, refundId) {
  try {
    const cashfree = getCashfreeInstance();
    const response = await cashfree.PGOrderFetchRefund(orderId, refundId);
    if (!response || !response.data) {
      throw new Error('Empty response received from Cashfree');
    }
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    const errorDetail = error.response?.data?.message || error.message || 'Failed to fetch refund status';
    return {
      success: false,
      error: errorDetail
    };
  }
}

/**
 * Verify webhook signature for security
 * Uses Cashfree instance method with HMAC-SHA256 fallback for dedicated webhook secrets
 * 
 * @param {string} signature - x-webhook-signature header value
 * @param {string} rawBody - Raw request body as string
 * @param {string} timestamp - x-webhook-timestamp header value
 * @returns {boolean} True if signature is valid
 * @throws {Error} If signature verification fails
 */
export function verifyWebhookSignature(signature, rawBody, timestamp) {
  if (!signature || !timestamp || !rawBody) {
    throw new Error('Webhook signature verification failed: Missing required verification parameters');
  }

  const cashfree = getCashfreeInstance();

  // 1. Try SDK built-in signature verification (uses clientSecret)
  try {
    cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
    console.log('✅ Webhook signature verified via SDK');
    return true;
  } catch (sdkError) {
    // 2. If SDK verification fails, check if a dedicated CASHFREE_WEBHOOK_SECRET is set
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
    if (webhookSecret && webhookSecret !== process.env.CASHFREE_CLIENT_SECRET) {
      const bodyToSign = timestamp + rawBody;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyToSign)
        .digest('base64');

      if (expectedSignature === signature) {
        console.log('✅ Webhook signature verified via dedicated webhook secret');
        return true;
      }
    }

    console.error('❌ Webhook signature verification failed: Signatures do not match');
    throw new Error('Webhook signature verification failed: Invalid signature');
  }
}

/**
 * Parse and validate webhook payload
 * 
 * @param {Object} payload - Webhook payload from Cashfree
 * @returns {Object} Validated webhook data
 */
export function parseWebhookPayload(payload) {
  const { type, data } = payload || {};

  if (!type || !data) {
    throw new Error('Invalid webhook payload structure: Missing type or data');
  }

  return {
    eventType: type, // PAYMENT_SUCCESS_WEBHOOK, PAYMENT_FAILED_WEBHOOK, PAYMENT_USER_DROPPED_WEBHOOK
    order: {
      orderId: data.order?.order_id,
      orderAmount: data.order?.order_amount,
      orderStatus: data.order?.order_status,
      orderCurrency: data.order?.order_currency || 'INR'
    },
    payment: {
      paymentStatus: data.payment?.payment_status,
      paymentAmount: data.payment?.payment_amount,
      paymentTime: data.payment?.payment_time,
      paymentMethod: data.payment?.payment_group,
      paymentMessage: data.payment?.payment_message,
      cfPaymentId: data.payment?.cf_payment_id,
      bankReference: data.payment?.bank_reference
    },
    customer: {
      customerId: data.customer_details?.customer_id,
      customerName: data.customer_details?.customer_name,
      customerEmail: data.customer_details?.customer_email,
      customerPhone: data.customer_details?.customer_phone
    }
  };
}

/**
 * Get normalized payment status enum for database storage
 * 
 * @param {string} cashfreeStatus - Cashfree payment or order status
 * @returns {string} Normalized payment status ('pending' | 'completed' | 'failed' | 'cancelled' | 'expired')
 */
export function normalizePaymentStatus(cashfreeStatus) {
  const statusMap = {
    // Order statuses
    'ACTIVE': 'pending',
    'PAID': 'completed',
    'EXPIRED': 'expired',
    
    // Payment statuses
    'SUCCESS': 'completed',
    'CAPTURED': 'completed',
    'FAILED': 'failed',
    'USER_DROPPED': 'cancelled',
    'VOID': 'cancelled',
    'CANCELLED': 'cancelled',
    'PENDING': 'pending',
    'NOT_ATTEMPTED': 'pending'
  };

  return statusMap[cashfreeStatus?.toUpperCase()] || 'pending';
}

/**
 * Check if payment is confirmed successful
 * 
 * @param {string} orderStatus - Cashfree order status
 * @param {string} [paymentStatus] - Cashfree payment status
 * @returns {boolean} True if payment is confirmed successful
 */
export function isPaymentSuccessful(orderStatus, paymentStatus) {
  return (
    orderStatus === 'PAID' || 
    paymentStatus === 'SUCCESS' || 
    paymentStatus === 'CAPTURED'
  );
}

/**
 * Get Cashfree environment configuration metadata (without revealing secrets)
 * 
 * @returns {Object} Safe configuration summary
 */
export function getCashfreeConfig() {
  if (!cashfreeConfig) {
    cashfreeConfig = validateCashfreeEnvironment();
  }

  return {
    environment: cashfreeConfig.environment,
    apiVersion: cashfreeConfig.apiVersion,
    isSandbox: cashfreeConfig.environment === 'SANDBOX',
    hasClientId: Boolean(cashfreeConfig.clientId),
    hasClientSecret: Boolean(cashfreeConfig.clientSecret),
    hasWebhookSecret: Boolean(cashfreeConfig.webhookSecret)
  };
}

export const PAYMENT_METHODS = {
  CARD: 'card',
  UPI: 'upi',
  NETBANKING: 'netbanking',
  WALLET: 'wallet',
  EMI: 'emi',
  PAYLATER: 'paylater'
};

export const ORDER_STATUS = {
  ACTIVE: 'ACTIVE',
  PAID: 'PAID',
  EXPIRED: 'EXPIRED'
};

export const PAYMENT_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
  USER_DROPPED: 'USER_DROPPED',
  CANCELLED: 'CANCELLED'
};

export default {
  initializeCashfree,
  getCashfreeInstance,
  createCashfreeOrder,
  fetchCashfreeOrder,
  createCashfreeRefund,
  fetchCashfreeRefund,
  verifyWebhookSignature,
  parseWebhookPayload,
  normalizePaymentStatus,
  isPaymentSuccessful,
  getCashfreeConfig,
  PAYMENT_METHODS,
  ORDER_STATUS,
  PAYMENT_STATUS
};
