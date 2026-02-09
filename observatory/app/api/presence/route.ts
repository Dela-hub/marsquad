export const dynamic = 'force-dynamic';

const TTL_SECONDS = 30;

function getClientIp(req: Request) {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return 'unknown';
}

function getCountry(req: Request): string {
  // Vercel provides geo headers automatically
  return req.headers.get('x-vercel-ip-country') || 'UN';
}

// Convert country code to flag emoji (regional indicator symbols)
function countryToFlag(code: string): string {
  if (!code || code.length !== 2) return '\u{1F3F3}'; // white flag fallback
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...upper.split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}

/** POST /api/presence — heartbeat from a visitor */
export async function POST(req: Request) {
  const hasKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  const country = getCountry(req);
  const flag = countryToFlag(country);

  if (!hasKv) {
    return Response.json({ ok: true, visitors: 1, totalVisitors: 1, flags: [flag] });
  }

  const { kv } = await import('@vercel/kv');
  const ip = getClientIp(req);
  const now = Date.now();

  // Store visitor with country as a hash field
  await kv.set(`observatory:visitor:${ip}`, country, { ex: TTL_SECONDS });

  // Sorted set for counting active visitors (score = expiry time)
  await (kv as any).zadd('observatory:visitors', {
    score: now + TTL_SECONDS * 1000,
    member: `${ip}:${country}`,
  });

  // Track total unique visitors (persistent — no TTL)
  await (kv as any).sadd('observatory:visitors:total', ip);
  const totalVisitors: number = await (kv as any).scard('observatory:visitors:total') || 0;

  // Remove expired active entries
  await (kv as any).zremrangebyscore('observatory:visitors', 0, now);

  // Get all active visitors with their countries
  const members: string[] = await (kv as any).zrange('observatory:visitors', 0, -1);
  const count = members.length;

  // Extract unique country flags
  const flags = Array.from(new Set(
    members.map(m => {
      const cc = m.split(':').pop() || 'UN';
      return countryToFlag(cc);
    })
  ));

  return Response.json({ ok: true, visitors: count, totalVisitors, flags });
}

/** GET /api/presence — get current visitor count */
export async function GET(req: Request) {
  const hasKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  if (!hasKv) {
    return Response.json({ visitors: 1, totalVisitors: 1, flags: ['\u{1F3F3}'] });
  }

  const { kv } = await import('@vercel/kv');
  const now = Date.now();

  const totalVisitors: number = await (kv as any).scard('observatory:visitors:total') || 0;

  await (kv as any).zremrangebyscore('observatory:visitors', 0, now);

  const members: string[] = await (kv as any).zrange('observatory:visitors', 0, -1);
  const count = members.length;

  const flags = Array.from(new Set(
    members.map(m => {
      const cc = m.split(':').pop() || 'UN';
      return countryToFlag(cc);
    })
  ));

  return Response.json({ visitors: count, totalVisitors, flags });
}
