export const dynamic = 'force-dynamic';

import { hasKv, getRoomConfig, setRoomConfig } from '../../../lib/rooms';
import type { RoomConfig } from '../../../lib/types';

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const masterKey = process.env.ROOMS_MASTER_KEY;
  if (!masterKey || auth !== `Bearer ${masterKey}`) {
    return new Response('unauthorized', { status: 401 });
  }

  if (!hasKv()) return new Response('kv not configured', { status: 503 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  const roomId = String(body.roomId || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  if (!roomId || roomId.length < 2 || roomId.length > 32) {
    return new Response('invalid roomId (2-32 chars, a-z0-9-)', { status: 400 });
  }

  const existing = await getRoomConfig(roomId);
  if (existing) return new Response('room already exists', { status: 409 });

  const apiKey = `room_${roomId}_${crypto.randomUUID().replace(/-/g, '')}`;

  const config: RoomConfig = {
    roomId,
    name: body.name || roomId,
    agents: Array.isArray(body.agents) ? body.agents : [],
    apiKey,
    created: Date.now(),
  };

  await setRoomConfig(config);

  return Response.json({ ok: true, roomId, apiKey });
}
