export const dynamic = 'force-dynamic';

import { hasKv, getRoomConfig } from '../../../../../lib/rooms';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;

  if (!hasKv()) return new Response('kv not configured', { status: 503 });

  const config = await getRoomConfig(roomId);
  if (!config) return new Response('room not found', { status: 404 });

  // Strip sensitive fields
  const { apiKey: _, ...publicConfig } = config;
  return Response.json(publicConfig);
}
