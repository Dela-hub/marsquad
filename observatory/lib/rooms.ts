import type { RoomConfig } from './types';

const MAX_EVENTS_DEFAULT = 1000;

export function hasKv(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKv() {
  const { kv } = await import('@vercel/kv');
  return kv;
}

// ── Room CRUD ──

export async function getRoomConfig(roomId: string): Promise<RoomConfig | null> {
  const kv = await getKv();
  return kv.get<RoomConfig>(`room:${roomId}:config`);
}

export async function setRoomConfig(config: RoomConfig): Promise<void> {
  const kv = await getKv();
  await kv.set(`room:${config.roomId}:config`, config);
  await kv.sadd('rooms:index', config.roomId);
}

// ── Auth ──

export async function validateRoomApiKey(roomId: string, token: string): Promise<boolean> {
  const config = await getRoomConfig(roomId);
  if (!config) return false;
  return config.apiKey === token;
}

// ── Events ──

export async function ingestEvent(
  roomId: string,
  event: { id: string; ts: number; [k: string]: unknown },
): Promise<{ ok: boolean; reason?: string }> {
  const kv = await getKv();
  const config = await getRoomConfig(roomId);
  const maxEvents = config?.maxEvents || MAX_EVENTS_DEFAULT;

  const dedupKey = `room:${roomId}:event:${event.id}`;
  const exists = await kv.get(dedupKey);
  if (exists) return { ok: true, reason: 'duplicate' };

  await kv.set(dedupKey, 1, { ex: 3600 });
  await kv.zadd(`room:${roomId}:events`, { score: event.ts, member: JSON.stringify(event) });
  await kv.zremrangebyrank(`room:${roomId}:events`, 0, -(maxEvents + 1));

  return { ok: true };
}

export async function getEvents(
  roomId: string,
  since: number,
  limit: number,
): Promise<unknown[]> {
  const kv = await getKv();
  const items = await kv.zrange(`room:${roomId}:events`, since, '+inf', {
    byScore: true,
    offset: 0,
    count: limit,
  });

  return items
    .map((item) => {
      try {
        return typeof item === 'string' ? JSON.parse(item) : item;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}
