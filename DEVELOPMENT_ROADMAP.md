# Phased Development Roadmap & Implementation Plan
## Heritage Site Crowd Management System

---

### Document Overview
- **Implementation Methodology:** Sequential, Feature-Driven Milestone Architecture
- **Target Timeline:** 12 Structured Implementation Phases
- **Execution Rule:** Zero premature code generation. Each phase must satisfy explicit prerequisites, deliverables, and automated/manual testing checkpoints before moving to the subsequent phase.
- **Current Status:** Architectural Design & Planning Phase Completed. Implementation strictly pending user sign-off.

---

## Roadmap Summary & Phased Progress Matrix

| Phase | Phase Title | Status | Primary Focus | Key Deliverables |
| :---: | :--- | :---: | :--- | :--- |
| **01** | Project Initialization & Config | ✅ Completed | Next.js 14, Tailwind, Tooling | `package.json`, `next.config.js`, `tailwind.config.js` |
| **02** | Design System & Reusable UI | ✅ Completed | Indian Heritage Palette, Atoms | `Button.jsx`, `Badge.jsx`, `Card.jsx`, `Modal.jsx` |
| **03** | Public Tourism Portal | ✅ Completed | Explore & Monument Details | `/`, `/explore`, `/sites/[slug]`, `Navbar.jsx` |
| **04** | Authentication & Visitor Portal | ✅ Completed | JWT, Sessions, Protected Views | `/login`, `/register`, `/profile`, `AuthContext.jsx` |
| **05** | Ticket Booking & Concurrency | ✅ Completed | Atomic Slot Reservation & QR | `POST /api/bookings`, Booking Wizard, Digital Pass |
| **06** | MongoDB Database Integration | 🕒 Planned | Mongoose Connection & Schemas | `lib/db.js`, 5 Mongoose Models, Compound Indexes |
| **07** | Heritage Site Management | 🕒 Planned | Monument CRUD & Quota Engine | `/api/sites/*`, Admin Site Editor |
| **08** | Crowd Monitoring & Analytics | 🕒 Planned | Telemetry Engine, Recharts | `CrowdGauge.jsx`, `HourlyDensityChart.jsx`, Gauge API |
| **09** | Admin Operations Dashboard | 🕒 Planned | Master KPIs & Turnstile Scanner | `/admin/dashboard`, `/admin/turnstile`, Ingress API |
| **10** | AWS S3 Cloud Media Storage | 🕒 Planned | Direct Pre-signed S3 Uploads | `lib/s3.js`, Monument Gallery Uploader |
| **11** | Security Hardening & Audits | 🕒 Planned | Rate Limiting, OWASP Checks | Cookie security, CSRF guards, Sanitization |
| **12** | CI/CD & Cloud Deployment | 🕒 Planned | GitHub & Vercel Production | Vercel production deployment, Domain verification |

---

## Phase-by-Phase Technical Specifications

### Phase 1: Project Initialization & Environment Configuration
- **Objectives:** Scaffold a clean Next.js App Router project using JavaScript (ES6+), establish path aliases (`@/*`), integrate Tailwind CSS, and configure development tools.
- **Components to Initialize:** Base HTML layout, font setup, global CSS reset.
- **Files Involved:**
  - `package.json`
  - `next.config.js`
  - `tailwind.config.js`
  - `postcss.config.js`
  - `jsconfig.json`
  - `.env.example` & `.env.local`
  - `app/layout.jsx` & `app/globals.css`
- **Technologies & Dependencies:** Next.js, React 18/19, Tailwind CSS, Autoprefixer, PostCSS.
- **Expected Outcome:** Fast-compiling development server running at `http://localhost:3000` with hot-reload functional and Tailwind classes rendering correctly.
- **Testing Requirements:** Verify `npm run dev` builds with zero warnings; verify path aliases resolve cleanly.

---

