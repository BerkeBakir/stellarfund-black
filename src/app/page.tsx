'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import WalletBar from '@/components/WalletBar';
import PollProvider from '@/components/PollProvider';
import CampaignCard from '@/components/CampaignCard';
import Hero from '@/components/Hero';
import LiveStats from '@/components/LiveStats';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAppStore } from '@/store';
import { getSummary, type Summary } from '@/lib/campaign';
import { useI18n } from '@/i18n/I18nProvider';

export default function Home() {
  const { t } = useI18n();
  const campaigns = useAppStore((s) => s.campaigns);
  const [summaries, setSummaries] = useState<Record<string, Summary>>({});
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const tmr = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30000);
    return () => clearInterval(tmr);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const entries = await Promise.all(
        campaigns.map(async (id) => {
          try {
            return [id, await getSummary(id)] as const;
          } catch {
            return null;
          }
        }),
      );
      if (!active) return;
      const map: Record<string, Summary> = {};
      for (const e of entries) if (e) map[e[0]] = e[1];
      setSummaries(map);
    })();
    return () => {
      active = false;
    };
  }, [campaigns]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 p-4 sm:p-6">
      <nav className="flex items-center justify-between">
        <span className="font-bold text-gradient">StellarFund</span>
        <div className="flex items-center gap-3 text-xs">
          <Link href="/ramp" className="text-indigo-300 underline">
            {t('nav.fiatRamp')} →
          </Link>
          <Link href="/proof" className="text-indigo-300 underline">
            {t('nav.proof')} →
          </Link>
          <LanguageSwitcher />
        </div>
      </nav>

      <Hero />
      <PollProvider />
      <LiveStats summaries={summaries} />
      <WalletBar />

      <div id="campaigns" className="flex items-center justify-between">
        <h2 className="font-semibold">{t('home.campaigns')}</h2>
        <Link
          href="/create"
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-1.5 text-sm font-medium text-white"
        >
          {t('nav.newCampaign')}
        </Link>
      </div>
      {campaigns.length === 0 ? (
        <p className="text-sm opacity-60">{t('home.empty')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {campaigns.map(
            (id) =>
              summaries[id] && (
                <CampaignCard key={id} id={id} summary={summaries[id]} now={now} />
              ),
          )}
        </div>
      )}

      <section className="glass mt-2 rounded-xl border border-white/10 p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide opacity-70">
          {t('how.title')}
        </h3>
        <ol className="flex flex-col gap-2 text-sm opacity-80">
          <li>1. {t('how.step1')}</li>
          <li>2. {t('how.step2')}</li>
          <li>3. {t('how.step3')}</li>
        </ol>
      </section>
    </main>
  );
}
