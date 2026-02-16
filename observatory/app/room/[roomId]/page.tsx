import { notFound } from 'next/navigation';
import { getRoomConfig, hasKv } from '../../../lib/rooms';
import RoomFeed from '../../../components/RoomFeed';

export async function generateMetadata({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  if (!hasKv()) return { title: 'Observatory' };
  const config = await getRoomConfig(roomId);
  if (!config) return { title: 'Room Not Found' };
  return { title: `${config.name} — Observatory` };
}

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  if (!hasKv()) notFound();
  const config = await getRoomConfig(roomId);
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
