'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { openWalletModal, disconnect } from '@/lib/wallet';
import { fundAccount } from '@/lib/friendbot';
import { getTestUsdc } from '@/lib/onboard';
import { useAppStore } from '@/store';
import { truncate } from '@/lib/format';
import { explorerTxUrl } from '@/lib/config';

export default function WalletBar() {
  const { publicKey, connected, setWallet } = useAppStore();
  const [busy, setBusy] = useState(false);

  async function connect() {
    setBusy(true);
    try {
      setWallet(await openWalletModal());
      toast.success('Wallet connected.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to connect.');
    } finally {
      setBusy(false);
    }
  }
  async function handleDisconnect() {
    try {
      await disconnect();
    } catch {
      /* ignore */
    }
    setWallet(null);
  }
  async function fund() {
    if (!publicKey) return;
    setBusy(true);
    try {
      await fundAccount(publicKey);
      toast.success('Funded with Test XLM.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Funding failed.');
    } finally {
      setBusy(false);
    }
  }
  async function getUsdc() {
    if (!publicKey) return;
    setBusy(true);
    const t = toast.loading('Funding account, setting USDC trustline, minting…');
    try {
      const hash = await getTestUsdc(publicKey);
      toast.success('Got 500 Test USDC!', {
        id: t,
        description: 'Tx: ' + explorerTxUrl(hash),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not get test USDC.', { id: t });
    } finally {
      setBusy(false);
    }
  }

  if (!connected || !publicKey) {
    return (
      <div className="glass flex items-center justify-between gap-3 rounded-xl border border-white/10 p-3">
        <span className="text-sm opacity-70">Connect a wallet to start</span>
        <button
          onClick={connect}
          disabled={busy}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? 'Connecting…' : 'Connect Wallet'}
        </button>
      </div>
    );
  }
  return (
    <div className="glass flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 p-3">
      <span className="font-mono text-sm">{truncate(publicKey)}</span>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={getUsdc}
          disabled={busy}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? '…' : 'Get Test USDC'}
        </button>
        <button
          onClick={fund}
          disabled={busy}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {busy ? '…' : 'Get Test XLM'}
        </button>
        <button
          onClick={handleDisconnect}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
