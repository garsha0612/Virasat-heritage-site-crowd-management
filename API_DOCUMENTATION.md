# REST API Architecture & Endpoint Specification
## Next.js App Router Route Handlers (`app/api/**/route.js`)

---

### Document Overview
- **Protocol:** HTTP/1.1 & HTTP/2 over TLS (HTTPS)
- **Data Exchange Format:** `application/json`
- **Architectural Style:** RESTful Resource-Oriented Architecture
- **Authentication Standard:** JSON Web Token (JWT) in HTTP-only, Secure Cookies (`token`) or `Authorization: Bearer <token>`
- **Standard Response Envelope:** Uniform JSON contract across all success and error responses.

---

## 1. Global API Standards & Response Envelope

Every endpoint adheres to a unified payload envelope, simplifying client parsing and error boundary handling.

### Success Response Envelope (`HTTP 200 / 201`)
```json
{
  "success": true,
  "data": { ... },
  "message": "Descriptive confirmation string",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### Error Response Envelope (`HTTP 4xx / 5xx`)
```json
{
  "success": false,
  "error": {
    "code": "CAPACITY_EXCEEDED",
    "message": "The selected time slot has insufficient capacity for 4 visitors.",
    "details": [
      { "field": "visitorsCount", "issue": "Only 2 tickets remain." }
    ]
  }
}
```

---

## 2. Authentication & Authorization Matrix

| Endpoint | Method | Purpose | Auth Required | Role Allowed |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Register a new tourist account | No | Public |
| `/api/auth/login` | `POST` | Authenticate user & issue cookie | No | Public |
| `/api/auth/logout` | `POST` | Clear session cookie | Yes | Any Authenticated |
| `/api/auth/me` | `GET` | Fetch authenticated user profile | Yes | Any Authenticated |
| `/api/sites` | `GET` | List all heritage sites with filters | No | Public |
| `/api/sites` | `POST` | Create a new heritage destination | Yes | `admin` |
| `/api/sites/[slug]` | `GET` | Get detailed site dossier by slug | No | Public |
| `/api/sites/[id]` | `PATCH` | Update site rules/pricing/capacity | Yes | `admin` |
| `/api/sites/[id]` | `DELETE`| Archive / decommission site | Yes | `admin` |
| `/api/bookings` | `GET` | Retrieve user booking history | Yes | `visitor`, `admin` |
| `/api/bookings` | `POST` | Atomically reserve tickets | Yes | `visitor`, `admin` |
| `/api/bookings/[id]` | `GET` | Get digital ticket & QR payload | Yes | Owner or `admin` |
| `/api/bookings/[id]` | `PATCH` | Cancel booking & release quota | Yes | Owner or `admin` |
| `/api/bookings/[id]` | `DELETE`| Hard purge booking record | Yes | `admin` |
| `/api/slots` | `GET` | Query available time slots by date | No | Public |
| `/api/slots` | `POST` | Generate daily slot matrix | Yes | `admin` |
| `/api/slots/[id]` | `PATCH` | Adjust slot capacity or blackout | Yes | `admin` |
| `/api/crowd/[siteId]` | `GET` | Real-time crowd occupancy gauge | No | Public |
| `/api/crowd/check-in` | `POST` | Turnstile ingress QR scan event | Yes | `admin`, `staff` |
| `/api/crowd/check-out`| `POST` | Turnstile egress scan event | Yes | `admin`, `staff` |
| `/api/crowd/statistics`| `GET` | Historical hourly density curves | No | Public / Admin |
| `/api/admin/dashboard`| `GET` | High-level operations analytics | Yes | `admin` |
| `/api/admin/bookings` | `GET` | Master booking registry with search| Yes | `admin` |
| `/api/admin/sites` | `GET` | Monument capacity & health table | Yes | `admin` |

---

## 3. Endpoints Specification

### 3.1 Authentication Module

#### `POST /api/auth/register`
- **Purpose:** Registers a new tourist or visitor.
- **Request Body:**
  ```json
  {
    "name": "Aarav Sharma",
    "email": "aarav.sharma@example.com",
    "password": "SecurePassword123!",
    "phone": "+919876543210",
    "nationality": "Indian"
  }
  ```
- **Responses:**
  - `201 Created`: User created. Sets `token` HTTP-only cookie.
  - `400 Bad Request`: Validation failure (e.g. invalid email format, short password).
  - `409 Conflict`: Email already registered.

#### `POST /api/auth/login`
- **Purpose:** Authenticates user credentials and issues signed JWT session cookie.
- **Request Body:**
  ```json
  {
    "email": "aarav.sharma@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "user": {
          "id": "6730a1b2c3d4e5f6a7b8c9d0",
          "name": "Aarav Sharma",
          "email": "aarav.sharma@example.com",
          "role": "visitor"
        }
      },
      "message": "Login successful"
    }
    ```
  - `401 Unauthorized`: Invalid email or password.

#### `POST /api/auth/logout`
- **Purpose:** Invalidates session by setting cookie expiry to past epoch.
- **Responses:**
  - `200 OK`: `{ "success": true, "message": "Logged out successfully" }`

#### `GET /api/auth/me`
- **Purpose:** Fetches current user session profile.
- **Headers:** Automatically sends `token` cookie.
- **Responses:**
  - `200 OK`: Returns authenticated user document (without password hash).
  - `401 Unauthorized`: No active session or expired token.

---

### 3.2 Heritage Sites Module

#### `GET /api/sites`
- **Purpose:** Retrieves paginated list of heritage sites with optional text search, city filter, and crowd status.
- **Query Parameters:**
  - `search` *(optional)*: Text string (e.g. `"Taj"`)
  - `city` *(optional)*: Filter by city (e.g. `"Agra"`)
  - `state` *(optional)*: Filter by state (e.g. `"Delhi"`)
  - `page` *(optional, default 1)*: Page number
  - `limit` *(optional, default 9)*: Items per page
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "6730a1b2c3d4e5f6a7b8c9d1",
        "name": "Taj Mahal",
        "slug": "taj-mahal",
        "shortDescription": "An immense mausoleum of white marble, built in Agra between 1631 and 1648.",
        "location": { "city": "Agra", "state": "Uttar Pradesh", "country": "India" },
        "heroImage": "https://heritage-site-media.s3.amazonaws.com/sites/taj_mahal_hero.webp",
        "ticketPricing": { "indianAdult": 50, "foreignerAdult": 1100, "student": 25 },
        "visitingHours": { "openingTime": "06:00", "closingTime": "18:30" },
        "maxCapacity": 5000,
        "currentVisitors": 1820,
        "occupancyPercentage": 36.4,
        "crowdCategory": "low",
        "status": "active"
      }
    ],
    "meta": { "page": 1, "limit": 9, "total": 1, "totalPages": 1 }
  }
  ```

