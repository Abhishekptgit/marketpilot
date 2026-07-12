# 🚀 MarketPilot — Dubai Ad & Event Content Planner

A multi-tenant SaaS web app for small/medium companies in Dubai to plan social media posts and ads around business events/campaigns, with an editable calendar view and a read-only client-approval link.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)

---

## ✨ Features

### 📊 Dashboard
- Campaign overview with post counts, status badges, and category colors
- Quick stats: total campaigns, active, total posts, drafts
- Create, edit, delete campaigns inline

### 📅 30-Day Content Calendar
- **Month & Week views** — toggle between overview and detailed daily layout
- **Click any date** to create a new post
- **Click any post** to view, edit, or delete
- **Drag & drop** posts between dates to reschedule
- **Quick status update** — one-click draft → scheduled → approved → published
- **Filter** by platform (Instagram, Facebook, TikTok, LinkedIn, Google Ads) and status
- Platform legend with post counts

### 📝 Post Editor
- Side panel editor with title, caption, platform, date/time, status, image URL
- Works from both the Calendar and Event detail pages

### 🔗 Client Share Links
- Generate a **public read-only link** for any campaign
- Clients can view the content calendar, **comment**, and **approve** posts — no login needed
- **Open Link** button to preview the share page in a new tab

### ⚙️ Settings
- Company name, logo, industry
- **Category manager** — add, edit, delete, reorder with color picker
- 12 preset colors to choose from

### 🏢 Industry Templates
Pre-loaded category templates on signup:
| Industry | Categories | Custom Field |
|----------|-----------|--------------|
| Real Estate | Property Launch, Open House, Price Drop, Sold Announcement | Project/Unit |
| F&B / Retail | Menu Promo, New Branch, Seasonal Offer, Flash Sale | Branch/Location |
| Aesthetics / Clinic | Clinic Offer, New Treatment, Before/After Feature | Treatment Type |
| Construction / B2B | Tender Update, Project Milestone, Site Launch | Project Reference |
| SaaS / Tech | Feature Launch, Webinar, Case Study | Product/Module |
| Other | Announcement, Promotion, Event | — |

---

## 🛠️ Tech Stack

- **Frontend + Backend:** Next.js 16 (App Router, TypeScript)
- **Database:** PostgreSQL with Drizzle ORM
- **Styling:** Tailwind CSS 4
- **Auth:** Cookie-based sessions with bcrypt

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### 1. Clone & Install

```bash
git clone https://github.com/Abhishekptgit/marketpilot.git
cd marketpilot
npm install
```

### 2. Set up environment

Create a `.env` file:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
```

### 3. Push database schema

```bash
npx drizzle-kit push
```

### 4. Seed demo data (optional)

```bash
npx tsx src/db/seed.ts
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Demo Accounts

| Industry | Email | Password |
|----------|-------|----------|
| 🏠 Real Estate | `demo-realestate@marketpilot.ae` | `demo123` |
| 💉 Aesthetics | `demo-clinic@marketpilot.ae` | `demo123` |
| 🏗️ Construction | `demo-construction@marketpilot.ae` | `demo123` |

### Share Links (no login needed)
- `/share/demo-realestate-share`
- `/share/demo-clinic-share`
- `/share/demo-construction-share`

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (app)/                    # Authenticated app pages
│   │   ├── app-shell.tsx         # Sidebar layout
│   │   ├── calendar/page.tsx     # 30-Day Content Calendar
│   │   ├── dashboard/page.tsx    # Campaign dashboard
│   │   ├── events/[id]/page.tsx  # Event detail + posts
│   │   ├── settings/page.tsx     # Company & category settings
│   │   └── layout.tsx            # Auth guard
│   ├── api/                      # API routes
│   │   ├── auth/                 # Login, signup, logout
│   │   ├── calendar/             # Calendar posts endpoint
│   │   ├── categories/           # Category CRUD
│   │   ├── company/              # Company settings
│   │   ├── events/               # Event CRUD
│   │   ├── posts/                # Post CRUD
│   │   └── share/                # Share link + comments
│   ├── share/[token]/page.tsx    # Public client share view
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── page.tsx                  # Landing page
├── db/
│   ├── index.ts                  # Database connection
│   ├── schema.ts                 # Drizzle ORM schema
│   └── seed.ts                   # Demo data seeder
└── lib/
    ├── auth.ts                   # Session management
    └── industry-templates.ts     # Industry configs
```

---

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `companies` | Workspace/tenant with name, logo, industry |
| `users` | Auth users linked to companies |
| `sessions` | Cookie-based auth sessions |
| `categories` | Per-company color-coded categories |
| `events` | Campaigns with dates, budget, status, custom fields |
| `posts` | Social media posts with platform, schedule, status |
| `share_links` | Public read-only access tokens |
| `post_comments` | Client comments & approvals on shared posts |

---

## 🌐 Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your `marketpilot` repo
4. Add environment variable: `DATABASE_URL` (use a cloud PostgreSQL like [Neon](https://neon.tech) or [Supabase](https://supabase.com))
5. Deploy!

---

## 📋 Roadmap (v2)

- [ ] Meta/Google Ads API integration (auto-publish)
- [ ] AI content generation for captions
- [ ] Billing & payments (Stripe)
- [ ] Team invitations by email
- [ ] File upload for post images
- [ ] Notification system
- [ ] Analytics dashboard

---

## 📄 License

MIT

---

**Built for Dubai businesses 🇦🇪** — Real Estate, F&B, Clinics, Construction, SaaS & more.
