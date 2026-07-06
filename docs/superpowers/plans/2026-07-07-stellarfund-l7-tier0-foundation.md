# StellarFund L7 — Tier 0: Foundation (Fork + Analytics + SEO) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the L7 fork (`stellarfund-master`) and its measurement foundation — a first-party analytics event pipeline and SEO surface — that every later L7 tier depends on.

**Architecture:** New full-history fork of `stellarfund-black` deployed as a new Vercel project. A privacy-light first-party analytics pipeline records events (visit / connect / contribute-intent / share / referral) as one Vercel Blob per event under `events/<date>/…`, read back by later tiers for funnel/retention. SEO metadata + `sitemap`/`robots` improve organic acquisition.

**Tech Stack:** Next.js App Router, TypeScript, `@vercel/blob`, vitest, next-intl.

## Global Constraints

- **Storage:** reuse the Vercel Blob pattern (`put`/`list` from `@vercel/blob`, `token = process.env.BLOB_READ_WRITE_TOKEN`); new store `stellarfund-master-meta`. One blob per event (no read-modify-write contention).
- **No PII in analytics:** store only `{type, wallet?, campaign?, ref?, ts}`; never IP/email/user-agent. Wallet is a public key.
- **Graceful degradation:** if `BLOB_READ_WRITE_TOKEN` unset, event ingest returns `{ ok: true, stored: false }` and never throws.
- **i18n:** any user-facing string ships TR + EN via next-intl (no new strings in Tier 0 beyond metadata copy).
- **Honesty:** analytics reflect only real events; no seeding of fake events.
- **Tests:** `npm test` (vitest) green; `npm run build` green each task.
- **Mainnet contracts shared** with L6 (Factory `CBUAZAAH7R7WXP3PIBKVPHYJ3XIHUTDOYBNUPPTLDVUWI6ZK6X33ZPN2`, Reputation `CCXGJUE6UXPMU27WKJZJS7XXV2NA5ZQPWLPQUJ2XNGDH5TD7L4DMAT5X`) — no redeploy.

---

### Task 1: Fork repo + Vercel project + env (controller/environment task)

> Executed inline by the controller (not a TDD subagent). Deliverable is a live new site.

**Files:** none (infrastructure).

- [ ] **Step 1: Clone with full history into a new working dir**

```bash
cd "C:/Users/Monster/Desktop"
cp -r stellarfund-black stellarfund-master
cd stellarfund-master
git remote remove black 2>/dev/null || true
git remote remove origin 2>/dev/null || true
```

- [ ] **Step 2: Create the new GitHub repo and push full history**

Create `BerkeBakir/stellarfund-master` (public) and push (use the ghp token inline, never commit it):

```bash
git remote add master "https://<ghp_token>@github.com/BerkeBakir/stellarfund-master.git"
git push -u master HEAD:main
```

- [ ] **Step 3: Create the Vercel project + Blob store, set env vars**

