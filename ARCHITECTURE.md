# System Architecture Specification
## Heritage Site Crowd Management System

---

### Document Overview
- **Project Title:** Heritage Site Crowd Management System
- **Classification:** College Continuous Assessment (CA) Project / Production-Oriented System Architecture
- **Lead Role:** Senior Software Architect, Full-Stack Engineer, Database Architect & Technical Project Lead
- **Target Platform:** Web (Desktop, Tablet, Mobile Responsive)
- **Primary Tech Stack:** Next.js (App Router, JavaScript ES6+), React.js, Tailwind CSS, MongoDB Atlas (Mongoose ODM), AWS S3, Vercel

---

## 1. Executive Summary & System Objectives

The **Heritage Site Crowd Management System** is a smart-tourism and crowd analytics platform engineered for prominent national monuments, cultural heritage sites, and historical destinations (e.g., Taj Mahal, Red Fort, Qutub Minar, Victoria Memorial, Ajanta & Ellora Caves). 

The platform addresses two complementary operational challenges:
1. **Visitor Experience (Public/Tourist Facing):** Empowers tourists to discover historical context, inspect high-resolution galleries, understand visiting rules, assess expected crowd density in advance, reserve time-slotted digital entry passes, and receive real-time entry alerts.
2. **Administrative Capacity & Safety Governance (Admin Facing):** Provides site curators, heritage officers, and ticket controllers with automated crowd telemetry, live-style turnstile ingress/egress accounting, dynamic quota management, historical crowd density analytics, and instant anomaly alerts to prevent hazardous overcrowding and wear-and-tear on fragile monument infrastructure.

> [!NOTE]
> **Data Disclosure Standard:** In accordance with architectural integrity requirements, all real-time crowd metrics are generated via a high-fidelity algorithmic simulation engine (mimicking turnstile sensors and ticketing gate counters) unless specifically bridged to physical IoT turnstile hardware or official governmental ASI/ministry APIs.

---

## 2. Layered Architecture Breakdown

The system is structured into seven distinct architectural layers adhering to the **Separation of Concerns (SoC)** principle:

```
+-----------------------------------------------------------------------------------+
|                           1. PRESENTATION LAYER                                   |
|  Tailwind CSS v3 | Heritage Palette (Ivory/Sandstone/Forest Green/Antique Gold)  |
|  Lucide React Icons | Recharts Interactive Canvas | Fully Responsive Breakpoints |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        2. FRONTEND APPLICATION LAYER                              |
|  Next.js App Router | React Server Components (RSC) & Client Components ('use client') |
|  React 18 Hooks (useState, useEffect, useContext) | Custom Hooks | Auth Context   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                           3. BACKEND / API LAYER                                  |
|  Next.js Route Handlers (/api/*) | Node.js Runtime | RESTful Endpoint Specifications |
|  JWT & Cookie-Based Middleware | Request Validation & Input Sanitization Layer     |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        4. BUSINESS LOGIC & DOMAIN LAYER                           |
|  Atomic Booking Engine | Anti-Overbooking Concurrency Lock | Ticket Fee Calculator|
|  Crowd Density Classification (Low/Mod/High) | Algorithmic Telemetry Simulator     |
+-----------------------------------------------------------------------------------+
                         │                                         │
                         ▼                                         ▼
+------------------------------------+   +------------------------------------------+
|         5. DATABASE LAYER          |   |          6. CLOUD STORAGE LAYER          |
|  MongoDB Atlas Cluster (heritageDB)|   |  AWS S3 Bucket: `heritage-site-media`    |
|  Mongoose ODM Schema Models        |   |  Pre-signed Upload URLs | Direct Ingress |
|  Atomic Updates ($inc, $set)       |   |  Public CDN Distribution for Web Assets  |
+------------------------------------+   +------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                    7. DEPLOYMENT & INFRASTRUCTURE LAYER                           |
|  Vercel Edge Network & Serverless Lambda Functions | Environment Isolation         |
|  MongoDB Atlas Managed VPC | AWS IAM Least-Privilege Role Security                |
+-----------------------------------------------------------------------------------+
```

### 2.1 Layer Responsibilities & Protocols

#### 1. Presentation Layer
- **Components:** Built using Tailwind CSS, adhering to an Indian Heritage aesthetic: Ivory (`#FDFBF7`), Sandstone (`#D4A373`), Forest Green (`#1B4332`), Antique Gold (`#C5A059`), and Charcoal (`#212529`).
- **Icons & Graphics:** Lucide React icons for intuitive wayfinding; Recharts for SVG-rendered real-time crowd gauges, hourly capacity area charts, and visitor demographic bars.
- **Protocol:** Semantic HTML5 compiled through JSX; client-side browser DOM rendering.

