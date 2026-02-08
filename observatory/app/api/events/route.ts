export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const since = Number(searchParams.get('since') || 0);
  const limit = Math.min(Number(searchParams.get('limit') || 200), 500);

  const hasKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  // ── Fallback: proxy to local office server ──
  if (!hasKv) {
    const local = process.env.LOCAL_BRIDGE_URL || 'http://localhost:3010';
    try {
      const res = await fetch(`${local}/api/events?since=${since}&limit=${limit}`, {
        cache: 'no-store',
      });
      if (!res.ok) return Response.json({ events: [], error: `upstream ${res.status}` });
      const data = await res.json();
      return Response.json({ events: data.events || [] });
    } catch (e: any) {
      return Response.json({ events: [], error: e.message || 'bridge unreachable' });
    }
  }

  // ── KV mode: read from Vercel KV ──
  const { kv } = await import('@vercel/kv');
  const items: unknown[] = await (kv as any).zrange('observatory:events', since, '+inf', {
    byScore: true,
    offset: 0,
    count: limit,
  });

  const events = items
    .map((item) => {
      try {
        return typeof item === 'string' ? JSON.parse(item) : item;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return Response.json({ events });
}
