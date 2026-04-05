# SupportAI — Customer Service Platform

> An AI-powered customer support platform built with Next.js 14, featuring intelligent ticket routing, real-time analytics, sentiment analysis, and a built-in AI chatbot. Built as a full-stack portfolio project.

![SupportAI Dashboard](public/screenshots/analytics.svg)

---

## Features

- 🤖 **AI-Powered Chatbot** — Streaming conversational AI on every ticket using the Anthropic Claude API (with intelligent mock fallback), responds word-by-word via Server-Sent Events
- 📊 **Real-time Analytics Dashboard** — 30-day ticket volume charts, category distribution, agent performance metrics, and CSAT scores powered by Recharts
- 😤 **Sentiment Analysis & Auto-escalation** — Detects frustrated customers in real time and automatically escalates urgent tickets to human agents
- 📚 **Smart Knowledge Base Suggestions** — AI scans the KB and surfaces the 3 most relevant articles on every ticket using keyword scoring
- 🎯 **Intelligent Ticket Categorization** — Auto-classifies tickets into Technical / Billing / Account / General with a confidence score as the customer types
- 👥 **Role-based Access Control** — Three distinct roles (Admin, Agent, Customer) each with a tailored UI and permissions enforced server-side
- 📱 **Responsive Design** — Mobile-first layout with a collapsible sidebar, works on phones, tablets, and desktops
- 🔐 **Secure Authentication** — Email/password auth via NextAuth.js with bcrypt password hashing

---

## Screenshots

| Landing Page | Dashboard |
|---|---|
| ![Landing](public/screenshots/landing.svg) | ![Dashboard](public/screenshots/dashboard.svg) |

| Ticket List | Ticket Detail + AI Chat |
|---|---|
| ![Tickets](public/screenshots/tickets.svg) | ![Ticket Detail](public/screenshots/ticket-detail.svg) |

| Analytics | Knowledge Base |
|---|---|
| ![Analytics](public/screenshots/analytics.svg) | ![KB](public/screenshots/knowledge-base.svg) |

> **Note:** Run `./take-screenshots.command` (double-click in Finder) to replace these with real PNG screenshots captured from the live app.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite (dev) / PostgreSQL (prod) via Prisma ORM |
| Auth | NextAuth.js v4 |
| AI | Anthropic Claude API (`claude-3-5-haiku`) with mock fallback |
| Charts | Recharts |
| Streaming | Server-Sent Events (SSE) |
| Deployment | Vercel |

---

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/support-platform.git
cd support-platform

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables below)

# 4. Set up the database
npx prisma generate
npx prisma db push

# 5. Seed with demo data (120 tickets, 18 KB articles, demo users)
npm run db:seed

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push Prisma schema to DB
npm run db:seed      # Seed with demo data
npm run db:reset     # Reset DB and re-seed
npm run db:studio    # Open Prisma Studio (DB browser)
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Database
# SQLite (default for local dev — no setup needed)
DATABASE_URL="file:./prisma/dev.db"

# PostgreSQL (for production / Vercel)
# DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here-generate-with-openssl-rand-base64-32"

