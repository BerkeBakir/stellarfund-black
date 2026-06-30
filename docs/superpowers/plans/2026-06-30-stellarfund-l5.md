# StellarFund L5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give StellarFund campaigns real identity (title, description, category, cover image, creator name) with category/search discovery, plus UX/stability fixes — turning the L4 MVP into a scalable, pitch-ready product, and produce the L5 growth + presentation deliverables.

**Architecture:** Off-chain campaign metadata keyed by contract address, stored in **Vercel Blob** (per-campaign JSON + cover images), served through Next.js API routes and merged with on-chain `list_campaigns`/`summary` data in the UI. No contract changes (preserves the live L4 contracts and the 10-backer proof).

**Tech Stack:** Next.js 16, @vercel/blob, existing stellar-sdk/wallets-kit clients, vitest. Pitch deck via PPTX.

## Global Constraints

- **No contract changes** — reuse the deployed L4 Factory/Escrow/Reputation + USDC (addresses in `src/lib/config.ts`). Data must not be lost.
- **Storage: Vercel Blob only**, free Hobby tier. Server token `BLOB_READ_WRITE_TOKEN` (env, server-only). No other DB/accounts.
- **Categories (fixed):** `Education`, `Health`, `Technology`, `Community`, `Emergency`, `Other`.
- **Image limits:** jpg/png/webp, ≤ 2 MB.
- **Missing metadata → truncated-address fallback** (never break existing campaigns).
- **i18n:** new user-facing strings go through next-intl (EN/TR) where the surrounding code already does.
- **Loading/error states** on every new fetch; **frequent commits**; ≥20 meaningful commits across L5.

---

## Phase A — Vercel Blob provisioning

### Task A1: Provision Blob store + env
**Files:** Modify `.env.local` (gitignored), Vercel project env.

- [ ] **Step 1:** Install dep: `npm install @vercel/blob`.
- [ ] **Step 2:** Create a Blob store and link it: `vercel blob store add stellarfund-meta` (or via `vercel link` project) — capture the `BLOB_READ_WRITE_TOKEN`.
- [ ] **Step 3:** Add token to Vercel prod env: `printf "%s" "<token>" | vercel env add BLOB_READ_WRITE_TOKEN production`; also append to local `.env.local`.
- [ ] **Step 4:** Verify: a throwaway node script does `put('campaigns/_probe.json', JSON.stringify({ok:true}), {access:'public', token})` then `list({prefix:'campaigns/'})` and finds it; then `del` the probe.
- [ ] **Step 5: Commit** `chore: add @vercel/blob for campaign metadata`.

---

## Phase B — Metadata API + client lib

### Task B1: Metadata types + category constant
**Files:** Create `src/lib/metadata.ts`; Test `tests/metadata.test.ts`

**Interfaces:**
- Produces: `CATEGORIES: readonly string[]` = the 6 fixed categories; `type CampaignMeta = { address: string; title: string; description: string; category: string; creatorName: string; imageUrl: string | null; createdAt: string }`; `isValidCategory(c: string): boolean`.