#### `GET /api/sites/[slug]`
- **Purpose:** Retrieves complete historical overview, visiting guidelines, image gallery, and live crowd status for a monument.
- **URL Parameter:** `slug` (e.g. `taj-mahal`, `red-fort-delhi`, `qutub-minar`)
- **Responses:**
  - `200 OK`: Complete monument document.
  - `404 Not Found`: Site slug does not exist.

#### `POST /api/sites`
- **Purpose:** Allows administrators to register a new monument.
- **Auth:** Requires `admin` role.
- **Request Body:** Complete `heritageSite` schema payload.
- **Responses:**
  - `201 Created`: Document created.
  - `403 Forbidden`: Authenticated user is not an administrator.

#### `PATCH /api/sites/[id]`
- **Purpose:** Updates monument details, capacity, visiting hours, or ticket rates.
- **Auth:** Requires `admin` role.
- **URL Parameter:** `id` (MongoDB ObjectId)
- **Responses:**
  - `200 OK`: Updated site document.
  - `404 Not Found`: Site not found.

#### `DELETE /api/sites/[id]`
- **Purpose:** Deactivates or removes a site from the directory.
- **Auth:** Requires `admin` role.

---

### 3.3 Time Slots Module

#### `GET /api/slots`
- **Purpose:** Retrieves all time slots for a specified monument and calendar date.
- **Query Parameters:**
  - `siteId` *(required)*: MongoDB ObjectId of monument
  - `date` *(required)*: Date in `YYYY-MM-DD` format
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "6730a1b2c3d4e5f6a7b8c9d2",
        "siteId": "6730a1b2c3d4e5f6a7b8c9d1",
        "date": "2026-11-15",
        "startTime": "06:00",
        "endTime": "08:00",
        "capacity": 500,
        "bookedCount": 120,
        "availableCount": 380,
        "isAvailable": true
      },
      {
        "_id": "6730a1b2c3d4e5f6a7b8c9d3",
        "siteId": "6730a1b2c3d4e5f6a7b8c9d1",
        "date": "2026-11-15",
        "startTime": "10:00",
        "endTime": "12:00",
        "capacity": 500,
        "bookedCount": 500,
        "availableCount": 0,
        "isAvailable": false
      }
    ]
  }
  ```

#### `POST /api/slots`
- **Purpose:** Admin batch utility to generate 2-hour slots for a site across a date range.
- **Auth:** Requires `admin` role.

#### `PATCH /api/slots/[id]`
- **Purpose:** Modifies an individual slot's capacity or marks `isActive = false` in case of VIP closures or bad weather.
- **Auth:** Requires `admin` role.

---

### 3.4 Bookings & Ticket Reservation Module (Phase 5)

#### `POST /api/bookings`
- **Purpose:** Atomically reserves time slot capacity and creates a booking record inside a single MongoDB ACID transaction.
- **Auth:** Requires authenticated visitor (`token` cookie).
- **Request Headers:**
  - `Content-Type: application/json`
  - `x-idempotency-key` (Optional): Unique idempotency key to prevent duplicate booking creation.
- **Request Body:**
  ```json
  {
    "siteSlug": "taj-mahal",
    "visitDate": "2026-12-30",
    "slotId": "6730a1b2c3d4e5f6a7b8c9d2",
    "includeMausoleum": true,
    "tickets": [
      { "category": "indianAdult", "quantity": 2 },
      { "category": "child", "quantity": 1 }
    ],
    "visitorDetails": {
      "primaryName": "Aarav Sharma",
      "primaryEmail": "aarav.sharma@example.com",
      "primaryPhone": "+919876543210",
      "nationality": "Indian"
    },
    "idempotencyKey": "opt-client-key-12345"
  }
  ```
- **Responses:**
  - `201 Created`: Booking created with status `pending` (awaits mock payment).
  - `200 OK`: Idempotent replay returned if duplicate request was sent with the same `idempotencyKey`.
  - `400 Bad Request`: Input validation failed, past date, or exceeds 10 tickets per order.
  - `409 Conflict`: Insufficient slot capacity; returns `remainingCapacity`.
  - `503 Service Unavailable`: Standalone MongoDB without replica set transaction support detected.

#### `GET /api/bookings`
- **Purpose:** Retrieves booking dossier history for the authenticated visitor.
- **Auth:** Requires authenticated user.
- **Response `200 OK`:** Returns array of bookings ordered by `createdAt` descending.

#### `GET /api/bookings/[id]`
- **Purpose:** Retrieves full booking dossier, ticket code, and digital QR pass.
- **Param:** MongoDB `_id` or human-readable `bookingReference` (e.g., `VIR-20261230-A1B2C3`).
- **Auth:** Booking owner or administrator. Returns `403 Forbidden` for cross-user requests.

#### `POST /api/bookings/[id]/cancel`
- **Purpose:** Atomically transitions booking status to `cancelled`, releases reserved slot capacity, and calculates simulated refund in a single ACID transaction.
- **Auth:** Booking owner or administrator.
- **Request Body:** `{ "reason": "Travel itinerary change" }`
- **Responses:**
  - `200 OK`: Booking cancelled, capacity released back to slot.
  - `400 Bad Request`: Already cancelled or invalid state.
  - `403 Forbidden`: Unauthorized user.

#### `POST /api/payments/mock`
- **Purpose:** Simulates payment gateway processing (Razorpay/UPI simulation). Confirms reservation, marks `paymentStatus = 'paid'`, and generates scannable digital entry pass.
- **Auth:** Booking owner or administrator.
- **Request Body:**
  ```json
  {
    "bookingId": "6730a1b2c3d4e5f6a7b8c9d1",
    "paymentMethod": "mock_upi",
    "simulateFailure": false
  }
  ```
- **Responses:**
  - `200 OK`: Booking confirmed, ticket security code (`TKT-...`) and base64 PNG QR code generated.
  - `400 Bad Request`: Already paid (`ALREADY_PAID`) or cancelled reservation.

#### `POST /api/bookings/[id]/regenerate-qr`
- **Purpose:** Idempotently generates or regenerates the digital QR pass for a confirmed and paid booking if initial generation was interrupted, without requiring a second payment.
- **Auth:** Booking owner or administrator.

#### `GET /api/availability`
- **Purpose:** Retrieves available demonstration time slots and capacity for a heritage site on a specific date. Auto-seeds 4 demonstration intervals if unseeded.
- **Query Params:** `?siteSlug=taj-mahal&date=2026-12-30`
- **Response `200 OK`:** Returns list of slots with `capacity`, `reservedCount`, `remainingCapacity`, and `isSimulatedSchedule: true`.

---

### 3.5 Crowd Management Module

#### `GET /api/crowd/[siteId]`
- **Purpose:** Provides current instantaneous crowd occupancy and classified density level.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "siteId": "6730a1b2c3d4e5f6a7b8c9d1",
      "siteName": "Taj Mahal",
      "currentVisitors": 1820,
      "maxCapacity": 5000,
      "occupancyPercentage": 36.4,
      "crowdCategory": "low",
      "recommendedAction": "Optimal time for photography and relaxed monument exploration.",
      "isSimulated": true,
      "lastUpdated": "2026-11-09T18:00:00.000Z"
    }
  }
  ```

