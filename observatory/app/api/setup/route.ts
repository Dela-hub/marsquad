export const dynamic = 'force-dynamic';

import { hasKv, getRoomConfig, setRoomConfig } from '../../../lib/rooms';
import type { RoomConfig } from '../../../lib/types';

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function getClientIp(req: Request) {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return 'unknown';
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
}

export async function POST(req: Request) {
  if (!hasKv()) return new Response('service unavailable', { status: 503 });

  // Rate limit
  const ip = getClientIp(req);
  const { kv } = await import('@vercel/kv');
  const rateKey = `setup:rate:${ip}`;
  const last = await kv.get<number>(rateKey);
  if (last && Date.now() - last < COOLDOWN_MS) {
    return Response.json({ ok: false, error: 'Rate limited — one room per hour' }, { status: 429 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  // Validate room name
  const roomName = String(body.roomName || '').trim();
  if (!roomName || roomName.length < 2 || roomName.length > 64) {
    return Response.json({ ok: false, error: 'Room name must be 2-64 characters' }, { status: 400 });
  }

  const roomId = slugify(roomName);
  if (!roomId || roomId.length < 2) {
    return Response.json({ ok: false, error: 'Room name must contain at least 2 alphanumeric characters' }, { status: 400 });
  }

  // Check if room exists
  const existing = await getRoomConfig(roomId);
  if (existing) {
    return Response.json({ ok: false, error: `Room "${roomId}" already exists — try a different name` }, { status: 409 });
  }

  // Validate agents
  const agents = body.agents;
  if (!Array.isArray(agents) || agents.length === 0 || agents.length > 50) {
    return Response.json({ ok: false, error: 'Provide 1-50 agents' }, { status: 400 });
  }

  const cleanAgents = agents.map((a: any) => {
    const name = String(a.name || '').trim();
    if (!name) return null;
    return {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      name,
      avatar: String(a.avatar || '\ud83e\udd16').trim().slice(0, 8),
      color: /^#[0-9a-f]{6}$/i.test(a.color) ? a.color : '#94a3b8',
      role: String(a.role || '').trim().slice(0, 50) || undefined,
      soul: String(a.soul || '').trim().slice(0, 500) || undefined,
      capabilities: Array.isArray(a.capabilities)
        ? a.capabilities.map((c: any) => String(c).trim()).filter(Boolean).slice(0, 20)
        : undefined,
    };
  }).filter(Boolean);

  if (cleanAgents.length === 0) {
    return Response.json({ ok: false, error: 'At least one agent must have a name' }, { status: 400 });
  }

  // Create room
  const apiKey = `room_${roomId}_${crypto.randomUUID().replace(/-/g, '')}`;
  const config: RoomConfig = {
    roomId,
    name: roomName,
    agents: cleanAgents,
    apiKey,
    created: Date.now(),
  };

  await setRoomConfig(config);
  await kv.set(rateKey, Date.now(), { ex: Math.ceil(COOLDOWN_MS / 1000) });

  return Response.json({
    ok: true,
    roomId,
    apiKey,
    roomUrl: `/room/${roomId}`,
    embedUrl: `/embed/${roomId}`,
  });
}
