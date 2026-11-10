# Heritage Site Crowd Management System
### Virasat — Smart Tourism & Crowd Analytics Platform

> **College Continuous Assessment (CA) Project**  
> **Branch:** `SaiTeja`  
> **Status:** Architecture Design & Phase 1 Project Initialization Complete  

---

## 🏛️ Project Overview

The **Heritage Site Crowd Management System** is a smart-tourism platform engineered for prominent Indian heritage destinations (Taj Mahal, Red Fort, Qutub Minar, Hampi, Sun Temple Konark, Ajanta Caves). The system balances public tourist discovery and digital ticket booking with administrative crowd safety monitoring, turnstile ingress/egress accounting, and real-time capacity management.

> [!NOTE]
> All real-time crowd metrics are generated via an algorithmic simulation engine unless connected to physical turnstile sensors or official ASI/ministry APIs.

---

## 🛠️ Technology Stack

- **Frontend Framework:** Next.js (App Router)
- **Component Engine:** React.js
- **Language Standard:** JavaScript (ES6+) — *Strictly NO TypeScript*
- **Styling & Design System:** Tailwind CSS v3 (Indian Heritage Palette: Ivory, Sandstone, Forest Green, Antique Gold, Charcoal)
- **Icons & Visualizations:** Lucide React, Recharts
- **Backend Architecture:** Next.js Route Handlers (`app/api/**/route.js`) on Node.js
- **Database & ODM:** MongoDB Atlas (`heritageDB`) with Mongoose ODM (5 collections)
- **Cloud Storage:** Amazon Web Services (AWS) S3 for monument photography
- **Deployment Platform:** Vercel

---

## 📚 Complete System Architecture Documentation

The project includes seven comprehensive architectural blueprints and technical specifications:

| Document | Purpose & Contents |
| :--- | :--- |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Complete 7-layer system architecture, Next.js vs React.js responsibilities, end-to-end request flows, and 8 Mermaid workflow diagrams. |
| **[DATABASE_DESIGN.md](./DATABASE_DESIGN.md)** | MongoDB Atlas schema specifications for 5 collections (`users`, `heritagesites`, `timeslots`, `bookings`, `crowdstatistics`), compound indexing, atomic `$inc` concurrency controls, and ER diagram. |
| **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** | RESTful API specifications for Authentication, Sites, Slots, Bookings, Crowd Management, and Administration with request/response envelopes. |
| **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** | Directory tree, route groups `(public)`, `(auth)`, `(visitor)`, `(admin)`, component atoms, custom hooks, and server singletons. |
| **[DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)** | 12-phase sequential implementation roadmap with objectives, deliverables, dependencies, and testing criteria. |
| **[REACT_NEXTJS_MAPPING.md](./REACT_NEXTJS_MAPPING.md)** | Academic CA syllabus cross-reference correlating every React.js and Next.js concept with exact project code files and Viva defense talking points. |
| **[SECURITY.md](./SECURITY.md)** | OWASP Top 10 defenses, bcrypt (12 rounds), HTTP-only cookies, Edge RBAC middleware, atomic anti-overbooking lock, and AWS S3 pre-signed upload security. |

---

## 🗂️ Project Directory Structure

```
heritage-site-crowd-management/
├── app/
│   ├── globals.css                  # Tailwind directives & Indian Heritage tokens
│   ├── layout.jsx                   # Root layout with metadata & fonts
│   └── page.jsx                     # Phase 1 verification showcase with initial monuments
├── components/                      # Modular UI components (atoms, site, booking, crowd, admin)
├── models/                          # Mongoose ODM schemas
├── lib/                             # Server singletons (db.js, auth.js, crowdSimulator.js, s3.js)
├── context/                         # React context providers (AuthContext, CrowdContext)
├── hooks/                           # Custom React hooks (useAuth, useCrowdData, useBooking)
├── services/                        # Client-side API abstraction services
├── utils/                           # Formatters, validators, and calculators
├── constants/                       # Crowd levels, navigation, and state lists
├── jsconfig.json                    # Path aliases (@/*)
├── next.config.js                   # Next.js runtime & image remote patterns
├── package.json                     # Dependencies & scripts
├── postcss.config.js                # PostCSS config
├── tailwind.config.js               # Heritage design system color extensions
└── .env.example                     # Environment variable template
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js v18+ or v20+
- npm v9+

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 📌 Implementation Status

- [x] **System Architecture & Design Blueprints** (All 7 documentation files)
- [x] **Phase 1: Project Initialization & Configuration** (Next.js App Router, Tailwind CSS Heritage Tokens, Path Aliases, Root Layout & Verification Page)
- [ ] **Phase 2: Design System & Reusable UI Components**
- [ ] **Phase 3: Public Tourism Portal**
- [ ] **Phase 4: Authentication & Visitor Portal**
- [ ] **Phase 5: MongoDB Database Integration**
- [ ] **Phase 6: Heritage Site Management**
- [ ] **Phase 7: Ticket Booking System & Concurrency Protection**
- [ ] **Phase 8: Crowd Telemetry & Analytics Dashboard**
- [ ] **Phase 9: Admin Operations Dashboard & Turnstile Controller**
- [ ] **Phase 10: AWS S3 Cloud Media Storage**
- [ ] **Phase 11: Testing, Security Hardening & Form Validation**
- [ ] **Phase 12: GitHub CI/CD & Vercel Deployment**
