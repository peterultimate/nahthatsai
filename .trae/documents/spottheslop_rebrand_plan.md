# SpotTheSlop Rebrand Implementation Plan

## Repository Research

**Current brand:** AIorNot.vote (aiornot)
- Internal pkg scope: `@aiornot/*` (web, db, seed, worker)
- Game axis: users vote **"AI"** vs **"Real / Not AI"**
- Display wordmark: `AI` + `or` + `NOT` + `.vote` (Unbounded font, `--ai`=pink accent, `--human`=green accent)
- Cookie: `aon_session`
- API key prefix: `aion_live_*` (salt `"aiornot-api-key"`)
- Email sender default: `"AIorNot.vote <hello@aiornot.vote>"`
- Display domain in docs/tests/emails/RSS: `aiornot.vote`
- RSS generator tag + siteName in crawl gateway: `AIorNot.vote` / `aiornot.vote`
- ~70 source files (src files only — excluding `.next/` & `bun.lock`) contain brand strings

**Target brand:** SpotTheSlop
- New visual axis: **Spot the Slop** — the two vote options become **SLOP** (bad/AI) vs **LEGIT** (good/real). This aligns semantically with the existing data model (`truth_label=ai` → "Slop", `truth_label=not_ai` → "Legit") without requiring a DB migration.
- CSS tokens aliased: `--slop` = pink = former `--ai`; `--clean` = green = former `--human`. (Tokens renamed; existing `--ai` + `--human` kept as aliases for one release so no component edits break mid-rename, then tokens become primary with backward-compat fallbacks removed in a later sweep.)
- Wordmark: `SPOT` · `the` · `SLOP` (same dual-weight pattern — heavy on the two meaningful words, faint on the filler `the`)

### Rename Matrix (source-level only; build artifacts regenerated)

| Old | New | Where |
|-----|-----|-------|
| `AIorNot.vote` (display/site name) | `SpotTheSlop` | title/meta, OG JSON-LD, email subjects, RSS `<title>`/`<generator>`, headers, footer, `about`, `terms`, `pricing`, `api-docs`, crawl gateway siteName, `llms.txt`, `skill.md`, `.well-known/*` |
| `aiornot.vote` (URLs) | `spottheslop.com` | default env `EMAIL_FROM`, `VAPID_SUBJECT`, `SITE_URL` fallback, docs/tests using example URLs, `payment-purpose` metadata, contact mailto |
| `AI or Not`, `AI-vs-real`, `Can you tell AI from real?` etc. | `Spot the Slop`, `Slop-vs-Legit`, `Can you spot the slop?` | hero copy, descriptions, email bodies, newsletter prompts, RSS `<description>`, `about` page, `privacy`, `terms` |
| pkg `name`: `aiornot.vote` | `spottheslop` | root `package.json` `name`, readme |
| workspace scope `@aiornot/web` | `@spottheslop/web` | every `package.json` `name` + workspace `dependencies` (`@aiornot/db`, `@aiornot/seed`) |
| workspace scope `@aiornot/db` | `@spottheslop/db` | same, plus any `import`/`require` paths using the old scope |
| workspace scope `@aiornot/seed` | `@spottheslop/seed` | same |
| workspace scope `@aiornot/worker` | `@spottheslop/worker` | same |
| `"bun --filter @aiornot/..."` scripts | `"bun --filter @spottheslop/..."` | root `package.json` scripts |
| COOKIE `"aon_session"` | `"sts_session"` | `lib/session.ts` |
| API_KEY_SALT `"aiornot-api-key"` | `"spottheslop-api-key"` | `lib/entitlements.ts` — NOTE: this rotates the hash, which invalidates **existing** stored `api_keys.key_hash` rows in DB. Mitigation: add a fallback-verification branch (check new salt first, if miss check old salt and re-hash with new salt on the next verify). See Risks. |
| key prefix `aion_live_` | `sts_live_` | `createApiKey` plaintext, `verifyApiKey` prefix check, all tests that hard-code `aion_live_*` fixtures |
| email sender default | `SpotTheSlop <hello@spottheslop.com>` | `lib/env.ts` `emailFrom` |
| VAPID contact fallback | `mailto:hello@spottheslop.com` | `lib/env.ts` `vapid.subject` |
| CrawlProof data-site id | keep unchanged (tied to their dashboard). Documented only. | `layout.tsx` `Script data-site="…"` |
| CSS tokens `--ai` / `--human` | add `--slop` (=pink) / `--clean` (=green); keep old tokens pointing to the same values as aliases during transition | `globals.css` + every component that references `var(--ai)` / `var(--human)` updated to the new names |
| CSS classes `.vote-btn.ai`, `.picked-ai`, `.picked-human`, `.human`, etc. | `.vote-btn.slop`, `.picked-slop`, `.picked-clean`, `.clean` | Vote UI classes in `globals.css`, `MediaCard.tsx`, `DetailVote.tsx`, `Arena.tsx`, `HomeHero.tsx` |
| Wordmark fragment classes `.wordmark .ai/.or/.not/.dot` | `.wordmark .spot/.the/.slop` | `globals.css` class rules, `SiteHeader.tsx` JSX |
| RSS `<generator>AIorNot.vote</generator>` | `<generator>SpotTheSlop</generator>` | `lib/rss.ts` `buildRss` |
| SiteHeader `aria-label="AIorNot.vote home"` | `aria-label="SpotTheSlop home"` | `SiteHeader.tsx` |

