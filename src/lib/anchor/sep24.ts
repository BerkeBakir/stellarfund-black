'use client';
import { getAnchorToken } from './sep10';
import { ANCHOR_BASE_URL } from '../config';

const SEP24 = `${ANCHOR_BASE_URL}/sep24`;

// The test anchor issues its own USDC (a different issuer than the escrow's
// USDC). The SEP-24 flow demonstrates the real fiat <-> USDC on/off-ramp
// protocol end-to-end on testnet.
export const ANCHOR_ASSET = 'USDC';

export type InteractiveResponse = {
  id: string;
  url: string;
};

export type AnchorTx = {
  id: string;
  status: string;
  amount_in?: string;
  amount_out?: string;
  more_info_url?: string;
  stellar_transaction_id?: string;
};

type Kind = 'deposit' | 'withdraw';

async function startInteractive(
  kind: Kind,
  publicKey: string,
): Promise<InteractiveResponse> {
  const token = await getAnchorToken(publicKey);
  const res = await fetch(`${SEP24}/transactions/${kind}/interactive`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ asset_code: ANCHOR_ASSET, account: publicKey }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Anchor ${kind} failed (${res.status}). ${body.slice(0, 140)}`);
  }
  const data = await res.json();
  if (!data.url || !data.id) throw new Error('Anchor did not return an interactive URL.');
  return { id: data.id, url: data.url };
}

export function startDeposit(publicKey: string) {
  return startInteractive('deposit', publicKey);
}
export function startWithdraw(publicKey: string) {
  return startInteractive('withdraw', publicKey);
}

/** Poll a single SEP-24 transaction's status. */
export async function getAnchorTx(publicKey: string, id: string): Promise<AnchorTx> {
  const token = await getAnchorToken(publicKey);
  const res = await fetch(`${SEP24}/transaction?id=${encodeURIComponent(id)}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Anchor transaction lookup failed (${res.status}).`);
  const data = await res.json();
  return data.transaction as AnchorTx;
}

const TERMINAL = new Set([
  'completed',
  'refunded',
  'expired',
  'error',
  'no_market',
  'too_small',
  'too_large',
]);

/**
 * Open the interactive popup and poll until the transfer reaches a terminal
 * state. `onStatus` reports intermediate statuses for the UI.
 *
 * The popup is opened *synchronously* at the very start (before any await) so
 * the browser keeps it tied to the user's click and does not block it; we then
 * navigate that same window once the anchor URL is ready.
 */
export async function runInteractive(
  kind: Kind,
  publicKey: string,
  onStatus: (status: string) => void,
): Promise<AnchorTx> {
  const win = window.open('about:blank', 'anchor_interactive', 'width=480,height=720');
  onStatus('opening');

  let id: string;
  let url: string;
  try {
    ({ id, url } = await startInteractive(kind, publicKey));
  } catch (e) {
    win?.close();
    throw e;
  }

  if (win && !win.closed) {
    win.location.href = url;
  } else {
    // Popup was blocked — fall back to a same-tab navigation attempt.
    const opened = window.open(url, 'anchor_interactive', 'width=480,height=720');
    if (!opened) {
      throw new Error(
        'Your browser blocked the anchor window. Please allow pop-ups for this site and try again.',
      );
    }
  }
  onStatus('incomplete');

  const deadline = Date.now() + 5 * 60 * 1000; // 5 min
  let last = '';
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    let tx: AnchorTx;
    try {
      tx = await getAnchorTx(publicKey, id);
    } catch {
      continue;
    }
    if (tx.status !== last) {
      last = tx.status;
      onStatus(tx.status);
    }
    if (TERMINAL.has(tx.status)) return tx;
  }
  throw new Error('Anchor transfer timed out. Check the popup and try again.');
}
