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

async function apiPost(path: string) {
  const r = await fetch(getApiBase() + path, { method: 'POST', headers: getApiHeaders() });
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
