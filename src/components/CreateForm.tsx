'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createCampaign } from '@/lib/factory';
import { useAppStore } from '@/store';
import { xlmToStroops, stroopsToXlm } from '@/lib/format';
import { explorerTxUrl } from '@/lib/config';

function parse(amount: string): bigint | null {
  try {
    const v = xlmToStroops(amount);
    return v > 0n ? v : null;
  } catch {
    return null;
  }
}

export default function CreateForm() {
  const router = useRouter();
  const { connected, publicKey } = useAppStore();
  const [goal, setGoal] = useState('');
  const [days, setDays] = useState('7');
  const [milestones, setMilestones] = useState<string[]>(['', '']);
  const [busy, setBusy] = useState(false);

  const goalUnits = parse(goal);
  const daysOk = /^\d+$/.test(days) && Number(days) >= 1;

  const milestoneUnits = useMemo(() => milestones.map(parse), [milestones]);
  const allMilestonesOk = milestoneUnits.every((m) => m !== null);
  const sum = milestoneUnits.reduce<bigint>((a, m) => a + (m ?? 0n), 0n);
  const sumMatchesGoal = goalUnits !== null && allMilestonesOk && sum === goalUnits;

  const canSubmit = connected && goalUnits !== null && daysOk && sumMatchesGoal && !busy;

  function setMilestone(i: number, v: string) {
    setMilestones((prev) => prev.map((m, idx) => (idx === i ? v : m)));
  }
  function addMilestone() {
    setMilestones((prev) => [...prev, '']);
  }
  function removeMilestone(i: number) {
    setMilestones((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function submit() {
    if (!publicKey || goalUnits === null) return;
    setBusy(true);
    try {
      const deadline = Math.floor(Date.now() / 1000) + Number(days) * 86400;
      const ms = milestoneUnits.map((m) => m as bigint);
      const hash = await createCampaign(publicKey, goalUnits, deadline, ms);
      toast.success('Campaign created!');
      toast.message('Tx', { description: explorerTxUrl(hash) });
      router.push('/');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create campaign.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass flex flex-col gap-3 rounded-xl border border-white/10 p-5">
      <label className="text-sm font-medium">Goal (USDC)</label>
      <input
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        inputMode="decimal"
        placeholder="100"
        className="rounded-lg border border-white/10 bg-transparent px-3 py-2"
      />
      {goal !== '' && goalUnits === null && (
        <span className="text-xs text-red-400">Enter a positive amount (max 7 decimals).</span>
      )}

      <label className="text-sm font-medium">Duration (days)</label>
      <input
        value={days}
        onChange={(e) => setDays(e.target.value)}
        inputMode="numeric"
        className="rounded-lg border border-white/10 bg-transparent px-3 py-2"
      />
      {!daysOk && <span className="text-xs text-red-400">At least 1 day.</span>}

      <div className="mt-2 flex items-center justify-between">
        <label className="text-sm font-medium">Milestones (must sum to goal)</label>
        <button type="button" onClick={addMilestone} className="text-xs text-indigo-300 underline">
          + add
        </button>
      </div>
      {milestones.map((m, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-5 text-xs opacity-60">{i + 1}</span>
          <input
            value={m}
            onChange={(e) => setMilestone(i, e.target.value)}
            inputMode="decimal"
            placeholder="50"
            className="flex-1 rounded-lg border border-white/10 bg-transparent px-3 py-2"
          />
          {milestones.length > 1 && (
            <button
              type="button"
              onClick={() => removeMilestone(i)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <div className="flex justify-between text-xs">
        <span className="opacity-60">
          Sum: {stroopsToXlm(sum)} {goalUnits !== null ? `/ ${stroopsToXlm(goalUnits)}` : ''} USDC
        </span>
        {goalUnits !== null && allMilestonesOk && !sumMatchesGoal && (
          <span className="text-red-400">Milestones must sum to the goal.</span>
        )}
        {sumMatchesGoal && <span className="text-emerald-400">✓ matches goal</span>}
      </div>

      <button
        onClick={submit}
        disabled={!canSubmit}
        className="mt-1 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 font-medium text-white disabled:opacity-40"
      >
        {busy ? 'Creating…' : 'Create campaign'}
      </button>
      {!connected && <span className="text-xs opacity-60">Connect a wallet first.</span>}
    </div>
  );
}
