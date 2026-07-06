# StellarFund — Level 7 (Founder Belt / Master Track) Design

**Date:** 2026-07-07
**Repo (new fork):** `stellarfund-master` (full-history fork of `stellarfund-black`)
**Live site (new):** `stellarfund-master.vercel.app` (new Vercel project)
**Base:** StellarFund Black (mainnet, gasless, Factory/Reputation live)

---

## 1. Context & Goal

Level 7 is the **Founder Belt** — the focus shifts from *shipping* to *building a startup*:
sustainable growth, user retention, product-market fit, and real adoption. It is a
**month-long growth challenge**, graded on real usage and growth, not just code.

**L7 required deliverables (from the brief):**
- Public GitHub repo · **30+ meaningful commits**
- Live production app
- **Proof of 50+ new mainnet users** + mainnet transaction proof
- User feedback sheet · product-improvement commit links
- **Monthly growth report**
- **Social media growth proof (50+ followers)** · product update posts
- Community contribution proof · updated documentation

**Division of labour (user decision: "orta / dürüst gönderim"):**
- **This project builds:** all product/analytics/retention/growth-report/docs tooling.
- **User owns (cannot be fabricated — same honesty rule as L5/L6):** 50+ real mainnet
  users, 50+ real followers, product-update posts, community contribution. We build the
  tools that *make these easier* (share cards, referral, ready-to-post copy) and report
  **honest** numbers.

**Key insight:** almost every feature below is **off-chain** (Vercel Blob JSON, first-party
analytics), so it costs **no XLM**. Only real user contributions touch XLM, and those are
covered by the existing **gasless sponsor** (`/api/sponsor`). This is what makes a large
L7 build feasible under the user's XLM constraint.

---

## 2. Fork Strategy (matches L4/L5/L6 pattern)