### Phase 2: Design System & Reusable UI Component Library
- **Objectives:** Implement the Indian Heritage aesthetic design tokens (Ivory `#FDFBF7`, Sandstone `#D4A373`, Forest Green `#1B4332`, Antique Gold `#C5A059`, Charcoal `#212529`). Build atomic UI components.
- **Components:**
  - `components/ui/Button.jsx` (Primary, Secondary, Outline, Danger variants)
  - `components/ui/Badge.jsx` (Low, Moderate, High crowd color states)
  - `components/ui/Card.jsx`
  - `components/ui/Input.jsx` & `Select.jsx`
  - `components/ui/Modal.jsx`
  - `components/ui/Spinner.jsx`
- **Files Involved:** `components/ui/*`, `constants/crowdLevels.js`.
- **Technologies:** React, Tailwind CSS, Lucide React icons.
- **Dependencies:** `lucide-react`, `clsx`, `tailwind-merge`.
- **Expected Outcome:** Standardized, accessible, responsive component primitives ready for composition.
- **Testing Requirements:** Visual verification across mobile (375px), tablet (768px), and desktop (1280px) viewports; keyboard focus and accessibility audits.

---

### Phase 3: Public Tourism Portal
- **Objectives:** Construct the tourist-facing discovery interface: interactive homepage hero, monument search and filtering grid, detailed monument dossiers, historical summaries, and visiting rules.
- **Components:**
  - `components/common/Navbar.jsx` & `Footer.jsx`
  - `components/common/SimulatedDataBanner.jsx`
  - `components/site/SiteCard.jsx`
  - `components/site/SiteHero.jsx`
  - `components/site/SiteGallery.jsx`
  - `components/site/PricingTable.jsx`
- **Files Involved:**
  - `app/(public)/layout.jsx`
  - `app/(public)/page.jsx`
  - `app/(public)/explore/page.jsx`
  - `app/(public)/sites/[slug]/page.jsx`
- **Technologies:** Next.js Server Components, React Client Components for search filtering, Lucide icons.
- **Dependencies:** Native Fetch, Lucide React.
- **Expected Outcome:** Visitors can seamlessly search monuments (e.g. "Taj Mahal", "Qutub Minar"), filter by state/city, inspect ticket prices, and view historical architecture details.
- **Testing Requirements:** Client-side debounced search responsiveness (<150ms); verify dynamic route resolution for `[slug]` parameters.

---

### Phase 4: Authentication & Visitor Portal
- **Objectives:** Establish secure user registration, login, session management, and visitor account profiles.
- **Components:**
  - `app/(auth)/login/page.jsx`
  - `app/(auth)/register/page.jsx`
  - `context/AuthContext.jsx`
  - `hooks/useAuth.js`
  - `app/(visitor)/profile/page.jsx`
- **Files Involved:**
  - `app/api/auth/register/route.js`
  - `app/api/auth/login/route.js`
  - `app/api/auth/logout/route.js`
  - `app/api/auth/me/route.js`
  - `lib/auth.js`
- **Technologies:** bcryptjs (password hashing), jsonwebtoken / jose (JWT creation and signature), HTTP-only cookies.
- **Dependencies:** `bcryptjs`, `jsonwebtoken`, `cookie`.
- **Expected Outcome:** Users register and sign in; authenticated session state is preserved across page refreshes; unauthorized visitors are redirected from protected routes.
- **Testing Requirements:** Validate rejection of duplicate emails, invalid passwords, expired JWTs, and tampering with cookie payloads.

---

