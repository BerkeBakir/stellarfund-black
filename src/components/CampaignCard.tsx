import Link from 'next/link';
import type { Summary } from '@/lib/campaign';
import { STATUS_LABEL, stroopsToXlm, pct, timeLeft, truncate } from '@/lib/format';

export default function CampaignCard({
  id,
  summary,
  now,
}: {
  id: string;
  summary: Summary;
  now: number;
}) {
  const percent = pct(summary.raised, summary.goal);
  const statusLabel = STATUS_LABEL[summary.status] ?? 'Active';
  return (
    <Link
      href={`/campaign/${id}`}
      className="glass block rounded-xl border border-white/10 p-4 transition hover:border-fuchsia-400/50 hover:shadow-[0_0_24px_-6px_rgba(217,70,239,0.5)]"
    >
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-mono opacity-70">{truncate(summary.creator)}</span>
        <span className="opacity-70">{timeLeft(summary.deadline, now)}</span>
      </div>
      <div className="mb-1 text-sm">
        {stroopsToXlm(summary.raised)} / {stroopsToXlm(summary.goal)}{' '}
        <span className="opacity-60">USDC</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-indigo-400 to-fuchsia-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs opacity-70">
        <span>{percent}%</span>
        <span>
          {statusLabel} · {summary.releasedCount}/{summary.milestoneCount} milestones
        </span>
      </div>
    </Link>
  );
}
