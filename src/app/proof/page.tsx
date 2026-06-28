'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProofData, type ProofData } from '@/lib/proof';
import { stroopsToXlm, truncate } from '@/lib/format';
import { explorerAccountUrl, explorerTxUrl } from '@/lib/config';

export default function ProofPage() {
  const [data, setData] = useState<ProofData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const d = await getProofData();
        if (active) setData(d);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load proof data');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 p-4 sm:p-6">
      <header className="flex flex-col gap-1">
        <Link href="/" className="text-xs text-indigo-300 underline">
          ← back
        </Link>
        <h1 className="text-2xl font-bold text-gradient">User-interaction proof</h1>
        <p className="text-sm opacity-70">
          Every contribution is a real, wallet-signed transaction on Stellar Testnet — permanent
          and publicly verifiable. Unique backer wallets are listed below with links to
          stellar.expert.
        </p>
      </header>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {!data && !error && <p className="text-sm opacity-60">Reading the chain…</p>}

      {data && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Unique backers" value={String(data.uniqueBackers)} />
            <Stat label="Contributions" value={String(data.totalContributions)} />
            <Stat label="Volume (USDC)" value={stroopsToXlm(data.totalVolume)} />
          </div>

          {data.backers.length === 0 ? (
            <p className="text-sm opacity-60">
              No contributions in the current RPC window yet. Once backers contribute, they appear
              here automatically. (Full history is always on stellar.expert.)
            </p>
          ) : (
            <div className="glass overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-left text-xs uppercase opacity-70">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Backer wallet</th>
                    <th className="px-3 py-2">USDC</th>
                    <th className="px-3 py-2">Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {data.backers.map((b, i) => (
                    <tr key={b.address} className="border-t border-white/5">
                      <td className="px-3 py-2 opacity-60">{i + 1}</td>
                      <td className="px-3 py-2">
                        <a
                          href={explorerAccountUrl(b.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-indigo-300 underline"
                        >
                          {truncate(b.address)}
                        </a>
                        {b.contributions > 1 && (
                          <span className="ml-2 text-xs opacity-50">×{b.contributions}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono">{stroopsToXlm(b.totalContributed)}</td>
                      <td className="px-3 py-2">
                        {b.lastTxHash ? (
                          <a
                            href={explorerTxUrl(b.lastTxHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-300 underline"
                          >
                            view
                          </a>
                        ) : (
                          <span className="opacity-40">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs opacity-50">
            Window: ledgers {data.windowStartLedger}–{data.latestLedger} (testnet RPC retention).
          </p>
        </>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl border border-white/10 p-4 text-center">
      <div className="text-2xl font-bold text-gradient">{value}</div>
      <div className="text-xs opacity-60">{label}</div>
    </div>
  );
}