#### `POST /api/crowd/check-in`
- **Purpose:** Invoked by entry gate scanner staff or simulator when a visitor scans their digital pass.
- **Auth:** Requires `admin` or `staff` role.
- **Request Body:**
  ```json
  {
    "bookingReference": "HST-2026-4B8K",
    "gateId": "GATE_NORTH_TURNSTILE_01"
  }
  ```
- **Execution:**
  1. Validates `bookingReference` exists, date matches today, and status is `confirmed`.
  2. Ensures visitor is not already `checked_in`.
  3. Updates booking: `checkInStatus = 'checked_in'`, `checkInTime = Date.now()`.
  4. Atomically increments `currentVisitors` on `HeritageSite` by `visitorsCount`.
- **Response `200 OK`:** Valid entry permit confirmed.

#### `POST /api/crowd/check-out`
- **Purpose:** Invoked when visitors pass through the exit turnstiles.
- **Auth:** Requires `admin` or `staff` role.
- **Request Body:** `{ "bookingReference": "HST-2026-4B8K" }` or batch exit counter `{ "siteId": "...", "count": 1 }`.
- **Execution:** Decrements site `currentVisitors` atomically (`Math.max(0, current - count)`).

#### `GET /api/crowd/statistics`
- **Purpose:** Serves historical time-series data for Recharts graphs.
- **Query Parameters:**
  - `siteId`: Target site
  - `date`: Query date (defaults to today)
  - `range`: `'today'`, `'week'`, `'month'`
