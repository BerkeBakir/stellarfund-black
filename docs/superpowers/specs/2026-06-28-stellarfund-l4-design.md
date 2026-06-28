# StellarFund — Level 4 (Green Belt) MVP Design

> Status: **Approved** (2026-06-28). Cross-border crowdfunding & SME micro-financing on
> Stellar. Evolves the Orange Belt crowdfund engine (Factory → Campaign → Reputation)
> into a fintech product: **USDC settlement, milestone-based escrow, and a real
> SEP-24 fiat↔USDC anchor bridge.**

## 1. One-liner

A supporter in Germany funds a bakery in Kenya in seconds, for cents. Money is held in a
Soroban **milestone escrow** contract, released tranche-by-tranche as the creator delivers,
and **automatically refunded** on-chain if the goal/deadline fails. Each campaign builds an
on-chain **reputation** history.

We take the Orange Belt engine ("open campaign → raise XLM → refund if goal missed") and turn it into:

- **USDC instead of XLM** — stable value, no FX risk for creator/backer.
- **Milestone release instead of single withdrawal** — creator receives funds in slices as milestones are approved.
- **A fiat↔USDC bridge on top** — pay with card/bank, settles as USDC behind the scenes (SEP-24 sandbox anchor).

## 2. Smart contracts (Soroban / Rust)

Evolves the three Orange Belt contracts. Factory pattern and inter-contract auth model are preserved.

| Contract | Orange Belt | StellarFund change |
|---|---|---|
| **Factory** | deploys Campaign contracts, registry | Unchanged structure; deploys the new Escrow; `list_campaigns`, `is_campaign` |
| **Escrow** (was Campaign) | XLM custody, single claim | **USDC custody + milestone table.** `contribute(USDC)`, `submit_milestone`, `release()` (sends approved milestone tranche to creator), `refund()` (returns each backer's USDC on miss/deadline). State: Active → Releasing → Completed / Refunding |
| **Reputation** | `record_success`, `get_score` | + milestone delivery history (how many tranches delivered); still gated to registered campaigns via Factory |

**Milestone escrow (core new mechanic):** Funds are split into creator-defined milestones
(e.g. 40% start / 30% prototype / 30% delivery). Each approved milestone releases its
tranche. This is what makes "enforced by code, not promises" real.

**Token:** Testnet USDC via its Stellar Asset Contract (SAC). All transfers are USDC, not XLM.

**Money-safety invariants:** sum of milestone tranches == goal; a tranche releases at most
once; total released + total refundable <= total contributed; refund path always reachable
after deadline if not completed.

## 3. Fiat ↔ USDC bridge (SEP-24 sandbox anchor)

Uses Stellar's test anchor (`testanchor.stellar.org`) — a real sandbox, real protocol flow,
no real money.

1. **On-ramp (backer deposits):** "Support with card" → SEP-24 interactive window → payment
   simulated in anchor sandbox → testnet USDC lands in wallet → `Escrow.contribute()`.
2. **Off-ramp (creator withdraws):** milestone approved & USDC released → SEP-24 withdraw →
   anchor simulates "fiat received in creator's country".
3. **Auth & KYC:** SEP-10 wallet-signature auth to the anchor; SEP-12 lightweight KYC form when required.

Demonstrates the full **fiat → USDC → escrow → fiat** loop end-to-end on testnet.

## 4. Frontend (bold, product-grade — not "MVP-looking")

**Visual language:** dark-first, Stellar/space aesthetic — deep indigo/violet gradients,
glassmorphism cards, subtle glow. Framer Motion micro-interactions (page transitions, card
hovers, milestone progress fill, "funds arrived" pulse/confetti). Animated hero with a world
map showing a cross-border money arc (SVG arc + flowing particles). Live animated counters
(total USDC, active campaigns, countries) driven by on-chain events. shadcn/ui + Tailwind v4,
mobile-first responsive.

**Screens:**
1. **Landing** — animated hero, 3-step "how it works", live stats, featured campaigns.
2. **Discover** — campaign grid, search/filter, country/category badges.
3. **Campaign detail** — visual milestone timeline, progress, backer list, "Support with card" CTA, live on-chain event feed.
4. **Create wizard** — multi-step with progress, milestone definition.
5. **Creator dashboard** — milestone submission/withdrawal, off-ramp, reputation score.
6. **Wallet connect** — StellarWalletsKit (Freighter et al.), one-tap testnet faucet.
7. **Proof board** (`/proof`) — see §6.

**Internationalization:** TR/EN, language switcher, all UI strings translated.

## 5. L4 production requirements (baked into the design)

- **Loading + error handling** — skeletons + toasts + retry on every on-chain/anchor action.
- **Monitoring/analytics** — Vercel Analytics + lightweight event tracking (wallet connect, contribute, milestone) + Sentry (free tier) for error tracking.
- **Onboarding** — one-tap testnet faucet, first-run guided tour, referral/invite for reaching 10+ users.
- **Feedback** — embedded feedback form (Supabase or Tally), summarized for submission.
- **PWA + mobile responsive.**
- **CI/CD** — GitHub Actions (inherited from crowdfund), contract tests + frontend build/lint.

## 6. Proof board (`/proof`) — user-interaction evidence

Auto-collects the belt's "10+ real wallet interactions" proof so submission is one screenshot:

- Queries the contracts for **unique backer addresses** across campaigns.
- Lists each: address + **stellar.expert testnet link** + date + USDC amount.
- Shows total unique backers and total USDC volume.

Backed by on-chain truth (every `contribute` is a permanent, public, wallet-signed tx),
supported by Vercel Analytics (unique visitors/countries) and the feedback summary.

> User-acquisition note: aim for several genuine users (onboarding is one-tap to keep it
> easy); self-generated wallets are technically distinct on-chain but weaken the
> product-validation signal and are detectable via analytics (same device/IP/timing) — a
> hybrid with real participants is strongest.

## 7. Build order (smart sequencing — core works early)

1. **Repo setup** — fork crowdfund → `stellarfund`, clean, fresh git. *(done)*
2. **Contracts** — evolve Escrow to USDC + milestones, deploy to testnet, tests.
3. **On-chain core frontend** — wallet connect, contribute/milestone/refund in USDC (fully working, no anchor yet).
4. **Anchor bridge** — SEP-24/10/12 sandbox integration.
5. **Visual polish** — animations, hero, theme, i18n.
6. **Production layer** — analytics, Sentry, feedback, monitoring, proof board, CI/CD.
7. **Submission package** — README, demo video, screenshots, 10+ interaction proof.

Each step lands solid before the next; the on-chain core is demoable early, so even if the
anchor sandbox has issues we still hold a strong submission.

## 8. Out of scope for L4 (deferred)

- Backer/curator milestone governance voting (idea-doc Phase 2 → L5).
- Yield on idle escrow via Stellar DeFi (L5+).
- Live/licensed mainnet anchor & real USDC (mainnet vision).
- Email notifications, embeddable widget/SDK, multi-currency anchors.
