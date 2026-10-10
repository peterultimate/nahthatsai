# Nah, that's AI (nahthatsai)

> **Built for Banana Hacks 2026**
>
> **Team:** Homesh Peter Paul · Sun Xiaochi

Can you tell a real photo from an AI-generated one? **Nah, that's AI** is a
crowd-powered photorealistic media classifier. A game where real humans vote
"AI" or "real" on every image, and the crowd's consensus becomes the ground
truth label. The best detectors build streaks, climb leaderboards, and unlock
AI-powered tools that zoom in on the artifacts.

What starts as a game ships as a labeled dataset, a public provenance API, and
RSS signal feeds anyone can subscribe to.

---

## The problem

By 2027, **90% of images online will be synthetic or manipulated**. We have no
scalable way to know what's real. Academic detectors lag behind each new
generative model. Fact-checking is manual and slow. And the one resource we do
have, millions of humans looking at images every day, has no incentive loop
that actually trains a better, open ground-truth set.

## What we built

**Nah, that's AI** is three things stacked into one product:

1. **The Arena.** A fast-paced, session-streak game. Load a random image,
   hover to zoom (inspect hands, text, edges, the classic AI tells), vote,
   reveal. Every guess feeds the crowd aggregate for that image.
2. **The Reward Layer.** Hit streaks and unlock AI Scans (a vision model
   highlights suspected artifact regions for you), Hints (one clue without the
   answer), and AI Verdicts (model gives its confidence). Sponsor monthly
   prizes and the top detector wins real rewards.
3. **The Public Signal.** Every image gets a permanent provenance page with
   its crowd truth label, votes, and metadata. A REST API exposes opinions and
   provenance. RSS feeds publish Latest, Trending, Featured, Tag pages, and
   every leaderboard. The output of the game *is* a public dataset.

Everything is **"image everything."** The game, the prizes, the API, even the
rewards.

---

## Features, built this weekend

| Layer | What's live |
|---|---|
| **Gameplay** | Random arena, feed browse, tag browse, search + filter, detail view, magnifier loupe (hover to zoom), crowd consensus reveal |
| **Accounts** | Email/password auth (Argon2id), HTTP-only signed sessions, email verification, password reset, profile settings, guess history with CSV export, follower/following |
| **Streaks / Rewards** | Personal streaks, auto-issued streak rewards: 💡 Hints · 🔍 AI Scans · 🤖 AI Verdicts, spendable per-image |
| **Leaderboards** | All-time · Weekly · Monthly · Streaks · Per-tag · Per-media-type, minimum-participation thresholds, each with RSS |
| **Prizes** | Weekly + monthly draws, sponsorable checkout flow, claimable by winners, drawn by cron |
| **Submissions** | Users submit URLs or uploads (S3/R2), SSRF-checked, moderation queue, admins set truth label (re-scores everyone's guesses) |
| **Admin** | Full console: users, tags, media, batches, seed (Unsplash + OpenAI), notifications, newsletter, promo codes, prize draws |
| **Public API** | `/v1/opinions/:id` + `/v1/provenance`: signed, rate-limited, API key management per user (scoped keys with prefix `nts_live_`) |
| **RSS** | 12 feeds out of the box: Latest, Trending, Featured, Search, Tag, Per-media, Leaderboard (All/Weekly/Monthly/Streaks/Tag), with `<link>` autodiscovery |
| **Payments** | CoinPay crypto checkout for prize sponsorship + membership tiers; 402 Payment Required gate for crawler/automated API traffic |
| **Push** | Web Push notifications (VAPID) for new rounds, reward drops, prize wins, and admin broadcasts |
| **Demo mode** | One-click demo admin / demo user login on the login page to try every role without signing up |

---

## The engineering

- **Next.js 15** App Router (RSC + `"use client"` only when needed)
- **Custom auth:** Argon2id password hashing, signed 30-day HTTP-only sessions,
  HMAC-SHA256 at rest for all tokens, IP/UAs, and API key records.
- **Dual-dialect DB:** Drizzle for schema + types, **100% raw SQL for queries**
  via `.execute()`. SQLite locally, Postgres on Railway.
- **Seeding pipeline:** Unsplash Access Key pulls real photos, OpenAI Images
  generates photorealistic variants, Sharp resizes, R2 stores. Admins can
  trigger batches from the web UI.
- **Stat rollups:** Streaks, difficulty, and leaderboard ranking all go
  through idempotent recalc functions, cron-safe.
- **Zero external UI deps:** pure vanilla CSS, Zinc-950 / solid-violet /
  emerald flat palette, no Tailwind, no Radix, hand-rolled responsive drawer,
  canvas-based `GridPulse` hero, procedural rAF loops for animations.
- **Railway deploy** via custom `.nixpacks/Dockerfile` Bun image; one container
  runs migrations, the seed worker, and the web frontend.
- **192/192 passing tests** across 38 test files.

---

## Quick run, no API keys needed

```bash
bun install
cp .env.example .env           # falls back to file SQLite at repo root
bun run migrate
bun run seed:tags              # 22 default tags
bun run seed:demo              # 12 demo media + demo admin + demo user
bun run dev                    # http://localhost:3000
```

On the login page, click **Demo Admin** or **Demo User** to drop straight into
both roles without signing up.

---

## Why it matters beyond the weekend

The provenance API + RSS feeds make nahthatsai a drop-in signal source for
fact-checker tools, browser extensions, or image scraper pipelines. Every
human player trains the dataset; every API consumer pays back into the prize
pool; the best players win. It's a flywheel, not a one-off quiz.

And when "is this real?" is no longer a question you have to answer alone,
that's the weekend win.

---

Built for Banana Hacks 2026 · © Homesh Peter Paul & Sun Xiaochi