### Explicitly OUT of SCOPE on first pass
- `.next/` directory (will be regenerated on `bun run dev`/`build`)
- `bun.lock` (auto-regenerated — user must run `bun install` after rename)
- Postgres/SQLite **table names & column names** & enum values stored in rows (`truth_label='ai'|'not_ai'`, `api_keys.key_prefix`): no schema migration. Column `status` enums, `role`, `reveal_status` untouched. Instead, presentation layer maps `ai → Slop`, `not_ai → Legit`.
- CoinPay x402 `CRAWL_PAY_TO` / env secrets (user owns values — only defaults renamed)
- Existing hashed cookie values (`aon_session` cookies in user browsers will simply be dropped, users re-login — acceptable rebrand cost. Documented.)

## Files and Modules

Change ~100 source files, grouped:

1. **Root config (6 files)**
   - `package.json`: `name`, `scripts` (`@aiornot/*` → `@spottheslop/*`)
   - `railway.json`: deploy commands (`--filter @aiornot/*` → `--filter @spottheslop/*`)
   - `README.md`: all display names, quick-start script filter refs
   - `tsconfig.base.json`: no change expected
   - `.env.example`: default `EMAIL_FROM`, `VAPID_SUBJECT`, `SITE_URL` comments
   - `.nixpacks/Dockerfile` (if present): `--filter` refs

2. **Workspace packages (8 files)**
   - `packages/db/package.json`: `name: @spottheslop/db`
   - `packages/seed/package.json`: `name: @spottheslop/seed` + deps (`@aiornot/db` → `@spottheslop/db`)
   - `packages/db/src/index.ts`, `packages/db/src/client.ts`, `packages/db/src/schema.ts`: any `@aiornot/*` import paths → `@spottheslop/*`
   - `packages/seed/src/*.ts`: same import path rewrite
   - `services/worker/package.json`: `name: @spottheslop/worker` + deps scope rename + script comments
   - `services/worker/jobs/*.ts`: any import path + string references (e.g. `console.log` site names)

