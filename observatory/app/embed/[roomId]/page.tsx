import { notFound } from 'next/navigation';
import { getRoomConfig, hasKv } from '../../../lib/rooms';
import RoomFeed from '../../../components/RoomFeed';

export default async function EmbedPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  if (!hasKv()) notFound();
  const config = await getRoomConfig(roomId);
  if (!config) notFound();

  return (
    <RoomFeed
      roomId={config.roomId}
      agents={config.agents}
      roomName={config.name}
      variant="embed"
    />
  );
}
