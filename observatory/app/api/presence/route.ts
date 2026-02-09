export const dynamic = 'force-dynamic';

const TTL_SECONDS = 30; // visitor considered gone after 30s without heartbeat

function getClientIp(req: Request) {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return 'unknown';
}

/** POST /api/presence — heartbeat from a visitor */
export async function POST(req: Request) {
  const hasKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  if (!hasKv) {
    return Response.json({ ok: true, visitors: 1 });
  }

  const { kv } = await import('@vercel/kv');
  const ip = getClientIp(req);
  const key = `observatory:visitor:${ip}`;
  const now = Date.now();

  // Set this visitor's heartbeat with TTL
  await kv.set(key, now, { ex: TTL_SECONDS });

  // Add to sorted set for counting (score = expiry timestamp)
  await (kv as any).zadd('observatory:visitors', { score: now + TTL_SECONDS * 1000, member: ip });

  // Remove expired entries
  await (kv as any).zremrangebyscore('observatory:visitors', 0, now);

  // Count active visitors
  const count: number = await (kv as any).zcard('observatory:visitors');

  return Response.json({ ok: true, visitors: count });
}

/** GET /api/presence — get current visitor count */
export async function GET() {
  const hasKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  if (!hasKv) {
    return Response.json({ visitors: 1 });
  }

  const { kv } = await import('@vercel/kv');
  const now = Date.now();

  // Remove expired entries
  await (kv as any).zremrangebyscore('observatory:visitors', 0, now);

  const count: number = await (kv as any).zcard('observatory:visitors');

  return Response.json({ visitors: count });
}
