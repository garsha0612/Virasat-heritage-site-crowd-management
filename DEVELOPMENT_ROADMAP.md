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
| **01** | Project Initialization & Config | 🕒 Planned | Next.js 14/15, Tailwind, Tooling | `package.json`, `next.config.js`, `tailwind.config.js` |
| **02** | Design System & Reusable UI | 🕒 Planned | Indian Heritage Palette, Atoms | `Button.jsx`, `Badge.jsx`, `Card.jsx`, `Modal.jsx` |
| **03** | Public Tourism Portal | 🕒 Planned | Explore & Monument Details | `/`, `/explore`, `/sites/[slug]`, `Navbar.jsx` |
| **04** | Authentication & Visitor Portal | 🕒 Planned | JWT, Sessions, Protected Views | `/login`, `/register`, `/profile`, `AuthContext.jsx` |
| **05** | MongoDB Database Integration | 🕒 Planned | Mongoose Connection & Schemas | `lib/db.js`, 5 Mongoose Models, Compound Indexes |
| **06** | Heritage Site Management | 🕒 Planned | Monument CRUD & Quota Engine | `/api/sites/*`, Admin Site Editor |
| **07** | Ticket Booking & Concurrency | 🕒 Planned | Atomic Slot Reservation & QR | `POST /api/bookings`, Booking Wizard, Digital Pass |
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

### Phase 5: MongoDB Database Integration & Mongoose Modeling
- **Objectives:** Configure the connection pool to MongoDB Atlas (`heritageDB`) with singleton caching for serverless environments. Create strictly typed Mongoose schemas with compound indexes.
- **Components:**
  - `lib/db.js` (Cached client connection)
  - `models/User.js`
  - `models/HeritageSite.js`
  - `models/TimeSlot.js`
  - `models/Booking.js`
  - `models/CrowdStatistics.js`
- **Files Involved:** `lib/db.js`, `models/*`.
- **Technologies:** MongoDB Atlas, Mongoose v8.x.
- **Dependencies:** `mongoose`.
- **Expected Outcome:** High-resilience database connection established; collections auto-index without performance bottlenecks.
- **Testing Requirements:** Validate connection pooling across concurrent route invocations; verify compound unique index enforcement on `TimeSlot(siteId, date, startTime)`.

---

### Phase 6: Heritage Site Administration
- **Objectives:** Implement administrative controls to create, update, and manage heritage destinations, ticket price tiers, operating schedules, and capacity limits.
- **Components:**
  - `app/(admin)/admin/sites/page.jsx`
  - `app/(admin)/admin/sites/new/page.jsx`
  - `app/(admin)/admin/sites/[id]/edit/page.jsx`
  - `components/admin/SiteForm.jsx`
- **Files Involved:**
  - `app/api/sites/route.js`
  - `app/api/sites/[id]/route.js`
  - `services/siteService.js`
- **Technologies:** Next.js Route Handlers, Role-Based Access Control (`role === 'admin'`).
- **Dependencies:** Mongoose, Zod or custom validator.
- **Expected Outcome:** Administrators can add new heritage destinations, modify adult/child/foreigner rates, and adjust carrying capacities.
- **Testing Requirements:** Attempting non-admin access returns HTTP 403 Forbidden; verify slug auto-generation and uniqueness.

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