- **Response `200 OK`:** Array of hourly data points (`hour`, `visitorCount`, `occupancyPercentage`, `entryCount`, `exitCount`).

---

### 3.6 Administration Module

#### `GET /api/admin/dashboard`
- **Purpose:** Delivers high-level KPI cards and operational summaries for curators.
- **Auth:** Requires `admin` role.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "summary": {
        "totalDestinations": 12,
        "totalActiveVisitorsRightNow": 6480,
        "totalBookingsToday": 1420,
        "totalRevenueToday": 348500,
        "sitesNearCapacityWarning": [
          { "name": "Qutub Minar", "occupancy": 88.5 }
        ]
      },
      "hourlyDistribution": [ ... ],
      "recentBookings": [ ... ]
    }
  }
  ```

#### `GET /api/admin/bookings`
- **Purpose:** Searchable and filterable master booking registry for audits and verification.
- **Auth:** Requires `admin` role.

#### `GET /api/admin/sites`
- **Purpose:** Monument management list with quick toggle actions for capacity and closures.
- **Auth:** Requires `admin` role.

---

## 4. Phase 5 Implemented Ticketing & Booking Endpoints

The following endpoints represent the active, production-verified Phase 5 Booking & Reservation implementation:

### 4.1 `GET /api/availability`
- **Purpose:** Queries real-time time slot availability and capacity for a destination on a given date. Automatically seeds 4 daily time-slots if they do not yet exist.
- **Academic Simulation Disclaimer:** Time slot intervals and interval quotas are ANVAYA demonstration parameters modeling staggered visitor ingress and crowd smoothing. They are not official statutory ASI turnstile rules.
- **Query Parameters:**
  - `site` or `siteSlug` *(required)*: e.g. `'taj-mahal'`, `'red-fort'`
  - `date` *(required)*: Format `YYYY-MM-DD` (cannot be in the past)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "site": { "slug": "taj-mahal", "name": "Taj Mahal", "location": "Agra", "state": "Uttar Pradesh" },
      "date": "2026-11-15",
      "isSimulatedSchedule": true,
      "notice": "ANVAYA Demonstration Schedule: Time intervals and slot quotas model crowd smoothing algorithms and do not represent statutory ASI turnstile designations.",
      "slots": [
        {
          "id": "6730a1b2c3d4e5f6a7b8c9d1",
          "startTime": "06:00",
          "endTime": "09:00",
          "slotLabel": "Morning Window 1 (06:00 AM – 09:00 AM) [Demo Simulation]",
          "capacity": 3500,
          "reservedCount": 0,
          "remainingCapacity": 3500,
          "occupancyPercentage": 0,
          "isFullyBooked": false,
          "isAvailable": true
        }
      ]
    }
  }
  ```

