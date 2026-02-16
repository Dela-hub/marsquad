import { notFound } from 'next/navigation';
import ExplorerClient from '../../../../components/ExplorerClient';
import { getRoomConfig, hasKv } from '../../../../lib/rooms';
import type { RoomConfig } from '../../../../lib/types';

const MARSQUAD_FALLBACK: RoomConfig = {
  roomId: 'marsquad',
  name: 'marsquad',
  apiKey: '',
  created: 0,
  agents: [
    { id: 'dilo', name: 'Dilo', avatar: '🧿', color: '#3b82f6' },
    { id: 'phantom', name: 'Phantom', avatar: '🟥', color: '#f43f5e' },
    { id: 'nyx', name: 'Nyx', avatar: '🟪', color: '#a855f7' },
    { id: 'cipher', name: 'Cipher', avatar: '🟦', color: '#06b6d4' },
    { id: 'pulse', name: 'Pulse', avatar: '🟩', color: '#10b981' },
    { id: 'wraith', name: 'Wraith', avatar: '🟣', color: '#6366f1' },
    { id: 'specter', name: 'Specter', avatar: '🟧', color: '#f59e0b' },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  if (!hasKv()) {
    if (roomId === 'marsquad') return { title: 'marsquad — Explorer' };
    return { title: 'Explorer' };
  }
  const config = await getRoomConfig(roomId);
  if (!config) return { title: 'Room Not Found' };
  return { title: `${config.name} — Explorer` };
}

export default async function ExplorerPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  let config: RoomConfig | null = null;
  if (hasKv()) config = await getRoomConfig(roomId);
  if (!config && roomId === 'marsquad') config = MARSQUAD_FALLBACK;
  if (!config) notFound();

  return (
    <ExplorerClient
      roomId={config.roomId}
      roomName={config.name}
      agents={config.agents}
    />
  );
}
