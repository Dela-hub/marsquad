import { notFound } from 'next/navigation';
import ExplorerClient from '../../../../components/ExplorerClient';
import { getRoomConfig, hasKv } from '../../../../lib/rooms';

export async function generateMetadata({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  if (!hasKv()) return { title: 'Explorer' };
  const config = await getRoomConfig(roomId);
  if (!config) return { title: 'Room Not Found' };
  return { title: `${config.name} — Explorer` };
}

export default async function ExplorerPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  if (!hasKv()) notFound();
  const config = await getRoomConfig(roomId);
  if (!config) notFound();

  return (
    <ExplorerClient
      roomId={config.roomId}
      roomName={config.name}
      agents={config.agents}
    />
  );
}

