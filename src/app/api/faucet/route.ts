import { NextResponse } from 'next/server';
import {
  rpc,
  Contract,
  TransactionBuilder,
  Keypair,
  Account,
  Address,
  nativeToScVal,
  BASE_FEE,
  StrKey,
} from '@stellar/stellar-sdk';
import { RPC_URL, NETWORK_PASSPHRASE, TOKEN_ID } from '@/lib/config';

// One-tap test USDC for onboarding. Mints a fixed grant to the caller's wallet
// (which must already hold a USDC trustline). Issuer secret is server-only.
const GRANT = 500n * 10_000_000n; // 500 USDC (7 decimals)

export async function POST(req: Request) {
  const secret = process.env.USDC_ISSUER_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Faucet not configured' }, { status: 500 });
  }

  let address: string;
  try {
    const body = await req.json();
    address = String(body.address ?? '');
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!StrKey.isValidEd25519PublicKey(address)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  try {
    const server = new rpc.Server(RPC_URL);
    const issuer = Keypair.fromSecret(secret);
    const source: Account = await server.getAccount(issuer.publicKey());

    const tx = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        new Contract(TOKEN_ID).call(
          'mint',
          new Address(address).toScVal(),
          nativeToScVal(GRANT, { type: 'i128' }),
        ),
      )
      .setTimeout(60)
      .build();

    const prepared = await server.prepareTransaction(tx);
    prepared.sign(issuer);
    const sent = await server.sendTransaction(prepared);
    if (sent.status === 'ERROR') {
      return NextResponse.json(
        { error: 'Mint submission failed', detail: sent.errorResult?.toXDR('base64') },
        { status: 502 },
      );
    }

    let got = await server.getTransaction(sent.hash);
    const deadline = Date.now() + 30_000;
    while (got.status === 'NOT_FOUND' && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      got = await server.getTransaction(sent.hash);
    }
    if (got.status !== 'SUCCESS') {
      return NextResponse.json(
        { error: `Mint ended with status ${got.status}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ hash: sent.hash, amount: GRANT.toString() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Faucet error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
