'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { AgentConfig } from '../lib/types';

type EventPayload = {
  id?: string;
  ts?: number;
  text?: string;
  agent?: string;
  type?: string;
  task?: string;
  status?: string;
  pos?: { x?: number; y?: number };
};

type AgentState = {
  id: string;
  name: string;
  color: string;
  avatar: string;
  status?: string;
  task?: string;
  text?: string;
  x: number;
  y: number;
  lastTs: number;
};

type Props = {
  roomId: string;
  roomName: string;
  agents: AgentConfig[];
};

const WORLD_W = 1400;
const WORLD_H = 900;
const GRID_W = 14;
const GRID_H = 10;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function normalizeId(v?: string) {
  return (v || '').trim().toLowerCase();
}

function agentDefaults(agents: AgentConfig[]): Record<string, AgentState> {
  const out: Record<string, AgentState> = {};
  const cols = 4;
  const spacingX = 260;
  const spacingY = 200;
  const startX = 220;
  const startY = 170;
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    const id = normalizeId(a.id);
    const col = i % cols;
    const row = Math.floor(i / cols);
    out[id] = {
      id,
      name: a.name || a.id,
      color: a.color || '#94a3b8',
      avatar: a.avatar || '🤖',
      x: startX + col * spacingX,
      y: startY + row * spacingY,
      lastTs: 0,
    };
  }
  return out;
}

function mapGridToWorld(pos: { x?: number; y?: number }) {
  const gx = clamp(Number(pos?.x ?? 0), 0, GRID_W - 1);
  const gy = clamp(Number(pos?.y ?? 0), 0, GRID_H - 1);
  return {
    x: 120 + (gx / (GRID_W - 1)) * (WORLD_W - 240),
    y: 120 + (gy / (GRID_H - 1)) * (WORLD_H - 240),
  };
}

