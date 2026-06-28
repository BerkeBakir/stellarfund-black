import { listCampaigns } from './factory';
import { getCampaignEvents, fetchLatestLedger } from './events';

export type Backer = {
  address: string;
  totalContributed: bigint; // USDC base units (sums contrib events seen in window)
  contributions: number;
  lastLedger: number;
  lastTxHash: string;
};

export type ProofData = {
  backers: Backer[];
  uniqueBackers: number;
  totalContributions: number;
  totalVolume: bigint;
  windowStartLedger: number;
  latestLedger: number;
};

// Testnet RPC keeps roughly a 24h event window (~17280 ledgers). We look back a
// little under that to stay inside retention.
const LOOKBACK_LEDGERS = 17000;

/**
 * Build the user-interaction proof from on-chain `contrib` events across every
 * campaign. Each backer is a real wallet that signed a contribution — permanent,
 * public evidence. Dedupes by address. (stellar.expert holds the full history
 * beyond the RPC retention window as a backstop.)
 */
export async function getProofData(): Promise<ProofData> {
  const latestLedger = await fetchLatestLedger();
  const windowStartLedger = Math.max(latestLedger - LOOKBACK_LEDGERS, 1);
  const campaigns = await listCampaigns();

  const byAddress = new Map<string, Backer>();
  let totalContributions = 0;
  let totalVolume = 0n;

  if (campaigns.length > 0) {
    const { events } = await getCampaignEvents(windowStartLedger, campaigns);
    for (const e of events) {
      if (e.kind !== 'contrib' || !e.topicAddr) continue;
      const amount = (() => {
        try {
          return BigInt(e.value);
        } catch {
          return 0n;
        }
      })();
      totalContributions += 1;
      totalVolume += amount;
      const prev = byAddress.get(e.topicAddr);
      if (prev) {
        prev.totalContributed += amount;
        prev.contributions += 1;
        if (e.ledger >= prev.lastLedger) {
          prev.lastLedger = e.ledger;
          prev.lastTxHash = e.txHash;
        }
      } else {
        byAddress.set(e.topicAddr, {
          address: e.topicAddr,
          totalContributed: amount,
          contributions: 1,
          lastLedger: e.ledger,
          lastTxHash: e.txHash,
        });
      }
    }
  }

  const backers = [...byAddress.values()].sort((a, b) => b.lastLedger - a.lastLedger);
  return {
    backers,
    uniqueBackers: backers.length,
    totalContributions,
    totalVolume,
    windowStartLedger,
    latestLedger,
  };
}