#### 2. Frontend Application Layer
- **Server Components:** Default execution mode in Next.js App Router. Renders static heritage descriptions, architectural histories, and initial SEO payloads on the server without shipping JavaScript bundles to the browser.
- **Client Components (`'use client'`):** Reserved for dynamic forms, booking date/time slot selectors, real-time telemetry polling, modal windows, and interactive analytics charts.
- **State Management:** React `useState`, `useReducer`, and Context API (`AuthContext`, `CrowdContext`) avoid third-party state bloat (e.g., Redux) while sustaining reactivity.

#### 3. Backend / API Layer
- **Route Handlers:** Pure Node.js execution through Next.js `app/api/**/route.js`. Handles standard HTTP verbs (`GET`, `POST`, `PATCH`, `DELETE`).
- **Gateways & Middleware:** Edge/Node.js middleware inspects HTTP-only session cookies, validates JWT authenticity, extracts `user.role`, and routes unauthorized traffic away from protected visitor or admin enclaves.

#### 4. Business Logic & Domain Layer
- **Atomic Booking Pipeline:** Handles booking transactions by checking slot thresholds and incrementing `bookedCount` within atomic MongoDB transactions (`findOneAndUpdate` with `$inc` and `$expr`), guaranteeing zero double-booking under concurrency.
- **Crowd Classification Algorithm:** Dynamically maps instantaneous visitor counts against monument maximum carrying capacities:
  $$\text{Occupancy Percentage} = \left(\frac{\text{Current Active Visitors}}{\text{Maximum Carrying Capacity}}\right) \times 100$$
  - `0% - 40%`: **Low Density** (Optimal for photography, relaxed exploration).
  - `41% - 70%`: **Moderate Density** (Standard flow, minimal queuing).
  - `71% - 100%`: **High Density** (Approaching safety limits; warning banners triggered).
- **Telemetry Ingestion & Simulation Engine:** Generates realistic pedestrian distributions (arrival surges at 10:00 AM and 03:00 PM; tapering near closing hours).

#### 5. Database Layer
- **Engine:** MongoDB Atlas (`heritageDB`).
- **ODM:** Mongoose with connection pooling and cached singleton connection instances across serverless executions.
- **Data Integrity:** Schema-enforced validation, unique compound indexing (preventing identical time slots per monument per day), and cascading updates.

#### 6. Cloud Storage Layer
- **Provider:** Amazon Web Services (AWS) Simple Storage Service (S3).
- **Architecture:** Client-side pre-signed URL retrieval. Images flow directly from client browser to S3 via temporary cryptographically signed AWS STS tokens, offloading large binary transfers from Next.js serverless functions.

#### 7. Deployment Infrastructure Layer
- **Provider:** Vercel (Global Edge Network + Serverless Node.js compute).
- **Integration:** Automated GitHub webhook deployments, environment variable scoping (`production`, `preview`, `development`), and health probe verification.

---

## 3. Next.js vs. React.js: Technical Distinction & Architectural Roles

A common misconception in academic projects is treating React and Next.js as competing or detached libraries. In our architecture:

> **Fundamental Principle:** Next.js is not a replacement for React; **Next.js is a full-stack meta-framework built on top of React**. React acts as the *component view engine*, while Next.js acts as the *application container, compiler, and server architecture*.

| Architectural Concern | React.js Responsibility | Next.js App Router Responsibility |
| :--- | :--- | :--- |
| **Component Model** | Functional UI components, JSX syntax, Props passing, component lifecycle. | Distinguishes between Server Components (RSC) and Client Components (`'use client'`). |
| **State & Interactivity** | `useState`, `useEffect`, `useContext`, local component state. | Manages route-level cache, server cache revalidation (`revalidatePath`, `revalidateTag`). |
| **Routing** | Historically requires client-side libraries (e.g., `react-router-dom`). | **File-system based App Router** with route groups `(public)`, `(admin)`, dynamic segments `[slug]`, `[id]`. |
| **Rendering Strategy** | Client-Side Rendering (CSR) via DOM hydration. | **Hybrid Rendering:** Server-Side Rendering (SSR), Static Site Generation (SSG), and streaming with Suspense. |
| **Backend & APIs** | None (purely client-side UI library). | **Full-Stack Route Handlers (`route.js`)** providing native REST API micro-endpoints running in Node.js. |
| **Data Fetching** | Fetch inside `useEffect` or React Query on the client. | Direct asynchronous `async/await` data fetching directly inside Server Components before HTML generation. |
| **SEO & Document Head** | Requires external libraries (e.g., React Helmet). | Native declarative `generateMetadata()` API rendering server-baked OpenGraph and meta tags. |
| **Asset Optimization** | Standard `<img>` elements without automatic resizing. | `<Image />` component with automatic WebP conversion, lazy loading, and responsive sizing. |