### Phase 5: Heritage Site Booking, Ticket Reservation & Concurrency System (Consolidated & Approved Ready)
- **Objectives:** Implement complete end-to-end monument ticketing, real-time slot inventory, multi-step booking wizard, server-side tariff recalculation with official ASI pricing, mock payment simulation, cryptographic QR digital passes, native multi-document ACID transactions with MongoDB Atlas/replica set, atomic overbooking defense, and exact-once cancellation capacity restoration.
- **Components & Endpoints:**
  - `app/(public)/sites/[slug]/book/page.jsx` (Multi-step booking wizard with categories & Mausoleum add-on)
  - `app/booking/payment/[id]/page.jsx` (Mock payment gateway simulation with UPI/Card/Netbanking)
  - `app/booking/confirmation/[reference]/page.jsx` (Immediate booking confirmation & QR pass view)
  - `app/tickets/[reference]/page.jsx` (Public digital ticket dossier with academic watermark & void overlay)
  - `app/(visitor)/dashboard/page.jsx` (Visitor pass dossier & cancellation control)
  - `app/api/availability/route.js` (Real-time slot availability with demo intervals)
  - `app/api/bookings/route.js` (Atomic multi-document transaction reservation with server-side price protection)
  - `app/api/bookings/[id]/route.js` (Booking details & digital ticket lookup)
  - `app/api/bookings/[id]/cancel/route.js` (Atomic transaction cancellation & capacity restoration)
  - `app/api/payments/mock/route.js` (Atomic transaction payment transition & QR code generator)
  - `app/api/bookings/[id]/regenerate-qr/route.js` (Idempotent QR code recovery endpoint)
- **Technologies:** Next.js App Router, React 18, MongoDB Atlas / Mongoose v8.x, Tailwind CSS, Canvas-free QR code data URL generation (`qrcode`), Lucide React.
- **Audit & Verification:** 73-point comprehensive automated test suite (`tests/run-all-booking-tests.mjs`) verified 100% pass rate:
  - 52 end-to-end concurrency, price tampering, access control, and race defense tests (`tests/booking-e2e-audit.mjs`).
  - 21 multi-document ACID transaction scenarios (`tests/booking-consolidation-audit.mjs`) including rollback after creation failure, slot reservation failure, idempotency replay, and tenant data isolation.

---

### Phase 6: Admin Dashboard & Heritage Site Management
- **Status:** **Consolidated, Exhaustively Tested & Ready for Review**
- **Objectives:** Implement a premium administrative control portal (`/admin`) to monitor live operations, manage heritage monuments, inspect bookings, manage registered visitors, configure time slot carrying capacities, tune demonstration crowd thresholds, export audit-safe CSV reports, and rotate administrative credentials.
- **Pages & Components Created:**
  - `app/admin/layout.jsx` (Responsive administrative layout with desktop sidebar & mobile drawer)
  - `components/admin/AdminSidebar.jsx` (8-module administrative sidebar navigation)
  - `components/admin/AdminHeader.jsx` (System status badge, admin profile, secure sign-out)
  - `app/admin/page.jsx` (Real-time MongoDB KPI metrics, Recharts trends, status distribution, recent activity)
  - `app/admin/sites/page.jsx` (Monument directory with search, state/category filters, active toggle, safe delete guard)
  - `app/admin/sites/new/page.jsx` (Monument registration form with Zod validation, official ASI tariffs, visiting guidelines)
  - `app/admin/sites/[id]/page.jsx` (Monument dossier, tariff schedule, visiting hours, operational stats)
  - `app/admin/sites/[id]/edit/page.jsx` (Monument edit form pre-populated with live data)
  - `app/admin/bookings/page.jsx` (Booking registry with search, status filters, date filters, pagination)
  - `app/admin/bookings/[id]/page.jsx` (Booking dossier with digital pass verification, itemized tariffs, administrative cancellation)
  - `app/admin/users/page.jsx` (Visitor accounts table with search, role filters, suspension toggle, booking history modal)
  - `app/admin/slots/page.jsx` (Time slots grid with occupancy progress, slot creation, carrying capacity floor guard)
  - `app/admin/crowd/page.jsx` (Live density status indicators, hourly timeline chart, simulation threshold tuning)
  - `app/admin/reports/page.jsx` (Financial KPIs, daily revenue trend, monument popularity leaderboard, CSV export)
  - `app/admin/settings/page.jsx` (Admin profile, bcrypt password rotation, system specifications)
