'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import WalletBar from '@/components/WalletBar';
import PollProvider from '@/components/PollProvider';
import CampaignCard from '@/components/CampaignCard';
import Hero from '@/components/Hero';
import LiveStats from '@/components/LiveStats';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import FirstRunHint from '@/components/FirstRunHint';
import { useAppStore } from '@/store';
import { getSummary, type Summary } from '@/lib/campaign';
import { FEEDBACK_FORM_URL, HIDDEN_CAMPAIGNS, ANCHOR_ENABLED } from '@/lib/config';
import { getAllMetadata, type CampaignMeta, CATEGORIES } from '@/lib/metadata';
import { filterCampaigns } from '@/lib/discovery';
import { getProofData } from '@/lib/proof';
import { useI18n } from '@/i18n/I18nProvider';

export default function Home() {
  const { t } = useI18n();
  const allCampaigns = useAppStore((s) => s.campaigns);
  const campaigns = allCampaigns.filter((id) => !HIDDEN_CAMPAIGNS.has(id));
  const [summaries, setSummaries] = useState<Record<string, Summary>>({});
  const [meta, setMeta] = useState<Record<string, CampaignMeta>>({});
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [backers, setBackers] = useState<number | null>(null);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const tmr = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30000);
    return () => clearInterval(tmr);
  }, []);

  useEffect(() => {
    let active = true;
    getAllMetadata()
      .then((m) => {
        if (active) setMeta(m);
      })
      .catch(() => {});
    // Real unique-backer count from on-chain contributions (lazy; ~few seconds).
    getProofData()
      .then((p) => {
        if (active) setBackers(p.uniqueBackers);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
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
      // Merge into the previous summaries instead of replacing: a transient
      // RPC rate-limit on one campaign shouldn't make it vanish from the list
      // (that caused the "campaign flickers in and out" issue).
      setSummaries((prev) => {
        const map = { ...prev };
        for (const e of entries) if (e) map[e[0]] = e[1];
        return map;
      });
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
          {ANCHOR_ENABLED && (
            <Link href="/ramp" className="text-indigo-300 underline">
              {t('nav.fiatRamp')} →
            </Link>
          )}
          <Link href="/proof" className="text-indigo-300 underline">
            {t('nav.proof')} →
          </Link>
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-fuchsia-300 underline"
          >
            {t('nav.feedback')} →
          </a>
          <LanguageSwitcher />
        </div>
      </nav>

      <Hero />
      <FirstRunHint />
      <PollProvider />
      <LiveStats summaries={summaries} backers={backers} />
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

      {/* Discovery: search + category chips */}
      <div className="flex flex-col gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('discovery.search')}
          className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategory(null)}
            className={`rounded-full px-3 py-1 text-xs ${category === null ? 'bg-white/20 font-semibold' : 'bg-white/5 opacity-70 hover:opacity-100'}`}
          >
            {t('discovery.all')}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1 text-xs ${category === c ? 'bg-white/20 font-semibold' : 'bg-white/5 opacity-70 hover:opacity-100'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-sm opacity-60">{t('home.empty')}</p>
      ) : (
        (() => {
          const withSummary = campaigns.filter((id) => summaries[id]);
          // Apply discovery search + category filter.
          const matched = new Set(
            filterCampaigns(
              withSummary.map((id) => ({ address: id, meta: meta[id] })),
              { query, category },
            ),
          );
          const visible = withSummary.filter((id) => matched.has(id));
          // Active = still accepting contributions (Active status, not ended, goal not reached).
          const active = visible.filter((id) => {
            const s = summaries[id];
            return s.status === 0 && now <= s.deadline && s.raised < s.goal;
          });
          const past = visible.filter((id) => !active.includes(id));
          const Section = ({ ids }: { ids: string[] }) => (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ids.map((id) => (
                <CampaignCard key={id} id={id} summary={summaries[id]} now={now} meta={meta[id]} />
              ))}
            </div>
          );
          return (
            <>
              <h3 className="text-sm font-semibold uppercase tracking-wide opacity-70">
                {t('home.active')} ({active.length})
              </h3>
              {active.length === 0 ? (
                <p className="text-sm opacity-50">—</p>
              ) : (
                <Section ids={active} />
              )}
              {past.length > 0 && (
                <>
                  <h3 className="mt-3 text-sm font-semibold uppercase tracking-wide opacity-70">
                    {t('home.past')} ({past.length})
                  </h3>
                  <Section ids={past} />
                </>
              )}
            </>
          );
        })()
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
