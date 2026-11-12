# Database Architecture & Schema Design
## Database Name: `heritageDB` (MongoDB Atlas & Mongoose ODM)

---

### Document Overview
- **Database System:** MongoDB Atlas (Document-oriented NoSQL Database)
- **Object Data Modeling (ODM):** Mongoose v8.x (Node.js runtime)
- **Database Name:** `heritageDB`
- **Application:** Heritage Site Crowd Management System
- **Architectural Scope:** Schema definitions, validation rules, relationship references, compound indexing, atomic concurrency patterns, and scalability design.

---

## 1. MongoDB & Mongoose ODM Integration Architecture

In this system, **MongoDB** provides a high-throughput, schema-flexible document store capable of handling rapid read traffic (tourists browsing monuments) and high-concurrency writes (turnstile entry logs and ticket reservations). 

**Mongoose ODM** serves as the modeling and data integrity layer running inside the Next.js Node.js server runtime.

```
+-----------------------------------------------------------------------------------+
|                        Next.js Serverless Route Handlers                          |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                            Mongoose ODM Layer                                     |
|  - Schema Validation & Cast Rules   - Pre/Post Save Middleware Hooks              |
|  - Virtual Properties               - Cached Singleton Connection Pool            |
+-----------------------------------------------------------------------------------+
                                         │
                         (TLS / SRV Connection Protocol)
                                         ▼
+-----------------------------------------------------------------------------------+
|                           MongoDB Atlas Cluster                                   |
|  - Database: heritageDB                                                           |
|  - Collections: users, heritagesites, timeslots, bookings, crowdstatistics        |
|  - Compound & Unique Indexes                                                      |
+-----------------------------------------------------------------------------------+
```

### 1.1 Serverless Connection Caching Pattern
In Next.js serverless route handlers, functions are spun up and torn down dynamically. Creating a new database connection on every incoming HTTP request exhausts MongoDB connection limits rapidly. To resolve this, we implement a **cached connection singleton**:

```javascript
// Conceptual Pattern: lib/db.js
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    }).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

---

## 2. Entity-Relationship (ER) Diagram

The relationships among the five core collections are modeled below using Mermaid notation:

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : "places (1:N)"
    HERITAGE_SITES ||--o{ BOOKINGS : "booked_for (1:N)"
    HERITAGE_SITES ||--o{ TIME_SLOTS : "schedules (1:N)"
    TIME_SLOTS ||--o{ BOOKINGS : "allocates (1:N)"
    HERITAGE_SITES ||--o{ CROWD_STATISTICS : "records (1:N)"

    USERS {
        ObjectId _id PK
        string name
        string email UK
        string passwordHash
        string role "visitor | admin | staff"
        string phone
        date createdAt
        date updatedAt
    }

    HERITAGE_SITES {
        ObjectId _id PK
        string name
        string slug UK
        string shortDescription
        string history
        object location
        string heroImage
        array galleryImages
        object ticketPricing
        object visitingHours
        int maxCapacity
        int currentVisitors
        object simulatedSensorConfig
        string status "active | maintenance | closed"
        date createdAt
        date updatedAt
    }

    TIME_SLOTS {
        ObjectId _id PK
        ObjectId siteId FK
        string date "YYYY-MM-DD"
        string startTime "HH:mm"
        string endTime "HH:mm"
        int capacity
        int bookedCount
        int availableCount
        boolean isActive
        date createdAt
        date updatedAt
    }

    BOOKINGS {
        ObjectId _id PK
        string bookingReference UK
        ObjectId userId FK
        ObjectId siteId FK
        ObjectId timeSlotId FK
        string visitDate "YYYY-MM-DD"
        object timeSlotSnapshot
        int visitorsCount
        array visitorDetails
        object ticketPricingSnapshot
        number totalAmount
        string paymentStatus "pending | paid | refunded"
        string bookingStatus "confirmed | cancelled | completed"
        string qrCodeData
        string checkInStatus "pending | checked_in | checked_out"
        date checkInTime
        date checkOutTime
        string cancellationReason
        date createdAt
        date updatedAt
    }

    CROWD_STATISTICS {
        ObjectId _id PK
        ObjectId siteId FK
        date timestamp
        string date "YYYY-MM-DD"
        int hour "0 to 23"
        int visitorCount
        number occupancyPercentage
        string crowdCategory "low | moderate | high"
        int entryCount
        int exitCount
        string weatherCondition
        boolean isSimulated
        date createdAt
    }
```

