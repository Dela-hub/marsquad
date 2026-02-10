'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { AgentConfig } from '../lib/types';

type EventPayload = {
  ts?: number;
  text?: string;
  agent?: string;
  type?: string;
};

type Props = {
  roomId: string;
  agents: AgentConfig[];
  roomName: string;
  variant?: 'full' | 'embed';
};

// ── Utilities ──

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

const NOISE = ['HEARTBEAT_OK', 'heartbeat', 'Nothing urgent', 'Monitoring.', 'tool: browser', 'tool: bash', 'tool: Read', 'tool: Write', 'tool: Glob', 'tool: Grep'];

function isNoise(line: string): boolean {
  if (NOISE.some(n => line.includes(n))) return true;
  if (/^tool: \w+$/.test(line.trim())) return true;
  if (line.trim().length < 5) return true;
  return false;
}

const TAG_COLORS: Record<string, string> = {
  Research: '#a855f7',
  Copy: '#f59e0b',
  Ops: '#f43f5e',
  Alerts: '#10b981',
  QA: '#6366f1',
  Data: '#06b6d4',
};

function tagEvent(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes('research') || lower.includes('competitor') || lower.includes('market')) return 'Research';
  if (lower.includes('draft') || lower.includes('write') || lower.includes('copy') || lower.includes('content')) return 'Copy';
  if (lower.includes('deploy') || lower.includes('build') || lower.includes('server') || lower.includes('infra')) return 'Ops';
  if (lower.includes('alert') || lower.includes('monitor') || lower.includes('watch') || lower.includes('signal')) return 'Alerts';
  if (lower.includes('review') || lower.includes('qa') || lower.includes('test') || lower.includes('check')) return 'QA';
  if (lower.includes('data') || lower.includes('analys') || lower.includes('chart') || lower.includes('trend')) return 'Data';
  return null;
}

const DEFAULT_COLOR = '#94a3b8';

// ── Component ──

