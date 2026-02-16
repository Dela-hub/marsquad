import { notFound } from 'next/navigation';
import { getRoomConfig, hasKv } from '../../../lib/rooms';
import RoomFeed from '../../../components/RoomFeed';
import type { RoomConfig } from '../../../lib/types';

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
    if (roomId === 'marsquad') return { title: 'marsquad — Observatory' };
    return { title: 'Observatory' };
  }
  const config = await getRoomConfig(roomId);
  if (!config) return { title: 'Room Not Found' };
  return { title: `${config.name} — Observatory` };
}

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  let config: RoomConfig | null = null;
  if (hasKv()) config = await getRoomConfig(roomId);
  if (!config && roomId === 'marsquad') config = MARSQUAD_FALLBACK;
  if (!config) notFound();

  return (
    <main className="lp">
      <div className="lp-grain" aria-hidden="true" />

      <nav className="lp-nav">
        <a href="/" className="lp-logo">
          <span className="lp-logo-icon">◈</span>
          <span className="lp-logo-text">{config.name}</span>
        </a>
        <div className="lp-nav-links">
          <a href="#terminal" className="lp-nav-link">live feed</a>
          <a href="#agents" className="lp-nav-link">agents</a>
          <a href={`/room/${config.roomId}/explorer`} className="lp-nav-link">explorer</a>
          <a href="#terminal" className="lp-nav-cta">
            <span className="lp-pulse" />
            watch now
          </a>
        </div>
      </nav>

      <RoomFeed
        roomId={config.roomId}
        agents={config.agents}
        roomName={config.name}
        variant="full"
      />
    </main>
  );
}