3. **Web app lib layer (~30 files, mostly `apps/web/lib/*`)**
   - `session.ts`: cookie name `aon_session` → `sts_session`
   - `entitlements.ts`: API_KEY_SALT, prefix `aion_live_` → `sts_live_`, prefix check, + **add legacy-salt fallback branch** in `verifyApiKey` (check new salt → if miss → try old salt → on hit: re-hash with new salt + `UPDATE api_keys SET key_hash=newHash WHERE id=...` so keys migrate lazily on first use)
   - `env.ts`: `emailFrom` default, `vapid.subject`, `appUrl` doc comments
   - `email.ts`: all hard-coded "Reset your AIorNot.vote password", invite "Join AIorNot.vote →", subjects, referrals HTML, prize HTML
   - `rss.ts`: `<generator>`, channel titles/descriptions defaulting to site name
   - `rss-response.ts`, `search-feed.ts`, `linkposts.ts`, `tips.ts`: any display names
   - `crawl-gateway.ts`: `siteName: "spottheslop.com"`, `contact` mailto
   - `push.ts`, `prizes.ts`, `sponsorships.ts`, `referrals.ts`, `newsletter.ts`: copy/mail subjects
   - `scrape.ts`, `media-create.ts`: user-facing strings
   - All `*.test.ts` files that hard-code `aion_live_*`: replace fixtures; tests that assert on site names/strings updated
   - `db.ts`: `export { getClient }` import path
   - `guess.ts`, `queries.ts`: any `ai`/`not_ai` → presentation-facing strings (e.g. labels, not DB values)

4. **Web app components (~40 files `apps/web/components/*.tsx` + `app/*.tsx` pages)**
   - `app/layout.tsx`: metadata `title.default/template/description/applicationName`, OG `siteName`, JSON-LD `name`/`url`/`publisher`/`founder`, SearchAction target, RSS alternates title, creator/publisher
   - `app/page.tsx`: hero copy references. `HomeHero.tsx`: `Is it AI, or not?` → `Spot the slop. Call it.` / matching variants. Vote button text: `AI` → `SLOP`, `REAL/NOT AI` → `LEGIT`
   - `app/about.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/pricing/page.tsx`, `app/membership/page.tsx`, `app/rewards/page.tsx`, `app/prizes/page.tsx`, `app/feeds/page.tsx`, `app/api-docs/page.tsx`, `app/rss/page.tsx`: all brand sentences
   - `app/play/page.tsx`, `app/m/[slug]/page.tsx`, `app/u/[id]/page.tsx` + `opengraph-image.tsx`, `app/t/[tagSlug]/page.tsx`, `app/search/page.tsx`, `app/leaderboard/**`: display names / CTA copy
   - `app/u/[id]/opengraph-image.tsx`, `app/opengraph-image.tsx`, `app/twitter-image.tsx`: rendered brand on OG images
   - `app/sitemap.ts`, `app/robots.txt/route.ts`: hostname in generated output
   - `SiteHeader.tsx`: wordmark JSX `SPOT`/`the`/`SLOP` spans (drop the `.vote` dot — now a word not a domain), nav aria-label
   - `SiteFooter.tsx`: brand name + copyright, mailto links
   - `CrowdPromo.tsx`: "Crowd-verified AI detection" → "Crowd-verified slop detection" / equivalent
   - `ShareStats.tsx`, `DetailVote.tsx`, `MediaCard.tsx`, `FeedSection.tsx`, `HomeHero.tsx`: vote button labels (`AI`→`SLOP`, `REAL`/`NOT`→`LEGIT`), verdict reveal text (`Correctly called AI/Not AI` → `Nailed it. Spotted the slop.` / `Called it — legit.`), Crowd result sentences
   - `Arena.tsx`: HUD, vote button texts, reveal verdicts, "Is it AI, or not?" → "Is it slop, or legit?"
   - `AuthForms.tsx`, `PaymentUI.tsx`, `RewardUI.tsx`, `PrizeUI.tsx`, `ReferUI.tsx`, `SponsorUI.tsx`, `SubmitForm.tsx`, `LinkSubmitForm.tsx`, `ProfileSettings.tsx`, `NotificationSettings.tsx`, `AdminControls.tsx`, `AdminMediaRow.tsx`, `NewsletterComposer.tsx`, `PushBroadcast.tsx`: any on-page brand sentences
   - `components/RssBar.tsx`, `TipBar.tsx`, `Magnifier.tsx`, `LeaderboardTable.tsx`, `LeaderboardView.tsx`, `FollowBoard.tsx`, `FollowButton.tsx`, `AdSlot.tsx`, `CopyButton.tsx`: no brand unless strings present

