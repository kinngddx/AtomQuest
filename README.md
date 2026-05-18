# GoalTrack — Enterprise Goal Management Portal

> **AtomQuest Hackathon Submission** | Full-stack goal-setting & performance tracking portal with multi-role access

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)](https://neon.tech)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?logo=clerk)](https://clerk.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)

---

## 🔗 Live Demo

**Portal URL:** `https://atom-quest-sable-seven.vercel.app/sign-in`

### Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| 👤 Employee | `employee@goaltrack.com` | `Winner@air100` |
| 👔 Manager | `manager@goaltrack.com` | `Winner@air100` |
| 🛡️ Admin | `admin@goaltrack.com` | `Winner@air100` |

---

## 📌 Problem Statement

Organizations struggle to align individual employee goals with company objectives. Traditional methods using spreadsheets lead to:
- No visibility into goal progress across teams
- Manual and delayed approval workflows
- No structured check-in mechanism for quarterly reviews
- Zero audit trail for compliance and reporting

**GoalTrack** solves this with a structured, role-based digital portal where goals are created, reviewed, approved, and tracked — all in one place.

---

## ✨ Key Features

### 👤 Employee
- Create goals with title, thrust area, UOM type, target value, and weightage (must total 100%)
- Submit goals for manager approval
- Perform quarterly check-ins (Q1–Q4) with achievement values
- View personal progress dashboard with completion scores

### 👔 Manager
- Review and approve/reject/return employee goals with inline comments
- Monitor team's goal progress in real time
- Add review comments during quarterly check-ins
- Manage shared goals across team members

### 🛡️ Admin
- Organization-wide analytics dashboard with charts
- Manage performance cycles (year + quarter)
- View and manage all users
- Full audit log of every action in the system
- Export reports to Excel

---

## 🏗️ Architecture Overview

```
Browser (Next.js App Router)
        │
        ▼
┌──────────────────────────────┐
│     Clerk Auth Middleware     │  ← Route protection + Role-based access
└──────────────┬───────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
   Page Routes    API Routes
  /dashboard     /api/goals
  /goals         /api/analytics
  /manager       /api/users
  /admin         /api/webhooks/clerk
        │             │
        └──────┬───────┘
               ▼
┌──────────────────────────────┐
│      Prisma ORM (Client)      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│    Neon PostgreSQL (Cloud)    │  ← Serverless DB
└──────────────────────────────┘
```

See the full [Architecture Diagram](./architecture.png) for a detailed visual.

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Sign-in / Sign-up pages
│   ├── (dashboard)/             # Protected routes
│   │   ├── dashboard/           # Employee dashboard
│   │   ├── goals/               # Goal CRUD + detail view
│   │   ├── checkins/            # Quarterly check-ins
│   │   ├── manager/             # Manager dashboard + approvals
│   │   └── admin/               # Admin analytics + cycles
│   └── api/                     # REST API endpoints
├── components/
│   ├── layout/                  # Sidebar + Header
│   ├── goals/                   # GoalCard, GoalForm, StatusBadge
│   └── dashboard/               # KPICard, ProgressRing, AuditTimeline
├── lib/
│   ├── prisma.ts                 # DB client
│   ├── validations.ts            # Zod schemas
│   └── progress.ts               # Score calculation logic
└── types/index.ts                # Shared TypeScript types
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Clerk (with role-based metadata) |
| Database | Neon PostgreSQL (serverless) |
| ORM | Prisma |
| Charts | Recharts |
| Animations | Framer Motion |
| Notifications | Sonner (toast) |
| Email | Resend |
| Deployment | Vercel |

---

## 🗃️ Database Schema (Key Models)

- **User** — Employee, Manager, Admin with hierarchy (`managerId`)
- **Goal** — Title, thrust area, UOM type, target, weightage, status lifecycle
- **CheckIn** — Quarterly achievement entries per goal per user
- **Approval** — Manager action log (approved / rejected / returned)
- **Cycle** — Performance year + quarter configuration (Admin-controlled)
- **AuditLog** — Every state change recorded for compliance
- **SharedGoalAssignment** — Goals shared across multiple employees

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- npm or yarn
- [Clerk account](https://clerk.com) (free)
- [Neon account](https://neon.tech) (free)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/goaltrack.git
cd goaltrack

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Fill in your Clerk and Neon credentials

# 4. Push DB schema
npx prisma db push

# 5. Seed demo data
npm run db:seed

# 6. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxx
CLERK_SECRET_KEY=sk_test_xxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
CLERK_WEBHOOK_SECRET=whsec_xxxx
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🎭 User Journey (Demo Flow)

```
1. EMPLOYEE logs in
   └─► Creates 3 goals (weightage must total 100%)
       └─► Submits goals for approval

2. MANAGER logs in
   └─► Sees pending approvals notification
       └─► Reviews goals, adds comment, approves

3. EMPLOYEE logs in
   └─► Sees goals are LOCKED (approved)
       └─► Enters Q1 check-in achievement value
           └─► Progress score calculated automatically

4. ADMIN logs in
   └─► Views org-wide analytics chart
       └─► Exports full report to Excel
           └─► Views audit log of all actions
```

---

## 🏆 Bonus Features Implemented

- [x] **Dark Mode** — Full dark/light theme toggle
- [x] **Export to Excel** — Admin can download full goal report
- [x] **Audit Logs** — Every action tracked with old/new values
- [x] **Shared Goals** — One goal assigned across multiple employees
- [x] **Email Notifications** — Goal approval/rejection emails via Resend
- [x] **Mobile Responsive** — Works on all screen sizes

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/goals` | List / Create goals |
| GET/PUT/DELETE | `/api/goals/[id]` | Goal detail operations |
| POST | `/api/goals/[id]/approve` | Manager approve/reject/return |
| POST | `/api/goals/[id]/checkin` | Submit quarterly check-in |
| POST | `/api/goals/shared` | Create shared goal |
| GET | `/api/analytics` | Admin analytics data |
| GET/POST | `/api/users` | User management |
| POST | `/api/webhooks/clerk` | Clerk user sync webhook |

---

## 👨‍💻 Made with ❤️ for AtomQuest Hackathon