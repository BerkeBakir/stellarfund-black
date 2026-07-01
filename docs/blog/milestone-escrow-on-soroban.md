# Building Milestone-Escrow Crowdfunding on Soroban

*A technical walkthrough of StellarFund — three cooperating Soroban contracts that
custody XLM and release it only as a creator delivers.*

> Ecosystem contribution for the Stellar Builder Challenge (Level 6). Publish this on
> dev.to / Medium / Hashnode and link it in the README.

## Why milestone escrow

Traditional crowdfunding is all-or-nothing at a single point in time: the platform
holds the money and trusts (or is trusted by) both sides. On a smart-contract platform
we can do better — hold funds **on-chain** and release them **incrementally**, tying
each payout to a milestone, with an automatic refund path if the campaign fails.

That's StellarFund. It runs on Stellar mainnet with three Soroban contracts and
custodies native **XLM**.

## The three contracts

```
Factory ──deploy + init──▶ Campaign (escrow) ──record_success──▶ Reputation
```

### 1. Factory — one escrow per campaign

Instead of a monolith holding every campaign's money, the Factory **deploys a fresh
Campaign contract per campaign** using `env.deployer().with_current_contract(salt)`.
Each campaign gets isolated storage and an isolated balance. The salt is a per-campaign
counter, so addresses are deterministic and unique:

```rust
let campaign_addr = env
    .deployer()
    .with_current_contract(salt)
    .deploy_v2(wasm_hash, ());

campaign_contract::Client::new(&env, &campaign_addr).init(
    &creator, &goal, &deadline, &token, &reputation, &factory_addr, &milestones,
);
```

The Factory also keeps a registry (`list_campaigns`, `is_campaign`) that other
contracts use to verify a caller is a legitimate campaign.

### 2. Campaign — the escrow itself

On `init` the contract validates a core invariant: the milestone schedule must sum to
the goal, and every tranche must be positive.

```rust
let mut sum: i128 = 0;
for amount in milestones.iter() {
    if amount <= 0 { panic!("milestone must be positive"); }
    sum += amount;
    schedule.push_back(Milestone { amount, released: false });
}
if sum != goal { panic!("milestones must sum to goal"); }
```

**Contributing** pulls XLM from the backer into the contract via the token client, and
records the per-backer amount so refunds are exact:

```rust
from.require_auth();
token::TokenClient::new(&env, &token).transfer(&from, &this, &amount);
```

Because StellarFund uses the **native XLM SAC**, the same `TokenClient` interface that
works for any Stellar asset also moves lumens — the escrow logic is asset-agnostic.

**Releasing** is where the milestone logic lives. Releases are strictly sequential,
gated on the goal being met and the deadline passed, and each milestone releases once:

```rust
if index != released_count { panic!("releases must be sequential"); }
...
if new_count == schedule.len() {
    s.set(&DataKey::Status, &Status::Completed);
    ReputationClient::new(&env, &reputation).record_success(&this, &creator);
}
```

**Refunding** is the safety net: after the deadline, if the goal wasn't reached, each
backer can reclaim their exact contribution. Note the checks-effects-interactions
ordering — the stored balance is zeroed **before** the transfer:

```rust
env.storage().persistent().set(&ckey, &0i128);
token::TokenClient::new(&env, &token).transfer(&this, &caller, &amount);
```

### 3. Reputation — provable delivery, not vanity

The Reputation contract increments a creator's score, but only when the caller is a
**Factory-registered campaign** that authorizes the sub-invocation:

```rust
campaign.require_auth();
let is_campaign = FactoryClient::new(&env, &factory).is_campaign(&campaign);
if !is_campaign { panic!("caller is not a registered campaign"); }
```

This cross-contract check is what makes the score meaningful: nobody can inflate their
reputation by calling the contract directly.

## Lessons for mainnet

Moving from testnet to mainnet surfaced real considerations we wrote up in a
[security review](../SECURITY.md):

- **State TTL / archival.** Soroban entries expire on mainnet unless their TTL is
  extended. Long-running campaigns need `extend_ttl` on hot paths or active monitoring.
- **Checks-effects-interactions & `checked_add`.** Safe with the trusted native SAC,
  but worth hardening as defense-in-depth.
- **No faucet.** Testnet's mint-on-demand onboarding doesn't exist on mainnet — the app
  had to switch from a mintable test token to native XLM with real balances.

## Try it

- Live app (Stellar mainnet): `<app-link>`
- Source: `<repo-link>`
- Contracts on stellar.expert: `<factory-link>`

Built with Rust + soroban-sdk, Next.js, and `@creit.tech/stellar-wallets-kit`.
Feedback and PRs welcome. #BuildOnStellar
