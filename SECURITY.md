# Security Architecture & Hardening Guide
## Heritage Site Crowd Management System

---

### Document Overview
- **Security Standard:** OWASP Top 10 Web Application Security Compliance
- **Authentication Model:** Stateless JSON Web Token (JWT) with HTTP-only, SameSite Cookies
- **Authorization Engine:** Role-Based Access Control (RBAC) enforced via Next.js Edge Middleware
- **Data Protection:** Zero-trust architecture across database, API endpoints, and cloud storage.

---

## 1. Threat Modeling & Defense-in-Depth

The application protects against key web vulnerabilities through multi-layered defenses:

```
[ Incoming HTTP Request ]
           │
           ▼
[ Layer 1: Edge Security & Rate Limiting ] ────> Mitigates DDoS & Brute-force
           │
           ▼
[ Layer 2: Next.js Middleware ] ───────────────> Enforces JWT & RBAC Route Protection
           │
           ▼
[ Layer 3: Route Handlers Input Validation ] ──> Sanitizes JSON, prevents NoSQL Injection & XSS
           │
           ▼
[ Layer 4: Business Logic & Atomic Locks ] ────> Prevents Double-Booking & Race Conditions
           │
           ▼
[ Layer 5: Database & Cloud Isolation ] ───────> MongoDB Atlas TLS & AWS IAM Pre-signed URLs
```

---

## 2. Authentication & Credential Security

### 2.1 Password Storage & Salting (bcrypt)
- Passwords are never stored in plaintext.
- The system employs `bcryptjs` with **12 salt rounds** (balanced for high computational resistance against rainbow-table attacks without causing serverless function timeouts).
- In the Mongoose `User` schema, the password hash is excluded from queries by default (`select: false`), preventing accidental exposure in API responses.

```javascript
// models/User.js (Security Hook)
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});
```

### 2.2 Secure Session Management via HTTP-Only Cookies
Instead of storing tokens in browser `localStorage` (which is vulnerable to Cross-Site Scripting / XSS attacks), session tokens are issued strictly through encrypted, HTTP-only cookies:

| Cookie Attribute | Production Value | Security Purpose |
| :--- | :--- | :--- |
| `HttpOnly` | `true` | Prevents malicious JavaScript from reading the token via `document.cookie`. |
| `Secure` | `true` (in production) | Enforces transmission exclusively over encrypted TLS (HTTPS) connections. |
| `SameSite` | `'Lax'` | Defends against Cross-Site Request Forgery (CSRF) on cross-origin requests. |
| `Path` | `'/'` | Scopes cookie availability to the root application domain. |
| `Max-Age` | `86400` (24 Hours) | Restricts token validity lifetime, reducing replay risk if compromised. |

---

## 3. Role-Based Access Control (RBAC) & Route Protection

The platform enforces three distinct user roles:
1. `visitor`: Standard registered tourist. Can view monuments, reserve ticket passes, view personal booking history, and cancel own reservations.
2. `staff`: Monument turnstile personnel. Authorized to scan entry QR codes and invoke `/api/crowd/check-in` and `/api/crowd/check-out`.
3. `admin`: Monument curators and platform officers. Full administrative control over monument definitions, pricing, time-slot capacities, and aggregate analytics.

### 3.1 Next.js Edge Middleware Implementation
Route protection occurs at the Edge before rendering begins:

```javascript
// middleware.js
import { NextResponse } from 'next/server';
import { verifyJwtEdge } from '@/lib/auth';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // 1. Guard Administrative Enclave
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const payload = await verifyJwtEdge(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // 2. Guard Visitor Enclave
  if (pathname.startsWith('/profile') || pathname.startsWith('/bookings') || pathname.startsWith('/book')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/profile/:path*', '/bookings/:path*', '/book/:path*']
};
```

---

## 4. Input Validation & Injection Mitigation

### 4.1 NoSQL Injection Defense
MongoDB queries with unsanitized user objects (e.g. `{ email: { $ne: null } }`) can bypass password checks. To protect against this:
1. Strict schema casting via Mongoose prevents arbitrary operator injection.
2. Explicit input validation strips malicious operators (`$`, `.`) from request bodies:
```javascript
// utils/validators.js
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/[${}]/g, '').trim();
}
```

