import { scValToNative, xdr } from '@stellar/stellar-sdk';
import { server, withRetry } from './soroban';

export type EventKind = 'created' | 'contrib' | 'goal_met' | 'claimed' | 'refunded' | 'rep_up';
export type ChainEvent = {
  kind: EventKind; contract: string; topicAddr: string; value: string; ledger: number; txHash: string;
};

const KINDS: Record<string, EventKind> = {
  created: 'created', contrib: 'contrib', goal_met: 'goal_met',
  claimed: 'claimed', refunded: 'refunded', rep_up: 'rep_up',
};

export async function fetchLatestLedger(): Promise<number> {
  return (await server.getLatestLedger()).sequence;
}

export async function getCampaignEvents(
  startLedger: number, contractIds: string[]
): Promise<{ events: ChainEvent[]; latestLedger: number }> {
  if (contractIds.length === 0) return { events: [], latestLedger: startLedger };
  const events: ChainEvent[] = [];
  let latestLedger = startLedger;
  // Soroban RPC allows at most 5 contract IDs per filter; scan in chunks of 5.
  for (let c = 0; c < contractIds.length; c += 5) {
    const chunk = contractIds.slice(c, c + 5);
    const resp = await withRetry(() =>
      server.getEvents({
        startLedger,
        filters: [{ type: 'contract', contractIds: chunk, topics: [['*', '*']] }],
      }),
    );
    latestLedger = Math.max(latestLedger, resp.latestLedger);
    for (const e of resp.events ?? []) {
      try {
        const topics = (e.topic as xdr.ScVal[]).map((t) => scValToNative(t));
        const kind = KINDS[String(topics[0])];
        if (!kind) continue;
        const value = scValToNative(e.value);
        events.push({
          kind,
          contract: e.contractId?.toString() ?? '',
          topicAddr: topics[1] != null ? String(topics[1]) : '',
          value: typeof value === 'bigint' ? value.toString() : String(value),
          ledger: e.ledger,
          txHash: e.txHash ?? '',
        });
      } catch { /* skip undecodable */ }
    }
  }
  return { events, latestLedger };
}
