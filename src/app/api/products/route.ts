import { NextResponse } from 'next/server';

const API_BASE = process.env.OPENCARDS_API || 'https://opencards-api-production.up.railway.app/api/v1';

export async function GET() {
  try {
    const r = await fetch(`${API_BASE}/cards/products`);
    const data = await r.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
