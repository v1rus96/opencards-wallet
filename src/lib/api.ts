import { getConfig } from './store';

const SOLANA_RPC = 'https://api.devnet.solana.com';
const USDC_SOL_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const USDC_BASE_CONTRACT = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

// Cache for user's wallet addresses
let cachedAddresses: { sol: string; evm: string } | null = null;

function getApiHeaders() {
  const config = getConfig();
  return {
    'Authorization': `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json',
  };
}

function getApiBase() {
  return getConfig().apiBase;
}

async function apiGet(path: string) {
  const r = await fetch(getApiBase() + path, { headers: getApiHeaders() });
  return r.json();
}

async function apiPost(path: string, body?: unknown) {
  const r = await fetch(getApiBase() + path, {
    method: 'POST',
    headers: getApiHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return r.json();
}

/**
 * Fetch the user's wallet addresses from OpenCards.
 * Caches in memory for the session.
 */
export async function getAddresses(): Promise<{ sol: string; evm: string }> {
  if (cachedAddresses) return cachedAddresses;

  try {
    const data = await apiGet('/wallets/me');
    const wallets = data.wallets || [];
    const solWallet = wallets.find((w: { network: string }) => w.network?.includes('solana'));
    const evmWallet = wallets.find((w: { network: string }) =>
      w.network?.includes('evm') || w.network?.includes('base') || w.network?.includes('eip155')
    );

    cachedAddresses = {
      sol: solWallet?.address || '',
      evm: evmWallet?.address || '',
    };
    return cachedAddresses;
  } catch {
    return { sol: '', evm: '' };
  }
}

/** Clear address cache (call on logout/reconnect) */
export function clearAddressCache() {
  cachedAddresses = null;
}

export async function getWallet() {
  const data = await apiGet('/cards/wallet');
  return data.wallet;
}

export async function getOrders() {
  const data = await apiGet('/cards/orders');
  return data.orders || [];
}

export async function getCardBalance(orderId: string) {
  const data = await apiGet(`/cards/orders/${orderId}/balance`);
  return data.balance;
}

export async function getCardSensitive(orderId: string) {
  const data = await apiGet(`/cards/orders/${orderId}/sensitive`);
  return data.card;
}

export async function getCardTransactions(orderId: string) {
  const data = await apiGet(`/cards/orders/${orderId}/transactions`);
  return data.transactions || [];
}

export async function freezeCard(orderId: string) {
  return apiPost(`/cards/orders/${orderId}/freeze`);
}

export async function unfreezeCard(orderId: string) {
  return apiPost(`/cards/orders/${orderId}/unfreeze`);
}

export async function getProducts() {
  const r = await fetch(getApiBase() + '/cards/products');
  const data = await r.json();
  return data.products || [];
}

export async function getSolBalance(): Promise<number> {
  const addr = await getAddresses();
  if (!addr.sol) return 0;
  try {
    const r = await fetch(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'getBalance',
        params: [addr.sol],
      }),
    });
    const d = await r.json();
    return (d.result?.value || 0) / 1e9;
  } catch {
    return 0;
  }
}

export async function getSolUsdcBalance(): Promise<number> {
  const addr = await getAddresses();
  if (!addr.sol) return 0;
  try {
    const r = await fetch(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'getTokenAccountsByOwner',
        params: [addr.sol, { mint: USDC_SOL_MINT }, { encoding: 'jsonParsed' }],
      }),
    });
    const d = await r.json();
    const accounts = d.result?.value || [];
    if (accounts.length === 0) return 0;
    return accounts[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
  } catch {
    return 0;
  }
}

export async function getBaseEthBalance(): Promise<number> {
  const addr = await getAddresses();
  if (!addr.evm) return 0;
  try {
    const r = await fetch(BASE_SEPOLIA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'eth_getBalance',
        params: [addr.evm, 'latest'],
      }),
    });
    const d = await r.json();
    return parseInt(d.result || '0', 16) / 1e18;
  } catch {
    return 0;
  }
}

// ── Onchain Send & Transactions ──────────────────────────────────

export interface SendTokensParams {
  to: string;
  amount: number;
  token: string;
  network: string;
  memo?: string;
}

export interface SendTokensResult {
  success: boolean;
  tx_hash?: string;
  tx_id?: string;
  message?: string;
  status?: string;
  approval_id?: string;
  reason?: string;
  error?: string;
}

export async function sendTokens(params: SendTokensParams): Promise<SendTokensResult> {
  return apiPost('/onchain/send', params);
}

export interface OnchainTransaction {
  id: string;
  type: string;
  token: string;
  amount: number;
  network: string;
  to?: string;
  from?: string;
  tx_hash?: string;
  status: string;
  memo?: string;
  created_at: string;
}

export async function getOnchainTransactions(limit = 10, opts?: { sync?: boolean; network?: string }): Promise<OnchainTransaction[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (opts?.sync) params.set('sync', 'true');
  if (opts?.network) params.set('network', opts.network);
  const data = await apiGet(`/onchain/transactions?${params}`);
  return data.transactions || [];
}

export async function syncOnchain(network?: string): Promise<{ success: boolean }> {
  return apiPost('/onchain/sync', network ? { network } : undefined);
}

// ── CoinGecko Prices ─────────────────────────────────────────────

const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum',
  SOL: 'solana',
  USDC: 'usd-coin',
};

let priceCache: { prices: Record<string, number>; ts: number } | null = null;
const PRICE_TTL = 60_000; // 1 minute

export async function getCryptoPrices(): Promise<Record<string, number>> {
  if (priceCache && Date.now() - priceCache.ts < PRICE_TTL) return priceCache.prices;

  try {
    const ids = Object.values(COINGECKO_IDS).join(',');
    const r = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { headers: { accept: 'application/json' } }
    );
    const data = await r.json();

    const prices: Record<string, number> = {};
    for (const [symbol, cgId] of Object.entries(COINGECKO_IDS)) {
      prices[symbol] = data[cgId]?.usd ?? (symbol === 'USDC' ? 1 : 0);
    }

    priceCache = { prices, ts: Date.now() };
    return prices;
  } catch {
    // Fallback: USDC = $1, others unknown
    return { ETH: 0, SOL: 0, USDC: 1 };
  }
}

export async function getBaseUsdcBalance(): Promise<number> {
  const addr = await getAddresses();
  if (!addr.evm) return 0;
  try {
    const data = '0x70a08231000000000000000000000000' + addr.evm.slice(2);
    const r = await fetch(BASE_SEPOLIA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'eth_call',
        params: [{ to: USDC_BASE_CONTRACT, data }, 'latest'],
      }),
    });
    const d = await r.json();
    return parseInt(d.result || '0', 16) / 1e6;
  } catch {
    return 0;
  }
}
