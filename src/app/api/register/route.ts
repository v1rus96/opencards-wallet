import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.OPENCARDS_API || 'https://opencards-api-production.up.railway.app/api/v1';

export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json();

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    // 1. Register agent
    const regResp = await fetch(`${API_BASE}/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: description?.trim() || `${name}'s wallet agent` }),
    });

    const regData = await regResp.json();
    if (!regData.success) {
      return NextResponse.json(regData, { status: regResp.status });
    }

    const apiKey = regData.agent.api_key;

    // 2. Generate wallets sequentially (Solana first, then EVM)
    const authHeaders = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    let solWallet = null;
    let evmWallet = null;

    try {
      const solResp = await fetch(`${API_BASE}/wallets/generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ network: 'solana-devnet' }),
      });
      const solData = await solResp.json();
      solWallet = solData.wallet || null;
    } catch (e) {
      console.error('Solana wallet generation failed:', e);
    }

    try {
      const evmResp = await fetch(`${API_BASE}/wallets/generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ network: 'base-sepolia' }),
      });
      const evmData = await evmResp.json();
      evmWallet = evmData.wallet || null;
    } catch (e) {
      console.error('EVM wallet generation failed:', e);
    }

    return NextResponse.json({
      success: true,
      agent: regData.agent,
      wallets: {
        solana: solWallet,
        evm: evmWallet,
      },
      message: 'Account created! Save your API key — it won\'t be shown again.',
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