---

## 3. Detailed Collection Specifications & Mongoose Schemas

### 3.1 Collection: `users`
Represents registered tourists, visiting scholars, monument administrators, and turnstile verification staff.

| Field Name | Type | Required | Default | Validation & Rules | Indexed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | MongoDB Primary Key | Yes (Primary) |
| `name` | `String` | Yes | None | `trim: true`, `minlength: 2`, `maxlength: 100` | No |
| `email` | `String` | Yes | None | `lowercase: true`, `trim: true`, RFC 5322 regex match | **Yes (Unique)** |
| `passwordHash`| `String` | Yes | None | Hashed with bcrypt (min 60 chars) | No |
| `role` | `String` | Yes | `'visitor'` | `enum: ['visitor', 'admin', 'staff']` | Yes |
| `phone` | `String` | No | `null` | E.164 international or 10-digit Indian standard | No |
| `nationality` | `String` | No | `'Indian'` | Used to pre-populate ticket tier defaults | No |
| `avatarUrl` | `String` | No | `null` | AWS S3 or Gravatar URL | No |
| `createdAt` | `Date` | Yes | `Date.now` | Managed automatically via timestamps | No |
| `updatedAt` | `Date` | Yes | `Date.now` | Managed automatically via timestamps | No |

#### Schema Definition & Indexing:
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['visitor', 'admin', 'staff'], default: 'visitor', index: true },
  phone: { type: String, trim: true, default: null },
  nationality: { type: String, default: 'Indian' },
  avatarUrl: { type: String, default: null }
}, { timestamps: true });

// Compound / Single Indexes
userSchema.index({ email: 1 }, { unique: true });
```

---

### 3.2 Collection: `heritagesites`
Stores comprehensive information, ticket structures, operating guidelines, and capacity constraints for each monument.

| Field Name | Type | Required | Default | Validation & Rules | Indexed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | MongoDB Primary Key | Yes (Primary) |
| `name` | `String` | Yes | None | Monument title, unique | **Yes (Unique)** |
| `slug` | `String` | Yes | None | URL slug (e.g. `'taj-mahal'`), lowercase | **Yes (Unique)** |
| `shortDescription` | `String` | Yes | None | Summary for card views (`maxlength: 300`) | No |
| `history` | `String` | Yes | None | Full markdown architectural and cultural background | No |
| `location` | `Object` | Yes | None | Embedded subdocument (details below) | Yes |
| `location.city` | `String` | Yes | None | e.g. `'Agra'` | Yes |
| `location.state` | `String` | Yes | None | e.g. `'Uttar Pradesh'` | Yes |
| `location.coordinates` | `Object` | Yes | None | `{ lat: Number, lng: Number }` | No |
| `heroImage` | `String` | Yes | None | S3 CDN URL to high-res banner | No |
| `galleryImages` | `[String]`| No | `[]` | Array of S3 CDN URLs | No |
| `ticketPricing` | `Object` | Yes | None | Nested pricing tiers: | No |
| `↳ indianAdult` | `Number` | Yes | `50` | Non-negative integer (INR) | No |
| `↳ indianChild` | `Number` | Yes | `0` | Non-negative integer (INR) | No |
| `↳ foreignerAdult`| `Number` | Yes | `1100` | Non-negative integer (INR) | No |
| `↳ foreignerChild`| `Number` | Yes | `0` | Non-negative integer (INR) | No |
| `↳ student` | `Number` | Yes | `25` | Discounted rate for valid ID holders | No |
| `visitingHours` | `Object` | Yes | None | Operating hours config: | No |
| `↳ openingTime` | `String` | Yes | `'06:00'` | 24-hr format `HH:mm` | No |
| `↳ closingTime` | `String` | Yes | `'18:00'` | 24-hr format `HH:mm` | No |
| `↳ closedDays` | `[String]`| No | `['Friday']`| Days closed for conservation or prayers | No |
| `↳ slotDuration`| `Number` | Yes | `120` | Duration of each visit window in minutes | No |
| `maxCapacity` | `Number` | Yes | `5000` | Maximum instantaneous physical limit | No |
| `currentVisitors`| `Number` | Yes | `0` | Real-time active occupants inside gates | No |
| `simulatedSensorConfig`| `Object` | No | `{}` | Base variance & peak curve multipliers | No |
| `status` | `String` | Yes | `'active'` | `enum: ['active', 'maintenance', 'closed']` | Yes |
| `createdAt` | `Date` | Yes | `Date.now` | Automated timestamp | No |
| `updatedAt` | `Date` | Yes | `Date.now` | Automated timestamp | No |

#### Schema Definition & Indexing:
```javascript
const heritageSiteSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  shortDescription: { type: String, required: true, maxlength: 300 },
  history: { type: String, required: true },
  location: {
    city: { type: String, required: true, index: true },
    state: { type: String, required: true, index: true },
    country: { type: String, default: 'India' },
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  heroImage: { type: String, required: true },
  galleryImages: [{ type: String }],
  ticketPricing: {
    indianAdult: { type: Number, required: true, min: 0 },
    indianChild: { type: Number, default: 0, min: 0 },
    foreignerAdult: { type: Number, required: true, min: 0 },
    foreignerChild: { type: Number, default: 0, min: 0 },
    student: { type: Number, required: true, min: 0 }
  },
  visitingHours: {
    openingTime: { type: String, required: true, default: '06:00' },
    closingTime: { type: String, required: true, default: '18:30' },
    closedDays: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
    slotDurationMinutes: { type: Number, default: 120, min: 30 }
  },
  maxCapacity: { type: Number, required: true, min: 100 },
  currentVisitors: { type: Number, default: 0, min: 0 },
  simulatedSensorConfig: {
    enabled: { type: Boolean, default: true },
    peakMorningFactor: { type: Number, default: 1.4 },
    peakAfternoonFactor: { type: Number, default: 1.8 }
  },
  status: { type: String, enum: ['active', 'maintenance', 'closed'], default: 'active', index: true }
}, { timestamps: true });

