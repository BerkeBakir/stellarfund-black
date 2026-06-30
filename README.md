# StellarFund 🟢

> Cross-border crowdfunding & SME micro-financing on **Stellar Testnet** — backers fund
> creators anywhere, money is held in a **USDC milestone-escrow** smart contract that
> releases funds tranche-by-tranche as milestones are met, and **refunds are enforced by
> code** if the goal is missed. A real **SEP-24 anchor** bridge demonstrates the fiat↔USDC
> on/off ramp.

Built for the **Stellar Journey to Mastery — Green Belt (Level 4)**. Evolves the Orange Belt
crowdfund engine (Factory → Campaign → Reputation) into a production-shaped fintech product.

🔗 **Live demo:** https://stellarfund-xi.vercel.app
🎬 **Demo video:** https://youtu.be/BPmoLqUu1rk
🧾 **Proof of users:** https://stellarfund-xi.vercel.app/proof (on-chain unique-backer evidence)

> **Network:** Stellar **Testnet** only. No real funds.

---

## Why it matters

Cross-border fundraising is broken for everyone outside major financial hubs: 5–10%+ fees,
days to settle, and most emerging-market creators can't even access Kickstarter/GoFundMe
payout rails. StellarFund makes global funding near-instant, sub-cent, transparent, and
**milestone-enforced** — a backer in Germany can fund a bakery in Kenya in seconds, for cents,
and the creator receives spendable value released against real progress.

## Architecture — 3 contracts, milestone escrow

```
        create_campaign(goal, milestones[])            record_success()
  ┌──────────┐  deploy + init   ┌──────────────────┐  on completion  ┌────────────┐
  │ Factory  │ ───────────────▶ │ Escrow (Campaign) │ ──────────────▶ │ Reputation │
  │ registry │                  │ USDC custody +    │                 │  scores +  │
  └──────────┘ ◀── is_campaign ─│ milestone release │                 │ deliveries │
                                 └──────────────────┘
                                   │ USDC SAC transfer (contribute / release / refund)
                                   ▼
                          ┌────────────────────────┐
                          │  Testnet USDC (SAC)     │
                          └────────────────────────┘
```

- **Factory** — `create_campaign(creator, goal, deadline, milestones)` deploys & registers an Escrow; `list_campaigns`, `is_campaign`.
- **Escrow** — custodies USDC. `contribute`, `release(index)` (sequential milestone tranche to creator, after goal met + deadline), `refund` (backers reclaim if goal missed). State: Active → Releasing → Completed / Refunding. Invariant: milestones sum to goal; each releases once. Calls Reputation on final release.
- **Reputation** — `record_success` (gated to registered campaigns via Factory), `get_score`, `milestones_delivered`.

## Fiat ↔ USDC bridge (SEP-24 sandbox anchor)

The `/ramp` page runs the real **SEP-10 auth + SEP-24 interactive deposit/withdraw** protocol
against `testanchor.stellar.org`: pay fiat → receive USDC (on-ramp), or send USDC → receive fiat
(off-ramp), with KYC collected inside the interactive flow (SEP-12).

> **Token note:** the test anchor issues its own USDC (issuer `GBBD47IF…`), which differs from
> the escrow's mintable test USDC (issuer `GBV7COBZ…`). The anchor therefore demonstrates the
> **fiat-ramp protocol**; the escrow loop runs on the mintable USDC so test users can be funded
> one-tap. Both are real on testnet.

## Features

- USDC **milestone escrow** with sequential tranche release + code-enforced refunds
- **One-tap onboarding** — `Get Test USDC` (fund + USDC trustline + faucet mint) in one click
- **SEP-24 fiat↔USDC ramp** (`/ramp`)
- **Proof board** (`/proof`) — unique backer wallets straight from chain, with stellar.expert links
- **Bold animated UI** — aurora/glassmorphism theme, Framer-Motion hero with a cross-border money arc, live count-up stats
- **TR/EN i18n** + language switcher
- **Feedback widget**, **Vercel Analytics**, **Sentry** (DSN-gated), **PWA**
- **CI/CD** — contract tests + frontend lint/test/build

## What's new in Level 5 (Blue Belt)

