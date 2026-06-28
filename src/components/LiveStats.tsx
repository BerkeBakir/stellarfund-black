'use client';
import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { useI18n } from '@/i18n/I18nProvider';
import { stroopsToXlm } from '@/lib/format';
import type { Summary } from '@/lib/campaign';

function Counter({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const controls = animate(0, value, {
      duration: 1,
      ease: 'easeOut',
      onUpdate: (v) => {
        node.textContent = Math.round(v).toLocaleString();
      },
    });
    return () => controls.stop();
  }, [value]);
  return (
    <div className="glass rounded-xl border border-white/10 p-4 text-center">
      <span ref={ref} className="text-2xl font-bold text-gradient">
        0
      </span>
      <div className="text-xs opacity-60">{label}</div>
    </div>
  );
}

export default function LiveStats({ summaries }: { summaries: Record<string, Summary> }) {
  const { t } = useI18n();
  const [raised, setRaised] = useState(0);
  const list = Object.values(summaries);

  useEffect(() => {
    const total = list.reduce<bigint>((a, s) => a + s.raised, 0n);
    setRaised(Number(stroopsToXlm(total)) || 0);
  }, [list]);

  return (
    <div className="grid grid-cols-3 gap-3">
      <Counter value={list.length} label={t('stats.campaigns')} />
      <Counter value={Math.round(raised)} label={t('stats.raised')} />
      <Counter value={new Set(list.map((s) => s.creator)).size} label={t('stats.backers')} />
    </div>
  );
}