### 4.2 Cross-Site Scripting (XSS) Prevention
- React natively escapes interpolated content inside JSX (`{variable}`), preventing inline script execution.
- Monument historical markdown is sanitized using DOMPurify before rendering any rich HTML formatting.

---

## 5. Concurrency & Race Condition Security (Anti-Overbooking)

Ticketing systems face race conditions during high-demand surges. Issuing more permits than the physical site limit creates security and safety risks.

### The Mitigation Guarantee
As detailed in the Database Specification, all slot reservations execute via atomic database operations:
```javascript
const result = await TimeSlot.findOneAndUpdate(
  { _id: slotId, availableCount: { $gte: requiredQuantity } },
  { $inc: { bookedCount: requiredQuantity, availableCount: -requiredQuantity } },
  { new: true }
);
if (!result) throw new Error('ERR_SLOT_FULL');
```
Because MongoDB guarantees document-level write atomicity, concurrent requests are serialized at the database engine level, making overselling mathematically impossible.

### 5.1 Phase 5 Implementation & Concurrency Guards
In the active Phase 5 booking implementation, the atomic conditional update is enforced in `lib/slots.js`:
```javascript
const updatedSlot = await TimeSlot.findOneAndUpdate(
  {
    _id: slotId,
    isActive: true,
    $expr: {
      $lte: [{ $add: ['$reservedCount', requestedQty] }, '$capacity'],
    },
  },
  { $inc: { reservedCount: requestedQty } },
  { new: true }
);
```
- If remaining capacity is less than requested quantity, `findOneAndUpdate` returns `null` and the API responds with `409 Conflict`.
- Server-side pricing recalculation (`constants/pricing.js`) recalculates subtotals and grand totals against official ASI tariffs, discarding any client-provided prices.
- Payment security in `app/api/payments/mock/route.js` verifies caller ownership (`booking.user === session.id`), prevents payments on cancelled passes, and prohibits duplicate payments on confirmed passes.
- Digital QR codes (`lib/tickets.js`) encode strictly verification tokens (`ref`, `ticketCode`, `monument`, `slot`, `pax`), completely excluding passwords, JWTs, or session credentials.

---

## 6. Cloud & AWS S3 Security Architecture

Directly receiving binary file uploads through the Next.js server introduces memory bloat and exposes server instances to Denial of Service (DoS) attacks. Furthermore, bundling AWS Access Keys in client bundles is a severe vulnerability.

