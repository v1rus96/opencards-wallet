/**
 * Payment Proxy Server
 * Runs on VPS, holds wallet keys, handles x402 payments
 * Mini app calls this to order cards and make deposits
 */
import http from 'http';
import fs from 'fs';
import { wrapFetchWithPayment, x402Client } from '@x402/fetch';
import { ExactSvmScheme, SOLANA_DEVNET_CAIP2 } from '@x402/svm';
import { createKeyPairSignerFromBytes } from '@solana/kit';

const PORT = 8402;
const OPENCARDS_API = 'https://opencards-api-production.up.railway.app/api/v1';
const API_KEY = 'oc_af95a5b4032f111b00e7d601476af612c4440c12ae037cc6';

// Load Solana keypair
const keypairPath = process.env.HOME + '/.openclaw/wallet/solana/keypair.json';
const secret = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
const signer = await createKeyPairSignerFromBytes(Uint8Array.from(secret));
console.log(`Payment proxy wallet: ${signer.address}`);

// Setup x402 client
const svmScheme = new ExactSvmScheme(signer);
const client = new x402Client();
client.register(SOLANA_DEVNET_CAIP2, svmScheme);
const x402Fetch = wrapFetchWithPayment(fetch, client);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function jsonResp(res, status, data) {
  res.writeHead(status, corsHeaders);
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('Invalid JSON')); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  try {
    // GET /health
    if (url.pathname === '/health') {
      return jsonResp(res, 200, { ok: true, wallet: signer.address });
    }

    // GET /products — list available card products
    if (url.pathname === '/products' && req.method === 'GET') {
      const r = await fetch(`${OPENCARDS_API}/cards/products`);
      const data = await r.json();
      return jsonResp(res, 200, data);
    }

    // GET /wallet — check wallet USDC balances
    if (url.pathname === '/wallet-balance' && req.method === 'GET') {
      // Solana USDC
      const solR = await fetch('https://api.devnet.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'getTokenAccountsByOwner',
          params: [signer.address, { mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' }, { encoding: 'jsonParsed' }],
        }),
      });
      const solD = await solR.json();
      const solUsdc = solD.result?.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;

      // Base Sepolia USDC
      const baseData = '0x70a08231000000000000000000000000' + '3bf8aA923427c135Fe1b4f564A067bfeFf3515E7';
      const baseR = await fetch('https://sepolia.base.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'eth_call',
          params: [{ to: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', data: baseData }, 'latest'],
        }),
      });
      const baseD = await baseR.json();
      const baseUsdc = parseInt(baseD.result || '0', 16) / 1e6;

      return jsonResp(res, 200, {
        solana: { usdc: solUsdc, address: signer.address },
        base: { usdc: baseUsdc, address: '0x3bf8aA923427c135Fe1b4f564A067bfeFf3515E7' },
      });
    }

    // POST /order — order a new card (x402 payment)
    if (url.pathname === '/order' && req.method === 'POST') {
      const { product_id, amount } = await parseBody(req);

      if (!product_id || !amount) {
        return jsonResp(res, 400, { error: 'product_id and amount required' });
      }

      console.log(`Ordering card: product=${product_id}, amount=$${amount}`);

      const resp = await x402Fetch(`${OPENCARDS_API}/cards/order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ card_type_id: product_id, amount }),
      });

      const data = await resp.json();
      const paymentReceipt = resp.headers.get('payment-response');

      console.log(`Order result: ${resp.status}`, data);

      return jsonResp(res, resp.status, {
        ...data,
        payment: paymentReceipt ? JSON.parse(atob(paymentReceipt)) : null,
      });
    }

    // POST /deposit — deposit funds into a card (x402 payment)
    if (url.pathname === '/deposit' && req.method === 'POST') {
      const { order_id, amount } = await parseBody(req);

      if (!order_id || !amount) {
        return jsonResp(res, 400, { error: 'order_id and amount required' });
      }

      console.log(`Depositing $${amount} to order ${order_id}`);

      const resp = await x402Fetch(`${OPENCARDS_API}/cards/orders/${order_id}/deposit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      const data = await resp.json();
      const paymentReceipt = resp.headers.get('payment-response');

      console.log(`Deposit result: ${resp.status}`, data);

      return jsonResp(res, resp.status, {
        ...data,
        payment: paymentReceipt ? JSON.parse(atob(paymentReceipt)) : null,
      });
    }

    jsonResp(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error('Error:', err);
    jsonResp(res, 500, { error: err.message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Payment proxy running on port ${PORT}`);
});