- [ ] **Step 1: Write failing test** `tests/metadata.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { CATEGORIES, isValidCategory } from '@/lib/metadata';
describe('metadata', () => {
  it('has the 6 fixed categories', () => {
    expect(CATEGORIES).toEqual(['Education','Health','Technology','Community','Emergency','Other']);
  });
  it('validates category membership', () => {
    expect(isValidCategory('Health')).toBe(true);
    expect(isValidCategory('Nope')).toBe(false);
  });
});
```
- [ ] **Step 2: Run** `npx vitest run tests/metadata.test.ts` → FAIL (module missing).
- [ ] **Step 3: Implement** the constants + types + `isValidCategory` in `src/lib/metadata.ts` (no Blob calls yet).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(meta): campaign metadata types + categories`.

### Task B2: Blob-backed metadata API route
**Files:** Create `src/app/api/campaigns/route.ts`

**Interfaces:**
- Consumes: `CampaignMeta`, `isValidCategory`.
- Produces: `GET /api/campaigns` → `{ campaigns: Record<address, CampaignMeta> }` (lists `campaigns/*.json` from Blob, fetches+parses each). `POST /api/campaigns` body `CampaignMeta` → validates required fields + category + address (StrKey contract), writes `campaigns/<address>.json` to Blob, returns `{ ok: true }`.

- [ ] **Step 1: Implement** the route using `@vercel/blob` `list`, `put`; validate with `StrKey.isValidContract(address)` from `@stellar/stellar-sdk` and `isValidCategory`. Reject missing title/category. `put(`campaigns/${address}.json`, JSON.stringify(meta), { access:'public', contentType:'application/json', token: process.env.BLOB_READ_WRITE_TOKEN, allowOverwrite:true })`.
- [ ] **Step 2: Verify locally** with `npm run build` (route compiles) and a manual `curl` against `npm run dev`: POST a sample meta for a real campaign address, then GET returns it.
- [ ] **Step 3: Commit** `feat(api): Blob-backed campaign metadata GET/POST`.

### Task B3: Cover image upload route
**Files:** Create `src/app/api/campaigns/upload/route.ts`

**Interfaces:**
- Produces: `POST /api/campaigns/upload` (multipart or raw body with `?address=&ext=`) → validates content-type in {image/jpeg,image/png,image/webp} and size ≤ 2 MB → `put(`covers/${address}.${ext}`, file, {access:'public', token})` → returns `{ url }`.

- [ ] **Step 1: Implement** the route (read `await req.arrayBuffer()` or `req.blob()`, check size/type, put to Blob).
- [ ] **Step 2: Verify** with `npm run build` + a manual curl uploading a small PNG → returns a public URL that loads.
- [ ] **Step 3: Commit** `feat(api): campaign cover image upload to Blob`.

### Task B4: Client metadata helpers
**Files:** Modify `src/lib/metadata.ts`

**Interfaces:**
- Produces: `getAllMetadata(): Promise<Record<string, CampaignMeta>>` (GET /api/campaigns); `putMetadata(meta: CampaignMeta): Promise<void>` (POST /api/campaigns); `uploadCover(address: string, file: File): Promise<string>` (POST upload, returns url).

- [ ] **Step 1: Implement** the three client helpers (fetch wrappers with error throwing).
- [ ] **Step 2: Verify** `npx tsc --noEmit` clean.
- [ ] **Step 3: Commit** `feat(meta): client helpers for metadata + cover upload`.

---

## Phase C — Create wizard with identity fields

### Task C1: CreateForm identity fields + metadata write
**Files:** Modify `src/components/CreateForm.tsx`

**Interfaces:**
- Consumes: `createCampaign` (existing), `putMetadata`, `uploadCover`, `CATEGORIES`.

- [ ] **Step 1: Implement** — add state for `title`, `description`, `category` (select from `CATEGORIES`), `creatorName`, `imageFile`. Validate title non-empty + category set. After the existing `createCampaign(...)` returns the new `address`: if `imageFile`, `const imageUrl = await uploadCover(address, imageFile)` (else null); then `await putMetadata({ address, title, description, category, creatorName, imageUrl, createdAt: new Date().toISOString() })`. Wrap metadata write in try/catch → on failure toast "Campaign created on-chain; metadata save failed, you can edit later" but still navigate. Keep milestone/goal logic unchanged.
- [ ] **Step 2: Verify** `npx tsc --noEmit` + `npm run build` clean.
- [ ] **Step 3: Commit** `feat(create): title/description/category/image/creator fields + metadata write`.

---

## Phase D — Render identity in cards & detail

### Task D1: Merge metadata into home + cards
**Files:** Modify `src/app/page.tsx`, `src/components/CampaignCard.tsx`

**Interfaces:**
- Consumes: `getAllMetadata`, `CampaignMeta`.

- [ ] **Step 1: Implement** — in `page.tsx` load `getAllMetadata()` once into state `meta: Record<string,CampaignMeta>`; pass `meta[id]` to each `CampaignCard`. In `CampaignCard`, accept optional `meta?: CampaignMeta`; when present render cover image (or gradient placeholder), `meta.title` as heading, category badge, `by {meta.creatorName || truncate(creator)}`; else fall back to current address display. Keep USDC/progress/milestone line.
- [ ] **Step 2: Verify** `npx tsc --noEmit` + update `tests/CampaignCard.test.tsx` to pass a meta object and assert the title renders; `npx vitest run`.
- [ ] **Step 3: Commit** `feat(cards): render campaign title/image/category from metadata`.

### Task D2: Campaign detail identity header
**Files:** Modify `src/components/CampaignDetail.tsx`, `src/app/campaign/[id]/page.tsx`

- [ ] **Step 1: Implement** — load `getMetadata`-equivalent (reuse `getAllMetadata()` then pick, or a `getMetadata(address)` helper) for the campaign; render cover image banner + title + category badge + description + creator name above the existing funding/milestone panels; address fallback when missing.
- [ ] **Step 2: Verify** `npx tsc --noEmit` + `npm run build`.
- [ ] **Step 3: Commit** `feat(detail): campaign identity header (image, title, description)`.

---

## Phase E — Discovery (search + category filter)

### Task E1: Filter logic (pure, tested)
**Files:** Create `src/lib/discovery.ts`; Test `tests/discovery.test.ts`

**Interfaces:**
- Produces: `filterCampaigns(items: {address:string; meta?: CampaignMeta}[], opts: { query: string; category: string | null }): string[]` — returns addresses matching the case-insensitive query against title+description (address always matches empty query) and the category (null = all).

- [ ] **Step 1: Write failing test** covering: empty query returns all; query matches title; query matches description; category filter narrows; query + category combined.
- [ ] **Step 2: Run** `npx vitest run tests/discovery.test.ts` → FAIL.
- [ ] **Step 3: Implement** the pure function.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(discovery): pure search + category filter`.

### Task E2: Discovery UI on home
**Files:** Modify `src/app/page.tsx`; messages `src/i18n/messages.ts`

- [ ] **Step 1: Implement** — a search input + category chip row (All + 6 categories) above the campaign grid; apply `filterCampaigns` to the active/past lists. Add i18n keys `discovery.search`, `discovery.all` (EN/TR).
- [ ] **Step 2: Verify** `npx tsc --noEmit` + `npm run build` + `npm run lint`.
- [ ] **Step 3: Commit** `feat(discovery): search box + category filters on home`.

---

## Phase F — Fixes, backfill, onboarding polish

### Task F1: Fix LiveStats backers stat
**Files:** Modify `src/components/LiveStats.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Implement** — the third stat currently uses `new Set(creators)`. Change it to show real unique backers: fetch `getProofData()` (lazy, in `page.tsx` or LiveStats effect) and pass `uniqueBackers`; if not yet loaded show the count from proof or relabel to "Creators" as a safe fallback. Use `uniqueBackers` from `@/lib/proof`.
- [ ] **Step 2: Verify** `npx tsc --noEmit` + `npm run build`.
- [ ] **Step 3: Commit** `fix(stats): show real unique backers, not creators`.

### Task F2: Backfill metadata for existing demo campaigns
**Files:** Create `scripts/backfill-meta.mjs` (one-off)

- [ ] **Step 1: Implement** a node script that POSTs metadata (title/description/category/creatorName, no image or a placeholder) to the **live** `/api/campaigns` for each existing campaign address from `list_campaigns`, with sensible demo titles (e.g. Bakery, Solar pump). Run it once against production.
- [ ] **Step 2: Verify** GET `/api/campaigns` returns the backfilled entries; home shows titles.
- [ ] **Step 3: Commit** `chore: backfill metadata for demo campaigns`.

### Task F3: Onboarding polish
**Files:** Modify `src/components/WalletBar.tsx` and/or first-run hint

- [ ] **Step 1: Implement** — a concise first-visit hint/tooltip guiding "Connect → Get Test USDC → Contribute" (e.g. a dismissible banner using localStorage), and ensure the `Get Test USDC` button is prominent. Keep it lightweight.
- [ ] **Step 2: Verify** `npm run build`.
- [ ] **Step 3: Commit** `feat(onboarding): first-run guidance banner`.

---

## Phase G — Growth + presentation deliverables (non-code)

### Task G1: Google Form questions
**Files:** Create `docs/GOOGLE_FORM.md`

- [ ] **Step 1:** Draft the form fields: Wallet address (short text, required), Email (email, required), Name (short text), "Rate the product 1–5" (linear scale), "What worked / what to improve?" (paragraph), "Which feature do you want next?" (multiple choice over the categories/feature list). Include exact question wording (EN + TR) and reviewer-facing notes.
- [ ] **Step 2: Commit** `docs: Google Form question set for user onboarding`.

### Task G2: Pitch deck (.pptx)
**Files:** Create `docs/StellarFund-Pitch.pptx`

- [ ] **Step 1:** Build a professional deck (problem, solution, market, architecture diagram, traction/proof, growth strategy, roadmap, ask) using project data and the StellarFund visual style. (Use the PPTX skill.)
- [ ] **Step 2: Commit** `docs: StellarFund pitch deck`.

### Task G3: README iteration summary + L5 docs
**Files:** Modify `README.md`, `docs/SUBMISSION.md`

- [ ] **Step 1:** Update README: features (campaign identity + discovery), link to the exported feedback Excel (placeholder until the user provides it), and a "Feedback-driven improvements" section listing each change with its git commit link. Update `docs/SUBMISSION.md` with the L5 checklist (50 users, pitch deck, demo, analytics screenshots).
- [ ] **Step 2: Commit** `docs: L5 README iteration summary + submission checklist`.

### Task G4: Demo video script
**Files:** Modify `docs/SUBMISSION.md` (L5 demo section)

- [ ] **Step 1:** Write a full-walkthrough script: create a campaign WITH identity → discovery filter → contribute → milestone release → proof board → fiat ramp → pitch one-liner.
- [ ] **Step 2: Commit** `docs: L5 demo walkthrough script`.

---

## Self-Review

- **Spec coverage:** campaign identity ✓(B,C,D), discovery ✓(E), UX/stability ✓(F1,F3), Blob storage ✓(A,B), Google Form ✓(G1), README iteration ✓(G3), pitch deck ✓(G2), demo ✓(G4), 20+ commits ✓(per-task), no contract change ✓(global constraint). 50 users + Excel + recording are user actions, tracked in G1/G3/G4.
- **Type consistency:** `CampaignMeta` defined B1, consumed B2/B4/C1/D1/D2/E1; `getAllMetadata`/`putMetadata`/`uploadCover` defined B4, consumed C1/D1/D2; `filterCampaigns` defined E1, consumed E2; `CATEGORIES` defined B1, consumed C1/E2.
- **Placeholder scan:** the Excel link in G3 is an intentional external artifact (user-provided), not a code placeholder.
