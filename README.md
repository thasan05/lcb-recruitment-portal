# LinkedIn Community Bangladesh (LCB) — Recruitment & Candidate Portal

> **Where Bangladesh's future leaders connect.**  
> An enterprise-grade recruitment management portal and candidate journey tracking system tailored for **LinkedIn Community Bangladesh (LCB)**.

---

## 🌟 Overview

The **LCB Recruitment Portal** is a specialized recruitment platform designed for the LCB HR & Talent Acquisition team and aspiring candidates across Bangladesh. 

- **For Candidates:** A frictionless, passwordless personal journey tracker (`/candidate/[secure-token]`). Candidates view their live application stage, an interactive horizontal/vertical recruitment stepper, interview details (with instant Google Calendar & `.ics` export), and public announcements from the HR team.
- **For HR Admins:** A centralized administrative console (`/admin`) for candidate evaluation, status pipelines, 1-click candidate link copying, email template generation, interview scheduling, automated time slot generation, and bulk CSV ingestion.
- **Privacy Guaranteed:** Strict data isolation ensures internal HR interview notes and audit trails are completely invisible to candidates.

---

## 🚀 Key Features

### 1. 🎯 Candidate Experience
* **Unique Unguessable Portal Links:** Accessible via private tokens (`/candidate/[secure-token]`). No account registration or passwords required for applicants.
* **Interactive Timeline Stepper:** Completed $\rightarrow$ Current $\rightarrow$ Upcoming visual pipeline. Fully responsive (horizontal on desktop, vertical on mobile).
* **Live Status Progression:** 10 granular statuses (*Application Received, Under Review, Shortlisted, Interview Scheduled, Interview Completed, Final Review, Selected, Waitlisted, Not Selected, Withdrawn*).
* **Comprehensive Interview Module:** Scheduled time in BST (GMT+6), duration, platform (Google Meet/Zoom), panel information, instructions, 1-click **Join Meeting**, **Add to Google Calendar**, and downloadable **.ICS Calendar File**.
* **Public Announcements:** Chronological updates published directly by HR to the candidate's screen.
* **Support Card:** Direct link to LCB Talent Acquisition (`linkedincommunitybangladesh@gmail.com`).

### 2. 🛡️ HR Administration Console (`/admin`)
* **Analytics Dashboard:** Live metrics tracking Total Applications, Under Review, Shortlisted, Interviews Scheduled, Selected, and Not Selected.
* **Candidate Directory:** Instant search by name, email, phone, role, or Application ID (`LCB-2026-XXXX`). Filterable by status and department.
* **1-Click Portal Link & Email Generator:** Pre-crafted, customizable templates for *Application Received, Shortlisted, Interview Scheduled, Selected, Not Selected, and General Update* with one-click copy.
* **Confidential Internal Notes:** Private HR evaluation notes protected behind authentication and database policies.
* **Audit & Activity Log:** Automatic chronological history tracking status updates, interview schedules, and modifications.
* **Batch Slot Generation Assistant:** Automatically generates sequential interview time slots with custom durations and buffer periods, and assigns candidates with 1 click.
* **Bulk Candidate CSV Ingestion:** Drag-and-drop or copy-paste CSV import with validation, error reporting, and auto-generated portal links.
* **CSV Export:** One-click full database export for reporting.

---

## 🛠️ Tech Stack

* **Framework:** Next.js 16 (App Router, Turbopack, React 19)
* **Language:** TypeScript 5
* **Styling:** Tailwind CSS 4, Custom Glassmorphism, CSS Tokens matching official LCB identity (`#040614` background, LinkedIn blue `#0A66C2`, cyan accents `#22D3EE`)
* **Icons:** Lucide React
* **Database & Auth:** Supabase (PostgreSQL, Row Level Security) with dual-mode in-memory local fallback for instant zero-config testing.
* **Deployment:** Vercel

---

## 📦 Getting Started Locally

### 1. Clone & Install
```bash
git clone https://github.com/thasan05/lcb-recruitment-portal.git
cd lcb-recruitment-portal
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Default `.env.local` contents:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Optional for local testing; portal runs with local fallback store if empty)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# HR Admin Credentials
ADMIN_EMAIL=hr@linkedincommunitybangladesh.com
ADMIN_PASSWORD=lcb_recruitment_2026!
ADMIN_SESSION_SECRET=lcb_dev_secret_session_key_2026_recruitment
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Access & Testing

The portal comes pre-seeded with realistic candidate profiles for testing:

### 1. Candidate Portal Links
* **Tanvir Hasan (Interview Stage):** [http://localhost:3000/candidate/tok_lcb_tanvir_h_2026](http://localhost:3000/candidate/tok_lcb_tanvir_h_2026)
* **Sadia Akter (Shortlisted):** [http://localhost:3000/candidate/tok_lcb_sadia_a_2026](http://localhost:3000/candidate/tok_lcb_sadia_a_2026)
* **Rahim Ahmed (Selected):** [http://localhost:3000/candidate/tok_lcb_rahim_a_2026](http://localhost:3000/candidate/tok_lcb_rahim_a_2026)

### 2. HR Admin Console
* **URL:** [http://localhost:3000/admin](http://localhost:3000/admin)
* **Email:** `hr@linkedincommunitybangladesh.com`
* **Password:** `lcb_recruitment_2026!`

---

## 🗄️ Supabase Database Setup

When you are ready to connect a live Supabase project:

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Open [`supabase/migrations/20261001_initial_schema.sql`](./supabase/migrations/20261001_initial_schema.sql) and run the script.
4. The migration script will automatically create:
   - `candidates`
   - `interviews`
   - `candidate_updates`
   - `internal_notes`
   - `activity_logs`
   - Triggers for `last_updated`
   - Indexes and Row Level Security (RLS) policies
   - Seed data
5. Copy your **Project URL** and **API Keys** from Supabase Settings $\rightarrow$ API into `.env.local` or your Vercel project environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

---

## 🚀 Production Build & Deployment

### Build Locally
```bash
npm run build
```
Verify that all static and dynamic routes compile cleanly.

### Deploy to Vercel
1. Push your repository to GitHub.
2. In Vercel, import `lcb-recruitment-portal`.
3. Set the Environment Variables:
   - `NEXT_PUBLIC_APP_URL` $\rightarrow$ Your production domain (e.g. `https://recruitment.linkedincommunitybangladesh.com`)
   - `ADMIN_EMAIL` $\rightarrow$ Your production HR admin email
   - `ADMIN_PASSWORD` $\rightarrow$ A strong production password
   - `ADMIN_SESSION_SECRET` $\rightarrow$ A random 32+ character string
   - `NEXT_PUBLIC_SUPABASE_URL` (if using Supabase)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (if using Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY` (if using Supabase)
4. Deploy!

---

## 🔒 Security & Privacy Model

- **No Public Candidate Enumeration:** Sequential IDs (`LCB-2026-0001`) are never used as public routes. Portals require the cryptographic `secure_token`.
- **Note Isolation:** `internal_notes` are excluded from all candidate-facing endpoints and protected by Supabase RLS.
- **Session Protection:** Admin sessions use encrypted, HTTP-only authentication cookies with a 7-day expiration.
- **Service Role Server-Side Only:** Supabase `service_role` keys are strictly restricted to server environments and never exposed to the client.

---

## 📄 License & Attribution

Developed for **LinkedIn Community Bangladesh (LCB)**.  
Official Website: [https://linkedincommunitybangladesh.com](https://linkedincommunitybangladesh.com)