- **Campaign identity** — title, description, category, cover image and creator name (off-chain in Vercel Blob, keyed by contract address). Cards and detail pages now show real campaigns instead of raw addresses.
- **Discovery** — text search + category filters (Education, Health, Technology, Community, Emergency, Other) on top of the active/past split.
- **Onboarding** — first-run 3-step hint; one-tap `Get Test USDC` retained.
- **Stability** — home "unique backers" stat now reads real on-chain backers; `getEvents` pagination + 5-contract chunking; contributions capped at the goal.

## Feedback-driven improvements

User feedback is collected via a Google Form (questions in [`docs/GOOGLE_FORM.md`](docs/GOOGLE_FORM.md));
the exported responses live at **`docs/feedback/` _(Excel link added after collection)_**. Each
recurring theme maps to a shipped change:

| Feedback theme | Shipped change | Commit |
|---|---|---|
| "I can't tell what a campaign is — only an address shows" | Campaign identity (title/description/category/image/creator) | [`0230d31`](https://github.com/BerkeBakir/stellarfund/commit/0230d31), [`7685208`](https://github.com/BerkeBakir/stellarfund/commit/7685208) |
| "Hard to find relevant campaigns" | Search + category filters | [`7685208`](https://github.com/BerkeBakir/stellarfund/commit/7685208) |
| "I didn't know I needed test USDC before contributing" | First-run onboarding hint + contribute pre-check | [`3114ccc`](https://github.com/BerkeBakir/stellarfund/commit/3114ccc), [`cd3be2c`](https://github.com/BerkeBakir/stellarfund/commit/cd3be2c) |
| "Couldn't connect my mobile/other wallet" | Added Albedo/Rabet/Hana + WalletConnect | [`24a4c3b`](https://github.com/BerkeBakir/stellarfund/commit/24a4c3b) |
| "Proof page showed 0 backers" | getEvents pagination + 5-ID chunking fix | [`c8d6d68`](https://github.com/BerkeBakir/stellarfund/commit/c8d6d68) |

> Next phase: creator profiles, campaign comments/updates, email notifications, and a path to mainnet — prioritised by the form's "which feature next?" responses.

## Tech stack

| Layer | Technology |
|---|---|
| Contracts | Rust + soroban-sdk 22 (Soroban), stellar-cli 27 |
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind v4, Framer Motion |
| Chain | @stellar/stellar-sdk 16, @creit.tech/stellar-wallets-kit 2.4 |
| Anchor | SEP-10 / SEP-24 / SEP-12 (testanchor.stellar.org) |
| Telemetry | Vercel Analytics, Sentry |
| Hosting | Vercel |

## Deployed on Testnet

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full address table.

| Contract | Address |
|---|---|
| Factory | `CDNLINFENSRBB3WZ4JCSJC5PPJT6CZJPSQ7EY5W2HC4UYZVHMGVHVNAF` |
| Reputation | `CCRWJWU42LP3ATOA6R4SJ4532XXQO6VSIXS5BWNQTZZVYAUSZCG5U7P4` |
| USDC (test SAC) | `CD4PMJAYGZ6DJI7R47PS7SUJ733GU7B4GEA6W7DKLDM5HJM3TGRPHZE7` |

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000

# contracts
cd contracts/<name> && cargo test --lib
```

Environment (`.env.local`, all optional except the faucet secret for onboarding):

```bash
USDC_ISSUER_SECRET=        # server-only; mints test USDC for onboarding
NEXT_PUBLIC_SENTRY_DSN=    # enables Sentry error tracking
FEEDBACK_WEBHOOK_URL=      # forwards feedback to a webhook
```

## Project structure

```
contracts/{factory,campaign,reputation}   # Soroban contracts (Rust)
src/lib/         # chain clients (soroban, factory, campaign, reputation, events, onboard, proof)
src/lib/anchor/  # SEP-10 + SEP-24 anchor integration
src/components/  # UI (Hero, CampaignDetail, CreateForm, WalletBar, AnchorRamp, FeedbackForm, …)
src/app/         # routes: / /create /campaign/[id] /ramp /proof /api/{faucet,feedback}
src/i18n/        # EN/TR messages + provider
docs/            # design spec, plan, deployment, submission
```

## License

MIT — testnet demo for the Stellar Journey to Mastery program.