5. **Styling (1 file + component class usage sites)**
   - `app/globals.css`: add `--slop` = `#ff3d8a` (= old --ai), `--clean` = `#3dffa8` (= old --human). Keep `--ai` and `--human` as aliases: `--ai: var(--slop); --human: var(--clean);` so anything missed still works.
   - Update every `var(--ai)` → `var(--slop)`, `var(--human)` → `var(--clean)` across styles (search/replace safe because they're already wrapped in `var()`)
   - Rename classes: `.vote-btn.ai` → `.vote-btn.slop`, `.picked-ai` → `.picked-slop`, `.picked-human` → `.picked-clean`, `.human` → `.clean` (keep both class rule sets temporarily via comma selectors so both work → safe transition)
   - Wordmark classes: add `.spot` / `.the` / `.slop` rules mirroring `.ai` / `.or` / `.not` (same values, new names). Keep old rules for one sweep then drop in follow-up.

6. **Public static files (`apps/web/public/*` + `.well-known/*`)**
   - `public/llms.txt`: site_name, contact, policy URLs, description
   - `public/skill.md`: short_name, description, aiornot.vote URLs
   - `public/sw.js`: cache names, `AIorNot` strings if any
   - `public/.well-known/openaccess.json`, `openwebring.json`, `security.txt`: contact/site values

7. **`docs/` folder (4 files)**
   - `README.md`, `docs/prd.md`, `docs/public-api.md`, `docs/seed-data.md`, `docs/design_handoff_aiornot_vote/README.md`: brand references. (Rename design folder name to `design_handoff_spottheslop` optionally — note only.)

## Implementation Steps (dependency-ordered)

1. **Package-name sweep** — edit every `package.json` first (root + 4 workspaces). Then edit any `import`/`require` of `@aiornot/` → `@spottheslop/` in all TS files. (Reason: build tooling must resolve before anything else.)
2. **CSS tokens + component class rules** — `globals.css` tokens and class rename (with backward-compat aliases/comma rules). Safe because both old and new names work during transition.
3. **Cookie + entitlements (incl. legacy-salt fallback)** — `session.ts` + `entitlements.ts`. Add the legacy-salt re-hash migration inside `verifyApiKey` so existing keys don't 401.
4. **lib layer strings** — go file by file in `apps/web/lib/*` (non-tests, then tests): emails, RSS, env defaults, crawl gateway, prizes, sponsorships, referrals, newsletter, push.
5. **App metadata + layout** — `layout.tsx` titles/descriptions/JSON-LD; sitemap/robots/OG/Twitter renderers.
6. **Pages copy** — route `page.tsx` files (home, about, play, detail, leaderboards, pricing, etc.). Button label text `AI` → `SLOP`; `REAL`/`NOT` → `LEGIT` in shared vote components first, then Arena.
7. **Components** — `SiteHeader` wordmark JSX rewrite (SPOT + the + SLOP, drop `.vote` span), `SiteFooter` copyright, `CrowdPromo`, `ShareStats`, `DetailVote`, `MediaCard`, `FeedSection`, `AuthForms`, `Arena`, all admin/submit/payment/reward/prize/refer UI.
8. **Public statics** — `public/llms.txt`, `skill.md`, `sw.js`, `.well-known/*`.
9. **docs + root README** — top-level project references and quickstart commands (`--filter @spottheslop/*`).
10. **railway.json deploy cmd update** — match `--filter` names.
11. **Test run** — `bun run typecheck` → `bun run test` → `bun run lint`. Fix any regressions.

## Dependencies and Considerations

- **User must run `bun install` after renaming packages** — workspace scopes changed, lockfile must regenerate; otherwise `bun run dev` will fail resolving `@spottheslop/db`. Documented in the final hand-off message.
- **Existing API keys break?** No — mitigated by: (a) new-key prefix `sts_live_` check first; (b) for still-stored `aion_live_*` hashes, try the legacy salt; (c) on legacy-hit, `UPDATE` the row's `key_hash` to the new salt so next verify succeeds on the new code path only. First-use lazy migration avoids a DB batch job.
- **Existing cookies invalidate?** Yes — cookie renamed `aon_session` → `sts_session`. Users must log in once; acceptable for a rebrand. No migration needed since hashes are tied to cookie name already on client.
- **Backward-compat CSS class rules** (comma selectors + token aliases) prevent partial-sweep broken renders. Remove in follow-up after verifying everything.
- **CoinPay / Resend / R2 secrets**: env *values* owned by user (not renamed). Only the defaults/`EMAIL_FROM` fallback changes. If user had `aiornot.vote` in their prod env vars, that's their ops, not this sweep.
- **RSS link URLs**: auto-derived from `env.appUrl`; changing the default doc-only is fine. On prod user sets the real URL externally.
- **DB truth_label values never change**: presentation mapping only. This avoids a schema/data migration that would invalidate stored `guesses.is_correct` etc.

## Validation

After the sweep:

1. `bun run typecheck` (web): no TS errors. This catches: missing/renamed imports, stale `@aiornot/*` paths, renamed API keys in tests.
2. `bun run test` (web): all unit tests green. Any string-asserting tests that still say AIorNot will fail and be caught.
3. `bun run lint`: no new lint regressions.
4. **Smoke checks on specific strings**: two grep sweeps to prove closure:
   - `grep -rn 'aiornot\|AIorNot\|aion_\|aon_session\|aiornot-api-key' packages/ apps/ services/ public/ docs/ *.json *.md *.mjs` → should return **0 hits** in source files (any hit is a missed rename; `.next/` and `bun.lock` excluded).
   - `grep -rn 'vote-btn\.ai\|\.picked-ai\|\.picked-human\|\.ai {\|\.human {' apps/web` → should return 0 hits after the sweep (or only lines in the backward-compat comma-selector list in globals.css, which is intentional).
5. Manual spot (optional for user): start dev, click 2 votes on home, play arena for 3 rounds, confirm SLOP/LEGIT buttons render with correct colors, wordmark displays `SPOT the SLOP`, meta title in `<title>` says SpotTheSlop.

## Risks

| Risk | Likelihood | Impact | Handling |
|------|-----------|--------|----------|
| Stale `@aiornot/*` import breaks typecheck/build | medium | high | caught by `typecheck` step 1 validation. Fix path |
| Existing prod API keys 401 due to salt change | medium | blocked | legacy-salt fallback in `verifyApiKey` + on-verify re-hash migration |
| Users lose session cookie on rebrand launch | certain | low | users re-login once; zero data loss (sessions table still valid for `sts_session` new logins; old `aon_session` rows untouched until TTL expires) |
| Partial CSS class rename leaves vote buttons unstyled | low | medium | backward-compat comma-selectors + token aliases mean both names work; caught by lint+typecheck won't catch but smoke-test grep for old classes will |
| Forgot to update one of 70 source files → stale brand string visible | medium | low | final grep sweep (step 4 in validation) catches every remaining occurrence; run again until 0 |
| Railway deploy cmd references old `--filter @aiornot/*` → deploy fails | low | blocked | `railway.json` is step 10 of implementation; also validated by `bun run build` locally referencing the same script |
| `@profullstack/x402-gateway` siteName used for signed offers externally, change rotates what crawlers see → they consider it a new site & existing 402 passes break | low | medium | keep `siteUrl` param only if user confirmed; otherwise warn. Default: **do rename** because brand rename trumps crawler-pass continuity — they re-buy for the new brand name anyhow; but note this in hand-off so user can decide |