- New Vercel project `stellarfund-master`, link local `.vercel` to it.
- Create Blob store `stellarfund-master-meta`; this sets `BLOB_READ_WRITE_TOKEN` (all envs).
- Re-supply secrets (not returned by `vercel env pull`): `SPONSOR_SECRET` (= deploy acct GAQ5, from `stellar keys show stellarfund-mainnet`), `NEXT_PUBLIC_STATS_KEY=sf-master-2026`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=2cb5c99fdef1da3ce16249fa32b3aeb1`.
- (Later tiers add `RESEND_API_KEY`, `CRON_SECRET`.)

- [ ] **Step 4: Deploy and verify**

```bash
vercel deploy --prod
```

Expected: `stellarfund-master.vercel.app` returns 200 on `/`, `/proof`, `/stats`. Update README title to "Founder Belt / Master Track" and commit.

```bash
git add README.md && git commit -m "docs(L7): fork to stellarfund-master (Founder Belt)" && git push master HEAD:main
```

---

### Task 2: Analytics event model + validation (pure lib)

**Files:**
- Create: `src/lib/analytics.ts`
- Test: `src/lib/analytics.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type EventType = 'visit' | 'connect' | 'contribute_intent' | 'share' | 'referral'`
  - `type AnalyticsEvent = { type: EventType; wallet: string | null; campaign: string | null; ref: string | null; ts: string }`
  - `sanitizeEvent(raw: unknown): AnalyticsEvent | null`
  - `eventBlobPath(ev: AnalyticsEvent): string`  // `events/YYYY-MM-DD/<ts>-<rand>.json`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/analytics.test.ts
import { describe, it, expect } from 'vitest';
import { sanitizeEvent, eventBlobPath, type AnalyticsEvent } from './analytics';

describe('sanitizeEvent', () => {
  it('accepts a valid event and strips unknown fields', () => {
    const ev = sanitizeEvent({ type: 'connect', wallet: 'GABC', evil: 1, ip: '1.2.3.4' });
    expect(ev).not.toBeNull();
    expect(ev!.type).toBe('connect');
    expect(ev!.wallet).toBe('GABC');
    expect(ev!.campaign).toBeNull();
    expect((ev as unknown as Record<string, unknown>).ip).toBeUndefined();
    expect(typeof ev!.ts).toBe('string');
  });

  it('rejects an unknown event type', () => {
    expect(sanitizeEvent({ type: 'hack' })).toBeNull();
  });

  it('truncates over-long fields', () => {
    const ev = sanitizeEvent({ type: 'visit', wallet: 'x'.repeat(200) });
    expect(ev!.wallet!.length).toBeLessThanOrEqual(60);
  });

  it('builds a date-partitioned blob path', () => {
    const ev: AnalyticsEvent = { type: 'visit', wallet: null, campaign: null, ref: null, ts: '2026-07-07T10:00:00.000Z' };
    expect(eventBlobPath(ev)).toMatch(/^events\/2026-07-07\/.+\.json$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/analytics.test.ts`
Expected: FAIL ("Cannot find module './analytics'").

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/analytics.ts
// Privacy-light first-party analytics. Stores ONLY {type, wallet, campaign, ref, ts}
// — never IP/email/user-agent. Wallet is a public key. One blob per event.

export type EventType = 'visit' | 'connect' | 'contribute_intent' | 'share' | 'referral';

export const EVENT_TYPES: readonly EventType[] = [
  'visit',
  'connect',
  'contribute_intent',
  'share',
  'referral',
];

export type AnalyticsEvent = {
  type: EventType;
  wallet: string | null;
  campaign: string | null;
  ref: string | null;
  ts: string;
};

function str(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
}

export function sanitizeEvent(raw: unknown): AnalyticsEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const type = r.type;
  if (typeof type !== 'string' || !EVENT_TYPES.includes(type as EventType)) return null;
  return {
    type: type as EventType,
    wallet: str(r.wallet, 60),
    campaign: str(r.campaign, 60),
    ref: str(r.ref, 60),
    ts: new Date().toISOString(),
  };
}