export default function RoomFeed({ roomId, agents, roomName, variant = 'full' }: Props) {
  const [events, setEvents] = useState<EventPayload[]>([]);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [since, setSince] = useState(0);
  const [visitors, setVisitors] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [flags, setFlags] = useState<string[]>([]);
  const [discoveredAgents, setDiscoveredAgents] = useState<Map<string, AgentConfig>>(new Map());
  const termRef = useRef<HTMLDivElement>(null);

  // Build agent lookup from props + discovered
  const agentsMap = useMemo(() => {
    const map = new Map<string, AgentConfig>();
    for (const a of agents) {
      map.set(a.id.toLowerCase(), a);
    }
    discoveredAgents.forEach((v, k) => {
      if (!map.has(k)) map.set(k, v);
    });
    return map;
  }, [agents, discoveredAgents]);

  function resolveAgent(event: EventPayload): AgentConfig | null {
    // Prefer explicit agent field
    if (event.agent) {
      const key = event.agent.toLowerCase();
      if (agentsMap.has(key)) return agentsMap.get(key)!;
      // Auto-discover
      const discovered: AgentConfig = {
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        avatar: '🤖',
        color: DEFAULT_COLOR,
      };
      setDiscoveredAgents(prev => {
        if (prev.has(key)) return prev;
        const next = new Map(prev);
        next.set(key, discovered);
        return next;
      });
      return discovered;
    }
    // Fall back to text scanning
    if (!event.text) return null;
    const lower = event.text.toLowerCase();
    let found: AgentConfig | null = null;
    agentsMap.forEach((config, key) => {
      if (!found && lower.includes(key)) found = config;
    });
    return found;
  }

  const eventsUrl = `/api/rooms/${roomId}/events`;

  // Visitor heartbeat (full variant only)
  useEffect(() => {
    if (variant === 'embed') return;
    let active = true;
    const heartbeat = async () => {
      try {
        const res = await fetch('/api/presence', { method: 'POST' });
        if (res.ok && active) {
          const data = await res.json();
          setVisitors(data.visitors || 0);
          setTotalVisitors(data.totalVisitors || 0);
          if (Array.isArray(data.flags)) setFlags(data.flags);
        }
      } catch { /* ignore */ }
      if (active) setTimeout(heartbeat, 15_000);
    };
    heartbeat();
    return () => { active = false; };
  }, [variant]);

  // Event polling
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(`${eventsUrl}?since=${since}&limit=200`);
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!active || !Array.isArray(data.events)) return;
        const evts = data.events as EventPayload[];
        if (evts.length) {
          setSince(evts[evts.length - 1].ts || Date.now());
          setEvents((prev) => [...prev, ...evts].slice(-500));
          setTerminalLines((prev) => {
            const next = [...prev];
            for (const e of evts) {
              if (e.text && !isNoise(e.text)) next.push(e.text);
            }
            return next.slice(-150);
          });
        }
      } catch {
        // ignore
      }
      if (active) setTimeout(poll, document.hidden ? 8000 : 3000);
    };
    poll();
    return () => { active = false; };
  }, [since, eventsUrl]);

  // Auto-scroll terminal
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // Derived stats
  const totalEvents = events.length;
  const agentsSeen = new Set(
    events.map(e => {
      const a = resolveAgent(e);
      return a?.id || null;
    }).filter(Boolean),
  );
  const recentEvents = events.filter(e => e.ts && Date.now() - e.ts < 86_400_000);

  const tickerItems = events
    .filter(e => e.text && e.ts && !isNoise(e.text))
    .slice(-30)
    .reverse();

  const activityItems = events
    .filter(e => e.text && e.ts && !isNoise(e.text))
    .slice(-12)
    .reverse();

  // All known agents (configured + discovered)
  const allAgents = Array.from(agentsMap.values());

  return (
    <>
      {/* ── Live Ticker ── */}
      <div className="ms-ticker">
        <div className="ms-ticker-track">
          {(tickerItems.length > 0 ? tickerItems : [
            { text: 'Waiting for live data...', ts: Date.now() },
          ]).map((item, i) => (
            <span key={i} className="ms-ticker-item">
              <span className="ms-ticker-dot" />
              <span className="ms-ticker-text">{(item.text || '').slice(0, 80)}</span>
              {item.ts && <span className="ms-ticker-time">{timeAgo(item.ts)}</span>}
            </span>
          ))}
          {tickerItems.map((item, i) => (
            <span key={`d-${i}`} className="ms-ticker-item" aria-hidden>
              <span className="ms-ticker-dot" />
              <span className="ms-ticker-text">{(item.text || '').slice(0, 80)}</span>
              {item.ts && <span className="ms-ticker-time">{timeAgo(item.ts)}</span>}
            </span>
          ))}
        </div>
      </div>

      {variant === 'full' && (
        <>
          {/* ── Stats Bar ── */}
          <section className="ms-stats">
            <div className="ms-stat">
              <span className="ms-stat-value">{visitors || 1}</span>
              <span className="ms-stat-label">Watching Now</span>
              {flags.length > 0 && (
                <span className="ms-stat-flags">{flags.join(' ')}</span>
              )}
            </div>
            <div className="ms-stat-divider" />
            <div className="ms-stat">
              <span className="ms-stat-value">{totalVisitors || '—'}</span>
              <span className="ms-stat-label">Total Visitors</span>
            </div>
            <div className="ms-stat-divider" />
            <div className="ms-stat">
              <span className="ms-stat-value">{agentsSeen.size || allAgents.length}</span>
              <span className="ms-stat-label">Agents Active</span>
            </div>
            <div className="ms-stat-divider" />
            <div className="ms-stat">
              <span className="ms-stat-value">{totalEvents || '—'}</span>
              <span className="ms-stat-label">Events Captured</span>
            </div>
            <div className="ms-stat-divider" />
            <div className="ms-stat">
              <span className="ms-stat-value">{recentEvents.length || '—'}</span>
              <span className="ms-stat-label">Last 24h</span>
            </div>
          </section>

          {/* ── Live Stage (marsquad only) ── */}
          {roomId === 'marsquad' && (
            <section className="ms-stage" id="stage">
              <div className="ms-stage-chrome">
                <div className="ms-terminal-bar">
                  <div className="ms-terminal-dots">
                    <span /><span /><span />
                  </div>
                  <span className="ms-terminal-title">{roomName} — office</span>
                  <div className="ms-terminal-live">
                    <span className="lp-pulse lp-pulse--red" />
                    <span>LIVE</span>
                  </div>
                </div>
                <div className="ms-stage-frame">
                  <iframe title={`${roomName} Live`} src="/live" loading="lazy" />
                </div>
              </div>
            </section>
          )}

          {/* ── Agent Cards ── */}
          <section className="ms-agents" id="agents">
            <h2 className="ms-section-title">The Squad</h2>
            <div className="ms-agent-grid">
              {allAgents.map((agent, i) => {
                const isActive = agentsSeen.has(agent.id);
                return (
                  <div
                    key={agent.id}
                    className="ms-agent-card"
                    style={{ '--agent-color': agent.color, '--agent-i': i } as any}
                  >
                    <div className="ms-agent-header">
                      <span className="ms-agent-avatar">{agent.avatar}</span>
                      <div className="ms-agent-meta">
                        <span className="ms-agent-name">{agent.name}</span>
                        {agent.role && <span className="ms-agent-role">{agent.role}</span>}
                      </div>
                      <span className={`ms-agent-status ${isActive ? 'ms-agent-status--active' : ''}`} />
                    </div>
                    {agent.desc && <p className="ms-agent-desc">{agent.desc}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* ── Live Terminal ── */}
      <section className="ms-terminal-section" id="terminal">
        {variant === 'full' && <h2 className="ms-section-title">Live Feed</h2>}
        <div className="ms-terminal-chrome">
          <div className="ms-terminal-bar">
            <div className="ms-terminal-dots">
              <span /><span /><span />
            </div>
            <span className="ms-terminal-title">{roomName} — live</span>
            <div className="ms-terminal-live">
              <span className="lp-pulse lp-pulse--red" />
              <span>LIVE</span>
            </div>
          </div>
          <div className="ms-terminal-body" ref={termRef}>
            {terminalLines.length === 0 && (
              <div className="ms-terminal-empty">
                <span className="ms-terminal-cursor" />
                Connecting to live feed...
              </div>
            )}
            {terminalLines.map((line, idx) => {
              const tag = tagEvent(line);
              return (
                <div className="ms-terminal-line" key={`${idx}-${line.slice(0, 20)}`}>
                  {tag && <span className="ms-tag" style={{ background: TAG_COLORS[tag] || '#666' }}>{tag}</span>}
                  {line}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {variant === 'full' && (
        /* ── Recent Activity Grid ── */
        <section className="ms-activity" id="activity">
          <h2 className="ms-section-title">Recent Activity</h2>
          <div className="ms-activity-grid">
            {(activityItems.length > 0 ? activityItems : Array.from({ length: 6 }, (_, i) => ({
              text: 'Awaiting agent output...',
              ts: Date.now() - i * 60_000,
            }))).map((item, i) => {
              const agentData = resolveAgent(item);
              return (
                <div
                  key={i}
                  className="ms-activity-card"
                  style={{ '--card-color': agentData?.color || 'var(--muted)', '--card-i': i } as any}
                >
                  <div className="ms-activity-card-header">
                    {agentData && (
                      <span className="ms-activity-agent" style={{ color: agentData.color }}>
                        {agentData.avatar} {agentData.name}
                      </span>
                    )}
                    {(() => { const t = tagEvent(item.text || ''); return t ? <span className="ms-tag" style={{ background: TAG_COLORS[t] || '#666' }}>{t}</span> : null; })()}
                    {item.ts && <span className="ms-activity-time">{timeAgo(item.ts)}</span>}
                  </div>
                  <p className="ms-activity-text">{(item.text || '').slice(0, 140)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
