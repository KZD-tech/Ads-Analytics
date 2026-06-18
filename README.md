# Ad Analytics Dashboard

Dashboard analisis prestasi iklan digital untuk **Meta Ads** dan **Google Ads**. Data diambil setiap hari melalui pipeline: **API → n8n → Supabase → Next.js Dashboard**.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Automation | n8n (self-hosted) |
| Deployment | Vercel |
| Charting | Recharts |
| Styling | Tailwind CSS |
| Auth | Supabase Auth (email/password) |

## Quick Start

### 1. Clone & Install

```bash
cd ad-analytics-dashboard
npm install
```

### 2. Environment Variables

Salin `.env.local.example` ke `.env.local` dan isi:

```bash
cp .env.local.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# n8n Webhook Security
N8N_WEBHOOK_SECRET=generate-a-random-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

Jalankan SQL migration di Supabase SQL Editor:

```sql
-- Buka Supabase Dashboard → SQL Editor
-- Paste kandungan supabase/migrations/0001_init.sql dan run
```

Atau guna Supabase CLI:

```bash
supabase db push
```

### 4. Seed Sample Data (optional)

Untuk preview dashboard dengan data contoh (30 hari):

```bash
npx tsx scripts/seed.ts
```

### 5. Run Dev Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Anda akan diarahkan ke `/login`.

**Buat akaun** di `/signup` atau log masuk jika sudah ada.

## Features

### Dashboard Overview (`/dashboard`)
- 4 summary cards (Spend, Impressions, Clicks, Conversions)
- Spend over time chart (Meta vs Google, 30 hari)
- CTR & ROAS dual-axis trend chart
- Top 5 performing campaigns table
- Platform split donut chart
- Automated insights panel (7 rule-based insights)
- Last sync status badge

### Campaign List (`/dashboard/campaigns`)
- Filter by platform, status, date range
- Sortable by spend, CTR, ROAS, conversions, impressions, clicks
- Click row → campaign detail

### Campaign Detail (`/dashboard/campaigns/[id]`)
- Per-campaign metric cards
- Daily performance chart (spend, clicks, impressions)
- Weekly breakdown table
- Comparison vs average of all campaigns

### Platform Pages (`/dashboard/meta`, `/dashboard/google`)
- Platform-filtered overview
- Platform-specific charts and campaign table
- Insights

### Compare Page (`/dashboard/compare`)
- Side-by-side Meta vs Google comparison
- Bar chart across 8 metrics
- Winner badge for each metric

## n8n Integration

Lihat [`docs/n8n-setup.md`](docs/n8n-setup.md) untuk panduan lengkap setup n8n workflows.

Ringkasnya:
1. Setup n8n self-hosted
2. Buat Meta Ads workflow (cron jam 2 pagi → pull API → POST webhook)
3. Buat Google Ads workflow (cron jam 3 pagi → pull API → POST webhook)
4. Set `x-api-key` header = `N8N_WEBHOOK_SECRET`

### Test Webhook Locally

```bash
# Terminal 1: start dev server
npm run dev

# Terminal 2: test webhook
npx tsx scripts/test-webhook.ts
```

## Webhook Format

```json
{
  "platform": "meta",
  "report_date": "2026-06-18",
  "campaigns": [
    {
      "campaign_id_external": "123456789",
      "campaign_name": "Kempen Ramadan 2026",
      "status": "active",
      "objective": "conversion",
      "impressions": 45000,
      "clicks": 1200,
      "spend": 850.50,
      "reach": 38000,
      "conversions": 45,
      "revenue": 4500.00
    }
  ]
}
```

Derived metrics (CTR, CPC, CPM, ROAS, CPA) dikira automatik di webhook endpoint.

## Project Structure

```
ad-analytics-dashboard/
├── app/
│   ├── layout.tsx                    # Root layout (Inter font, dark theme)
│   ├── page.tsx                      # Redirect → /dashboard
│   ├── globals.css                   # Tailwind + dark theme styles
│   ├── login/page.tsx                # Login page
│   ├── signup/page.tsx               # Signup page
│   ├── dashboard/
│   │   ├── layout.tsx                # Auth guard + sidebar shell
│   │   ├── page.tsx                  # Overview
│   │   ├── OverviewClient.tsx        # Overview content (server component)
│   │   ├── PlatformPage.tsx           # Shared platform page (Meta/Google)
│   │   ├── campaigns/
│   │   │   ├── page.tsx              # Campaign list
│   │   │   ├── CampaignFilters.tsx   # Filter UI (client)
│   │   │   └── [id]/page.tsx          # Campaign detail
│   │   ├── meta/page.tsx             # Meta dashboard
│   │   ├── google/page.tsx           # Google dashboard
│   │   └── compare/page.tsx          # Meta vs Google compare
│   └── api/webhook/n8n/route.ts      # n8n webhook endpoint
├── components/
│   └── dashboard/
│       ├── DashboardShell.tsx        # Sidebar + nav layout
│       ├── MetricCard.tsx
│       ├── CampaignTable.tsx
│       ├── PerformanceChart.tsx
│       ├── PlatformBreakdown.tsx
│       ├── DateRangePicker.tsx
│       ├── InsightPanel.tsx
│       └── SyncStatusBadge.tsx
├── lib/
│   ├── supabase-browser.ts           # Browser Supabase client (anon)
│   ├── supabase-server.ts            # Server + service role clients
│   ├── metrics.ts                    # CTR/CPC/CPM/ROAS/CPA + formatters
│   ├── insights.ts                   # Rule-based insight generator
│   └── dashboard-data.ts             # Server-side data queries
├── types/
│   └── ads.ts                        # Shared TypeScript types
├── supabase/
│   └── migrations/
│       └── 0001_init.sql             # DB schema + RLS
├── scripts/
│   ├── seed.ts                       # 30-day sample data seeder
│   └── test-webhook.ts               # Webhook test script
├── docs/
│   └── n8n-setup.md                  # n8n workflow documentation
├── middleware.ts                     # Auth route protection
├── vercel.json                       # Vercel deployment config
├── .env.local.example                # Env var template
├── tailwind.config.ts                # Dark theme config
└── package.json
```

## Design System

| Element | Color |
|---|---|
| Background | `#0F1117` |
| Surface (cards) | `#1A1D27` |
| Border | `#2A2D3A` |
| Primary (indigo) | `#6366F1` |
| Meta (blue) | `#1877F2` |
| Google (red) | `#EA4335` |
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Danger | `#EF4444` |

- Font: **Inter** (Google Fonts)
- Currency: **RM (MYR)**
- Date format: **DD/MM/YYYY** (display), ISO (database)
- Tabular numbers throughout

## Deployment (Vercel)

1. Push ke GitHub
2. Import project di [Vercel](https://vercel.com)
3. Tambah env vars di Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `N8N_WEBHOOK_SECRET`
4. Deploy

## License

Private — internal use only.