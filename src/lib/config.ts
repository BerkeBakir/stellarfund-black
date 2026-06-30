export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
export const RPC_URL = 'https://soroban-testnet.stellar.org';
export const FRIENDBOT_URL = 'https://friendbot.stellar.org';
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const EXPLORER_BASE_URL = 'https://stellar.expert/explorer/testnet';

// StellarFund — deployed on Stellar Testnet (2026-06-28).
export const FACTORY_ID = 'CDNLINFENSRBB3WZ4JCSJC5PPJT6CZJPSQ7EY5W2HC4UYZVHMGVHVNAF';
export const REPUTATION_ID = 'CCRWJWU42LP3ATOA6R4SJ4532XXQO6VSIXS5BWNQTZZVYAUSZCG5U7P4';

// Mintable Testnet USDC (SAC). Issued by the StellarFund deployer so test
// users can be funded one-tap for onboarding. 7 decimals.
export const TOKEN_ID = 'CD4PMJAYGZ6DJI7R47PS7SUJ733GU7B4GEA6W7DKLDM5HJM3TGRPHZE7';
export const TOKEN_CODE = 'USDC';
export const TOKEN_DECIMALS = 7;
export const TOKEN_ISSUER = 'GBV7COBZWLBL5KCBWIHMWTG4LG5H4P2AMS5RDDAOFN5QBPPW2SZU2A76';
export const CAMPAIGN_WASM_HASH =
  'f42f7c5faae416b3a77695e9f9a8330cdad45901a1deebea894081ccf7f4f1a2';

// External user-feedback Google Form.
export const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSc68-9vpke9EhgRoir6NSVas_RsJldfz8JoLaBqyUXO42420w/viewform';

// SEP-24 sandbox anchor (fiat <-> USDC bridge demonstration).
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