---

## 4. End-to-End System Workflow Diagrams (Mermaid)

### Diagram 1: Complete Layered Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["1. Client / Browser Tier"]
        Browser["End-User Web Browser (Desktop / Mobile)"]
        UI["React 18 JSX + Tailwind CSS UI"]
    end

    subgraph EdgeLayer ["2. Edge & Routing Tier (Next.js App Router)"]
        Middleware["auth.middleware.js\n(JWT & Route Protection)"]
        RSC["Server Components (RSC)\n(Static Site Layouts & SEO)"]
        RCC["Client Components ('use client')\n(Booking Form, Charts, Live Telemetry)"]
    end

    subgraph APILayer ["3. REST API Layer (Next.js Route Handlers)"]
        AuthAPI["/api/auth/*\n(Login, Register, Session)"]
        SitesAPI["/api/sites/*\n(Monuments, Pricing, Slugs)"]
        BookingAPI["/api/bookings/*\n(Slots, Payments, Tickets)"]
        CrowdAPI["/api/crowd/*\n(Sensors, Check-in, Analytics)"]
        AdminAPI["/api/admin/*\n(Capacity, Quotas, Logs)"]
    end

    subgraph ServiceLayer ["4. Domain & Business Logic Tier"]
        AuthService["Auth & Token Service\n(bcrypt + JWT)"]
        BookingService["Booking Engine\n(Atomic Capacity Reservation)"]
        CrowdService["Crowd Analytics Engine\n(Telemetry Simulation & Classification)"]
        S3Service["Media Storage Manager\n(AWS Pre-signed URL Signer)"]
    end

    subgraph DataLayer ["5. Persistence & Storage Tier"]
        MongoDB[("MongoDB Atlas (heritageDB)\nUsers | Sites | Bookings\nTimeSlots | CrowdStats")]
        S3Bucket[("AWS S3 Bucket\n(Monuments & Gallery Media)")]
    end

    Browser --> UI
    UI --> Middleware
    Middleware --> RSC
    Middleware --> RCC
    RCC -->|Fetch / REST API| APILayer
    RSC -->|Direct Service Calls| ServiceLayer
    
    AuthAPI --> AuthService
    SitesAPI --> S3Service
    SitesAPI --> MongoDB
    BookingAPI --> BookingService
    CrowdAPI --> CrowdService
    AdminAPI --> BookingService
    AdminAPI --> CrowdService

    AuthService --> MongoDB
    BookingService --> MongoDB
    CrowdService --> MongoDB
    S3Service --> S3Bucket
```

---

### Diagram 2: User Registration & Authentication Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User as Visitor / Admin
    participant UI as React Client Component (LoginForm / RegisterForm)
    participant API as /api/auth/[register|login]
    participant BCrypt as Password Engine (bcryptjs)
    participant DB as MongoDB Atlas (Users Collection)
    participant JWT as Token Manager (jose / jsonwebtoken)

    User->>UI: Input Credentials (Email, Password, Name)
    UI->>API: POST /api/auth/register or /api/auth/login
    API->>API: Validate input schema (Regex, Required fields)
    
    alt Registration Flow
        API->>DB: Check if user exists (email lookup)
        DB-->>API: User status
        API->>BCrypt: Hash plaintext password (12 salt rounds)
        BCrypt-->>API: Return passwordHash
        API->>DB: Insert new User (Role: 'visitor')
        DB-->>API: Document created
    else Login Flow
        API->>DB: Find user by email
        DB-->>API: Return user document with passwordHash
        API->>BCrypt: Compare plaintext password with hash
        BCrypt-->>API: Comparison boolean result
    end

    API->>JWT: Generate JWT Payload { id, email, role } (Expiry: 24h)
    JWT-->>API: Signed JWT String
    API-->>UI: Set-Cookie: token=JWT; HttpOnly; Secure; SameSite=Lax; Path=/
    UI-->>User: Redirect to /dashboard or /explore (Updated AuthState)
```

---

