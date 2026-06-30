'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { runInteractive, type AnchorTx } from '@/lib/anchor/sep24';
import { useAppStore } from '@/store';
import { explorerTxUrl } from '@/lib/config';

const STATUS_COPY: Record<string, string> = {
  opening: 'Authenticating with the anchor (sign in your wallet)…',
  incomplete: 'Waiting for you to complete the anchor form in the pop-up…',
  pending_user_transfer_start: 'Anchor is waiting for the transfer…',
  pending_anchor: 'Anchor is processing…',
  pending_stellar: 'Settling on Stellar…',
  pending_external: 'Processing with the external rail…',
  completed: 'Completed!',
  error: 'The anchor reported an error.',
  expired: 'The request expired.',
  refunded: 'The transfer was refunded.',
};

export default function AnchorRamp() {
  const { connected, publicKey } = useAppStore();
  const [busy, setBusy] = useState<null | 'deposit' | 'withdraw'>(null);
  const [status, setStatus] = useState<string>('');
  const [result, setResult] = useState<AnchorTx | null>(null);

  async function run(kind: 'deposit' | 'withdraw') {
    if (!publicKey) return;
    setBusy(kind);
    setStatus('');
    setResult(null);
    try {
      const tx = await runInteractive(kind, publicKey, setStatus);
      setResult(tx);
      if (tx.status === 'completed') {
        toast.success(`${kind === 'deposit' ? 'On-ramp' : 'Off-ramp'} completed!`);
      } else {
        toast.message(`Anchor status: ${tx.status}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Anchor flow failed.');
    } finally {
      setBusy(null);
    }
  }

  if (!connected || !publicKey) {
    return (
      <p className="text-sm opacity-60">Connect a wallet to use the fiat ramp.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={() => run('deposit')}
          disabled={busy !== null}
          className="glass rounded-xl border border-white/10 p-5 text-left transition hover:border-indigo-400/50 disabled:opacity-50"
        >
          <div className="text-lg font-semibold">💳 → 🪙 On-ramp</div>
          <p className="mt-1 text-sm opacity-70">
            Pay fiat in the anchor sandbox; receive USDC in your wallet (SEP-24 deposit).
          </p>
          <span className="mt-2 inline-block text-sm text-indigo-300">
            {busy === 'deposit' ? 'Running…' : 'Start deposit'}
          </span>
        </button>

        <button
          onClick={() => run('withdraw')}
          disabled={busy !== null}
          className="glass rounded-xl border border-white/10 p-5 text-left transition hover:border-fuchsia-400/50 disabled:opacity-50"
        >
          <div className="text-lg font-semibold">🪙 → 💵 Off-ramp</div>
          <p className="mt-1 text-sm opacity-70">
            Send USDC to the anchor; receive fiat in your country (SEP-24 withdraw).
          </p>
          <span className="mt-2 inline-block text-sm text-fuchsia-300">
            {busy === 'withdraw' ? 'Running…' : 'Start withdraw'}
          </span>
        </button>
      </div>

      {status && (
        <div className="glass rounded-xl border border-white/10 p-4 text-sm">
          <span className="opacity-70">Status: </span>
          <span>{STATUS_COPY[status] ?? status}</span>
        </div>
      )}

      {result && (
        <div className="glass rounded-xl border border-white/10 p-4 text-sm">
          <div>
            Final status: <span className="font-medium">{result.status}</span>
          </div>
          {result.amount_in && <div>Amount in: {result.amount_in}</div>}
          {result.amount_out && <div>Amount out: {result.amount_out}</div>}
          {result.stellar_transaction_id && (
            <a
              href={explorerTxUrl(result.stellar_transaction_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-300 underline"
            >
              Stellar transaction
            </a>
          )}
        </div>
      )}
    </div>
  );
}