### 4.2 `POST /api/bookings`
- **Purpose:** Creates a pending reservation and atomically reserves slot capacity. Recalculates itemized totals entirely on the server using official destination tariffs and add-ons to defeat client price tampering.
- **Consistency Architecture:** Employs a dual-consistency model. On MongoDB replica sets (Atlas/Cluster), uses multi-document ACID transactions. On standalone local MongoDB instances, utilizes atomic conditional `$expr` reservations paired with an idempotent compensating rollback (`compensateSlotReservation`) on document insertion failure.
- **Auth:** Requires authenticated visitor or admin session.
- **Request Body:**
  ```json
  {
    "siteSlug": "taj-mahal",
    "visitDate": "2026-11-15",
    "slotId": "6730a1b2c3d4e5f6a7b8c9d1",
    "includeMausoleum": true,
    "tickets": [
      { "category": "indianAdult", "quantity": 2 },
      { "category": "saarcBimstec", "quantity": 1 },
      { "category": "child", "quantity": 1 }
    ],
    "visitorDetails": {
      "primaryName": "Arjun Kapoor",
      "primaryEmail": "arjun.kapoor@anvaya.test",
      "primaryPhone": "+919811122233",
      "nationality": "Indian"
    }
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "message": "Reservation initiated successfully. Please complete simulated payment to confirm your pass.",
    "data": {
      "bookingId": "6730a1b2c3d4e5f6a7b8c9d9",
      "bookingReference": "VIR-20261115-9A4F2C",
      "totalAmount": 1240,
      "totalTickets": 4,
      "currency": "INR",
      "checkoutUrl": "/booking/payment/6730a1b2c3d4e5f6a7b8c9d9"
    }
  }
  ```
