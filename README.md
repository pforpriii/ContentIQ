# ContentIQ — LinkedIn Content Strategy Tool

AI-powered LinkedIn content strategy platform. Analyze creators, research trending topics, and generate personalized content ideas based on your voice and goals.

## Features

- **Email + OTP Auth** — Passwordless sign-in via Supabase
- **7-Step Onboarding** — Captures voice, positioning, audience, past content, and favourite creators
- **Creator Analysis** — Analyzes LinkedIn creators via web search and generates tailored topic ideas
- **Topic Research** — Web-searches trending conversations and turns them into content ideas
- **Saved Ideas** — Bookmark and organize ideas across sessions
- **Fully personalized** — Every output is shaped by the user's brand context

---

## Tech Stack

| Layer       | Tech                          |
|-------------|-------------------------------|
| Framework   | Next.js 14 (App Router)       |
| Auth + DB   | Supabase (OTP + PostgreSQL)   |
| AI          | Anthropic Claude (web search) |
| Styling     | Tailwind CSS                  |
| Deployment  | Vercel (recommended)          |

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url>
cd contentiq
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Authentication → Email** and make sure OTP is enabled (it is by default)
4. Optionally customize the OTP email template under **Auth → Email Templates**

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Where to find these:**
- Supabase keys: `Project Settings → API`
- Anthropic key: [console.anthropic.com](https://console.anthropic.com)

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel (Recommended)

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel deploy
```

Follow the prompts, then add environment variables in the Vercel dashboard under `Settings → Environment Variables`.

### Option B — GitHub + Vercel Dashboard

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add all environment variables from `.env.example`
4. Click **Deploy**

### Custom Domain

In Vercel dashboard → **Settings → Domains** → Add your domain.

Update Supabase:
- Go to `Authentication → URL Configuration`
- Set **Site URL** to your domain (e.g. `https://contentiq.yourdomain.com`)
- Add your domain to **Redirect URLs**

---

## Deploy to Other Platforms

### Netlify

```bash
npm run build
# Deploy the .next folder
```

Add a `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Railway / Render

Both support Next.js natively. Set environment variables in their dashboards and connect your GitHub repo.

---

## Database Schema

Tables created by `supabase/schema.sql`:

- `profiles` — User account + all brand context (created automatically on sign-up)
- `saved_ideas` — Bookmarked content ideas per user

Row-Level Security (RLS) is enabled — users can only access their own data.

---

## Customization

### Branding

Update colors in `tailwind.config.js`:
```js
colors: {
  bg:     '#0A0A0F',   // background
  card:   '#111118',   // card background
  border: '#1E1E2E',   // borders
  accent: '#00E5A0',   // primary accent (change to your brand color)
  muted:  '#6B6B8A',   // secondary text
  ink:    '#E8E8F0',   // primary text
}
```

Update app name in `app/layout.js` and across the UI.

### Adding Pricing / Limits

To add usage limits (e.g. free tier = 5 analyses/month):
1. Add a `usage_count` column to `profiles`
2. Increment it in the API routes
3. Return a 402 error when limit is reached
4. Add a pricing page and Stripe integration

---

## Roadmap Ideas

- [ ] Stripe integration for paid plans
- [ ] Content calendar with scheduled ideas
- [ ] Direct LinkedIn post drafting (full post writer)
- [ ] Team/agency support (multiple brand profiles)
- [ ] Export saved ideas to Notion / CSV
- [ ] Webhook to push ideas to Slack

---

## Support

Built with Next.js, Supabase, and Anthropic Claude.
