export const dynamic = 'force-dynamic';

const MAX_EVENTS = 1000;

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

  const hasKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  if (!hasKv) {
    // No KV configured — events are proxied from local office via /api/events
    // Ingest is a no-op without KV (local mode uses direct proxy)
    return Response.json({ ok: true, store: 'proxy-mode' });
  }

  // ── Vercel KV storage ──
  const { kv } = await import('@vercel/kv');

  const exists = await kv.get(`observatory:event:${id}`);
  if (exists) {
    return new Response('duplicate', { status: 200 });
  }
  await kv.set(`observatory:event:${id}`, 1, { ex: 3600 });

  await kv.zadd('observatory:events', { score: ts, member: JSON.stringify(event) });
  await kv.zremrangebyrank('observatory:events', 0, -MAX_EVENTS - 1);

  return Response.json({ ok: true });
}