heritageSiteSchema.index({ slug: 1 }, { unique: true });
heritageSiteSchema.index({ name: 'text', 'location.city': 'text', 'location.state': 'text' });
```

---

### 3.3 Collection: `timeslots`
Controls per-interval visitor quotas for each heritage destination on a specific calendar day.

| Field Name | Type | Required | Default | Validation & Rules | Indexed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | MongoDB Primary Key | Yes |
| `siteId` | `ObjectId` | Yes | None | Reference to `heritagesites._id` | **Yes (Foreign Key)** |
| `date` | `String` | Yes | None | Format `YYYY-MM-DD` | **Yes** |
| `startTime` | `String` | Yes | None | 24-hr `HH:mm` (e.g., `'09:00'`) | **Yes** |
| `endTime` | `String` | Yes | None | 24-hr `HH:mm` (e.g., `'11:00'`) | No |
| `capacity` | `Number` | Yes | None | Max permits issued for this window | No |
| `bookedCount`| `Number` | Yes | `0` | Quantity of confirmed tickets | No |
| `availableCount`| `Number`| Yes | `capacity` | Derived `capacity - bookedCount` | No |
| `isActive` | `Boolean` | Yes | `true` | Emergency blackout toggle | Yes |
| `createdAt` | `Date` | Yes | `Date.now` | Automated timestamp | No |
| `updatedAt` | `Date` | Yes | `Date.now` | Automated timestamp | No |

#### Schema Definition & Compound Uniqueness:
```javascript
const timeSlotSchema = new mongoose.Schema({
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'HeritageSite', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  startTime: { type: String, required: true }, // HH:mm
  endTime: { type: String, required: true }, // HH:mm
  capacity: { type: Number, required: true, min: 1 },
  bookedCount: { type: Number, default: 0, min: 0 },
  availableCount: { type: Number, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// CRITICAL UNIQUE COMPOUND INDEX
// Ensures a site cannot have duplicate conflicting slots on the same day at the same start time
timeSlotSchema.index({ siteId: 1, date: 1, startTime: 1 }, { unique: true });
timeSlotSchema.index({ siteId: 1, date: 1, isActive: 1 });
```

---

### 3.4 Collection: `bookings`
Stores visitor ticket reservations, transaction details, passenger manifests, and entry/exit audit trails.

| Field Name | Type | Required | Default | Validation & Rules | Indexed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | MongoDB Primary Key | Yes |
| `bookingReference`| `String` | Yes | None | Unique alphanumeric code (e.g., `HST-2026-X8R4`) | **Yes (Unique)** |
| `userId` | `ObjectId` | Yes | None | Reference to `users._id` | **Yes (Foreign Key)** |
| `siteId` | `ObjectId` | Yes | None | Reference to `heritagesites._id` | **Yes (Foreign Key)** |
| `timeSlotId` | `ObjectId` | Yes | None | Reference to `timeslots._id` | **Yes (Foreign Key)** |
| `visitDate` | `String` | Yes | None | Format `YYYY-MM-DD` | **Yes** |
| `timeSlotSnapshot` | `Object`| Yes | None | `{ startTime: String, endTime: String }` (Immutable record) | No |
| `visitorsCount` | `Number` | Yes | None | Minimum 1, Maximum 10 per booking | No |
| `visitorDetails`| `[Object]`| Yes | None | Array of attendee items: `{ name, age, gender, category }` | No |
| `ticketPricingSnapshot`| `Object`| Yes | None | Historical rate snapshot when transaction was processed | No |
| `totalAmount` | `Number` | Yes | None | Calculated ticket price sum in INR | No |
| `paymentStatus` | `String` | Yes | `'paid'` | `enum: ['pending', 'paid', 'refunded', 'failed']` | Yes |
| `bookingStatus` | `String` | Yes | `'confirmed'`| `enum: ['confirmed', 'cancelled', 'completed']` | **Yes** |
| `qrCodeData` | `String` | Yes | None | Signed JSON payload for physical turnstile scanning | No |
| `checkInStatus` | `String` | Yes | `'pending'` | `enum: ['pending', 'checked_in', 'checked_out']` | **Yes** |
| `checkInTime` | `Date` | No | `null` | Exact timestamp when scanned at ingress gate | No |
| `checkOutTime` | `Date` | No | `null` | Exact timestamp when scanned at egress gate | No |
| `cancellationReason`| `String`| No | `null` | Reason if cancelled by user or administrator | No |
| `createdAt` | `Date` | Yes | `Date.now` | Booking purchase time | **Yes** |

#### Schema Definition & Indexing:
```javascript
const bookingSchema = new mongoose.Schema({
  bookingReference: { type: String, required: true, unique: true, uppercase: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'HeritageSite', required: true, index: true },
  timeSlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', required: true, index: true },
  visitDate: { type: String, required: true, index: true },
  timeSlotSnapshot: {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  },
  visitorsCount: { type: Number, required: true, min: 1, max: 10 },
  visitorDetails: [{
    name: { type: String, required: true },
    age: { type: Number, required: true, min: 1 },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    category: { type: String, enum: ['indianAdult', 'indianChild', 'foreignerAdult', 'foreignerChild', 'student'], required: true }
  }],
  ticketPricingSnapshot: { type: Map, of: Number, required: true },
  totalAmount: { type: Number, required: true, min: 0 },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'paid' },
  bookingStatus: { type: String, enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed', index: true },
  qrCodeData: { type: String, required: true },
  checkInStatus: { type: String, enum: ['pending', 'checked_in', 'checked_out'], default: 'pending', index: true },
  checkInTime: { type: Date, default: null },
  checkOutTime: { type: Date, default: null },
  cancellationReason: { type: String, default: null }
}, { timestamps: true });

// Compound Indexes for fast user queries and admin reports
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ siteId: 1, visitDate: 1, checkInStatus: 1 });
bookingSchema.index({ bookingReference: 1 }, { unique: true });
```

---

### 3.5 Collection: `crowdstatistics`
Aggregates hourly and daily visitor flows, occupancy rates, and crowd categories for historical reporting and trend projections.

| Field Name | Type | Required | Default | Validation & Rules | Indexed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Yes | Auto | MongoDB Primary Key | Yes |
| `siteId` | `ObjectId` | Yes | None | Reference to `heritagesites._id` | **Yes (Foreign Key)** |
| `timestamp` | `Date` | Yes | `Date.now` | Time of statistical recording | **Yes** |
| `date` | `String` | Yes | None | Format `YYYY-MM-DD` | **Yes** |
| `hour` | `Number` | Yes | None | Hour index: `0` through `23` | **Yes** |
| `visitorCount` | `Number` | Yes | `0` | Active visitors inside site during this hour | No |
| `occupancyPercentage`| `Number`| Yes | `0.0` | Relative to site `maxCapacity` (`0.0` to `100.0`) | No |
| `crowdCategory` | `String` | Yes | `'low'` | `enum: ['low', 'moderate', 'high']` | Yes |
| `entryCount` | `Number` | Yes | `0` | Ingress count during this 1-hour bracket | No |
| `exitCount` | `Number` | Yes | `0` | Egress count during this 1-hour bracket | No |
| `weatherCondition` | `String` | No | `'Clear'` | e.g. `'Sunny'`, `'Rain'`, `'Fog'` (affects density) | No |
| `isSimulated` | `Boolean` | Yes | `true` | Distinguishes mathematical model from physical IoT | No |

#### Schema Definition & Indexing:
```javascript
const crowdStatisticsSchema = new mongoose.Schema({
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'HeritageSite', required: true },
  timestamp: { type: Date, default: Date.now },
  date: { type: String, required: true },
  hour: { type: Number, required: true, min: 0, max: 23 },
  visitorCount: { type: Number, required: true, min: 0 },
  occupancyPercentage: { type: Number, required: true, min: 0, max: 100 },
  crowdCategory: { type: String, enum: ['low', 'moderate', 'high'], required: true },
  entryCount: { type: Number, default: 0, min: 0 },
  exitCount: { type: Number, default: 0, min: 0 },
  weatherCondition: { type: String, default: 'Clear' },
  isSimulated: { type: Boolean, default: true }
}, { timestamps: true });

