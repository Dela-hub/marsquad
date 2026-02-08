export const dynamic = 'force-dynamic';

const COOLDOWN_MS = 5 * 60 * 1000;
const MAX_LEN = 500;

function getClientIp(req: Request) {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return 'unknown';
}

export async function POST(req: Request) {
  const hasKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  // Rate-limit via KV when available
  if (hasKv) {
    const ip = getClientIp(req);
    const key = `observatory:prompt:${ip}`;
    const { kv } = await import('@vercel/kv');
    const last = await kv.get<number>(key);
    const now = Date.now();
    if (last && now - last < COOLDOWN_MS) {
      return new Response('rate limited', { status: 429 });
    }
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  const text = String(payload?.text || '').trim();
  if (!text || text.length > MAX_LEN) {
    return new Response('invalid text', { status: 400 });
  }

  const local = process.env.LOCAL_BRIDGE_URL;
  const auth = process.env.OBSERVATORY_API_KEY;
  if (!local || !auth) {
    return new Response('misconfigured', { status: 500 });
  }

  // Save rate-limit timestamp after validation
  if (hasKv) {
    const ip = getClientIp(req);
    const key = `observatory:prompt:${ip}`;
    const { kv } = await import('@vercel/kv');
    await kv.set(key, Date.now(), { ex: Math.ceil(COOLDOWN_MS / 1000) });
  }

  try {
    const res = await fetch(`${local}/api/prompt`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${auth}`,
      },
      body: JSON.stringify({ text, ts: Date.now() }),
    });

    if (!res.ok) {
      return new Response('upstream error', { status: 502 });
    }
  } catch (e: any) {
    return new Response(e.message || 'bridge unreachable', { status: 502 });
  }

  return Response.json({ ok: true });
}
