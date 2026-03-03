import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.OPENCARDS_API || 'https://opencards-api-production.up.railway.app/api/v1';

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
    }

    const { product_id, amount } = await req.json();
    if (!product_id || !amount) {
      return NextResponse.json({ error: 'Missing product_id or amount' }, { status: 400 });
    }

    // Use the /pay/order endpoint which handles x402 signing server-side
    const resp = await fetch(`${API_BASE}/pay/order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ card_type_id: product_id, amount }),
    });

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
