import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.OPENCARDS_API || 'https://opencards-api-production.up.railway.app/api/v1';

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');

    // If user has API key, fetch their wallet from OpenCards
    if (apiKey) {
      const resp = await fetch(`${API_BASE}/wallets/balance`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        return NextResponse.json(data);
      }
    }

    // No API key — return empty
    return NextResponse.json({
      success: false,
      error: 'No API key provided',
    }, { status: 401 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