- **Response `409 Conflict`:** Capacity exceeded during concurrent booking attempt.

### 4.3 `GET /api/bookings`
- **Purpose:** Returns authenticated visitor's personal bookings sorted newest first (`createdAt: -1`).
- **Auth:** Requires authenticated session.

### 4.4 `GET /api/bookings/[id]`
- **Purpose:** Retrieves full booking dossier and scannable digital entry pass. Supports lookup by either MongoDB `_id` or human-readable `bookingReference`.
- **Auth:** Verified owner (`booking.user === session.id`) or `admin`. Non-owners receive `403 Forbidden`.

### 4.5 `POST /api/bookings/[id]/cancel`
- **Purpose:** Cancels a reservation, transitions status to `'cancelled'`, marks refund status as `'simulated_refund_processed'`, and atomically releases reserved capacity back to the slot inventory via `releaseSlotCapacity`.
- **Atomic Guard:** Employs conditional update `findOneAndUpdate({ _id, bookingStatus: { $in: ['pending', 'confirmed'] } })` to guarantee capacity is released exactly once and duplicate/racing cancellation attempts are rejected with HTTP 400.
- **Auth:** Verified owner or `admin`.

### 4.6 `POST /api/payments/mock`
- **Purpose:** Processes simulated payment for a pending reservation. Prevents double-payments and blocks payments on cancelled bookings.
- **Concurrency & Race Guard:** Uses atomic conditional update `findOneAndUpdate({ _id, bookingStatus: 'pending', paymentStatus: { $ne: 'paid' } })` to defeat racing cancellations.
- **Payload:** `{ bookingId, paymentMethod: "mock_upi" | "mock_card" | "mock_netbanking", simulateOutcome: "success" | "failure" }`
- **Outcome `success`:** Transitions booking to `'confirmed'` and `paymentStatus: 'paid'`, generates unique turnstile `ticketCode` (`TKT-YYYYMMDD-XXXXXXXX`), and creates high-resolution scannable PNG QR code data URL. If QR generation fails during payment, the confirmed payment is preserved and QR code is queued for retryable recovery without re-payment.

