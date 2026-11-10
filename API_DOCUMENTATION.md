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

### 3.4 Bookings Module

#### `POST /api/bookings`
- **Purpose:** Atomically reserves ticket passes for a selected site, date, and slot.
- **Auth:** Requires authenticated user (`visitor` or `admin`).
- **Request Body:**
  ```json
  {
    "siteId": "6730a1b2c3d4e5f6a7b8c9d1",
    "timeSlotId": "6730a1b2c3d4e5f6a7b8c9d2",
    "visitDate": "2026-11-15",
    "visitorDetails": [
      { "name": "Aarav Sharma", "age": 28, "gender": "male", "category": "indianAdult" },
      { "name": "Pooja Sharma", "age": 26, "gender": "female", "category": "indianAdult" }
    ]
  }
  ```
- **Responses:**
  - `201 Created`:
    ```json
    {
      "success": true,
      "data": {
        "bookingReference": "HST-2026-4B8K",
        "siteName": "Taj Mahal",
        "visitDate": "2026-11-15",
        "timeSlot": "06:00 - 08:00",
        "visitorsCount": 2,
        "totalAmount": 100,
        "qrCodeData": "HST-2026-4B8K|6730a1b2c3d4e5f6a7b8c9d1|2|CONFIRMED",
        "status": "confirmed"
      },
      "message": "Ticket booking confirmed successfully."
    }
    ```
  - `409 Conflict`:
    ```json
    {
      "success": false,
      "error": {
        "code": "SLOT_CAPACITY_EXCEEDED",
        "message": "The selected time slot does not have sufficient available seats."
      }
    }
    ```

#### `GET /api/bookings`
- **Purpose:** If visitor, returns visitor's personal bookings. If admin, returns all bookings with filter options.
- **Auth:** Requires authentication.

#### `GET /api/bookings/[id]`
- **Purpose:** Retrieves full digital ticket details, QR string, and passenger manifest.
- **Auth:** Booking owner or `admin`.

#### `PATCH /api/bookings/[id]`
- **Purpose:** Visitor cancels booking prior to visit date. Releases reserved capacity back to `timeSlots` atomically (`bookedCount - N`, `availableCount + N`).
- **Auth:** Booking owner or `admin`.

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