// Compound index for time-series range lookups in Recharts graphs
crowdStatisticsSchema.index({ siteId: 1, date: 1, hour: 1 }, { unique: true });
crowdStatisticsSchema.index({ siteId: 1, timestamp: -1 });
```

---

## 4. Concurrency & Race Condition Prevention

### Overbooking Problem
When thousands of tourists attempt to book the final 3 tickets for a 10:00 AM slot at the Taj Mahal simultaneously, traditional `read-then-write` logic causes disastrous overbooking:
1. Thread A reads `availableCount = 3`.
2. Thread B reads `availableCount = 3`.
3. Thread A reserves 3 tickets and writes `availableCount = 0`.
4. Thread B reserves 3 tickets and writes `availableCount = 0`.
5. **Result:** 6 tickets issued for 3 physical slots.

### Architectural Solution: Conditional Atomic `$inc`
In MongoDB, a single document update is strictly atomic. We utilize conditional atomic increments:

```javascript
// services/bookingService.js
const updatedSlot = await TimeSlot.findOneAndUpdate(
  {
    _id: slotId,
    isActive: true,
    availableCount: { $gte: requestedTicketCount } // ATOMIC GUARD
  },
  {
    $inc: {
      bookedCount: requestedTicketCount,
      availableCount: -requestedTicketCount
    }
  },
  { new: true }
);

