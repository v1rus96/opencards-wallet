import { getConfig } from './store';

/**
 * Payment client — calls Next.js API routes which proxy to OpenCards.
 * x402 signing happens on the OpenCards backend using per-agent wallets.
 * User only needs their API key.
 */

export async function getProducts() {
  const r = await fetch('/api/products');
  const data = await r.json();
  return data.products || [];
}

export async function getPaymentWalletBalance() {
  const config = getConfig();
  const headers: Record<string, string> = {};
  if (config.apiKey) headers['X-API-Key'] = config.apiKey;

  const r = await fetch('/api/wallet', { headers });
  const data = await r.json();

  // Normalize response format
  if (data.wallet) {
    return {
      solana: { usdc: data.wallet.usdc || 0, address: data.wallet.address },
      base: { usdc: 0, address: '' },
    };
  }
  return data;
}

export async function orderCard(productId: string, amount: number) {
  const config = getConfig();
  const r = await fetch('/api/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey,
    },
    body: JSON.stringify({ product_id: productId, amount }),
  });
  return r.json();
}

export async function depositCard(orderId: string, amount: number) {
  const config = getConfig();
  const r = await fetch('/api/deposit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey,
    },
    body: JSON.stringify({ order_id: orderId, amount }),
  });
  return r.json();
}