export function eventBlobPath(ev: AnalyticsEvent): string {
  const date = ev.ts.slice(0, 10); // YYYY-MM-DD
  const rand = Math.random().toString(36).slice(2, 10);
  return `events/${date}/${Date.parse(ev.ts)}-${rand}.json`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/analytics.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.ts src/lib/analytics.test.ts
git commit -m "feat(L7): analytics event model + validation"
```

---

### Task 3: Event ingest API route

**Files:**
- Create: `src/app/api/events/route.ts`
- Test: `src/app/api/events/route.test.ts`

**Interfaces:**
- Consumes: `sanitizeEvent`, `eventBlobPath` from `src/lib/analytics.ts`; `put` from `@vercel/blob`.
- Produces: `POST /api/events` → `{ ok: true, stored: boolean }`; `POST` with bad body → 400.

- [ ] **Step 1: Write the failing test** (mock blob + env)

```ts
// src/app/api/events/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const put = vi.fn(async () => ({ url: 'https://blob/x.json' }));
vi.mock('@vercel/blob', () => ({ put }));

import { POST } from './route';

function req(body: unknown): Request {
  return new Request('http://x/api/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/events', () => {
  beforeEach(() => {
    put.mockClear();
    process.env.BLOB_READ_WRITE_TOKEN = 'tok';
  });

  it('stores a valid event', async () => {
    const res = await POST(req({ type: 'visit', campaign: 'CABC' }));
    const json = await res.json();
    expect(json).toEqual({ ok: true, stored: true });
    expect(put).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid event type with 400', async () => {
    const res = await POST(req({ type: 'nope' }));
    expect(res.status).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });

  it('degrades gracefully when storage unset', async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const res = await POST(req({ type: 'visit' }));
    expect(await res.json()).toEqual({ ok: true, stored: false });
    expect(put).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/events/route.test.ts`
Expected: FAIL ("Cannot find module './route'").

- [ ] **Step 3: Write minimal implementation**

```ts
// src/app/api/events/route.ts
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { sanitizeEvent, eventBlobPath } from '@/lib/analytics';

// POST /api/events  body: { type, wallet?, campaign?, ref? } -> stores one blob.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  const ev = sanitizeEvent(body);
  if (!ev) return NextResponse.json({ error: 'Invalid event' }, { status: 400 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ ok: true, stored: false });

  try {
    await put(eventBlobPath(ev), JSON.stringify(ev), {
      access: 'public',
      contentType: 'application/json',
      token,
      addRandomSuffix: false,
    });
    return NextResponse.json({ ok: true, stored: true });
  } catch {
    // Best effort — never break the UX for analytics.
    return NextResponse.json({ ok: true, stored: false });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/events/route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/events/route.ts src/app/api/events/route.test.ts
git commit -m "feat(L7): first-party analytics event ingest"
```

---

### Task 4: Client tracker + auto page-view

**Files:**
- Create: `src/lib/track.ts`
- Create: `src/components/PageTracker.tsx`
- Modify: `src/app/layout.tsx` (mount `<PageTracker />`)
- Test: `src/lib/track.test.ts`

**Interfaces:**
- Consumes: `EventType` from `src/lib/analytics.ts`.
- Produces:
  - `track(type: EventType, props?: { wallet?: string; campaign?: string; ref?: string }): void`
  - `<PageTracker />` React component that calls `track('visit', …)` on pathname change.

- [ ] **Step 1: Write the failing test** (track posts via sendBeacon/fetch)

```ts
// src/lib/track.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { track } from './track';

describe('track', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('posts the event to /api/events via fetch when no beacon', () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('navigator', {}); // no sendBeacon
    track('share', { campaign: 'CABC' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/events');
    expect(JSON.parse((opts as RequestInit).body as string)).toMatchObject({
      type: 'share',
      campaign: 'CABC',
    });
  });

  it('prefers navigator.sendBeacon when available', () => {
    const beacon = vi.fn(() => true);
    vi.stubGlobal('navigator', { sendBeacon: beacon });
    vi.stubGlobal('fetch', vi.fn());
    track('connect', { wallet: 'GABC' });
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon.mock.calls[0][0]).toBe('/api/events');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/track.test.ts`
Expected: FAIL ("Cannot find module './track'").

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/track.ts
import type { EventType } from './analytics';

type Props = { wallet?: string; campaign?: string; ref?: string };

// Fire-and-forget. Uses sendBeacon when available (survives page unload),
// else fetch with keepalive. Never throws into the caller.
export function track(type: EventType, props: Props = {}): void {
  try {
    const payload = JSON.stringify({ type, ...props });
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav && typeof nav.sendBeacon === 'function') {
      nav.sendBeacon('/api/events', new Blob([payload], { type: 'application/json' }));
      return;
    }
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
    });
  } catch {
    /* analytics must never break the app */
  }
}
```

```tsx
// src/components/PageTracker.tsx
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/track';

// Records a 'visit' event on every route change. Reads ?ref= for referral attribution.
export default function PageTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const ref =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('ref') ?? undefined
        : undefined;
    track('visit', ref ? { ref } : {});
  }, [pathname]);
  return null;
}
```

- [ ] **Step 4: Mount in root layout**

In `src/app/layout.tsx`, import and render `<PageTracker />` inside `<body>` (alongside existing providers):

```tsx
import PageTracker from '@/components/PageTracker';
// … inside <body>, near the top of the tree:
<PageTracker />
```

- [ ] **Step 5: Run tests + build to verify**

Run: `npx vitest run src/lib/track.test.ts && npm run build`
Expected: tests PASS (2); build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/lib/track.ts src/components/PageTracker.tsx src/app/layout.tsx
git commit -m "feat(L7): client analytics tracker + auto page-view"
```

---

### Task 5: SEO — metadata, sitemap, robots

**Files:**
- Modify: `src/app/layout.tsx` (enrich `metadata` export)
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Test: `src/app/sitemap.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `sitemap(): MetadataRoute.Sitemap` (default export) listing the public routes; `robots(): MetadataRoute.Robots`.

- [ ] **Step 1: Write the failing test**

```ts
// src/app/sitemap.test.ts
import { describe, it, expect } from 'vitest';
import sitemap from './sitemap';

describe('sitemap', () => {
  it('lists the core public routes with absolute URLs', () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain('https://stellarfund-master.vercel.app/');
    expect(urls).toContain('https://stellarfund-master.vercel.app/proof');
    for (const e of entries) {
      expect(e.url.startsWith('https://')).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/sitemap.test.ts`
Expected: FAIL ("Cannot find module './sitemap'").

- [ ] **Step 3: Write minimal implementation**

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from 'next';

export const BASE_URL = 'https://stellarfund-master.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/proof', '/create', '/stats'];
  const now = new Date();
  return routes.map((path) => ({
    url: `${BASE_URL}${path || '/'}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: path === '' ? 1 : 0.7,
  }));
}
```

```ts
// src/app/robots.ts
import type { MetadataRoute } from 'next';
import { BASE_URL } from './sitemap';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 4: Enrich layout metadata**

In `src/app/layout.tsx`, expand the exported `metadata` to include `metadataBase`, `openGraph`, and `twitter` (keep existing title/description if present, else set them):

```ts
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://stellarfund-master.vercel.app'),
  title: 'StellarFund — Milestone-escrow crowdfunding on Stellar',
  description:
    'Fund real projects on Stellar with milestone-based escrow. Gasless contributions, transparent on-chain proof.',
  openGraph: {
    title: 'StellarFund',
    description: 'Milestone-escrow crowdfunding on Stellar. Gasless, transparent, on-chain.',
    url: 'https://stellarfund-master.vercel.app',
    siteName: 'StellarFund',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StellarFund',
    description: 'Milestone-escrow crowdfunding on Stellar.',
  },
};
```

- [ ] **Step 5: Run test + build to verify**

Run: `npx vitest run src/app/sitemap.test.ts && npm run build`
Expected: test PASS; build emits `/sitemap.xml` + `/robots.txt`.

- [ ] **Step 6: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts src/app/sitemap.test.ts src/app/layout.tsx
git commit -m "feat(L7): SEO metadata, sitemap, robots for organic acquisition"
```

---

## Self-Review

**Spec coverage (Tier 0 items):**
- Fork repo + Vercel + env → Task 1. ✓
- First-party analytics (C) event pipeline → Tasks 2–4 (model, ingest, tracker). ✓
- SEO/sitemap (J) → Task 5. ✓
- Later tiers (retention/funnel read of events, `/growth`, `/metrics`, creator dashboard, referral, email, PWA, etc.) → **out of Tier 0 scope**; their own plans consume `events/<date>/…` blobs + `sanitizeEvent`/`eventBlobPath`.

**Placeholder scan:** none — every code step has full code and exact commands.

**Type consistency:** `EventType`/`AnalyticsEvent` defined in Task 2 are consumed unchanged in Tasks 3–4; `track(type, props)` signature matches its test; `sitemap()` default export matches its test and `robots.ts` import of `BASE_URL`.

**Note for reviewer:** Task 1 is controller/environment work (no TDD); Tasks 2–5 are standard red→green→commit slices. The event-per-blob choice avoids write contention; a compaction/rollup step is deferred to Tier 1 where funnel/retention reads happen.
```