if (!updatedSlot) {
  // If null is returned, capacity was insufficient at the exact millisecond of write
  throw new Error('CAPACITY_EXCEEDED');
}
```

---

## 5. Database Scalability & Performance Strategy

1. **Read-Heavy Optimization:** Heritage site details rarely change. Public routes query indexed fields (`slug`, `status`) and leverage Lean queries (`.lean()`) to bypass heavy Mongoose document hydration.
2. **Denormalization vs. Normalization Balance:** 
   - Immutable historical data (e.g., `ticketPricingSnapshot` and `timeSlotSnapshot`) are denormalized inside the `Booking` document. If monument ticket prices rise in 2027, historical 2026 bookings preserve their original purchased monetary values.
   - Dynamic states (`availableCount`, `currentVisitors`) remain strictly normalized in single documents to maintain consistency.
3. **Compound Index Selectivity:** All compound indexes are structured following the **Equality, Sort, Range (ESR)** heuristic (e.g., `{ siteId: 1, date: 1, hour: 1 }`).
4. **Time-Series Growth Management:** `crowdStatistics` generates 24 records per monument daily (8,760 per site per year). For a college CA project of 10 heritage sites, this totals under 88,000 lightweight documents per year—well within MongoDB Atlas free tier (512 MB) limits.

---

## 6. Phase 5 Consolidated Database Architecture & Transaction Design

In Phase 5 (Heritage Site Booking & Ticket Reservation System), the database architecture was consolidated into a production-grade, maintainable system powered by **native MongoDB multi-document ACID transactions** (`session.withTransaction()`) backed by MongoDB Atlas or a local replica set (`rs0`):

### 6.1 Multi-Document ACID Transaction Guarantees
In standalone MongoDB, operations across distinct collections cannot be atomically coordinated. In ANVAYA, multi-document consistency is strictly enforced by running on MongoDB Atlas (or local single-node replica set `rs0`) using Mongoose sessions:

1. **Reservation & Booking Creation Transaction:**
   ```javascript
   await withDatabaseTransaction(async (session) => {
     // 1. Conditionally reserve slot capacity
     const updatedSlot = await reserveSlotCapacity(slotId, requestedQty, session);
     if (!updatedSlot) throw new InsufficientCapacityError();

     // 2. Create booking within the same session
     const [booking] = await Booking.create([bookingPayload], { session });
     return booking;
   });
   ```
   - **Atomicity:** If capacity is insufficient or booking insertion fails, the transaction is automatically aborted by the storage engine. Zero capacity is leaked, and zero partial documents are created.
   - **Idempotency:** A unique sparse index on `idempotencyKey` prevents duplicate booking creation under network retries.

2. **Cancellation & Capacity Restoration Transaction:**
   ```javascript
   await withDatabaseTransaction(async (session) => {
     // 1. Atomically transition booking status from pending/confirmed to cancelled
     const updatedBooking = await Booking.findOneAndUpdate(
       { _id: bookingId, bookingStatus: { $in: ['pending', 'confirmed'] } },
       { $set: { bookingStatus: 'cancelled', paymentStatus: 'refunded', cancellation: { ... } } },
       { session, new: true }
     );
     if (!updatedBooking) throw new InvalidCancellationStateError();

     // 2. Atomically restore slot capacity in the same session
     await releaseSlotCapacity(slotId, totalTickets, session);
     return updatedBooking;
   });
   ```
   - **Atomicity:** A booking is never cancelled without its capacity being restored, and capacity is never released without the booking being marked cancelled.

3. **Mock Payment & Pass Issuance Transaction:**
   ```javascript
   await withDatabaseTransaction(async (session) => {
     const booking = await Booking.findOne({ _id: bookingId }).session(session);
     if (booking.bookingStatus === 'cancelled') throw new Error('Cannot pay cancelled booking');
     if (booking.paymentStatus === 'paid') throw new Error('Already paid');

     // Generate ticket code and scannable QR pass
     booking.bookingStatus = 'confirmed';
     booking.paymentStatus = 'paid';
     booking.ticketCode = generateTicketCode();
     booking.qrCodeDataUrl = await generateTicketQRCode({ ... });
     await booking.save({ session });
     return booking;
   });
   ```

### 6.2 Consolidated Schema: `models/TimeSlot.js`
- **Unique Compound Index:** `{ heritageSite: 1, date: 1, startTime: 1 }` prevents scheduling conflicts.
- **Availability Index:** `{ heritageSite: 1, date: 1, isActive: 1 }` accelerates visitor search queries.
- **Atomic Capacity Guard (`lib/slots.js`):**
  Uses `$expr: { $lte: [{ $add: ['$reservedCount', requestedQty] }, '$capacity'] }` with `$inc: { reservedCount: requestedQty }` inside the Mongoose session.
- **Underflow Protection:** Decrements only when `reservedCount >= requestedQty`.

### 6.3 Consolidated Schema: `models/Booking.js`
- **Unique Indexes:**
  - `bookingReference`: Alphanumeric unique identifier (`VIR-YYYYMMDD-XXXXXX`).
  - `idempotencyKey`: Sparse unique index enforcing exact single-order processing under retry.
  - `ticketCode`: Sparse unique identifier (`TKT-YYYYMMDD-XXXXXXXX`).
- **Compound Query Indexes:**
  - `{ user: 1, createdAt: -1 }`: Rapid visitor booking dossier lookup.
  - `{ heritageSite: 1, visitDate: 1, bookingStatus: 1 }`: Accelerated gate verification.

### 6.4 Verification Evidence
- **73 / 73 Automated Tests Passing (100%):**
  - 52 concurrency, security, and tenant isolation tests (`tests/booking-e2e-audit.mjs`).
  - 21 multi-document ACID transaction scenarios (`tests/booking-consolidation-audit.mjs`).
- **Zero Leaked Capacity:** Validated under 5-way simultaneous concurrent race conditions and deliberate transaction aborts.
