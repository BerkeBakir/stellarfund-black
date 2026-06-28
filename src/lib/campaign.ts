import { simulateRead, invoke, nativeToScVal, scValToNative, Address, xdr } from './soroban';

export type Summary = {
  creator: string;
  goal: bigint;
  deadline: number;
  raised: bigint;
  status: number; // 0 Active, 1 Releasing, 2 Completed, 3 Refunding
  milestoneCount: number;
  releasedCount: number;
};

export type Milestone = {
  amount: bigint;
  released: boolean;
};

export { STATUS_LABEL } from './format';

export async function getSummary(id: string): Promise<Summary> {
  const t = (await simulateRead(id, 'summary')) as [
    string,
    bigint,
    bigint | number,
    bigint,
    number,
    number,
    number,
  ];
  return {
    creator: String(t[0]),
    goal: BigInt(t[1]),
    deadline: Number(t[2]),
    raised: BigInt(t[3]),
    status: Number(t[4]),
    milestoneCount: Number(t[5]),
    releasedCount: Number(t[6]),
  };
}

export async function getMilestones(id: string): Promise<Milestone[]> {
  const raw = (await simulateRead(id, 'milestones')) as Array<{
    amount: bigint | number;
    released: boolean;
  }>;
  return (raw ?? []).map((m) => ({
    amount: BigInt(m.amount),
    released: Boolean(m.released),
  }));
}

export async function totalReleased(id: string): Promise<bigint> {
  const v = (await simulateRead(id, 'total_released')) as bigint | number;
  return BigInt(v ?? 0);
}

export async function contributionOf(id: string, who: string): Promise<bigint> {
  const v = (await simulateRead(id, 'contribution_of', [
    new Address(who).toScVal(),
  ])) as bigint | number;
  return BigInt(v ?? 0);
}

export async function contribute(pk: string, id: string, amount: bigint): Promise<string> {
  return invoke(pk, id, 'contribute', [
    new Address(pk).toScVal(),
    nativeToScVal(amount, { type: 'i128' }),
  ]);
}

/** Release milestone `index` (creator only, after goal met + deadline). */
export async function release(pk: string, id: string, index: number): Promise<string> {
  return invoke(pk, id, 'release', [nativeToScVal(index, { type: 'u32' })]);
}

export async function refund(pk: string, id: string): Promise<string> {
  return invoke(pk, id, 'refund', [new Address(pk).toScVal()]);
}

// re-export so callers can build i128 vecs if needed
export { scValToNative, xdr };
