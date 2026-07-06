# StellarFund — Level 6 (Black Belt) Submission

Mainnet launch + security + real adoption. This document tracks the Level 6
deliverables; `<…>` placeholders are filled in after the mainnet deploy.

## Links
- **Public GitHub repo:** https://github.com/BerkeBakir/stellarfund-black
- **Live mainnet app:** https://stellarfund-black.vercel.app
- **Demo video:** `<video-link>`
- **Twitter/X launch post:** `<tweet-link>` (see `docs/MARKETING.md`)
- **Technical blog (ecosystem contribution):** `<blog-link>` (draft in `docs/blog/`)
- **Security review:** [`docs/SECURITY.md`](SECURITY.md) → mentor/team review: `<status>`
- **User guide:** [`docs/USER_GUIDE.md`](USER_GUIDE.md)
- **Proof of users (mainnet):** https://stellarfund-black.vercel.app/proof
- **Private analytics:** `/stats` (key-gated)
- **User onboarding form:** https://docs.google.com/forms/d/e/1FAIpQLSdPHTcL_s4Q2TTPq6YpXOhP0XYzS-EGpXm1nKwajXKU_lMOQw/viewform (questions in `docs/GOOGLE_FORM.md`)
- **Exported responses (Excel):** `docs/feedback/…xlsx` `<add after collection>`

## Mainnet contract addresses (Stellar Public)
| Component | Address |
|---|---|
| Factory | `CBUAZAAH7R7WXP3PIBKVPHYJ3XIHUTDOYBNUPPTLDVUWI6ZK6X33ZPN2` |
| Reputation | `CCXGJUE6UXPMU27WKJZJS7XXV2NA5ZQPWLPQUJ2XNGDH5TD7L4DMAT5X` |
| Token (native XLM SAC) | `CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA` |
| Campaign wasm hash | `f42f7c5faae416b3a77695e9f9a8330cdad45901a1deebea894081ccf7f4f1a2` |

## Requirements checklist
- [x] **Advanced feature** — Cross-border flows via SEP-24/SEP-10 anchor integration
      (protocol demo); native-XLM escrow model. _(Fee Sponsorship optional follow-up.)_
- [x] Native XLM migration (no faucet), mainnet config, production build
- [x] Security review document ([`docs/SECURITY.md`](SECURITY.md))
- [x] Launch/marketing kit ([`docs/MARKETING.md`](MARKETING.md))
- [x] Technical blog draft ([`docs/blog/`](blog/milestone-escrow-on-soroban.md))
- [x] User guide + full documentation
- [x] Onboarding form spec (wallet + email + name + rating + feedback)
- [x] 30+ meaningful commits
- [x] **Smart contracts deployed on mainnet** — Factory + Reputation live (see addresses)
- [ ] **Live production app on mainnet** — Vercel deploy of the mainnet build
- [ ] **20+ verified mainnet users** with real on-chain activity (tracked on `/proof`)
- [ ] **Security review approved** by mentor/team (submit `docs/SECURITY.md`)
- [ ] **Twitter/X launch post** published (fill link)
- [ ] **Ecosystem contribution** published (blog link)
- [ ] Responses exported to Excel + linked in README + improvement section w/ commit links

## What still needs real-world action
1. **Fund the deploy account** with ~10–25 XLM: `GAQ5YHRV5POBZDJFP5EI5S6HOJCXVFY5LOQG76TI44D3DDEKCIANNURB`
2. After funding: build + deploy the 3 contracts to mainnet, set env vars, deploy the app.
3. Onboard **20+ real** mainnet users (no fabricated wallets).
4. Publish the Twitter/X launch and the blog; request the mentor security review.
5. Collect form responses → export Excel → link in README with improvement commits.

## Demo video script (mainnet, ~2–3 min)
1. Hook: the problem + StellarFund one-liner over the animated globe.
2. Connect a mainnet wallet; show the XLM balance.
3. Browse/discover a campaign; open the milestone timeline.
4. Contribute a small amount of **real XLM** (real mainnet tx); show it on `/proof`.
5. Create a campaign with identity + milestones (Factory deploys the escrow).
6. Creator: release a milestone tranche after goal + deadline.
7. Wrap: architecture (Factory→Escrow→Reputation), security review, roadmap.
