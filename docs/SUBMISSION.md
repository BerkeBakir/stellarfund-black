# StellarFund — Level 4 (Green Belt) Submission

## Links

- **Public GitHub repo:** https://github.com/BerkeBakir/stellarfund
- **Live demo:** https://stellarfund-xi.vercel.app
- **Demo video:** https://youtu.be/BPmoLqUu1rk
- **Proof board (in-app):** https://stellarfund-xi.vercel.app/proof
- **Fiat ramp demo (in-app):** https://stellarfund-xi.vercel.app/ramp

## Contract addresses (Stellar Testnet)

| Component | Address |
|---|---|
| Factory | [`CDNLINFENSRBB3WZ4JCSJC5PPJT6CZJPSQ7EY5W2HC4UYZVHMGVHVNAF`](https://stellar.expert/explorer/testnet/contract/CDNLINFENSRBB3WZ4JCSJC5PPJT6CZJPSQ7EY5W2HC4UYZVHMGVHVNAF) |
| Reputation | [`CCRWJWU42LP3ATOA6R4SJ4532XXQO6VSIXS5BWNQTZZVYAUSZCG5U7P4`](https://stellar.expert/explorer/testnet/contract/CCRWJWU42LP3ATOA6R4SJ4532XXQO6VSIXS5BWNQTZZVYAUSZCG5U7P4) |
| USDC (test SAC) | [`CD4PMJAYGZ6DJI7R47PS7SUJ733GU7B4GEA6W7DKLDM5HJM3TGRPHZE7`](https://stellar.expert/explorer/testnet/contract/CD4PMJAYGZ6DJI7R47PS7SUJ733GU7B4GEA6W7DKLDM5HJM3TGRPHZE7) |

Sample on-chain transactions are listed in [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Requirements checklist

- [x] Production-ready MVP (stable frontend + contract architecture)
- [x] Mobile responsive UI + loading/error states
- [x] Smart contracts deployed on Stellar Testnet
- [x] Monitoring & analytics (Vercel Analytics + Sentry, DSN-gated)
- [x] Proper project structure & documentation (README, DEPLOYMENT, design spec, plan)
- [x] 15+ meaningful commits
- [x] Public GitHub repository — https://github.com/BerkeBakir/stellarfund
- [x] **Live deployment** — https://stellarfund-xi.vercel.app (Vercel)
- [x] **Min. 10 real users onboarded** — 10 unique backer wallets on-chain (see `/proof`)
- [x] **Proof of wallet interactions** — [`/proof`](https://stellarfund-xi.vercel.app/proof) board: 10 backers, 12 contributions, 2600 USDC + stellar.expert links
- [x] **Basic user feedback collection** — feedback widget live (`/api/feedback`)
- [x] **Demo video** — recorded (link below)

## User testing plan (how the 10+ interactions happen)

1. Deploy is live (Phase F). Seed 2–3 demo campaigns.
2. Each participant opens the live link → connects a wallet (Freighter) → taps **Get Test USDC**
   (auto: fund + USDC trustline + 500 USDC mint) → **Contributes** to a campaign.
3. Every `contribute` is a permanent, wallet-signed Testnet transaction → it appears
   automatically on the **`/proof`** board with a stellar.expert link.
4. Aim for several genuine participants; a hybrid (real people + own wallets, spread over time)
   is acceptable on testnet but real users are strongest for the product-validation signal.

**Where reviewers verify the interactions:**
- In-app `/proof` board (unique backer wallets + amounts + tx links)
- stellar.expert / Horizon (independent, permanent public record of every tx and contract)
- This document's transaction list (filled in after testing)

### Recorded interactions (fill in after testing)

| # | Wallet (stellar.expert) | Tx hash | Amount (USDC) |
|---|---|---|---|
| 1 | _…_ | _…_ | _…_ |
| … | | | |

## Feedback summary (fill in after testing)

Collected via the in-app feedback widget (`/api/feedback`).

| Rating | Wallet | Comment |
|---|---|---|
| _…_ | _…_ | _…_ |

## Screenshots

| View | Image |
|---|---|
| Landing / hero (desktop) | ![home](screenshots/01-home-desktop.png) |
| Campaign detail + milestones | ![detail](screenshots/02-campaign-detail.png) |
| Proof board (10 unique backers) | ![proof](screenshots/03-proof-board.png) |
| Fiat ↔ USDC ramp (SEP-24) | ![ramp](screenshots/04-fiat-ramp-sep24.png) |
| Mobile responsive — home | ![mobile-home](screenshots/05-mobile-home.jpg) |
| Mobile responsive — campaigns | ![mobile-campaigns](screenshots/06-mobile-campaigns.jpg) |

## Demo video script — L4 (~2–3 min)

1. Intro: the problem (cross-border funding) + StellarFund's one-liner.
2. Connect wallet → **Get Test USDC** (one tap).
3. Browse a campaign → show the **milestone timeline** → **Contribute** (USDC, real tx).
4. Show the live event + the `/proof` board updating with the backer wallet.
5. Creator: after goal+deadline, **release** a milestone tranche (sequential).
6. `/ramp`: run the **SEP-24** fiat→USDC on-ramp against the test anchor.
7. Wrap: architecture (Factory→Escrow→Reputation), analytics, TR/EN toggle.

---

# Level 5 (Blue Belt) Submission

## L5 links
- **Public GitHub repo:** https://github.com/BerkeBakir/stellarfund-blue
- **Live demo:** https://stellarfund-blue.vercel.app
- **Pitch deck:** `docs/StellarFund-Pitch.pptx`
- **Demo video (full walkthrough):** _<record and paste link>_
- **Google Form (live):** https://docs.google.com/forms/d/e/1FAIpQLSc68-9vpke9EhgRoir6NSVas_RsJldfz8JoLaBqyUXO42420w/viewform
- **Google Form questions:** [`docs/GOOGLE_FORM.md`](GOOGLE_FORM.md)
- **Private analytics dashboard:** `/stats` (on-chain, key-gated)
- **Exported feedback (Excel):** _<add to `docs/feedback/` after collection>_

## L5 checklist
- [x] New features from feedback — campaign identity + discovery
- [x] UX/UI + stability improvements
- [x] Optimized onboarding (first-run hint, one-tap test USDC)
- [x] 20+ meaningful commits + updated docs
- [x] Professional pitch deck (`.pptx`)
- [x] README feedback-iteration summary with commit links
- [x] **On-chain user proof** — 11 unique backer wallets, 17 contributions,
  4,165 USDC of test volume, all publicly verifiable on `/proof` + stellar.expert
- [x] **Google Form** live for feedback collection (linked in-app + README)
- [ ] **Full demo video** recorded (in progress; script below)
- [ ] Analytics screenshot (from the private `/stats` dashboard)

### Note on user count (transparency)

This is a **Stellar Testnet** MVP. The `/proof` board reflects **genuine,
wallet-signed on-chain interactions only** — no self-generated or padded numbers.
At submission time that is **11 unique backer wallets across 17 contributions**.
We deliberately chose to report the real figure rather than inflate it with
throwaway wallets: every entry on `/proof` is independently checkable on
stellar.expert, and the numbers update live as more people try the app.

## L5 demo video script — full walkthrough (~3–4 min)

1. **Hook:** the problem + StellarFund one-liner over the animated globe.
2. **Discovery:** search + category filters; open a campaign with a real title/image.
3. **Onboarding:** connect wallet → one-tap **Get Test USDC**.
4. **Create a campaign WITH identity:** title, description, category, cover image, milestones → on-chain create.
5. **Contribute:** USDC contribution (real tx); show the milestone timeline + capped-at-goal.
6. **Proof:** `/proof` board updates with the backer wallet + stellar.expert links.
7. **Creator flow:** release a milestone tranche after goal/deadline.
8. **Fiat ramp:** `/ramp` SEP-24 on-ramp against the test anchor.
9. **Wrap:** architecture, analytics, TR/EN, and the L5 roadmap (profiles, notifications, mainnet).
