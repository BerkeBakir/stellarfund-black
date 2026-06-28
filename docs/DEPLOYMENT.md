# StellarFund — Testnet Deployment

> Network: **Stellar Testnet** only. No real funds.
> Deployed 2026-06-28.

## Contract addresses

| Component | Address |
| --- | --- |
| **Factory** | [`CDNLINFENSRBB3WZ4JCSJC5PPJT6CZJPSQ7EY5W2HC4UYZVHMGVHVNAF`](https://stellar.expert/explorer/testnet/contract/CDNLINFENSRBB3WZ4JCSJC5PPJT6CZJPSQ7EY5W2HC4UYZVHMGVHVNAF) |
| **Reputation** | [`CCRWJWU42LP3ATOA6R4SJ4532XXQO6VSIXS5BWNQTZZVYAUSZCG5U7P4`](https://stellar.expert/explorer/testnet/contract/CCRWJWU42LP3ATOA6R4SJ4532XXQO6VSIXS5BWNQTZZVYAUSZCG5U7P4) |
| **Escrow (Campaign) wasm hash** | `f42f7c5faae416b3a77695e9f9a8330cdad45901a1deebea894081ccf7f4f1a2` |
| **USDC (mintable test SAC)** | [`CD4PMJAYGZ6DJI7R47PS7SUJ733GU7B4GEA6W7DKLDM5HJM3TGRPHZE7`](https://stellar.expert/explorer/testnet/contract/CD4PMJAYGZ6DJI7R47PS7SUJ733GU7B4GEA6W7DKLDM5HJM3TGRPHZE7) |
| USDC issuer / deployer | `GBV7COBZWLBL5KCBWIHMWTG4LG5H4P2AMS5RDDAOFN5QBPPW2SZU2A76` |

## Token model

For the L4 testnet sandbox, USDC is a **mintable** Stellar Asset Contract issued by the
StellarFund deployer, so test users can be funded one-tap during onboarding and the full
milestone-escrow loop is demonstrable. The **SEP-24 sandbox anchor**
(`testanchor.stellar.org`) demonstrates the real fiat↔USDC on/off-ramp protocol flow.

## Smoke test (milestone escrow live)

`create_campaign(goal=1000, deadline=2000000000, milestones=[600,400])` deployed escrow
[`CA55N6JECXNMPOQ526745DQYJX6ZMRSQVB5YKVPNHUQUJCAJNE5VR2SP`](https://stellar.expert/explorer/testnet/contract/CA55N6JECXNMPOQ526745DQYJX6ZMRSQVB5YKVPNHUQUJCAJNE5VR2SP)
and registered it in the Factory (`list_campaigns` returns it).

- Factory init tx: `fb0d02b91a1cfb264ee05d02eae128ed1d959fa4b2637a57d90161e0704170b3`
- Reputation init tx: `a3b7f9f1e5e090ed665dbf45edee7a95796438634ea903339abf1d8615935068`
- USDC SAC deploy tx: `81178468dc81cca69f6c0f9f8ef5f41c007e76586c0557af1a40b1c7cdfcb73e`

## Redeploy

See `scripts/deploy.sh`. Requires a funded `stellarfund` identity
(`stellar keys generate stellarfund --network testnet --fund`).