# Anthropic Claude API (optional — app uses mock AI if omitted)
ANTHROPIC_API_KEY="sk-ant-api03-..."
```

### Generating `NEXTAUTH_SECRET`

```bash
openssl rand -base64 32
```

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@support.dev | admin123 |
| **Agent** | sarah@support.dev | agent123 |
| **Agent** | marcus@support.dev | agent123 |
| **Customer** | alice@example.com | customer123 |

Each role gets a different experience:
- **Admin** — Full access: dashboard, analytics, all tickets, KB management
- **Agent** — Dashboard, analytics, ticket queue (assigned + unassigned)
- **Customer** — Their own tickets only, KB search, AI chatbot

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Split-panel login with demo buttons
│   │   └── register/page.tsx       # Registration form
│   ├── api/
│   │   ├── ai/
│   │   │   ├── categorize/         # POST — auto-categorize ticket
│   │   │   ├── kb-suggestions/     # POST — surface relevant KB articles
│   │   │   └── sentiment/          # POST — analyze message sentiment
│   │   ├── analytics/              # GET  — full analytics payload
│   │   ├── chat/                   # POST — SSE streaming AI chat
│   │   └── tickets/                # CRUD ticket operations
│   ├── dashboard/
│   │   ├── page.tsx                # Agent/admin dashboard
│   │   └── analytics/page.tsx      # Analytics dashboard with charts
│   ├── knowledge-base/page.tsx     # Searchable KB article list
│   ├── tickets/
│   │   ├── page.tsx                # Ticket list with filters
│   │   ├── new/page.tsx            # New ticket form + AI categorization
│   │   └── [id]/page.tsx           # Ticket detail + AI chat
│   └── page.tsx                    # Marketing landing page
├── components/
│   ├── ai/
│   │   ├── AIChat.tsx              # Streaming AI chatbot component
│   │   └── AIKBSuggestions.tsx     # KB suggestion sidebar
│   ├── layout/
│   │   └── AppShell.tsx            # Sidebar + mobile nav
│   ├── tickets/
│   │   ├── MessageThread.tsx       # Ticket message history
│   │   └── TicketActions.tsx       # Status/priority/agent controls
│   └── ui/
│       └── Badge.tsx               # Status, priority, category badges
└── lib/
    ├── auth.ts                     # NextAuth config
    ├── mock-ai.ts                  # Mock AI responses (keyword-based)
    └── prisma.ts                   # Prisma client singleton
```

---

## AI Architecture

The platform has two AI modes that are API-compatible and seamlessly switch:

### Real mode (`ANTHROPIC_API_KEY` set)
Calls the Claude API with full context for intelligent, dynamic responses.

### Mock mode (default / no API key)
`src/lib/mock-ai.ts` implements four AI features using keyword matching:

| Feature | Implementation |
|---|---|
| **Chat** | 5 topic clusters × 5 response templates, streamed word-by-word via SSE |
| **Sentiment Analysis** | VERY_NEGATIVE / NEGATIVE keyword arrays + all-caps detection |
| **KB Suggestions** | Keyword scoring (3pt per hit) + category match bonus (2pt) |
| **Categorization** | Keyword rules → TECHNICAL / BILLING / ACCOUNT / GENERAL + confidence |

---

## Database Schema

```prisma
model User          { id, email, name, passwordHash, role, tickets[], messages[] }
model Ticket        { id, title, description, category, status, priority, userId, agentId, messages[], analytics }
model Message       { id, ticketId, senderId, content, isAI, createdAt }
model KBArticle     { id, title, content, category, views, helpfulCount }
model TicketAnalytics { id, ticketId, responseTime, resolutionTime, satisfactionScore }
```

---

## Key Metrics (demo data)

- **120+** tickets across all categories
- **87%** resolution rate
- **~2.3 hour** average response time
- **4.2 / 5** average customer satisfaction score
- **18** knowledge base articles

---

## Deployment (Vercel)

1. Push to GitHub
2. Import project at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` — PostgreSQL connection string (e.g., Neon, Supabase, PlanetScale)
   - `NEXTAUTH_URL` — Your production URL (e.g., `https://yourapp.vercel.app`)
   - `NEXTAUTH_SECRET` — Run `openssl rand -base64 32` to generate
   - `ANTHROPIC_API_KEY` — Optional; app uses mock AI if not set
4. Deploy

### Recommended free PostgreSQL providers

- [Neon](https://neon.tech) — Serverless Postgres, generous free tier
- [Supabase](https://supabase.com) — Postgres + extras, easy setup
- [Railway](https://railway.app) — Simple, one-click Postgres

---

## Future Enhancements

- [ ] Real-time notifications via WebSockets or Server-Sent Events
- [ ] Email integration (send/receive tickets via email)
- [ ] Multi-language support with i18n
- [ ] Advanced reporting with date range filters and CSV export
- [ ] Customer satisfaction survey automation
- [ ] Agent workload balancing and auto-assignment
- [ ] Audit logs for compliance

---

## Author

**Emiliano Gutierrez**
Stevens Institute of Technology · Computer Science '28

Built with Next.js 14, Prisma, Tailwind CSS, and Anthropic Claude AI.
