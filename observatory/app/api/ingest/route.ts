export const dynamic = 'force-dynamic';

import { hasKv, ingestEvent } from '../../../lib/rooms';

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const key = process.env.OBSERVATORY_API_KEY;
  if (!key || auth !== `Bearer ${key}`) {
    return new Response('unauthorized', { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  const ts = typeof payload.ts === 'number' ? payload.ts : Date.now();
  const id = payload.id || `${ts}-${Math.random().toString(16).slice(2)}`;
  const event = { ...payload, id, ts };

  if (!hasKv()) {
    return Response.json({ ok: true, store: 'proxy-mode' });
  }

  try {
    const result = await ingestEvent('marsquad', event);
    return Response.json(result);
  } catch {
    // Keep bridge emitters alive even if KV is transiently unavailable.
    return Response.json({ ok: true, store: 'proxy-mode' });
  }
}
