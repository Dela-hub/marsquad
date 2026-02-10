export const dynamic = 'force-dynamic';

import { hasKv, getEvents, getRoomConfig } from '../../../../../lib/rooms';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;
  const { searchParams } = new URL(req.url);
  const since = Number(searchParams.get('since') || 0);
  const limit = Math.min(Number(searchParams.get('limit') || 200), 500);

  if (!hasKv()) {
    // Marsquad room: fall back to local bridge
    if (roomId === 'marsquad') {
      const local = process.env.LOCAL_BRIDGE_URL || 'http://localhost:3010';
      try {
        const res = await fetch(`${local}/api/events?since=${since}&limit=${limit}`, {
          cache: 'no-store',
        });
        if (!res.ok) return Response.json({ events: [] });
        const data = await res.json();
        return Response.json({ events: data.events || [] });
      } catch {
        return Response.json({ events: [] });
      }
    }
    return Response.json({ events: [] });
  }

  const config = await getRoomConfig(roomId);
  if (!config) return new Response('room not found', { status: 404 });

  const events = await getEvents(roomId, since, limit);

  // Marsquad: fall back to bridge if KV has no events yet
  if (events.length === 0 && roomId === 'marsquad') {
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