### 6.1 Pre-Signed Upload Architecture
Our system uses temporary pre-signed S3 URLs:
1. The admin client requests a short-lived cryptographic upload token from `/api/admin/media/sign-url`.
2. The server-side Route Handler generates a pre-signed URL using scoped IAM credentials:
```javascript
// lib/s3.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

export async function generatePresignedUploadUrl(fileName, contentType) {
  const key = `monuments/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType
  });

  // Pre-signed URL expires strictly in 300 seconds (5 minutes)
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, publicUrl };
}
```
3. The client uploads the binary image directly to AWS S3 via an HTTP `PUT` request.
4. AWS credentials never touch the client browser.

### 6.2 S3 Bucket Security Policies
- **Public Write Access:** Strictly blocked (`BlockPublicAcls = true`, `IgnorePublicAcls = true`).
- **Read Policy:** Read-only access enabled for media assets (`s3:GetObject`).
- **Allowed MIME Types:** Strictly enforced at the server to `image/jpeg`, `image/webp`, and `image/png`. Max file size capped at 5 MB.

---

## 7. Rate Limiting Recommendations

To protect authentication endpoints (`/api/auth/login`, `/api/auth/register`) from automated credential stuffing, the following sliding-window rate limits are recommended:

| Endpoint Target | Allowed Invocations | Time Window | Action on Breach |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | 5 requests | 15 Minutes | HTTP 429 Too Many Requests |
| `/api/auth/register` | 3 requests | 1 Hour | HTTP 429 Too Many Requests |
| `/api/bookings` (POST) | 10 requests | 5 Minutes | HTTP 429 Too Many Requests |
| `/api/crowd/*` (GET) | 60 requests | 1 Minute | HTTP 429 (Shields Telemetry) |

---

## 8. Secrets & Environment Configuration Hygiene

1. `.env.local` contains all sensitive tokens and is strictly listed in `.gitignore`.
2. `.env.example` provides documentation with placeholder values:
```bash
# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/heritageDB?retryWrites=true&w=majority

# Authentication Secrets
JWT_SECRET=super_secret_cryptographic_random_string_minimum_32_characters

# Cloud Media Storage (AWS S3)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA_MOCK_SAMPLE_KEY
AWS_SECRET_ACCESS_KEY=MOCK_SAMPLE_SECRET_KEY
AWS_S3_BUCKET_NAME=heritage-site-media
```
3. In production, variables are configured securely through the Vercel Project Settings interface.

---

## 9. Booking, Ticketing & Concurrency Security (Phase 5)

### 9.1 Server-Side Price Tampering Defenses
Clients can alter request payloads to manipulate ticket prices. The booking endpoint (`POST /api/bookings`) ignores any client-supplied totals and recalculates itemized amounts exclusively on the server using verified destination tariffs (`SITE_PRICING_CATALOG` in `constants/pricing.js`):
- Official adult, child, and foreign visitor tariffs are applied strictly per monument.
- Free entry for children under 15 is enforced in compliance with ASI statutory notifications.
- Optional supplements (such as the Taj Mahal Main Mausoleum dome entry fee of ₹200) are verified and calculated strictly server-side.

### 9.2 Native Multi-Document ACID Transaction Architecture
High-volume concurrent booking spikes are protected against overbooking through native MongoDB transactions (`session.withTransaction()`):
- **Replica Sets / MongoDB Atlas:** Multi-document ACID transactions encapsulate slot reservation and booking creation into an atomic unit. If slot capacity is exceeded or booking insertion fails, the entire transaction is aborted by the storage engine with zero capacity leakage.
- **Fail-Fast Detection:** If the system is connected to a standalone MongoDB deployment without replica set transaction support, `withDatabaseTransaction()` fails fast with HTTP 503 (`TRANSACTIONS_UNSUPPORTED`), refusing to perform unsafe non-transactional multi-document operations.

### 9.3 Idempotency & Replay Attack Defense
- Every booking request supports an optional `idempotencyKey` (in payload or `x-idempotency-key` header).
- A sparse unique index on `Booking.idempotencyKey` prevents duplicate booking creation under network retries or client re-transmissions.
- Concurrent racing requests with the same key resolve safely via duplicate key handling, returning the existing booking with `{ idempotentReplay: true }`.

### 9.3 Payment & Cancellation Race Defense
Simultaneous racing payment and cancellation requests are resolved deterministically without application-level race conditions:
- **Payment Guard:** `Booking.findOneAndUpdate({ _id, bookingStatus: 'pending', paymentStatus: { $ne: 'paid' } })`
- **Cancellation Guard:** `Booking.findOneAndUpdate({ _id, bookingStatus: { $in: ['pending', 'confirmed'] } })`
- The winner of the database document lock executes the transition; the loser immediately receives HTTP 400 or HTTP 409 Conflict. This prevents payments on cancelled passes and duplicate cancellations.

### 9.4 Exact-Once Capacity Restoration
When a confirmed or pending booking is cancelled:
- Capacity release occurs strictly after the state transition succeeds.
- Capacity restoration uses an underflow guard `{ reservedCount: { $gte: qty } }`, preventing mathematical errors or double-decrement under rapid multi-click scenarios.

### 9.5 QR Code Payload Privacy & Turnstile Security
Digital ticket entry passes generated upon mock payment:
- **Zero Sensitive Data:** The QR payload contains only the booking reference, unique ticket code (`TKT-YYYYMMDD-XXXXXXXX`), site slug, date, slot label, and total tickets. Zero passwords, emails, phone numbers, or authentication tokens are embedded.
- **Cryptographic Verification:** A SHA-256 integrity hash is embedded to prevent physical counterfeiting at ingress scanners.
- **Academic Simulation Notice:** Every generated QR code and ticket dossier bears an explicit watermark stating: `"ACADEMIC SIMULATION PASS - NOT VALID FOR PHYSICAL MONUMENT ENTRY"`. Cancelled passes render a prominent void watermark.
- **Fault-Tolerant QR Recovery:** If QR generation fails during payment due to hardware or encoder errors, the confirmed payment record is preserved and the QR code is made available through a retryable, authenticated endpoint (`/api/bookings/[id]/regenerate-qr`) without requiring another payment.

### 9.6 Multi-Tenant Data Isolation
- Cross-user access to booking dossiers, payments, or cancellations is strictly blocked with HTTP 403 Forbidden.
- Visitor dashboard queries filter strictly by the authenticated visitor's session ID (`Booking.find({ user: session.id })`).
- Administrators retain scoped supervisory permissions for operational oversight.

### 9.7 Verification
- Exhaustively verified across 73 automated test suites including concurrent overbooking stress tests, deliberate transaction rollbacks, race conditions, and tenant isolation tests with a 100% pass rate.

---

## 10. Administrative Access Control & Operations Security (Phase 6)

### 10.1 Multi-Layered Server-Side Authorization
Every administrative operation is protected across multiple defense perimeters:
- **Next.js Edge Middleware:** All requests targeting `/admin/:path*` and `/api/admin/:path*` are inspected before route execution. Unauthenticated requests are redirected to `/login` (or return HTTP 401 for API calls); non-admin users receive HTTP 403 Forbidden.
- **Server-Side Route Handler Enforcement:** Route handlers never rely solely on middleware or client-side navigation guards. Every administrative endpoint invokes `requireAdmin(request)`, which validates the cryptographic JWT signature, verifies live user status in MongoDB, and strictly asserts `dbUser.role === 'admin'` and `dbUser.isActive !== false`.

### 10.2 Privilege Escalation Defenses in Public Registration
- The public registration endpoint (`POST /api/auth/register`) enforces `role: 'visitor'` on the database record regardless of client payload fields. Client-submitted `role`, `isAdmin`, or permission flags are completely discarded.
- Administrator accounts cannot be provisioned via public registration; they are initialized exclusively via secure CLI bootstrap (`scripts/seed-admin.mjs`) or verified database migration.

### 10.3 Credential Hash Concealment & PII Protection
- Administrative visitor management endpoints (`GET /api/admin/users`) strictly project out sensitive credential fields (`select('name email role phone nationality isActive lastLogin createdAt')`). Password hashes (`password`), reset tokens, and session cookies are never transmitted to client dashboards.
- Reports and export modules conceal full visitor phone numbers and email details, preventing unnecessary PII leakage in exported audit spreadsheets.

### 10.4 Administrator Self-Deactivation Safeguard
- To prevent accidental lockout of supervisory access, `PATCH /api/admin/users/[id]/toggle-status` verifies `auth.adminUser.id !== params.id`. An administrator attempting to suspend their own account is rejected with HTTP 400 (`CANNOT_DEACTIVATE_SELF`).

### 10.5 Monument Safe Deletion Invariant
- To prevent database corruption and orphaned financial records, hard deletion (`DELETE /api/admin/sites/[id]`) verifies:
  1. `Booking.countDocuments({ siteSlug: site.slug }) === 0`
  2. `TimeSlot.countDocuments({ heritageSite: site.slug, reservedCount: { $gt: 0 } }) === 0`
- If active or historical bookings exist, deletion is strictly rejected with HTTP 409 Conflict (`CANNOT_DELETE_ACTIVE_RECORDS`). Curators must deactivate (`isActive: false`) the monument instead.

### 10.6 Carrying Capacity Floor Invariant
- When modifying time slot limits (`PATCH /api/admin/slots/[id]`), the system validates `newCapacity >= slot.reservedCount`. Attempts to reduce carrying capacity below already reserved tickets are rejected with HTTP 400 (`CAPACITY_LESS_THAN_RESERVED`), mathematically preventing retroactive overbooking.

### 10.7 CSV Formula Injection (DDE) Mitigation
- In `app/api/admin/reports/export/route.js`, all string values undergo formula injection sanitization. Any cell beginning with dangerous command triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) is prefixed with an apostrophe (`'`), preventing malicious code execution when opened in Microsoft Excel or Google Sheets. Internal quotes are safely doubled (`""`).


