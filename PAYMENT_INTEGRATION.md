# ANVAYA – Cashfree Payment Gateway Integration Documentation

**Version:** 1.0.0  
**Date:** November 11, 2026  
**Environment:** SANDBOX ONLY (Test Mode)  
**Gateway:** Cashfree Payment Gateway  
**SDK Version:** cashfree-pg@6.0.6

---

## Table of Contents

1. [Overview](#overview)
2. [Security Model](#security-model)
3. [Architecture](#architecture)
4. [Setup & Configuration](#setup--configuration)
5. [Payment Flow](#payment-flow)
6. [API Endpoints](#api-endpoints)
7. [Webhook Integration](#webhook-integration)
8. [Testing Guide](#testing-guide)
9. [Error Handling](#error-handling)
10. [Troubleshooting](#troubleshooting)
11. [Future Enhancements](#future-enhancements)

---

## Overview

ANVAYA integrates with Cashfree Payment Gateway to provide secure, real-time payment processing for heritage site ticket bookings. The integration is currently configured for **SANDBOX mode only** for testing and demonstration purposes.

### Key Features

- ✅ **Sandbox Environment Only** - No real money transactions
- ✅ **Server-Side Order Creation** - Secure credential handling
- ✅ **Hosted Checkout** - PCI-DSS compliant payment collection
- ✅ **Payment Verification** - Server-side status validation
- ✅ **Webhook Integration** - Real-time payment notifications
- ✅ **Idempotent Operations** - Safe retry mechanisms
- ✅ **QR Ticket Generation** - Only after verified payment
- ✅ **Comprehensive Error Handling** - User-friendly feedback

---

## Security Model

### Environment Enforcement

```javascript
// lib/env-validator.js enforces SANDBOX-only mode
- ✅ CASHFREE_ENV must be "SANDBOX"
- ✅ CASHFREE_CLIENT_ID must start with "TEST"
- ✅ CASHFREE_CLIENT_SECRET must contain "_test_"
- ❌ Production credentials are BLOCKED
- ❌ Live payment endpoints are DISABLED
```

### Authentication & Authorization

1. **Server-Side Only**: All Cashfree API calls from backend
2. **User Authentication**: JWT-based session validation
3. **Booking Ownership**: Verify user owns booking before payment
4. **Webhook Signature**: Cryptographic verification of callbacks
5. **Idempotency**: Prevent duplicate payment processing

### Data Protection

- Payment credentials NEVER sent to client
- QR tickets generated ONLY after verified payment
- Booking status transitions are atomic
- MongoDB transactions for consistency
- Sensitive data excluded from QR payloads

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Payment Page (app/booking/payment/[id]/page.jsx)        │   │
│  │  - Loads Cashfree SDK                                    │   │
│  │  - Calls /api/payments/create-order                      │   │
│  │  - Opens hosted checkout popup                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ANVAYA Backend (Next.js)                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  POST /api/payments/create-order                         │   │
│  │  - Validates booking & user                              │   │
│  │  - Creates Cashfree order                                │   │
│  │  - Returns payment_session_id                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  GET /api/payments/verify                                │   │
│  │  - Fetches order status from Cashfree                    │   │
│  │  - Updates booking status                                │   │
│  │  - Generates QR ticket if successful                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  POST /api/webhooks/cashfree                             │   │
│  │  - Verifies webhook signature                            │   │
│  │  - Processes payment events                              │   │
│  │  - Idempotent event handling                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  lib/cashfree.js                                         │   │
│  │  - SDK initialization                                    │   │
│  │  - API wrapper functions                                 │   │
│  │  - Security validation                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cashfree Payment Gateway (Sandbox)                 │
│  - Order creation                                               │
│  - Hosted checkout                                              │
│  - Payment processing                                           │
│  - Webhook notifications                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema Updates

```javascript
// models/Booking.js - New payment fields
{
  paymentStatus: ['pending', 'completed', 'failed', 'cancelled', 'expired'],
  paymentMethod: ['cashfree', 'razorpay', 'none'],
  payment: {
    // Cashfree-specific fields
    cashfreeOrderId: String,
    paymentSessionId: String,
    orderCreatedAt: Date,
    orderStatus: String, // ACTIVE, PAID, EXPIRED
    
    // Payment transaction details
    cfPaymentId: String,
    paymentStatus: String, // SUCCESS, FAILED, etc.
    paymentMethod: String, // card, upi, netbanking
    paymentAmount: Number,
    paymentTime: Date,
    bankReference: String,
    paymentMessage: String,
    
    // Webhook tracking
    lastWebhookAt: Date,
    webhookEventType: String,
    
    // Error handling
    failureReason: String
  }
}
```

---

## Setup & Configuration

### 1. Environment Variables

Add to `.env.local`:

```bash
# Cashfree Payment Gateway - SANDBOX ONLY
CASHFREE_CLIENT_ID=your_cashfree_test_client_id
CASHFREE_CLIENT_SECRET=your_cashfree_test_client_secret
CASHFREE_ENV=SANDBOX
CASHFREE_API_VERSION=2025-01-01
CASHFREE_WEBHOOK_SECRET=your_webhook_signing_secret_here
```

### 2. Cashfree Dashboard Configuration

1. **Login** to [Cashfree Merchant Dashboard](https://merchant.cashfree.com/)
2. **Switch to Test Mode** (top-right corner)
3. **Get API Keys**:
   - Navigate to: Developers > API Keys
   - Copy Client ID and Client Secret
4. **Configure Webhook**:
   - Navigate to: Developers > Webhooks
   - Click "Add Webhook Endpoint"
   - URL: `https://your-domain.com/api/webhooks/cashfree`
   - Events: Select all payment events
   - Copy Signing Secret

### 3. Install Dependencies

```bash
npm install cashfree-pg@latest
```

### 4. Verify Configuration

The application automatically validates configuration on startup:

```javascript
// Validates:
- CASHFREE_ENV === 'SANDBOX'
- CASHFREE_CLIENT_ID starts with 'TEST'
- CASHFREE_CLIENT_SECRET contains '_test_'
- All required variables present
```

---

## Payment Flow

### Step-by-Step Process

#### 1. Booking Creation

```
User → Selects heritage site, date, tickets
     → POST /api/bookings
     → Booking created with paymentStatus='pending'
     → User redirected to /booking/payment/[bookingId]
```

#### 2. Payment Initiation

```javascript
// Client-side (app/booking/payment/[id]/page.jsx)
1. Load Cashfree SDK from CDN
2. Call POST /api/payments/create-order
   - Server creates Cashfree order
   - Returns payment_session_id
3. Initialize Cashfree SDK
4. Open hosted checkout popup
```

#### 3. Payment Processing

```
User → Enters payment details in Cashfree popup
     → Cashfree processes payment
     → One of three callbacks triggered:
       - onPaymentSuccess: Redirect to confirmation
       - onPaymentFailure: Show error message
       - onClose: User cancelled
```

#### 4. Payment Verification

```javascript
// Server-side verification (two paths)

Path A - User-initiated (confirmation page):
1. GET /api/payments/verify?bookingReference=XXX
2. Fetch order status from Cashfree API
3. Verify payment success (PAID + SUCCESS)
4. Update booking status atomically
5. Generate QR ticket
6. Return verification result

Path B - Webhook (asynchronous):
1. POST /api/webhooks/cashfree (from Cashfree)
2. Verify webhook signature
3. Check idempotency (prevent duplicates)
4. Update booking status
5. Generate QR ticket
6. Return 200 OK
```

#### 5. Ticket Access

```
User → Views confirmation page
     → Clicks "View Digital Ticket"
     → /tickets/[reference]
     → Verify paymentStatus='completed'
     → Display QR ticket
```

---

## API Endpoints

### POST /api/payments/create-order

Creates a Cashfree payment order for a booking.

**Request:**
```json
{
  "bookingId": "673abc123def456789012345"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment order created successfully",
  "data": {
    "bookingId": "673abc123def456789012345",
    "bookingReference": "VIR-20261111-A1B2C3",
    "cashfreeOrderId": "ANVAYA-VIR-20261111-A1B2C3",
    "paymentSessionId": "session_abc123xyz",
    "orderAmount": 2540,
    "currency": "INR"
  }
}
```

**Error Codes:**
- `401`: Authentication required
- `403`: Unauthorized (not booking owner)
- `404`: Booking not found
- `400`: Payment already completed / Booking cancelled

---

### GET /api/payments/verify

Verifies payment status with Cashfree and updates booking.

**Query Parameters:**
- `bookingId` OR `bookingReference` (required)

**Response (Payment Completed):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "bookingReference": "VIR-20261111-A1B2C3",
    "paymentStatus": "completed",
    "bookingStatus": "confirmed",
    "paymentMethod": "card",
    "paymentAmount": 2540,
    "paymentTime": "2026-11-11T10:30:00.000Z",
    "cfPaymentId": "cf_123456789",
    "hasQrTicket": true,
    "ticketUrl": "/tickets/VIR-20261111-A1B2C3"
  }
}
```

**Response (Payment Pending):**
```json
{
  "success": true,
  "message": "Payment is still pending",
  "data": {
    "bookingReference": "VIR-20261111-A1B2C3",
    "paymentStatus": "pending",
    "bookingStatus": "pending",
    "orderStatus": "ACTIVE"
  }
}
```

---

### POST /api/webhooks/cashfree

Receives real-time payment notifications from Cashfree.

**Headers Required:**
- `x-webhook-signature`: Webhook signature
- `x-webhook-timestamp`: Timestamp
- `x-idempotency-key`: Unique event identifier

**Request Body:**
```json
{
  "type": "PAYMENT_SUCCESS_WEBHOOK",
  "data": {
    "order": {
      "order_id": "ANVAYA-VIR-20261111-A1B2C3",
      "order_amount": 2540,
      "order_status": "PAID"
    },
    "payment": {
      "cf_payment_id": "cf_123456789",
      "payment_status": "SUCCESS",
      "payment_amount": 2540,
      "payment_time": "2026-11-11T10:30:00.000Z",
      "payment_group": "card",
      "bank_reference": "BNK123456"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "bookingReference": "VIR-20261111-A1B2C3"
}
```

**Security:**
- Signature verification prevents forged requests
- Idempotency prevents duplicate processing
- Always returns 200 (prevent Cashfree retries on internal errors)

---

## Webhook Integration

### Configuring Webhooks

1. Go to Cashfree Dashboard > Developers > Webhooks
2. Click "Add Webhook Endpoint"
3. Enter webhook URL: `https://your-domain.com/api/webhooks/cashfree`
4. Select events:
   - `PAYMENT_SUCCESS_WEBHOOK`
   - `PAYMENT_FAILED_WEBHOOK`
   - `PAYMENT_USER_DROPPED_WEBHOOK`
5. Copy the **Signing Secret**
6. Add to `.env.local` as `CASHFREE_WEBHOOK_SECRET`

### Webhook Events

| Event | Description | Booking Action |
|-------|-------------|----------------|
| `PAYMENT_SUCCESS_WEBHOOK` | Payment completed successfully | Set status to 'confirmed', generate QR ticket |
| `PAYMENT_FAILED_WEBHOOK` | Payment failed | Set status to 'failed', store failure reason |
| `PAYMENT_USER_DROPPED_WEBHOOK` | User cancelled payment | Set status to 'cancelled' |

### Testing Webhooks Locally

Use **ngrok** to expose local server:

```bash
# Start ngrok
ngrok http 3000

# Update webhook URL in Cashfree Dashboard
https://your-ngrok-url.ngrok.io/api/webhooks/cashfree

# Monitor webhook logs
tail -f logs/webhooks.log
```

### Webhook Health Check

Test webhook endpoint:

```bash
curl http://localhost:3000/api/webhooks/cashfree
```

Response:
```json
{
  "success": true,
  "message": "Cashfree webhook endpoint is active",
  "endpoint": "/api/webhooks/cashfree",
  "methods": ["POST"]
}
```

---

## Testing Guide

### Test Credentials

#### Test Cards (Success Scenarios)

| Card Type | Card Number | Expiry | CVV | OTP | Result |
|-----------|-------------|--------|-----|-----|--------|
| Visa Debit | `4706 1312 1121 2123` | 03/2028 | 123 | 111000 | Success |
| Mastercard | `5555 2222 3333 4444` | 03/2028 | 123 | 111000 | Success |
| Visa Credit | `4444 3333 2222 1111` | 03/2028 | 123 | 111000 | Success |

#### Test UPI

| VPA | Result |
|-----|--------|
| `testsuccess@gocash` | Payment Success |
| `testfailure@gocash` | Payment Failure |
| `testdeclineuser@gocash` | User Cancellation |
| `testexpired@gocash` | Session Timeout |

#### Test Netbanking

| Bank | Result |
|------|--------|
| TEST Bank (code: `TESTR`) | Success |

### Test Flow

1. **Create Booking**:
   ```bash
   # Login first
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}' \
     -c cookies.txt
   
   # Create booking
   curl -X POST http://localhost:3000/api/bookings \
     -H "Content-Type: application/json" \
     -b cookies.txt \
     -d '{
       "siteSlug": "taj-mahal",
       "visitDate": "2026-12-01",
       "slotId": "673abc...",
       "tickets": [{"category":"indianAdult","quantity":2}],
       "visitorDetails": {
         "primaryName": "Test User",
         "primaryEmail": "test@example.com",
         "primaryPhone": "9999999999"
       }
     }'
   ```

2. **Navigate to Payment Page**:
   ```
   http://localhost:3000/booking/payment/[bookingId]
   ```

3. **Use Test Card**:
   - Card: `4706 1312 1121 2123`
   - Expiry: `03/2028`
   - CVV: `123`
   - OTP: `111000`

4. **Verify Payment**:
   ```bash
   curl http://localhost:3000/api/payments/verify?bookingReference=VIR-... \
     -b cookies.txt
   ```

5. **Access Ticket**:
   ```
   http://localhost:3000/tickets/VIR-20261111-A1B2C3
   ```

---

## Error Handling

### Common Errors & Solutions

#### 1. "Cashfree SDK not loaded"

**Cause**: Network issue or script blocked  
**Solution**: Refresh page, check browser console

#### 2. "Failed to create payment order"

**Possible Causes**:
- Booking not found
- Payment already completed
- Booking cancelled
- Not booking owner

**Solution**: Check booking status, verify authentication

#### 3. "Payment verification failed"

**Cause**: Cashfree API timeout or error  
**Solution**: Retry verification, check Cashfree dashboard

#### 4. "Webhook signature verification failed"

**Cause**: Incorrect webhook secret or tampered request  
**Solution**: Verify `CASHFREE_WEBHOOK_SECRET` matches dashboard

#### 5. "QR ticket not generated"

**Cause**: Payment not completed or verification pending  
**Solution**: Refresh confirmation page, check payment status

### Error Response Format

All API endpoints follow consistent error format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details (development only)"
}
```

### User-Facing Error Messages

The UI displays contextual, actionable error messages:

- **Payment failed**: "Payment failed. Please try again or contact support."
- **Session expired**: "Payment session expired. Please retry payment."
- **Network error**: "Network error. Please check your connection and try again."
- **Unauthorized**: "Unauthorized access. Please login and try again."

---

## Troubleshooting

### Debug Checklist

1. **Environment Variables**
   ```bash
   # Verify all variables are set
   echo $CASHFREE_CLIENT_ID
   echo $CASHFREE_CLIENT_SECRET
   echo $CASHFREE_ENV
   ```

2. **Cashfree SDK Loading**
   ```javascript
   // Check browser console
   console.log(window.Cashfree);
   ```

3. **API Logs**
   ```bash
   # Check server logs for errors
   npm run dev
   # Look for "Payment order created" or error messages
   ```

4. **Webhook Delivery**
   ```bash
   # Check Cashfree Dashboard > Webhooks > Logs
   # Verify delivery status and response codes
   ```

5. **Database State**
   ```javascript
   // Check booking document
   db.bookings.findOne({ bookingReference: "VIR-..." })
   ```

### Common Issues

#### "Environment validation failed"

**Fix**: Ensure `CASHFREE_ENV=SANDBOX` in `.env.local`

#### "Production credentials detected"

**Fix**: Use TEST credentials only, ensure CLIENT_ID starts with "TEST"

#### Webhook not received

**Fixes**:
1. Verify webhook URL is accessible (use ngrok for local testing)
2. Check Cashfree Dashboard > Webhooks > Logs for delivery attempts
3. Ensure endpoint returns 200 status code
4. Verify signature verification is not failing

#### Payment stuck in "pending"

**Fixes**:
1. Click "Refresh Status" on confirmation page
2. Check Cashfree Dashboard for order status
3. Manually call `/api/payments/verify`
4. Check webhook logs for missed events

---

## Future Enhancements

### Planned Features

1. **Automatic Payment Retry** - Retry failed payments automatically
2. **Partial Refunds** - Support cancellation with refunds
3. **Multiple Payment Methods** - Add wallet, BNPL options
4. **Payment Analytics** - Dashboard with payment metrics
5. **Subscription Plans** - Recurring payments for memberships
6. **Split Payments** - Group bookings with split billing
7. **Dynamic Pricing** - Surge pricing based on demand
8. **Currency Support** - Multi-currency for international tourists

### Migration to Production

**When ready for production:**

1. **Get Live Credentials**:
   - Apply for live account activation in Cashfree Dashboard
   - Complete KYC verification
   - Get live API keys

2. **Update Configuration**:
   ```bash
   CASHFREE_ENV=PRODUCTION
   CASHFREE_CLIENT_ID=<live_client_id>
   CASHFREE_CLIENT_SECRET=<live_client_secret>
   ```

3. **Remove Sandbox Enforcement**:
   - Update `lib/env-validator.js` to allow PRODUCTION
   - Update `lib/cashfree.js` to use `Cashfree.PRODUCTION`
   - Remove test mode notices from UI

4. **Security Audit**:
   - Penetration testing
   - PCI-DSS compliance review
   - Legal compliance check

5. **Monitoring Setup**:
   - Error tracking (Sentry)
   - Payment analytics
   - Webhook monitoring
   - Alert system for failed payments

---

## Support & Resources

### Documentation

- [Cashfree Official Docs](https://docs.cashfree.com/)
- [Node.js SDK GitHub](https://github.com/cashfree/cashfree-pg-sdk-nodejs)
- [API Reference](https://docs.cashfree.com/reference)
- [Webhook Guide](https://docs.cashfree.com/docs/webhooks)

### Support Channels

- **Cashfree Support**: support@cashfree.com
- **Dashboard**: [https://merchant.cashfree.com/](https://merchant.cashfree.com/)
- **Dev Community**: [Cashfree Developers](https://community.cashfree.com/)

### Internal Documentation

- `lib/cashfree.js` - SDK wrapper and utility functions
- `lib/env-validator.js` - Environment validation
- `models/Booking.js` - Database schema
- API endpoints have inline JSDoc documentation

---

## Changelog

### Version 1.0.0 (November 11, 2026)

**Added:**
- Initial Cashfree Payment Gateway integration
- Sandbox environment support
- Hosted checkout implementation
- Server-side payment verification
- Webhook signature verification
- Idempotent event processing
- QR ticket generation after verified payment
- Comprehensive error handling
- Test mode UI with test credentials
- Payment status polling
- Multiple payment scenarios (success/failure/cancellation)

**Security:**
- SANDBOX-only enforcement
- Production endpoint blocking
- Authentication & authorization
- Webhook signature verification
- Idempotency for safe retries
- Atomic database updates

**Testing:**
- Test card numbers documented
- Test UPI addresses provided
- Webhook testing guide
- Local development setup

---

## License

This integration is part of the ANVAYA heritage tourism platform and follows the same license as the main application.

**IMPORTANT**: This integration is configured for SANDBOX testing only. Do not use in production without proper security audit and compliance verification.

---

## Appendix

### Status Mappings

#### Cashfree Order Status → ANVAYA Booking Status

| Cashfree Order Status | ANVAYA Payment Status | ANVAYA Booking Status |
|----------------------|----------------------|----------------------|
| `ACTIVE` | `pending` | `pending` |
| `PAID` | `completed` | `confirmed` |
| `EXPIRED` | `expired` | `failed` |

#### Cashfree Payment Status → ANVAYA Payment Status

| Cashfree Payment Status | ANVAYA Payment Status |
|------------------------|----------------------|
| `SUCCESS` | `completed` |
| `FAILED` | `failed` |
| `USER_DROPPED` | `cancelled` |
| `CANCELLED` | `cancelled` |
| `PENDING` | `pending` |
| `NOT_ATTEMPTED` | `pending` |

### File Structure

```
ANVAYA/
├── app/
│   ├── api/
│   │   ├── payments/
│   │   │   ├── create-order/route.js
│   │   │   └── verify/route.js
│   │   └── webhooks/
│   │       └── cashfree/route.js
│   ├── booking/
│   │   ├── payment/[id]/page.jsx
│   │   └── confirmation/[reference]/page.jsx
│   └── tickets/[reference]/page.jsx
├── lib/
│   ├── cashfree.js
│   ├── env-validator.js
│   └── tickets.js
├── models/
│   └── Booking.js
├── .env.example
├── .env.local
└── PAYMENT_INTEGRATION.md
```

---

**End of Documentation**