### Diagram 3: High-Concurrency Ticket Booking Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Visitor as Tourist / Visitor
    participant BookingUI as Booking Wizard (Client Component)
    participant API as POST /api/bookings
    participant Engine as Booking Domain Engine
    participant DB as MongoDB Atlas (Transactions / Atomic $inc)
    participant Mailer as Digital Pass Generator

    Visitor->>BookingUI: Select Site, Date, Time Slot (e.g. 10:00 AM - 12:00 PM), Quantity
    BookingUI->>API: POST /api/bookings with JWT Cookie
    API->>API: Verify Tourist Identity & Sanitize Input
    API->>Engine: Initiate Slot Reservation(siteId, slotId, quantity)
    
    Engine->>DB: findOneAndUpdate(\n  { _id: slotId, availableCount: { $gte: quantity } },\n  { $inc: { bookedCount: quantity, availableCount: -quantity } },\n  { new: true }\n)
    
    alt Slot Has Insufficient Capacity (Sold Out)
        DB-->>Engine: null (Atomic condition failed)
        Engine-->>API: Error: CapacityExceeded
        API-->>BookingUI: HTTP 409 Conflict ("Selected slot is fully booked")
        BookingUI-->>Visitor: Show alternate available slots
    else Capacity Reserved Successfully
        DB-->>Engine: Updated TimeSlot document
        Engine->>Engine: Calculate Total Amount (Tiered: Adults, Children, Foreigners)
        Engine->>Engine: Generate Cryptographic Booking Reference (e.g., HST-2026-9812A)
        Engine->>DB: Insert Booking Record (Status: 'confirmed', QR payload)
        DB-->>Engine: Booking Saved
        Engine->>Mailer: Generate Digital Ticket (QR Code + Pass Details)
        Engine-->>API: Return Booking Receipt & Ticket ID
        API-->>BookingUI: HTTP 201 Created { bookingReference, ticketData }
        BookingUI-->>Visitor: Render Digital Ticket with Download / Print capability
    end
```

---

### Diagram 4: Crowd Monitoring & Live Turnstile Telemetry

```mermaid
flowchart TD
    subgraph DataIngestion ["1. Ingress & Egress Ingestion"]
        TurnstileIn["Turnstile / Gate Entry Check-in\nPOST /api/crowd/check-in"]
        TurnstileOut["Turnstile / Gate Exit Check-out\nPOST /api/crowd/check-out"]
        Simulator["Simulated Telemetry Engine\n(Periodic Inflow/Outflow Generator)"]
    end

    subgraph Processing ["2. Real-Time Processing & State Sync"]
        Controller["Crowd Controller Logic"]
        AtomicUpdate["MongoDB Atomic Updates:\nHeritageSite: $inc { currentVisitors: +1 / -1 }\nCrowdStatistics: Hourly snapshot upsert"]
    end

    subgraph Classification ["3. Dynamic Capacity Classification"]
        Calc["Occupancy = (Current Visitors / Max Capacity) * 100"]
        Low["0% - 40%: LOW (Green)\nSmooth pedestrian movement"]
        Mod["41% - 70%: MODERATE (Amber)\nNormal flow, monitor bottlenecks"]
        High["71% - 100%: HIGH (Red)\nAutomated booking throttle & turnstile alert"]
    end

    subgraph ConsumerViews ["4. Multi-Tenant Broadcast"]
        VisitorView["Visitor Portal:\nLive Crowd Indicator & Best-Time-To-Visit badge"]
        AdminDashboard["Admin Dashboard:\nRecharts Density Curve, Ingress/Egress Rates, Gate Control"]
    end

    TurnstileIn --> Controller
    TurnstileOut --> Controller
    Simulator --> Controller
    Controller --> AtomicUpdate
    AtomicUpdate --> Calc
    Calc --> Low
    Calc --> Mod
    Calc --> High
    Low --> VisitorView
    Mod --> VisitorView
    High --> VisitorView
    Low --> AdminDashboard
    Mod --> AdminDashboard
    High --> AdminDashboard
```

---

### Diagram 5: Administrator Site & Capacity Governance Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Site Curator / Administrator
    participant AdminUI as Next.js Admin Portal (/admin/*)
    participant AdminAPI as Next.js Admin Route Handlers
    participant Middleware as Role Authorization Guard
    participant DB as MongoDB Atlas

    Admin->>AdminUI: Access /admin/sites or /admin/dashboard
    AdminUI->>Middleware: Inspect Session Token
    alt Role != 'admin'
        Middleware-->>AdminUI: HTTP 403 Forbidden (Redirect to /unauthorized)
    else Role == 'admin'
        Middleware-->>AdminAPI: Forward verified Admin Request
        AdminAPI->>DB: Fetch Aggregated Metrics (Total Bookings, Active Visitors, Revenue)
        DB-->>AdminAPI: Aggregation Results
        AdminAPI-->>AdminUI: Render Admin Dashboard
    end

    Admin->>AdminUI: Modify Site Capacity / Adjust Slot Limits / Blackout Dates
    AdminUI->>AdminAPI: PATCH /api/sites/[id] or PATCH /api/slots/[id]
    AdminAPI->>DB: Atomic Update Document
    DB-->>AdminAPI: Updated Document Confirmation
    AdminAPI-->>AdminUI: Toast: "Configuration updated successfully"
```

