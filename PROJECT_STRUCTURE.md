# Complete Project Folder Structure Specification
## Next.js App Router Architecture (JavaScript ES6+)

---

### Document Overview
- **Framework:** Next.js (App Router)
- **Language Standard:** JavaScript (ES6+) — *Strictly NO TypeScript*
- **File Extensions:** `.jsx` for React UI components and layouts, `.js` for Route Handlers, Mongoose models, hooks, services, and utility logic.
- **Styling Architecture:** Tailwind CSS v3 with custom Heritage color tokens.

---

## 1. Directory Tree Overview

```
heritage-site-crowd-management/
├── .env.example                     # Environment template (publicly safe)
├── .env.local                       # Local secret credentials (git-ignored)
├── .gitignore                       # Git exclusion rules
├── jsconfig.json                    # Path alias configuration (@/*)
├── next.config.js                   # Next.js runtime, image domains (S3)
├── package.json                     # Project manifest and scripts
├── postcss.config.js                # PostCSS tooling for Tailwind
├── tailwind.config.js               # Heritage design system & color extensions
│
├── public/                          # Static assets served from root
│   ├── favicon.ico
│   ├── images/
│   │   ├── placeholders/            # Fallback imagery if S3 is unreached
│   │   │   ├── monument-hero.webp
│   │   │   └── avatar-default.webp
│   │   └── logo-heritage.svg        # Scalable Vector Brand Mark
│   └── site.webmanifest             # Progressive Web App manifest
│
├── app/                             # Next.js App Router (File-System Routing)
│   ├── layout.jsx                   # Global Root Layout (Fonts, Theme, AuthProvider)
│   ├── page.jsx                     # Root landing redirect or wrapper
│   ├── not-found.jsx                # Global 404 handler
│   ├── error.jsx                    # Global Error boundary
│   ├── loading.jsx                  # Root skeleton loader
│   ├── globals.css                  # Tailwind directives and CSS variables
│   │
│   ├── (public)/                    # Route Group: Public Facing Pages
│   │   ├── layout.jsx               # Public Shell: Header, Navbar, Footer
│   │   ├── page.jsx                 # Public Home / Hero Showcase
│   │   ├── explore/
│   │   │   └── page.jsx             # Search, Filter & Monument Grid
│   │   ├── sites/
│   │   │   └── [slug]/
│   │   │       ├── page.jsx         # Dynamic Heritage Site Detail View
│   │   │       ├── loading.jsx      # Monument Detail Skeleton
│   │   │       └── not-found.jsx    # Missing Monument Notice
│   │   ├── crowd-status/
│   │   │   └── page.jsx             # Public Live Crowd Telemetry Directory
│   │   └── about/
│   │       └── page.jsx             # Heritage Mission & Simulated Data Disclosure
│   │
│   ├── (auth)/                      # Route Group: Authentication Workflows
│   │   ├── layout.jsx               # Centered Card Shell for Auth
│   │   ├── login/
│   │   │   └── page.jsx             # Tourist & Staff Sign-in Form
│   │   └── register/
│   │       └── page.jsx             # Visitor Account Registration Form
│   │
│   ├── (visitor)/                   # Route Group: Authenticated Visitor Enclave
│   │   ├── layout.jsx               # Visitor Dashboard Shell & Nav Tabs
│   │   ├── profile/
│   │   │   └── page.jsx             # Tourist Account Preferences & History
│   │   ├── book/
│   │   │   └── [slug]/
│   │   │       └── page.jsx         # Multi-step Ticket Booking Wizard
│   │   └── bookings/
│   │       ├── page.jsx             # "My Bookings" List View
│   │       └── [id]/
│   │           └── page.jsx         # Digital Pass, QR Display & Cancellation
│   │
│   ├── (admin)/                     # Route Group: Administrative & Turnstile Enclave
│   │   ├── layout.jsx               # Admin Sidebar, Turnstile Status, Security Bar
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   │   └── page.jsx         # Master KPI Cards & Capacity Heatmaps
│   │   │   ├── sites/
│   │   │   │   ├── page.jsx         # Monument Inventory & Quota Editor
│   │   │   │   ├── new/
│   │   │   │   │   └── page.jsx     # Add New Monument Form
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.jsx # Edit Monument & Ticket Tiers
│   │   │   ├── slots/
│   │   │   │   └── page.jsx         # Time Slot Matrix & Emergency Blackouts
│   │   │   ├── turnstile/
│   │   │   │   └── page.jsx         # Live QR Scanner & Ingress/Egress Controller
│   │   │   ├── bookings/
│   │   │   │   └── page.jsx         # Global Ticket Registry & Manifest
│   │   │   └── analytics/
│   │   │       └── page.jsx         # Recharts Deep-Dive Density Curves
│   │
│   └── api/                         # Backend REST API (Route Handlers)
│       ├── auth/
│       │   ├── register/
│       │   │   └── route.js         # POST user registration
│       │   ├── login/
│       │   │   └── route.js         # POST user login & cookie issue
│       │   ├── logout/
│       │   │   └── route.js         # POST session clearance
│       │   └── me/
│       │       └── route.js         # GET current user payload
│       │
│       ├── sites/
│       │   ├── route.js             # GET (list/filter) & POST (admin create)
│       │   ├── [slug]/
│       │   │   └── route.js         # GET single site by slug
│       │   └── [id]/
│       │       └── route.js         # PATCH & DELETE monument record
│       │
│       ├── slots/
│       │   ├── route.js             # GET available slots & POST batch create
│       │   └── [id]/
│       │       └── route.js         # PATCH slot capacity/blackout
│       │
│       ├── bookings/
│       │   ├── route.js             # GET user bookings & POST atomic reservation
│       │   └── [id]/
│       │       └── route.js         # GET digital ticket & PATCH cancellation
│       │
│       ├── crowd/
│       │   ├── [siteId]/
│       │   │   └── route.js         # GET live telemetry for single site
│       │   ├── check-in/
│       │   │   └── route.js         # POST gate scan ingress (+1 visitor)
│       │   ├── check-out/
│       │   │   └── route.js         # POST turnstile exit (-1 visitor)
│       │   └── statistics/
│       │       └── route.js         # GET hourly historical curves
│       │
│       └── admin/
│           ├── dashboard/
│           │   └── route.js         # GET aggregate KPI statistics
│           ├── bookings/
│           │   └── route.js         # GET admin master ticket audit
│           └── sites/
│               └── route.js         # GET admin monument operational table
│
├── components/                      # Reusable UI & Domain React Components
│   ├── ui/                          # Atoms & Primitives (Pure, Generic)
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx                # Crowd Level Badges (Low/Mod/High)
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── Modal.jsx
│   │   ├── Spinner.jsx
│   │   └── Alert.jsx
│   │
│   ├── common/                      # Compound / Structural Elements
│   │   ├── Navbar.jsx               # Public responsive navigation
│   │   ├── Footer.jsx               # Heritage footer with disclosure notice
│   │   ├── AdminSidebar.jsx         # Fixed side-navigation for curators
│   │   ├── Breadcrumb.jsx
│   │   └── SimulatedDataBanner.jsx  # Disclaimer banner on crowd data
│   │
│   ├── site/                        # Heritage Site Domain Components
│   │   ├── SiteCard.jsx             # Monument card with live density badge
│   │   ├── SiteHero.jsx             # High-res monument header with fast facts
│   │   ├── SiteGallery.jsx          # Lightbox/carousel for photo archives
│   │   ├── VisitingRules.jsx        # Timings, prohibited items, etiquette
│   │   └── PricingTable.jsx         # Clear breakdown of tiered ticket rates
│   │
│   ├── booking/                     # Ticket Reservation Components
│   │   ├── DateSelector.jsx         # Calendar date picker
│   │   ├── SlotPicker.jsx           # Time slot radio pills with availability
│   │   ├── VisitorForm.jsx          # Dynamic passenger manifest inputs
│   │   ├── PriceSummary.jsx         # Real-time subtotal calculation
│   │   └── DigitalTicket.jsx        # Printable pass with QR code
│   │
│   ├── crowd/                       # Telemetry & Visualization Components
│   │   ├── CrowdGauge.jsx           # Circular/radial progress occupancy meter
│   │   ├── CrowdBadge.jsx           # Color-coded status indicator pill
│   │   ├── HourlyDensityChart.jsx   # Recharts Area/Line chart for peak hours
│   │   ├── WeeklyTrendsChart.jsx    # Recharts Bar chart for day-of-week trends
│   │   └── TurnstileCounter.jsx     # Live ingress/egress ticker
│   │
│   └── admin/                       # Administrative Management Components
│       ├── StatCard.jsx             # Metric card (Total Revenue, Visitors)
│       ├── ScannerModal.jsx         # Camera/QR check-in scanner module
│       ├── CapacityManager.jsx      # Slider/Input to adjust monument caps
│       └── SiteForm.jsx             # Form to create or update monuments
│
├── models/                          # Mongoose ODM Schema Definitions
│   ├── User.js                      # User schema with bcrypt hooks
│   ├── HeritageSite.js              # Monument details, hours, capacity
│   ├── TimeSlot.js                  # Interval quotas & compound index
│   ├── Booking.js                   # Reservations, QR, and manifests
│   └── CrowdStatistics.js           # Hourly telemetry snapshots
│
├── lib/                             # Core Infrastructure & Server Singletons
│   ├── db.js                        # Cached Mongoose connection singleton
│   ├── auth.js                      # JWT signing, verification, and cookie extraction
│   ├── crowdSimulator.js            # Algorithmic pedestrian generator
│   └── s3.js                        # AWS S3 client & pre-signed URL generator
│
├── context/                         # React 18 Context Providers
│   ├── AuthContext.jsx              # Global logged-in user state & logout
│   └── CrowdContext.jsx             # Global live telemetry subscription/polling
│
├── hooks/                           # Custom React Hooks
│   ├── useAuth.js                   # Consumes AuthContext safely
│   ├── useCrowdData.js              # Polling hook for live crowd telemetry
│   ├── useBooking.js                # State machine for ticket booking wizard
│   └── useDebounce.js               # Debounce hook for monument search bar
│
├── services/                        # Client-Side API Abstraction Layer
│   ├── authService.js               # Wraps fetch calls for /api/auth/*
│   ├── siteService.js               # Wraps fetch calls for /api/sites/*
│   ├── bookingService.js            # Wraps fetch calls for /api/bookings/*
│   ├── crowdService.js              # Wraps fetch calls for /api/crowd/*
│   └── adminService.js              # Wraps fetch calls for /api/admin/*
│
├── utils/                           # Pure Helper Functions & Utilities
│   ├── formatters.js                # Date, currency (INR ₹), and numbers
│   ├── validators.js                # Regex schemas for email, phone, slots
│   ├── qrGenerator.js               # Encodes ticket payload into QR canvas
│   └── crowdCalculator.js           # Percentage and classification formulas
│
└── constants/                       # Static System-wide Constants
    ├── crowdLevels.js               # Low (0-40), Moderate (41-70), High (71-100)
    ├── navigation.js                # Nav links for public, visitor, and admin
    └── indianStates.js              # List of Indian states & heritage hubs
```

