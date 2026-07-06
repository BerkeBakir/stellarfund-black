import {
  rpc, Contract, TransactionBuilder, nativeToScVal, scValToNative,
  Address, Account, Keypair, BASE_FEE, xdr,
} from '@stellar/stellar-sdk';
import { RPC_URL, NETWORK_PASSPHRASE } from './config';
import { signXdr } from './wallet';

export const server = new rpc.Server(RPC_URL);
export { nativeToScVal, scValToNative, Address, xdr };

/**
 * Retry a public-RPC call with linear backoff. The mainnet RPC is behind a
 * rate limiter (Cloudflare 1015) that intermittently rejects bursts, which
 * otherwise surfaces as "failed to fetch". A few spaced retries smooth it out.
 */
export async function withRetry<T>(fn: () => Promise<T>, tries = 4, delayMs = 1200): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

function readSource(): Account {
  return new Account(Keypair.random().publicKey(), '0');
}

export async function simulateRead(
  contractId: string, method: string, args: xdr.ScVal[] = []
): Promise<unknown> {
  const tx = new TransactionBuilder(readSource(), { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();
  const sim = await withRetry(() => server.simulateTransaction(tx));
  if (rpc.Api.isSimulationError(sim)) throw new Error(`Simulation failed: ${sim.error}`);
  const retval = sim.result?.retval;
  if (!retval) throw new Error(`No return value from ${method}.`);
  return scValToNative(retval);
}

// The CLI default (100 stroops) is too low on mainnet, so transactions never
// get included and hang in "pending". This is a MAX inclusion-fee bid — Soroban
// only charges the actual metered fee (~0.01–0.05 XLM), not the full cap.
const TX_FEE = '2000000'; // 0.2 XLM cap

export async function invoke(
  publicKey: string, contractId: string, method: string, args: xdr.ScVal[]
): Promise<string> {
  const account = await withRetry(() => server.getAccount(publicKey));
  const built = new TransactionBuilder(account, { fee: TX_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(120)
    .build();
  const prepared = await withRetry(() => server.prepareTransaction(built));
  const signedXdr = await signXdr(prepared.toXDR(), publicKey);
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const sent = await withRetry(() => server.sendTransaction(signedTx));
  if (sent.status === 'ERROR') {
    throw new Error(`Submission failed: ${sent.errorResult?.toXDR('base64') ?? 'unknown'}`);
  }
  const hash = sent.hash;
  let getResp = await server.getTransaction(hash);
  const deadline = Date.now() + 60_000;
  while ((getResp.status === 'NOT_FOUND') && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2500));
    getResp = await server.getTransaction(hash).catch(() => getResp);
  }
  if (getResp.status !== 'SUCCESS') throw new Error(`Transaction ${hash} ended with status ${getResp.status}.`);
  return hash;
}