---

### Diagram 6: AWS S3 Media Asset Direct Upload Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Content Manager
    participant Browser as Admin Browser Client
    participant API as /api/admin/media/sign-url
    participant AWS_STS as AWS S3 / STS Service
    participant S3 as AWS S3 Bucket (heritage-site-media)
    participant DB as MongoDB Atlas (heritageSites)

    Admin->>Browser: Select Monument Image (e.g., taj_mahal_facade.jpg)
    Browser->>Browser: Validate MIME type (image/jpeg, image/webp) & size (< 5MB)
    Browser->>API: POST /api/admin/media/sign-url { fileName, fileType, folder: 'sites' }
    API->>API: Verify Admin Permissions
    API->>AWS_STS: Request PutObjectCommand Pre-signed URL (Expiry: 5 mins)
    AWS_STS-->>API: Returns https://s3.amazonaws.com/...?...AWSAccessKeyId...
    API-->>Browser: HTTP 200 { uploadUrl, filePermanentUrl }
    
    Browser->>S3: PUT [uploadUrl] (Raw binary stream directly to S3)
    S3-->>Browser: HTTP 200 OK (Uploaded without passing through Next.js server)
    
    Browser->>API: PATCH /api/sites/[id] { heroImage: filePermanentUrl }
    API->>DB: Update site record with S3 CDN image URL
    DB-->>API: Acknowledged
    API-->>Browser: Site Media Updated Successfully
```

---

### Diagram 7: Application Deployment & Hosting Architecture

```mermaid
flowchart LR
    subgraph Development ["Local Workstation"]
        Dev["Developer (VS Code / Antigravity)"]
        GitRepo["Git Version Control"]
    end

    subgraph CI_CD ["CI / CD Pipeline"]
        GitHub["GitHub Repository\n(main branch)"]
        VercelHook["Vercel Deployment Trigger"]
    end

    subgraph CloudProduction ["Production Cloud Infrastructure"]
        subgraph VercelEdge ["Vercel Global Platform"]
            EdgeDNS["Global Anycast DNS"]
            EdgeStatic["Edge Static Cache (HTML, JS, CSS)"]
            NodeFunctions["Serverless Node.js Route Handlers\n(/api/*)"]
        end
        
        subgraph AtlasCluster ["MongoDB Atlas Cloud"]
            ReplicaSet[("Primary Database (heritageDB)\nM0 / Dedicated Replica Set")]
        end

        subgraph AWSStorage ["Amazon Web Services"]
            S3Bucket[("AWS S3 Bucket\n(heritage-site-media)")]
        end
    end

    Dev -->|git commit & push| GitRepo
    GitRepo --> GitHub
    GitHub -->|Webhook| VercelHook
    VercelHook -->|Automated Build & Lint| VercelEdge
    EdgeDNS --> EdgeStatic
    EdgeDNS --> NodeFunctions
    NodeFunctions -->|Mongoose TLS Connection Pool| ReplicaSet
    NodeFunctions -->|AWS SDK v3 Pre-signing| S3Bucket
```

---

## 5. Architectural Quality Attributes & Non-Functional Requirements (NFR)

1. **Scalability:** By leveraging Next.js Server Components, over 80% of public page requests (historical overview, site descriptions) are rendered statically or cached at the Edge, shielding the MongoDB database from high-volume tourist read traffic.
2. **Availability:** Database is provisioned via MongoDB Atlas multi-zone replica sets, guaranteeing 99.95% uptime and automated failover.
3. **Data Consistency:** All ticketing and slot-booking operations employ atomic conditionals (`$gte`, `$inc`), precluding overselling without necessitating heavy, locking database table locks.
4. **Security & Compliance:** Strict zero-trust posture: passwords hashed via bcrypt (12 rounds), tokens signed via HMAC-SHA256 in HTTP-only cookies, and all cloud media uploads gated via signed tokens.
5. **Transparency:** Crowd metrics render with prominent indicators distinguishing actual physical gate telemetry from algorithmic mathematical projections.
