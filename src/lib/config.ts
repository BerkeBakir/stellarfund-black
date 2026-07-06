export const NETWORK_PASSPHRASE = 'Public Global Stellar Network ; September 2015';
export const RPC_URL = 'https://mainnet.sorobanrpc.com';
export const HORIZON_URL = 'https://horizon.stellar.org';
export const EXPLORER_BASE_URL = 'https://stellar.expert/explorer/public';

// StellarFund — deployed on Stellar MAINNET (Black Belt / L6), 2026-07-06.
// Deployer: GAQ5YHRV5POBZDJFP5EI5S6HOJCXVFY5LOQG76TI44D3DDEKCIANNURB
export const FACTORY_ID =
  process.env.NEXT_PUBLIC_FACTORY_ID ?? 'CBUAZAAH7R7WXP3PIBKVPHYJ3XIHUTDOYBNUPPTLDVUWI6ZK6X33ZPN2';
export const REPUTATION_ID =
  process.env.NEXT_PUBLIC_REPUTATION_ID ?? 'CCXGJUE6UXPMU27WKJZJS7XXV2NA5ZQPWLPQUJ2XNGDH5TD7L4DMAT5X';

// Native XLM via its Stellar Asset Contract (SAC) on mainnet. The escrow is
// token-agnostic, so on mainnet it custodies real XLM — no faucet, no minting.
// Users contribute small real XLM amounts. Native has no issuer/trustline.
export const TOKEN_ID = 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA';
export const TOKEN_CODE = 'XLM';
export const TOKEN_DECIMALS = 7;
export const TOKEN_ISSUER = ''; // native asset — no issuer
export const CAMPAIGN_WASM_HASH =
  process.env.NEXT_PUBLIC_CAMPAIGN_WASM_HASH ??
  'f42f7c5faae416b3a77695e9f9a8330cdad45901a1deebea894081ccf7f4f1a2';

// Campaigns hidden from the UI/analytics (broken economics). Empty on mainnet;
// their on-chain contributions would still count on /proof if any were added.
export const HIDDEN_CAMPAIGNS = new Set<string>([]);

// External user-feedback Google Form (L6: wallet + email + name + rating + feedback).
export const FEEDBACK_FORM_URL =
  process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL ??
  'https://docs.google.com/forms/d/e/1FAIpQLSc68-9vpke9EhgRoir6NSVas_RsJldfz8JoLaBqyUXO42420w/viewform';

// SEP-24 anchor demo. testanchor is testnet-only, so on the mainnet build the
// /ramp page is shown as a protocol demonstration and gated behind this flag.
export const ANCHOR_ENABLED = false;
export const ANCHOR_HOME_DOMAIN = 'testanchor.stellar.org';
export const ANCHOR_BASE_URL = 'https://testanchor.stellar.org';

export function explorerTxUrl(hash: string): string {
  return `${EXPLORER_BASE_URL}/tx/${hash}`;
}
export function explorerContractUrl(id: string): string {
  return `${EXPLORER_BASE_URL}/contract/${id}`;
}
export function explorerAccountUrl(addr: string): string {
  return `${EXPLORER_BASE_URL}/account/${addr}`;
}
