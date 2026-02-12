export const dynamic = 'force-dynamic';

const COOLDOWN_MS = 60 * 1000; // 1 minute per IP
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

export async function POST(req: Request) {
  const hasKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  if (!hasKv) return new Response('service unavailable', { status: 503 });

  const ip = getClientIp(req);
  const { kv } = await import('@vercel/kv');

  // Rate limit
  const rateKey = `observatory:leads:rate:${ip}`;
  const last = await kv.get<number>(rateKey);
  if (last && Date.now() - last < COOLDOWN_MS) {
    return new Response('rate limited', { status: 429 });
  }

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
  await kv.set(rateKey, ts, { ex: Math.ceil(COOLDOWN_MS / 1000) });

  return Response.json({ ok: true, id: lead.id });
}
