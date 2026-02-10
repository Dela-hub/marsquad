export const dynamic = 'force-dynamic';

import { hasKv, getEvents } from '../../../lib/rooms';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const since = Number(searchParams.get('since') || 0);
  const limit = Math.min(Number(searchParams.get('limit') || 200), 500);

  if (!hasKv()) {
    // Fallback: proxy to local office server
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

  const events = await getEvents('marsquad', since, limit);

  // Fall back to bridge if KV has no events yet
  if (events.length === 0) {
    const local = process.env.LOCAL_BRIDGE_URL || 'http://76.13.255.23:3010';
    try {
      const res = await fetch(`${local}/api/events?since=${since}&limit=${limit}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return Response.json({ events: data.events || [] });
      }
    } catch { /* fall through */ }
  }

  return Response.json({ events });
}