1. Freeze `stellarfund-black` (L6) for review — no further L7 commits there.
2. Create new repo **`BerkeBakir/stellarfund-master`** with full git history mirrored.
3. New Vercel project **`stellarfund-master`** → `stellarfund-master.vercel.app`.
4. Re-set env vars (secrets are not returned by `vercel env pull` — re-supply from source):
   - `SPONSOR_SECRET` (= deploy acct GAQ5…, gasless), `BLOB_READ_WRITE_TOKEN` (new store
     `stellarfund-master-meta`), `NEXT_PUBLIC_STATS_KEY`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`,
     `FEEDBACK_FORM_URL`, plus new: `RESEND_API_KEY` (email), `CRON_SECRET` (digest cron).
5. Mainnet contracts are **shared** (same Factory/Reputation/XLM SAC as L6) — no redeploy.
6. Local `.vercel` links to the new project; push to the new `master` remote only.

---

## 3. Architecture Overview

Next.js App Router (existing). New work slots into the current structure:

- **Storage:** reuse the **Vercel Blob** pattern (JSON docs) for all new off-chain state —
  follows/updates/comments/referrals/emails/events. New store `stellarfund-master-meta`.
  Blob is eventually-consistent and fine for low-write JSON; for **counters/analytics
  events** we aggregate append-only and roll up (no per-write contention). Upstash KV stays
  an *optional* upgrade if write volume demands it (documented, not built up front).
- **Identity:** wallet address is the user key (no accounts/passwords). Email is *optional*
  contact captured separately and linked to a wallet when available.
- **On-chain:** unchanged Factory→Escrow→Reputation. Badges (Phase D) mint via the existing
  `reputation.ts` contract, **sponsor-paid and rate-limited** to protect the ~6 XLM balance.
- **i18n:** every new string ships TR + EN (existing `LanguageSwitcher` pattern).
- **Analytics:** new first-party event pipeline feeds `/stats`, `/metrics`, `/growth`.

### New/changed files (indicative)
```
src/app/me/                     P1  personal dashboard ("StellarFund'ım")
src/app/creator/                A   creator dashboard
src/app/changelog/              E   public changelog/roadmap
src/app/metrics/                G   build-in-public live KPIs (public)
src/app/growth/                 P3  monthly growth report (rendered)
src/app/embed/[id]/             P2  embeddable campaign widget
src/app/try/                    F   testnet free-try funnel
src/app/api/follow/             P1  follow/unfollow a campaign (per wallet)
src/app/api/updates/            P1/A creator campaign updates CRUD
src/app/api/comments/           P4  campaign comments
src/app/api/referral/           P2  referral capture + rollup
src/app/api/subscribe/          B   email capture
src/app/api/notify/             P1  in-app notification feed (derived)
src/app/api/events/             C   first-party analytics ingest
src/app/api/cron/digest/        B   weekly email digest (Vercel Cron)
src/app/api/og/[id]/            P2  dynamic OG share image (@vercel/og)
src/lib/analytics.ts            C   event tracking client + rollup
src/lib/follows.ts, updates.ts, referral.ts, subscribers.ts, notifications.ts
src/lib/retention.ts            P3  cohort/funnel math
src/components/ … (dashboards, NotificationBell, ShareBar, OnboardingTour, Testimonials, PWA)
public/manifest.webmanifest, sw.js   I   PWA
```

---

## 4. Feature Set (grouped; sequenced in §5)

### Phase 1 — Retention & Engagement
- `/me` personal dashboard: my contributions (proof filtered by wallet), my campaigns, followed campaigns.
- Follow/watch a campaign → `api/follow` (Blob `follows/<wallet>.json`).
- Campaign **updates feed**: creator posts updates (`updates/<addr>.json`); backers see them on campaign page.
- **In-app notification center** (`NotificationBell`): milestone/goal reached + new update on followed campaigns, derived from on-chain state + updates, with per-wallet read cursor.

### Phase 2 — Growth & Virality
- Dynamic **OG share cards** per campaign (`api/og/[id]`, `@vercel/og`).
- **Referral**: `?ref=<wallet>` capture → `api/referral`; referred visit/contribution attribution; referral leaderboard.
- **ShareBar**: one-click X / Telegram / WhatsApp / copy.
- **Embeddable widget** `/embed/[id]` (iframe-friendly, minimal).

### Phase 3 — Analytics, Retention Measurement & Growth Report
- **First-party analytics (C)**: `analytics.ts` logs visit / connect / contribute-intent /
  share / referral events → `api/events` → daily rollup Blob. Privacy-light, no PII.
- `/stats` gains **cohort/retention** (new vs returning wallets, weekly cohorts) + **funnel**
  (visit → connect → contribution) from real events.
- `/growth`: renders the **Monthly Growth Report** from live on-chain numbers (backers,
  contributions, volume, new-users-this-month) + manually entered social/community metrics;
  exportable to `docs/GROWTH-REPORT.md`.
- **Feedback sheet**: import Google Form responses → `docs/feedback/*.csv` + in-app summary.

### Phase 4 — Trust & PMF
- Campaign **comments** (`api/comments`, Blob, optional wallet-signed).
- Creator **verification badge** (allowlist / signed) + transparency badges (on-chain
  verified · escrow · sequential milestones).

### Extra features (user-approved)
- **A) Creator dashboard** (`/creator`): a creator sees their campaigns' backers, posts
  updates, grabs share links/cards. Turns creators into growth agents. *(Overlaps P1 updates.)*
- **B) Email capture + weekly digest**: `api/subscribe` (Blob `subscribers.json`), weekly
  "followed campaigns" digest via **Resend** + Vercel Cron (`api/cron/digest`). Needs
  `RESEND_API_KEY` + a verified sending domain (user supplies; falls back to no-send if unset).
- **D) On-chain reputation badges** (opt-in, **sponsor-paid, rate-limited**): backer/referrer
  badges via existing `reputation.ts`. Guarded by an XLM-budget check; if sponsor low, mirror
  the badge **off-chain** and mint later. Never spends below a reserve.
- **E) Changelog/roadmap** (`/changelog`): product-update posts + roadmap; doubles as the
  "product update posts" evidence and a founder-momentum signal.
- **F) Testnet "free try"** (`/try`): full flow on **testnet** (free faucet, clearly labeled)
  so newcomers experience it before spending real XLM; a conversion funnel to mainnet.
  *(Does not count toward the 50 mainnet users; it is an acquisition tool.)*
- **G) Live metrics** (`/metrics`, public): build-in-public KPI board (total backers, volume,
  new users this week, followers) — continuous, unlike the monthly `/growth` report.
- **H) Onboarding tour + funnel optimization**: guided first-run tour; reduce drop-off on the
  visit→connect→contribute path; measured by Phase-3 analytics.
- **I) PWA + web push**: installable (`manifest.webmanifest` + service worker); web-push
  milestone/update alerts (opt-in) as an alternative/complement to email digest.
- **J) SEO + marketing landing + sitemap**: metadata, `sitemap.xml`, `robots.txt`, optimized
  landing for organic acquisition.
- **K) Testimonial wall**: real Google Form feedback quotes rendered as social proof →
  conversion. Only shows consented/real responses.

---

## 5. Priority Sequencing (so highest-impact lands first)

The plan (writing-plans step) will order work so a partial month still yields a valid,
gradable submission:

1. **Tier 0 — Foundation & fork** (must exist first): fork repo + Vercel + env; first-party
   analytics (C) + event pipeline; SEO/sitemap (J). *Everything else measures/depends on these.*
2. **Tier 1 — Grading essentials**: `/growth` monthly report (P3) + retention/cohort in
   `/stats`; feedback sheet import; changelog (E); `/metrics` (G). *Directly maps to L7 required items.*
3. **Tier 2 — Growth levers** (help the 50-user goal): creator dashboard (A) + updates feed
   (P1); referral + share cards + ShareBar (P2); email capture + digest (B); onboarding tour (H).
4. **Tier 3 — Retention & reach**: `/me` dashboard + follows + notifications (P1); embeddable
   widget (P2); PWA + push (I); testnet try funnel (F).
5. **Tier 4 — Trust/PMF & polish**: comments + verification/transparency badges (P4);
   testimonial wall (K); on-chain reputation badges (D, sponsor-budget-gated).

**Commit budget:** 30+ meaningful commits is easily met; work is committed per feature slice.

---

## 6. Error Handling & Constraints

- **XLM reserve guard:** any on-chain action (badges D, seed campaigns) checks a minimum
  reserve on the sponsor/deploy account and refuses/falls back if below it. No action may
  strand the account.
- **Gasless fallback preserved:** contributions still auto-fall-back to direct submit when
  the sponsor is unavailable (existing L6 behavior — do not regress).
- **Blob consistency:** rollups are append-then-aggregate; readers tolerate slightly stale
  counters. Never treat Blob as strongly consistent.
- **Email:** if `RESEND_API_KEY`/domain unset, subscribe still stores the address but digest
  is a no-op (logged), so the feature degrades gracefully.
- **Honesty gates:** `/growth`, `/metrics`, `/proof`, testimonial wall render **only real,
  verifiable** data. Manually entered social/community figures are labeled as self-reported.
  No fabricated wallets, users, followers, or quotes — consistent with L5/L6.
- **Privacy:** first-party analytics store no PII (wallet is public; no IP/email in event log).

---

## 7. Testing

- **Contract/lib:** unit tests for retention/funnel math (`retention.ts`), referral
  attribution, follows, notification derivation, XLM-reserve guard.
- **API routes:** tests for follow/updates/comments/referral/subscribe/events happy-path +
  degraded (Blob/email unset) paths.
- **Web:** existing test suite stays green; add tests for new components' core logic.
- **Build:** `next build` green each slice; CI stays green.
- **Manual/preview:** verify `/me`, `/creator`, `/growth`, `/metrics`, `/changelog`,
  share-card OG, embed widget, PWA install in the Vercel preview before prod promote.

---

## 8. What Stays on the User (cannot be built/faked)

- Onboard **50+ real mainnet users** (gasless + testnet-try + referral lower the barrier).
- Grow to **50+ real followers**; publish product-update posts (drafts/copy provided).
- Community contribution (draft provided; user publishes).
- Fund/decide any XLM spend for optional on-chain badges or new seed campaigns.
- Collect Google Form responses → we import to `docs/feedback/` + testimonial wall + report.

---

## 9. Out of Scope (YAGNI)

- Password accounts / off-wallet auth.
- Native mobile apps (PWA covers installability).
- Paid ads / growth automation bots (against the honesty rule).
- New smart-contract features beyond the existing Factory/Escrow/Reputation + badge mint.
- Upstash KV / Postgres migration (documented as optional upgrade only).