export default function ExplorerClient({ roomId, roomName, agents }: Props) {
  const [agentMap, setAgentMap] = useState<Record<string, AgentState>>(() => agentDefaults(agents));
  const [since, setSince] = useState(0);
  const [selectedId, setSelectedId] = useState<string>('');
  const [followId, setFollowId] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const [cam, setCam] = useState({ x: WORLD_W / 2, y: WORLD_H / 2 });
  const [dragging, setDragging] = useState(false);
  const [stats, setStats] = useState({ events: 0, connected: true });
  const dragRef = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null);

  useEffect(() => {
    setAgentMap(agentDefaults(agents));
  }, [agents]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/events?since=${since}&limit=200`);
        if (!res.ok) throw new Error(`events ${res.status}`);
        const data = await res.json();
        const events = (data?.events || []) as EventPayload[];
        if (!active) return;
        setStats((s) => ({ ...s, connected: true, events: s.events + events.length }));
        if (!events.length) {
          timer = setTimeout(poll, 2000);
          return;
        }

        const lastTs = Number(events[events.length - 1]?.ts || Date.now());
        setSince(lastTs);

        setAgentMap((prev) => {
          const next = { ...prev };
          for (const e of events) {
            const id = normalizeId(e.agent);
            if (!id) continue;
            if (!next[id]) {
              next[id] = {
                id,
                name: id,
                color: '#94a3b8',
                avatar: '🤖',
                x: WORLD_W / 2,
                y: WORLD_H / 2,
                lastTs: 0,
              };
            }
            const a = { ...next[id] };
            if (e.type === 'agent.move' && e.pos) {
              const p = mapGridToWorld(e.pos);
              a.x = p.x;
              a.y = p.y;
            }
            if (e.type === 'agent.status') a.status = e.status || e.text || a.status;
            if (e.type === 'task.started' || e.type === 'task.progress') a.task = e.task || e.text || a.task;
            if (e.type === 'task.done') a.task = e.task ? `done: ${e.task}` : 'task done';
            if (e.text) a.text = e.text;
            a.lastTs = Number(e.ts || Date.now());
            next[id] = a;
          }
          return next;
        });
      } catch {
        if (active) setStats((s) => ({ ...s, connected: false }));
      }
      if (active) timer = setTimeout(poll, 2200);
    };

    poll();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [roomId, since]);

  const agentsList = useMemo(
    () => Object.values(agentMap).sort((a, b) => a.name.localeCompare(b.name)),
    [agentMap],
  );

  const selected = selectedId ? agentMap[selectedId] : null;

  useEffect(() => {
    if (!followId) return;
    const target = agentMap[followId];
    if (!target) return;
    setCam({ x: target.x, y: target.y });
  }, [followId, agentMap]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    setDragging(true);
    dragRef.current = { sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const { sx, sy, cx, cy } = dragRef.current;
    const dx = (e.clientX - sx) / zoom;
    const dy = (e.clientY - sy) / zoom;
    setCam({ x: cx - dx, y: cy - dy });
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    setDragging(false);
    dragRef.current = null;
  }

  function zoomBy(delta: number) {
    setZoom((z) => clamp(Number((z + delta).toFixed(2)), 0.45, 2.2));
  }

  function resetView() {
    setZoom(1);
    setCam({ x: WORLD_W / 2, y: WORLD_H / 2 });
    setFollowId('');
  }

  const viewportStyle = {
    transform: `scale(${zoom}) translate(${-cam.x + WORLD_W / 2}px, ${-cam.y + WORLD_H / 2}px)`,
  } as React.CSSProperties;

  return (
    <main className="explorer-shell">
      <nav className="lp-nav">
        <a href={`/room/${roomId}`} className="lp-logo">
          <span className="lp-logo-icon">◈</span>
          <span className="lp-logo-text">{roomName} explorer</span>
        </a>
        <div className="lp-nav-links">
          <a href={`/room/${roomId}`} className="lp-nav-link">back to feed</a>
          <a href="#inspect" className="lp-nav-cta">
            <span className="lp-pulse" />
            inspect workers
          </a>
        </div>
      </nav>

      <section className="explorer-main">
        <div className="explorer-stage-wrap">
          <div className="explorer-toolbar">
            <button className="lp-btn lp-btn--ghost" onClick={() => zoomBy(-0.15)}>−</button>
            <button className="lp-btn lp-btn--ghost" onClick={() => zoomBy(0.15)}>+</button>
            <button className="lp-btn lp-btn--ghost" onClick={resetView}>Reset</button>
            <span className="explorer-stat">{Math.round(zoom * 100)}%</span>
            <span className="explorer-stat">{stats.connected ? 'live' : 'reconnecting'}</span>
            <span className="explorer-stat">{stats.events} events</span>
          </div>

          <div
            className={`explorer-stage ${dragging ? 'is-dragging' : ''}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div className="explorer-viewport" style={viewportStyle}>
              <div className="explorer-world">
                <div className="explorer-grid" />
                <div className="explorer-huddle">Huddle zone</div>
                {agentsList.map((a) => (
                  <button
                    key={a.id}
                    className={`explorer-agent ${selectedId === a.id ? 'is-selected' : ''}`}
                    style={{ left: `${a.x}px`, top: `${a.y}px`, ['--agent-color' as any]: a.color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(a.id);
                      setFollowId((f) => (f === a.id ? '' : f));
                    }}
                  >
                    <span className="explorer-agent-avatar">{a.avatar}</span>
                    <span className="explorer-agent-name">{a.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside id="inspect" className="explorer-panel">
          <h2>Workers</h2>
          <div className="explorer-list">
            {agentsList.map((a) => (
              <button
                key={a.id}
                className={`explorer-list-item ${selectedId === a.id ? 'is-selected' : ''}`}
                onClick={() => {
                  setSelectedId(a.id);
                  setCam({ x: a.x, y: a.y });
                }}
              >
                <span className="explorer-list-dot" style={{ background: a.color }} />
                <span className="explorer-list-name">{a.name}</span>
              </button>
            ))}
          </div>

          <div className="explorer-details">
            <h3>{selected?.name || 'Select a worker'}</h3>
            {selected ? (
              <>
                <p><strong>Status:</strong> {selected.status || 'idle'}</p>
                <p><strong>Task:</strong> {selected.task || '—'}</p>
                <p><strong>Last:</strong> {selected.text || '—'}</p>
                <button
                  className="lp-btn lp-btn--primary"
                  onClick={() => setFollowId((f) => (f === selected.id ? '' : selected.id))}
                >
                  {followId === selected.id ? 'Stop following' : 'Follow agent'}
                </button>
              </>
            ) : (
              <p>Click an agent to inspect live status and tasks.</p>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}