---

## 2. Explanation of Key Directory Responsibilities

### 2.1 Route Groups in `app/`
Next.js App Router route groups use parenthesis notation (e.g. `(public)`) to organize routes logically without altering the URL path structure.
1. `(public)`: Contains unauthenticated tourist routes (`/`, `/explore`, `/sites/[slug]`, `/crowd-status`). Shares a common navigation layout with header and footer.
2. `(auth)`: Isolated, distraction-free container for `/login` and `/register`. Center-aligned layout without navigation noise.
3. `(visitor)`: Authenticated tourist portal routes (`/profile`, `/book/[slug]`, `/bookings`). Requires active session cookie.
4. `(admin)`: Strict administrative enclave (`/admin/dashboard`, `/admin/sites`, `/admin/turnstile`). Protected by role-check middleware verifying `user.role === 'admin'`.

### 2.2 Reusable Component Structure (`components/`)
- Avoids monolithic files by dividing components into atomic levels (`ui/` for buttons, cards, badges) and domain-specific modules (`booking/`, `crowd/`, `site/`).
- Components are marked with `'use client'` only when they manage local state, listen to browser events, or use browser APIs (e.g., QR rendering, Recharts). All other layout and informational components remain Server Components for maximum performance.

### 2.3 Models (`models/`)
Contains Mongoose ODM models. Each model exports a cached schema to avoid the common Next.js development reload error `Cannot overwrite model once compiled`:
```javascript
export default mongoose.models.User || mongoose.model('User', userSchema);
```

### 2.4 Server Singletons (`lib/`)
Contains stateful or external SDK initializations that must remain singletons across function invocations:
- `lib/db.js`: Holds the MongoDB connection promise in Node's global object.
- `lib/auth.js`: Implements cryptographic token verification.
- `lib/crowdSimulator.js`: Implements Gaussian distribution curves to model peak-hour surges.

### 2.5 Custom Hooks (`hooks/`)
Encapsulates complex lifecycle logic:
- `useCrowdData(siteId, intervalMs)`: Polls `/api/crowd/[siteId]` periodically, managing loading, error, and cached data states smoothly without jitter.
- `useBooking(initialSite)`: Manages the multi-step wizard state (Step 1: Date & Slot $\to$ Step 2: Visitors $\to$ Step 3: Confirmation).

### 2.6 Services (`services/`)
Separates UI presentation from network transport. Instead of scattering `fetch('/api/sites')` across multiple React components, components invoke `siteService.getSites(params)`. This makes testing straightforward and allows future endpoint refactoring without touching UI code.
