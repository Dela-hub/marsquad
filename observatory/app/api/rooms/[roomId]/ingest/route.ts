export const dynamic = 'force-dynamic';

import { hasKv, validateRoomApiKey, ingestEvent } from '../../../../../lib/rooms';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;

  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return new Response('unauthorized', { status: 401 });

  if (!hasKv()) return Response.json({ ok: true, store: 'no-kv' });

  const valid = await validateRoomApiKey(roomId, token);
  if (!valid) return new Response('unauthorized', { status: 401 });

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  const ts = typeof payload.ts === 'number' ? payload.ts : Date.now();
  const id = payload.id || `${ts}-${Math.random().toString(16).slice(2)}`;
  const event = { ...payload, id, ts };

  const result = await ingestEvent(roomId, event);
  return Response.json(result);
}