- **API Route Handlers:**
  - `app/api/admin/overview/route.js` (Real-time MongoDB metrics & Recharts telemetry)
  - `app/api/admin/sites/route.js` (List & create monuments)
  - `app/api/admin/sites/[id]/route.js` (Get, update, & safe delete monuments)
  - `app/api/admin/sites/[id]/toggle-status/route.js` (Toggle active status)
  - `app/api/admin/bookings/route.js` (List & search bookings with pagination)
  - `app/api/admin/bookings/[id]/route.js` (Booking dossier lookup)
  - `app/api/admin/bookings/[id]/cancel/route.js` (ACID transaction cancellation & capacity restoration)
  - `app/api/admin/users/route.js` (List visitors with booking counts, hash concealment)
  - `app/api/admin/users/[id]/route.js` (Visitor dossier with booking history)
  - `app/api/admin/users/[id]/toggle-status/route.js` (Suspend/activate account, self-deactivation guard)
  - `app/api/admin/slots/route.js` (List & create time slots)
  - `app/api/admin/slots/[id]/route.js` (Update capacity with reserved-count floor guard, delete unreserved)
  - `app/api/admin/crowd/route.js` (Occupancy calculations & threshold configuration)
  - `app/api/admin/reports/route.js` (Date-filtered financial intelligence)
  - `app/api/admin/reports/export/route.js` (Audit-safe CSV export with formula injection escaping)
  - `app/api/admin/settings/route.js` (Profile & environment specifications)
  - `app/api/admin/settings/password/route.js` (Bcrypt password change)
- **Database Models & Security:**
  - `models/HeritageSite.js` (Mongoose schema with slug uniqueness, official ASI tariffs, coordinates, demonstration capacity)
  - `lib/seedSites.js` (Auto-seeding 6 default monuments from verified ASI catalog)
  - `lib/adminAuth.js` (Server-side `requireAdmin` guard enforcing active session and `role === 'admin'`)
  - `scripts/seed-admin.mjs` (CLI bootstrap script for provisioning admin accounts)
- **Testing & Verification:**
  - 91 total automated tests passing (100% pass rate):
    - 52 Phase 5 E2E Concurrency & Access Control tests (`tests/booking-e2e-audit.mjs`).
    - 21 Phase 5 Consolidated ACID Transaction scenarios (`tests/booking-consolidation-audit.mjs`).
    - 18 Phase 6 Administrative & Security tests (`tests/admin-e2e-audit.mjs`).
  - Production build (`npm run build`) compiled cleanly across all 35 static/SSG/dynamic routes with exit code 0.

---

### Phase 7: Ticket Booking System & Concurrency Protection
- **Objectives:** Build an end-to-end multi-step ticket booking wizard with atomic MongoDB updates preventing overbooking. Issue scannable digital passes.
- **Components:**
  - `app/(visitor)/book/[slug]/page.jsx`
  - `components/booking/DateSelector.jsx`
  - `components/booking/SlotPicker.jsx`
  - `components/booking/VisitorForm.jsx`
  - `components/booking/PriceSummary.jsx`
  - `components/booking/DigitalTicket.jsx`
  - `app/(visitor)/bookings/page.jsx`
  - `app/(visitor)/bookings/[id]/page.jsx`
- **Files Involved:**
  - `app/api/bookings/route.js`
  - `app/api/bookings/[id]/route.js`
  - `app/api/slots/route.js`
  - `services/bookingService.js`
  - `utils/qrGenerator.js`
- **Technologies:** Atomic MongoDB `$inc` with `$gte` conditionals, canvas-based QR generation.
- **Dependencies:** `qrcode`.
- **Expected Outcome:** Tourists select date, view available slots, add visitor details, and receive an instant digital ticket with unique reference and QR code; slots decrement accurately.
- **Testing Requirements:** Concurrent reservation test (simulating 5 users booking the final 2 tickets to prove no overbooking occurs).

---

### Phase 8: Crowd Telemetry & Analytics Dashboard
- **Objectives:** Deploy the crowd monitoring engine with visual occupancy gauges and historical charts. Integrate the algorithmic sensor simulator.
- **Components:**
  - `components/crowd/CrowdGauge.jsx`
  - `components/crowd/HourlyDensityChart.jsx`
  - `components/crowd/WeeklyTrendsChart.jsx`
  - `components/crowd/TurnstileCounter.jsx`
  - `app/(public)/crowd-status/page.jsx`