### 4.7 `POST /api/bookings/[id]/regenerate-qr`
- **Purpose:** Generates or recovers the digital QR entry pass for confirmed and paid bookings where QR generation was interrupted or deferred, without requiring another payment.
- **Auth:** Verified owner or `admin`.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Digital QR entry pass generated successfully.",
    "data": {
      "booking": {
        "id": "6730a1b2c3d4e5f6a7b8c9d9",
        "bookingReference": "VIR-20261115-9A4F2C",
        "ticketCode": "TKT-20261115-A1B2C3D4",
        "qrCodeDataUrl": "data:image/png;base64,...",
        "bookingStatus": "confirmed",
        "paymentStatus": "paid"
      },
      "regenerated": true
    }
  }
  ```

---

## 5. Administrative API Endpoints (Phase 6)

All administrative endpoints require an authenticated session with `role === 'admin'`. Edge middleware and server-side `requireAdmin` reject unauthorized requests with `401 Unauthorized` or `403 Forbidden`.

### 5.1 `GET /api/admin/overview`
- **Purpose:** Returns real-time MongoDB KPI metrics and aggregated Recharts telemetry.
- **Query Parameters:** `range=7d | 30d | 90d | all` (default: `30d`).
- **Data Returned:**
  - `metrics`: `{ totalSites, totalVisitors, totalBookings, confirmedBookings, pendingBookings, cancelledBookings, totalRevenue, todayBookings, upcomingVisits }`
  - `charts`: `{ bookingTrends, bookingsBySite, statusDistribution, visitorActivity }`
  - `recentBookings`: Array of last 5 transactions for quick feed.

### 5.2 `GET /api/admin/sites`
- **Purpose:** Lists all heritage monuments with search, filtering by state/category, sorting, and dependent booking/slot counts.
- **Query Parameters:** `search`, `state`, `category`, `isActive`, `sortBy`, `sortOrder`.

### 5.3 `POST /api/admin/sites`
- **Purpose:** Creates a new heritage monument entry with strict Zod validation. Enforces slug uniqueness (`SLUG_EXISTS`).

### 5.4 `GET /api/admin/sites/[id]`
- **Purpose:** Retrieves complete monument dossier with operational statistics (active slot count, total bookings).

### 5.5 `PUT /api/admin/sites/[id]`
- **Purpose:** Updates existing monument details, official ASI tariffs, visiting hours, or coordinates.

### 5.6 `PATCH /api/admin/sites/[id]/toggle-status`
- **Purpose:** Toggles the `isActive` state of a monument without affecting historical bookings or audit logs.

### 5.7 `DELETE /api/admin/sites/[id]`
- **Purpose:** Safely removes an unused monument.
- **Safety Invariant:** If dependent bookings or reserved slots exist, rejects with `409 Conflict` (`CANNOT_DELETE_ACTIVE_RECORDS`) and instructs the curator to deactivate instead.

### 5.8 `GET /api/admin/bookings`
- **Purpose:** Queries bookings with pagination, search (Reference, visitor name, email, phone), site filter, booking status filter, and payment status filter.

### 5.9 `GET /api/admin/bookings/[id]`
- **Purpose:** Retrieves complete booking dossier with digital pass verification, itemized tariffs, and audit timestamps.

### 5.10 `POST /api/admin/bookings/[id]/cancel`
- **Purpose:** Executes administrative cancellation using a native MongoDB ACID transaction, restoring reserved slot capacity and logging supervisory reason.

### 5.11 `GET /api/admin/users`
- **Purpose:** Lists registered visitors with search, role filtering, and aggregated booking counts. Never exposes password hashes or tokens.

### 5.12 `GET /api/admin/users/[id]`
- **Purpose:** Retrieves visitor profile dossier and complete historical reservations list.

### 5.13 `PATCH /api/admin/users/[id]/toggle-status`
- **Purpose:** Toggles user `isActive` status.
- **Self-Deactivation Guard:** Administrators cannot suspend their own active account (`CANNOT_DEACTIVATE_SELF`).

### 5.14 `GET /api/admin/slots`
- **Purpose:** Retrieves time slots filtered by monument and calendar date.

### 5.15 `POST /api/admin/slots`
- **Purpose:** Creates a new demonstration booking window with carrying capacity. Enforces unique compound index `{ heritageSite, date, startTime }`.

### 5.16 `PATCH /api/admin/slots/[id]`
- **Purpose:** Modifies slot capacity or active status.
- **Capacity Floor Guard:** Strictly rejects any capacity update below already reserved ticket counts with `400 Bad Request` (`CAPACITY_LESS_THAN_RESERVED`).

### 5.17 `DELETE /api/admin/slots/[id]`
- **Purpose:** Deletes unreserved slot. If `reservedCount > 0`, rejects with `409 Conflict` (`CANNOT_DELETE_RESERVED_SLOT`).

### 5.18 `GET /api/admin/crowd`
- **Purpose:** Computes site-by-site crowd occupancy percentages, Low/Moderate/High classifications, peak hours, and today's slot occupancy. Includes mandatory simulation disclaimer.

### 5.19 `POST /api/admin/crowd`
- **Purpose:** Configures demonstration crowd thresholds (`lowMax`, `moderateMax`, `highMax`) and simulation multiplier.

### 5.20 `GET /api/admin/reports`
- **Purpose:** Aggregates financial intelligence (gross revenue, average order value, cancellation rate, daily timeline, site popularity) over specified date window.

### 5.21 `GET /api/admin/reports/export`
- **Purpose:** Generates audit-safe CSV export with formula injection escaping and PII protection.

### 5.22 `GET /api/admin/settings`
- **Purpose:** Retrieves administrator profile information and system specifications (MongoDB replica set name, Node.js version, Next.js framework).

### 5.23 `POST /api/admin/settings/password`
- **Purpose:** Rotates administrator password with current password verification and 12-round bcrypt hashing.

