'use client';

import { useEffect, useRef, useState } from 'react';

type EventPayload = {
  ts?: number;
  text?: string;
  agent?: string;
  type?: string;
};

const AGENTS: Record<string, { name: string; role: string; desc: string; color: string; avatar: string }> = {
  dilo:    { name: 'Dilo',    role: 'Lead',  desc: 'Primary orchestrator. Breaks down missions, delegates, and oversees delivery.',           color: '#3b82f6', avatar: '🤖' },
  phantom: { name: 'Phantom', role: 'Ops',   desc: 'Execution engine. Runs tools, manages infrastructure, handles deployments.',               color: '#f43f5e', avatar: '👻' },
  nyx:     { name: 'Nyx',     role: 'Intel', desc: 'Intelligence & monitoring. Watches signals, scrapes data, tracks market shifts.',           color: '#a855f7', avatar: '🔮' },
  cipher:  { name: 'Cipher',  role: 'Data',  desc: 'Security & data analysis. Encrypts, validates, and crunches numbers.',                     color: '#06b6d4', avatar: '🔐' },
  pulse:   { name: 'Pulse',   role: 'Comms', desc: 'Data analyst for stocks and trends. Surfaces patterns and delivers insights.',              color: '#10b981', avatar: '📡' },
  wraith:  { name: 'Wraith',  role: 'QA',    desc: 'Quality & red-team. Tests every output, catches hallucinations, stress-tests claims.',      color: '#6366f1', avatar: '👁' },
  specter: { name: 'Specter', role: 'Copy',  desc: 'Communications & copy. Drafts messages, writes content, polishes deliverables.',            color: '#f59e0b', avatar: '✍️' },
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function extractAgent(text: string): string | null {
  const lower = text.toLowerCase();
  for (const key of Object.keys(AGENTS)) {
    if (lower.includes(key)) return key;
  }
  return null;
}

// ── Public feed filter: hide system noise ──
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

export default function LandingLive() {
  const [events, setEvents] = useState<EventPayload[]>([]);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [since, setSince] = useState(0);
  const [visitors, setVisitors] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [flags, setFlags] = useState<string[]>([]);
  const termRef = useRef<HTMLDivElement>(null);

  // Visitor heartbeat
  useEffect(() => {
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
  }, []);

  // Event polling
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/events?since=${since}&limit=200`);
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
  }, [since]);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // Derive stats
  const totalEvents = events.length;
  const agentsSeen = new Set(events.map(e => extractAgent(e.text || '')).filter(Boolean));
  const recentEvents = events.filter(e => e.ts && Date.now() - e.ts < 86_400_000);

  // Ticker items (last 30 events with text, filtered)
  const tickerItems = events
    .filter(e => e.text && e.ts && !isNoise(e.text))
    .slice(-30)
    .reverse();

  // Activity items for grid (last 12 with text, filtered)
  const activityItems = events
    .filter(e => e.text && e.ts && !isNoise(e.text))
    .slice(-12)
    .reverse();

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
          {/* duplicate for seamless loop */}
          {tickerItems.map((item, i) => (
            <span key={`d-${i}`} className="ms-ticker-item" aria-hidden>
              <span className="ms-ticker-dot" />
              <span className="ms-ticker-text">{(item.text || '').slice(0, 80)}</span>
              {item.ts && <span className="ms-ticker-time">{timeAgo(item.ts)}</span>}
            </span>
          ))}
        </div>
      </div>

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
          <span className="ms-stat-value">{agentsSeen.size || 7}</span>
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

      {/* ── Live Stage (canvas iframe) ── */}
      <section className="ms-stage" id="stage">
        <div className="ms-stage-chrome">
          <div className="ms-terminal-bar">
            <div className="ms-terminal-dots">
              <span /><span /><span />
            </div>
            <span className="ms-terminal-title">marsquad — office</span>
            <div className="ms-terminal-live">
              <span className="lp-pulse lp-pulse--red" />
              <span>LIVE</span>
            </div>
          </div>
          <div className="ms-stage-frame">
            <iframe title="Marsquad Live" src="/live" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ── Agent Cards ── */}
      <section className="ms-agents" id="agents">
        <h2 className="ms-section-title">The Squad</h2>
        <div className="ms-agent-grid">
          {Object.entries(AGENTS).map(([key, agent], i) => {
            const isActive = agentsSeen.has(key);
            return (
              <div
                key={key}
                className="ms-agent-card"
                style={{ '--agent-color': agent.color, '--agent-i': i } as any}
              >
                <div className="ms-agent-header">
                  <span className="ms-agent-avatar">{agent.avatar}</span>
                  <div className="ms-agent-meta">
                    <span className="ms-agent-name">{agent.name}</span>
                    <span className="ms-agent-role">{agent.role}</span>
                  </div>
                  <span className={`ms-agent-status ${isActive ? 'ms-agent-status--active' : ''}`} />
                </div>
                <p className="ms-agent-desc">{agent.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Live Terminal ── */}
      <section className="ms-terminal-section" id="terminal">
        <h2 className="ms-section-title">Live Feed</h2>
        <div className="ms-terminal-chrome">
          <div className="ms-terminal-bar">
            <div className="ms-terminal-dots">
              <span /><span /><span />
            </div>
            <span className="ms-terminal-title">marsquad — live operations</span>
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

      {/* ── Recent Activity Grid ── */}
      <section className="ms-activity" id="activity">
        <h2 className="ms-section-title">Recent Activity</h2>
        <div className="ms-activity-grid">
          {(activityItems.length > 0 ? activityItems : Array.from({ length: 6 }, (_, i) => ({
            text: 'Awaiting agent output...',
            ts: Date.now() - i * 60_000,
          }))).map((item, i) => {
            const agent = extractAgent(item.text || '');
            const agentData = agent ? AGENTS[agent] : null;
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
    </>
  );
}
