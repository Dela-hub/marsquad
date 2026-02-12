export const dynamic = 'force-dynamic';

import crypto from 'crypto';

const FINGERPRINT_COOLDOWN_MS = 10 * 60 * 1000; // 10 min for same contact+brand
const IP_BURST_COOLDOWN_MS = 20 * 1000; // short anti-spam burst control per IP
const MAX_FIELD = 300;
const MAX_GOALS = 800;
const MAX_COMPETITORS = 1200;

function getClientIp(req: Request) {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return 'unknown';
}

function cleanStr(v: any, max: number) {
  return String(v || '').trim().slice(0, max);
}

function fingerprint(contact: string, brandUrl: string, ua: string) {
  const base = `${contact.toLowerCase()}|${brandUrl.toLowerCase()}|${(ua || '').slice(0, 120)}`;
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

  const brandUrl = cleanStr(body?.brandUrl, MAX_FIELD);
  const category = cleanStr(body?.category, MAX_FIELD);
  const spendRange = cleanStr(body?.spendRange, 80);
  const contact = cleanStr(body?.contact, MAX_FIELD);
  const competitors = cleanStr(body?.competitors, MAX_COMPETITORS);
  const markets = cleanStr(body?.markets, 120);
  const primaryChannel = cleanStr(body?.primaryChannel, 80);
  const deliveryPreference = cleanStr(body?.deliveryPreference, 80);
  const goals = cleanStr(body?.goals, MAX_GOALS);

  if (!brandUrl || !contact) {
    return new Response('missing fields', { status: 400 });
  }

  // Rate limit by lead fingerprint (contact + brand + ua), with a short IP burst guard.
  const ua = req.headers.get('user-agent') || '';
  const fp = fingerprint(contact, brandUrl, ua);
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
    brandUrl,
    category: category || undefined,
    spendRange: spendRange || undefined,
    contact,
    competitors: competitors || undefined,
    markets: markets || undefined,
    primaryChannel: primaryChannel || undefined,
    deliveryPreference: deliveryPreference || undefined,
    goals: goals || undefined,
    source: 'landing',
  };

  await kv.zadd('observatory:leads', { score: ts, member: JSON.stringify(lead) });
  await Promise.all([
    kv.set(fpRateKey, ts, { ex: Math.ceil(FINGERPRINT_COOLDOWN_MS / 1000) }),
    kv.set(ipRateKey, ts, { ex: Math.ceil(IP_BURST_COOLDOWN_MS / 1000) }),
  ]);

  return Response.json({ ok: true, id: lead.id });
}
