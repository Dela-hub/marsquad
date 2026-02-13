export const dynamic = 'force-dynamic';

import crypto from 'crypto';

const FINGERPRINT_COOLDOWN_MS = 10 * 60 * 1000; // 10 min for same whatsapp+name
const IP_BURST_COOLDOWN_MS = 20 * 1000; // short anti-spam burst control per IP
const MAX_FIELD = 300;
const MAX_HELP = 900;

function getClientIp(req: Request) {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return 'unknown';
}

function cleanStr(v: any, max: number) {
  return String(v || '').trim().slice(0, max);
}

function fingerprint(whatsapp: string, name: string, ua: string) {
  const base = `${whatsapp.toLowerCase()}|${name.toLowerCase()}|${(ua || '').slice(0, 120)}`;
  return crypto.createHash('sha256').update(base).digest('hex').slice(0, 24);
}

export async function POST(req: Request) {
  const hasKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  if (!hasKv) return new Response('service unavailable', { status: 503 });

  const ip = getClientIp(req);
  const { kv } = await import('@vercel/kv');

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  const name = cleanStr(body?.name, 120);
  const whatsapp = cleanStr(body?.whatsapp, 40);
  const help = cleanStr(body?.help, MAX_HELP);

  if (!name || !whatsapp || !help) {
    return new Response('missing fields', { status: 400 });
  }

  // Rate limit by lead fingerprint (contact + brand + ua), with a short IP burst guard.
  const ua = req.headers.get('user-agent') || '';
  const fp = fingerprint(whatsapp, name, ua);
  const fpRateKey = `observatory:leads:rate:fp:${fp}`;
  const ipRateKey = `observatory:leads:rate:ip:${ip}`;
  const now = Date.now();

  const [lastFp, lastIp] = await Promise.all([
    kv.get<number>(fpRateKey),
    kv.get<number>(ipRateKey),
  ]);

  if ((lastFp && now - lastFp < FINGERPRINT_COOLDOWN_MS) || (lastIp && now - lastIp < IP_BURST_COOLDOWN_MS)) {
    return Response.json({
      ok: false,
      error: 'Already received—check your inbox/WhatsApp in a minute.',
      rateLimited: true,
    }, { status: 429 });
  }

  const ts = Date.now();
  const lead = {
    id: `lead_${ts}_${Math.random().toString(36).slice(2, 8)}`,
    ts,
    name,
    whatsapp,
    help,
    source: 'landing',
    kind: 'assistant_setup',
  };

  await kv.zadd('observatory:leads', { score: ts, member: JSON.stringify(lead) });
  await Promise.all([
    kv.set(fpRateKey, ts, { ex: Math.ceil(FINGERPRINT_COOLDOWN_MS / 1000) }),
    kv.set(ipRateKey, ts, { ex: Math.ceil(IP_BURST_COOLDOWN_MS / 1000) }),
  ]);

  return Response.json({ ok: true, id: lead.id });
}