- **Files Involved:**
  - `lib/crowdSimulator.js`
  - `app/api/crowd/[siteId]/route.js`
  - `app/api/crowd/statistics/route.js`
  - `hooks/useCrowdData.js`
- **Technologies:** Recharts SVG charting library, mathematical distribution modeling.
- **Dependencies:** `recharts`.
- **Expected Outcome:** Real-time animated gauges display current crowd percentages (0-40% Green, 41-70% Amber, 71-100% Red); interactive hourly density curves illustrate peak visiting hours.
- **Testing Requirements:** Telemetry data falls strictly within 0% to 100% bounds; simulated disclaimer banner displays prominently.

---

### Phase 9: Admin Operations Dashboard & Turnstile Controller
- **Objectives:** Provide monument curators with a unified command center: aggregate visitor numbers, revenue metrics, real-time turnstile check-in/out scanner, and emergency capacity throttles.
- **Components:**
  - `app/(admin)/admin/dashboard/page.jsx`
  - `app/(admin)/admin/turnstile/page.jsx`
  - `components/admin/StatCard.jsx`
  - `components/admin/ScannerModal.jsx`
- **Files Involved:**
  - `app/api/admin/dashboard/route.js`
  - `app/api/crowd/check-in/route.js`
  - `app/api/crowd/check-out/route.js`
- **Technologies:** Dynamic Recharts dashboards, camera or manual input QR validator.
- **Dependencies:** Lucide React, Recharts.
- **Expected Outcome:** Turnstile controllers scan ticket QR codes to record immediate entry (+1 count) and exit (-1 count); dashboard updates immediately.
- **Testing Requirements:** Double check-in prevention (preventing reuse of the same ticket); invalid date ticket rejection.

---

### Phase 10: AWS S3 Cloud Media Storage Integration
- **Objectives:** Implement secure, scalable monument image storage via AWS S3 using pre-signed upload URLs.
- **Components:**
  - `lib/s3.js` (AWS SDK v3 S3 client)
  - `app/api/admin/media/sign-url/route.js`
  - Monument image upload UI inside `SiteForm.jsx`
- **Files Involved:** `lib/s3.js`, `next.config.js` (remotePatterns).
- **Technologies:** AWS SDK for JavaScript v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`).
- **Dependencies:** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`.
- **Expected Outcome:** High-resolution monument images upload directly to S3 buckets; secure URLs persist in MongoDB without exposing AWS Secret Keys to the browser.
- **Testing Requirements:** Upload file size limits (5 MB max), MIME type restriction (`image/jpeg`, `image/webp`, `image/png`).

---

### Phase 11: Testing, Security Hardening & Form Validation
- **Objectives:** Perform comprehensive security audits, sanitize inputs, enforce rate-limiting on sensitive endpoints, and ensure cross-browser responsiveness.
- **Tasks:**
  - Audit OWASP Top 10 vulnerabilities (NoSQL injection, XSS, broken access controls).
  - Add rate-limiting middleware for `/api/auth/*` and `/api/bookings`.
  - Validate all forms with client-side and server-side checks.
- **Files Involved:** `middleware.js`, `utils/validators.js`.
- **Expected Outcome:** Clean, resilient application free of unhandled exceptions or data leakage.
- **Testing Requirements:** Complete end-to-end user journeys (Register $\to$ Explore $\to$ Book $\to$ Check-in $\to$ Check-out $\to$ Admin Review).

---

### Phase 12: GitHub CI/CD & Vercel Production Deployment
- **Objectives:** Push the validated codebase to GitHub, configure production environment variables on Vercel, link MongoDB Atlas and AWS S3, and verify production deployment.
- **Tasks:**
  - Configure `.env.production` in Vercel project settings.
  - Execute production build locally (`npm run build`) to ensure zero bundling errors.
  - Trigger Vercel Edge deployment and verify SSL/HTTPS certificates.
- **Files Involved:** `next.config.js`, Vercel Deployment Dashboard.
- **Expected Outcome:** Publicly accessible, high-performance web platform running on Vercel with zero downtime.
- **Testing Requirements:** Lighthouse audit scoring >90 for Performance, Accessibility, and Best Practices.
