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

type VisitorState = {
  id: string;
  x: number;
  y: number;
  text?: string;
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

function initialAgentState(agents: AgentConfig[]): Record<string, AgentState> {
  const out: Record<string, AgentState> = {};
  const cols = 4;
  const spacingX = 250;
  const spacingY = 190;
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
    y: 100 + (gy / (GRID_H - 1)) * (WORLD_H - 220),
  };
}

export default function Explorer3DClient({ roomId, roomName, agents }: Props) {
  const [agentMap, setAgentMap] = useState<Record<string, AgentState>>(() => initialAgentState(agents));
  const [visitors, setVisitors] = useState<Record<string, VisitorState>>({});
  const [since, setSince] = useState(0);
  const sinceRef = useRef(0);
  const [selectedId, setSelectedId] = useState('');
  const [followId, setFollowId] = useState('');
  const [yaw, setYaw] = useState(-26);
  const [zoom, setZoom] = useState(1);
  const [cam, setCam] = useState({ x: WORLD_W / 2, y: WORLD_H / 2 });
  const [dragging, setDragging] = useState(false);
  const [stats, setStats] = useState({ events: 0, connected: true });
  const dragRef = useRef<{ sx: number; sy: number; cx: number; cy: number; y0: number } | null>(null);

  useEffect(() => {
    setAgentMap(initialAgentState(agents));
  }, [agents]);

  useEffect(() => {
    sinceRef.current = since;
  }, [since]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const poll = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/events?since=${sinceRef.current}&limit=200`);
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
        sinceRef.current = lastTs;

        setAgentMap((prev) => {
          const next = { ...prev };
          for (const e of events) {
            const id = normalizeId(e.agent);
            if (!id) continue;
            if (id === 'visitor') continue;
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

        setVisitors((prev) => {
          const next = { ...prev };
          let changed = false;
          for (const e of events) {
            const id = normalizeId(e.agent);
            if (id !== 'visitor') continue;
            const vId = e.id ? `v-${e.id}` : `v-${Number(e.ts || Date.now())}`;
            const ts = Number(e.ts || Date.now());
            const p = e.pos ? mapGridToWorld(e.pos) : { x: 1180, y: 740 };
            next[vId] = {
              id: vId,
              x: p.x + (Math.random() * 40 - 20),
              y: p.y + (Math.random() * 20 - 10),
              text: e.text || e.task || 'visitor',
              lastTs: ts,
            };
            changed = true;
          }
          // expire old visitors
          const cutoff = Date.now() - 90_000;
          for (const [k, v] of Object.entries(next)) {
            if (v.lastTs < cutoff) {
              delete next[k];
              changed = true;
            }
          }
          return changed ? next : prev;
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
  }, [roomId]);

  const agentsList = useMemo(
    () => Object.values(agentMap).sort((a, b) => a.name.localeCompare(b.name)),
    [agentMap],
  );
  const visitorList = useMemo(
    () => Object.values(visitors).sort((a, b) => b.lastTs - a.lastTs),
    [visitors],
  );
  const selected = selectedId ? agentMap[selectedId] : null;

  useEffect(() => {
    if (!followId) return;
    const a = agentMap[followId];
    if (!a) return;
    setCam({ x: a.x, y: a.y });
  }, [followId, agentMap]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    setDragging(true);
    dragRef.current = { sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, y0: yaw };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const { sx, sy, cx, cy, y0 } = dragRef.current;
    const dx = (e.clientX - sx) / zoom;
    const dy = (e.clientY - sy) / zoom;
    setCam({ x: cx - dx, y: cy - dy });
    setYaw(clamp(y0 + dx * 0.08, -40, -8));
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    dragRef.current = null;
    setDragging(false);
  }

  function zoomBy(delta: number) {
    setZoom((z) => clamp(Number((z + delta).toFixed(2)), 0.55, 1.9));
  }

  function resetView() {
    setCam({ x: WORLD_W / 2, y: WORLD_H / 2 });
    setYaw(-26);
    setZoom(1);
    setFollowId('');
  }

  const worldStyle = {
    transform: `translate(${-cam.x + WORLD_W / 2}px, ${-cam.y + WORLD_H / 2}px) rotateX(58deg) rotateZ(${yaw}deg) scale(${zoom})`,
  } as React.CSSProperties;

  return (
    <main className="explorer3d-shell">
      <nav className="lp-nav">
        <a href={`/room/${roomId}`} className="lp-logo">
          <span className="lp-logo-icon">◈</span>
          <span className="lp-logo-text">{roomName} 3d beta</span>
        </a>
        <div className="lp-nav-links">
          <a href={`/room/${roomId}/explorer`} className="lp-nav-link">2d explorer</a>
          <a href={`/room/${roomId}`} className="lp-nav-link">feed</a>
          <a href="#inspect" className="lp-nav-cta">
            <span className="lp-pulse" />
            inspect
          </a>
        </div>
      </nav>

      <section className="explorer3d-main">
        <div className="explorer3d-stage-wrap">
          <div className="explorer3d-toolbar">
            <button className="lp-btn lp-btn--ghost" onClick={() => zoomBy(-0.1)}>−</button>
            <button className="lp-btn lp-btn--ghost" onClick={() => zoomBy(0.1)}>+</button>
            <button className="lp-btn lp-btn--ghost" onClick={resetView}>Reset</button>
            <span className="explorer-stat">{Math.round(zoom * 100)}%</span>
            <span className="explorer-stat">yaw {Math.round(yaw)}°</span>
            <span className="explorer-stat">{stats.connected ? 'live' : 'reconnecting'}</span>
            <span className="explorer-stat">{stats.events} events</span>
          </div>

          <div
            className={`explorer3d-stage ${dragging ? 'is-dragging' : ''}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div className="explorer3d-scene">
              <div className="explorer3d-world" style={worldStyle}>
                <div className="explorer3d-floor" />
                <div className="explorer3d-wall explorer3d-wall--top" />
                <div className="explorer3d-wall explorer3d-wall--left" />
                <div className="explorer3d-wall explorer3d-wall--right" />
                <div className="explorer3d-huddle">HUDDLE</div>
                <div className="explorer3d-projector">PROJECTOR</div>
                <div className="explorer3d-reception">RECEPTION</div>
                <div className="explorer3d-entrance">ENTRANCE</div>
                <div className="explorer3d-desk explorer3d-desk--1" />
                <div className="explorer3d-desk explorer3d-desk--2" />
                <div className="explorer3d-desk explorer3d-desk--3" />
                <div className="explorer3d-desk explorer3d-desk--4" />
                <div className="explorer3d-desk explorer3d-desk--5" />
                <div className="explorer3d-desk explorer3d-desk--6" />
                {agentsList.map((a) => (
                  <button
                    key={a.id}
                    className={`explorer3d-agent ${selectedId === a.id ? 'is-selected' : ''}`}
                    style={{ left: `${a.x}px`, top: `${a.y}px`, ['--agent-color' as any]: a.color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(a.id);
                    }}
                  >
                    <span className="explorer3d-agent-orb">{a.avatar}</span>
                    <span className="explorer3d-agent-name">{a.name}</span>
                  </button>
                ))}
                {visitorList.map((v) => (
                  <div
                    key={v.id}
                    className="explorer3d-visitor"
                    style={{ left: `${v.x}px`, top: `${v.y}px` }}
                    title={v.text || 'visitor'}
                  >
                    <span className="explorer3d-visitor-avatar">🧍</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside id="inspect" className="explorer3d-panel">
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

          <h2 style={{ marginTop: 14 }}>Visitors</h2>
          <div className="explorer-list">
            {visitorList.length === 0 ? (
              <div className="explorer-list-item"><span className="explorer-list-name">No recent visitors</span></div>
            ) : visitorList.slice(0, 8).map((v) => (
              <div key={v.id} className="explorer-list-item">
                <span className="explorer-list-dot" style={{ background: '#fbbf24' }} />
                <span className="explorer-list-name">{v.text || 'visitor'}</span>
              </div>
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
              <p>Pick a worker to inspect and follow.</p>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
