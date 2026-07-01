# StellarFund — Security Review (Internal)

> **Purpose.** This is an internal, pre-mainnet security review of the StellarFund
> Soroban contracts, prepared to accompany a **mentor/team security review request**
> (the Level 6 security requirement). It documents the threat model, the invariants
> we rely on, the findings we identified, and the fixes/mitigations applied or
> recommended before real value is custodied on mainnet.
>
> Scope: `contracts/campaign`, `contracts/factory`, `contracts/reputation`
> (commit pinned at review time). Network: Stellar **mainnet**, asset: **native XLM**
> via its Stellar Asset Contract (SAC).

## 1. Architecture & trust model

```
Factory ──deploy+init──▶ Campaign (escrow, custodies XLM) ──record_success──▶ Reputation
   registry of campaigns          contribute / release / refund              score + deliveries
```

- **Factory** deploys and registers each Campaign; holds the campaign wasm hash,
  the token address (native XLM SAC), and the Reputation address.
- **Campaign** is the only contract that custodies value. It holds contributed XLM
  and pays it out to the creator (on milestone release) or back to backers (on refund).
- **Reputation** only increments a creator's score, and only when the caller is a
  Factory-registered campaign that authorizes the sub-invocation.

**Trusted components:** the native XLM SAC (canonical, non-malicious token), the
Stellar ledger's `require_auth` and deployer semantics, and the deploy operator who
runs `init` on each contract exactly once.

## 2. Assets at risk

- **Custodied XLM** in each Campaign (backers' contributions until release/refund).
- **Reputation integrity** (creators' success scores).

## 3. Invariants the design relies on

1. A Campaign can be `init`-ed exactly once (re-init is rejected).
2. `sum(milestones) == goal`, every milestone `> 0`, enforced at init.
3. Contributions only while `Active` and before `deadline`.
4. `release` only by the creator, only after `deadline`, only if `total_raised >= goal`,
   strictly sequential, each milestone released at most once.
5. `refund` only after `deadline`, only if the goal was **not** met, and each backer
   can reclaim their contribution exactly once (balance zeroed before transfer).
6. `record_success` only from a Factory-registered campaign that authorizes the call.

## 4. Methodology

Manual review of all three contracts against the Soroban security checklist:
authorization (`require_auth`), checks-effects-interactions ordering, reentrancy,
integer overflow, storage/TTL (state archival) on mainnet, initialization/one-shot
guards, access control on privileged paths, and denial-of-service surface. The
contract test suites (`cargo test --lib`) exercise the happy paths and the key
revert conditions.

## 5. Findings

| # | Severity | Area | Status |
|---|----------|------|--------|
| F-1 | **Medium** | State TTL / archival on mainnet | Mitigation planned |
| F-2 | Low | Checks-effects-interactions in `release` | Hardening recommended |
| F-3 | Low | Unchecked integer arithmetic | Hardening recommended |
| F-4 | Informational | No upgradeability / emergency pause | Accepted, documented |
| F-5 | Informational | Over-funding past goal allowed on-chain | Accepted (by design) |
| F-6 | Informational | Unbounded `milestones` length at create | Accepted (self-paid) |

### F-1 — State TTL / archival (Medium)

Soroban entries (instance + persistent) expire and can be **archived** on mainnet if
their TTL is not extended. The contracts never call `extend_ttl`. A long-running
campaign (e.g. a 30–45 day deadline) whose entries are not bumped could have its
instance/persistent state archived, temporarily blocking `contribute` / `release` /
`refund` until the entries are restored.

**Mitigation:** (a) bump TTL on the hot paths (`contribute`, `release`, `refund`)
via `env.storage().instance().extend_ttl(...)` and `persistent().extend_ttl(...)`;
and/or (b) operationally monitor campaign TTLs and restore before expiry. For the
initial mainnet launch we keep campaign deadlines short and monitor TTL; adding
explicit `extend_ttl` calls is the recommended follow-up hardening.

### F-2 — Checks-effects-interactions in `release` (Low)

In `release`, the milestone schedule and `ReleasedCount` are persisted **after** the
token transfer to the creator. With the trusted native XLM SAC this is safe (the SAC
does not re-enter). As defense-in-depth against ever swapping the token, persist all
state mutations (`ReleasedCount`, `Milestones`, `TotalReleased`, `Status`) **before**
the external `transfer`. `refund` already follows the correct order (balance zeroed
before transfer). Not exploitable with the fixed native token.

### F-3 — Unchecked integer arithmetic (Low)

`sum += amount`, `total + amount`, `total_released + amount`, `score + 1` use
unchecked arithmetic. With native XLM (total supply ≈ 5×10¹⁷ stroops, far below the
i128 range) realistic overflow is impossible. Recommended hardening: use
`checked_add(...).unwrap()` (or explicit `panic!` on overflow) for defensive clarity.

### F-4 — No upgradeability / emergency pause (Informational)

Contracts are immutable and have no pause switch: a latent bug is permanent and funds
cannot be frozen. This is an intentional trust-minimizing choice; documented so users
understand there is no admin backdoor either. Revisit if a future version needs
governed upgradeability.

### F-5 — Over-funding past goal allowed on-chain (Informational)

`contribute` does not cap `total_raised` at `goal`; the **UI** caps the input, but the
contract accepts contributions beyond the goal. This is harmless (excess simply raises
`total_raised`; releases are bounded by the milestone schedule and any surplus is
covered by the same custody logic) and is accepted by design.

### F-6 — Unbounded `milestones` length (Informational)

`create_campaign` / `init` accept an arbitrarily long milestone vector; a very large
vector could hit instruction/size limits. The transaction is paid for by the creator,
so this is self-limiting griefing only. Accepted.

## 6. Authorization review (passed)

- `contribute` → `from.require_auth()` ✔
- `release` → `creator.require_auth()` ✔ (creator loaded from storage, not caller-supplied)
- `refund` → `caller.require_auth()` ✔ (refunds only the caller's own balance)
- `create_campaign` → `creator.require_auth()` ✔
- `record_success` → `campaign.require_auth()` **and** Factory `is_campaign` gate ✔
- `init` (all three) → one-shot, rejects re-initialization ✔

## 7. Recommendations before/at mainnet

1. **(F-1)** Add `extend_ttl` on hot paths or actively monitor/restore campaign TTLs.
2. **(F-2, F-3)** Apply checks-effects-interactions ordering and `checked_add` as
   low-risk hardening in the next contract revision.
3. Keep the token fixed to the canonical native XLM SAC
   (`CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA`).
4. Request the **mentor/team security review** with this document as the starting point.
5. Launch with short campaign deadlines and small amounts while the review completes.

## 8. Test coverage

`cargo test --lib` across the three contracts covers: init validation (goal/milestone
sum), contribute gating (status/deadline), sequential release with goal/deadline
checks, refund-on-miss, and the Reputation registered-caller gate. See each
`contracts/*/src/test.rs`.

---

_This internal review does not replace an independent professional audit. It is
provided as the basis for the Level 6 mentor/team security review._
