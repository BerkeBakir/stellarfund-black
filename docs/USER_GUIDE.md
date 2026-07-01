# StellarFund — User Guide

StellarFund is crowdfunding on **Stellar mainnet**. You back campaigns in **XLM**; the
money is held by a smart-contract escrow and released to the creator milestone-by-
milestone, or refunded to backers if the campaign misses its goal.

> **Real value.** This runs on mainnet with real XLM. Only contribute what you're
> comfortable with, and **never share your wallet's secret key** with anyone.

## 1. Get a Stellar wallet

Install one of the supported wallets:
- **Freighter** (browser extension) — easiest to start
- Albedo, xBull, LOBSTR, Rabet, Hana, or any WalletConnect-compatible wallet

Create/restore an account and **back up your recovery phrase** offline.

## 2. Fund your wallet with XLM

There is no faucet on mainnet. Acquire a small amount of XLM (from an exchange or a
friend) and send it to your wallet address. You need enough to:
- keep the account's base reserve (~1 XLM), and
- cover your contribution plus small network fees.

The wallet bar in the app shows your current XLM balance once connected.

## 3. Connect

Open the app, click **Connect Wallet**, and pick your wallet. Approve the connection.
Your address (truncated) and XLM balance appear in the wallet bar.

## 4. Back a campaign

1. Browse campaigns on the home page — filter by category or search.
2. Open a campaign to see its **milestone timeline**, goal, and progress.
3. Enter an amount (or tap **Max** to fill what's left to the goal) and click
   **Contribute**. Approve the transaction in your wallet.
4. Your contribution appears on the campaign and on the **Proof of Users** board, with
   a link to the transaction on stellar.expert.

## 5. Create a campaign

1. Click **+ New campaign**.
2. Add identity: title, description, category, cover image, creator name.
3. Set the **goal (XLM)** and define **milestones** — each releases one tranche of
   funds. Milestones must sum to the goal.
4. Submit and approve. The Factory deploys your escrow contract on-chain.

## 6. Release funds (creators)

After your campaign's **deadline passes** and the **goal is met**, open your campaign
and click **Release milestone N**. Releases happen in order; each pays one tranche to
your wallet. The final release marks the campaign completed and records a success on
your on-chain reputation.

## 7. Refunds (backers)

If a campaign's deadline passes **without** reaching its goal, open it and click
**Refund** to reclaim your contribution. Refunds are enforced by the contract — no
approval from anyone else is needed.

## Safety notes

- StellarFund never asks for your secret key or recovery phrase.
- All contracts are public and verifiable on stellar.expert (see the README).
- The app holds no custody — funds live in the on-chain escrow contract.

## Troubleshooting

- **"Account isn't funded yet"** — send a little XLM to your address first.
- **Transaction failed / insufficient balance** — keep enough XLM for your contribution
  plus the base reserve and fees.
- **Wallet won't connect** — make sure the extension is unlocked and on the correct
  network (Stellar **Public/Mainnet**), then retry.
