'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { AgentConfig } from '../lib/types';

type EventPayload = {
  ts?: number;
  text?: string;
  agent?: string;
  type?: string;
  task?: string; // target agent for conversations, or task name
  kind?: string;
  target?: string;
  points?: Array<{ x?: number; y?: number }>;
  attendees?: string[];
  // Provenance (optional; inferred for legacy events)
  actor?: 'human' | 'agent' | 'system';
  source?: string; // e.g. 'openclaw' | 'autonomy' | 'api' | 'manual'
  runId?: string;
  sessionId?: string;
  parentEventId?: string;
};

type DisplayEvent = EventPayload & {
  displayText: string;
};

type RichLine = {
  text: string;
  kind: string; // CSS modifier: chat, think, task, tool, system, default
  agentName?: string;
  agentColor?: string;
  targetName?: string;
  targetColor?: string;
  actor?: 'human' | 'agent' | 'system';
  source?: string;
};

type Props = {
  roomId: string;
  agents: AgentConfig[];
  roomName: string;
  variant?: 'full' | 'embed';
  showAgents?: boolean;
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
const KNOWN_AGENT_IDS = new Set(['dilo', 'phantom', 'nyx', 'cipher', 'pulse', 'wraith', 'specter', 'visitor']);

function normalizeAgentKey(raw?: string): string {
  const v = (raw || '').toString().trim().toLowerCase();
  if (!v) return 'unknown';
  if (KNOWN_AGENT_IDS.has(v)) return v;
  if (/^[a-f0-9]{8}$/i.test(v) || /^[a-f0-9-]{24,}$/i.test(v)) return `session-${v.slice(0, 6)}`;
  if (v.length > 24) return `agent-${v.slice(0, 6)}`;
  return v;
}

function inferActor(e: EventPayload): 'human' | 'agent' | 'system' {
  if (e.actor) return e.actor;
  const t = (e.text || '').trim();
  if (t.toLowerCase().startsWith('system:')) return 'system';
  if (t.toLowerCase().startsWith('user:')) return 'human';
  // Common system-ish event types
  if (e.type === 'threat') return 'system';
  return 'agent';
}

function inferSource(e: EventPayload): string {
  if (e.source) return e.source;
  const t = (e.text || '').toLowerCase();
  if (t.includes('[whatsapp ') || t.includes('whatsapp gateway')) return 'openclaw';
  // Heuristic: autonomy tends to emit "insight"/delegation/task lifecycle frequently
  if (e.type === 'insight' || e.type === 'task.delegated') return 'autonomy';
  return 'api';
}

function prettifyType(type?: string): string {
  if (!type) return 'event';
  return type.replace(/[._]/g, ' ');
}

function fallbackEventText(e: EventPayload): string {
  const text = (e.text || '').trim();
  if (text) return text;

  const task = (e.task || '').trim();
  const target = (e.target || '').trim();
  const kind = (e.kind || '').trim();
  const attendees = Array.isArray(e.attendees) ? e.attendees.filter(Boolean) : [];
  const points = Array.isArray(e.points) ? e.points.length : 0;
  switch (e.type) {
    case 'emote':
      if (kind === 'follow') return target ? `Following ${target}` : 'Following target';
      if (kind === 'gather') return attendees.length ? `Gathering: ${attendees.join(', ')}` : 'Gathering team';
      if (kind === 'patrol') return points ? `Patrolling ${points} points` : 'Patrolling area';
      return kind ? `Emote: ${kind}` : 'Emote';
    case 'follow': return target ? `Following ${target}` : 'Following target';
    case 'gather': return attendees.length ? `Gathering: ${attendees.join(', ')}` : 'Gathering team';
    case 'patrol': return points ? `Patrolling ${points} points` : 'Patrolling area';
    case 'standup': return task ? `Standup: ${task}` : 'Standup called';
    case 'conversation': return task ? `Conversation -> ${task}` : 'Conversation';
    case 'task.started': return task ? `Started ${task}` : 'Task started';
    case 'task.progress': return task ? `Working on ${task}` : 'Task progress';
    case 'task.done': return task ? `Completed ${task}` : 'Task done';
    case 'task.error': return task ? `Error in ${task}` : 'Task error';
    case 'task.delegated': return task ? `Delegated ${task}` : 'Task delegated';
    case 'mission.created': return task ? `Mission started: ${task}` : 'Mission started';
    case 'mission.step': return task ? `Mission step: ${task}` : 'Mission step';
    case 'mission.completed': return task ? `Mission completed: ${task}` : 'Mission completed';
    case 'mission.failed': return task ? `Mission failed: ${task}` : 'Mission failed';
    case 'agent.move': return 'Repositioning';
    case 'agent.status': return task ? `Status: ${task}` : 'Status updated';
    case 'tool_call': return task ? `Tool: ${task}` : 'Tool call';
    case 'coffee': return 'Coffee break';
    case 'smoke': return 'Smoke break';
    case 'celebrate': return 'Celebration';
    case 'threat': return task ? `Threat: ${task}` : 'Threat detected';
    default: return task || prettifyType(e.type);
  }
}

// ── Component ──

export default function RoomFeed({ roomId, agents, roomName, variant = 'full', showAgents = true }: Props) {
  const [events, setEvents] = useState<EventPayload[]>([]);
  const [since, setSince] = useState(0);
  const [visitors, setVisitors] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [flags, setFlags] = useState<string[]>([]);
  const [discoveredAgents, setDiscoveredAgents] = useState<Map<string, AgentConfig>>(new Map());
  const [showStage, setShowStage] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [stageOptIn, setStageOptIn] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);

  // Build agent lookup from props + discovered
  const agentsMap = useMemo(() => {
    const map = new Map<string, AgentConfig>();
    for (const a of agents) {
      map.set(normalizeAgentKey(a.id), a);
    }
    discoveredAgents.forEach((v, k) => {
      if (!map.has(k)) map.set(k, v);
    });
    return map;
  }, [agents, discoveredAgents]);

  // Discover unknown agents from events (batched, outside render path)
  const pendingDiscoveries = useRef<Map<string, AgentConfig>>(new Map());

  useEffect(() => {
    if (pendingDiscoveries.current.size === 0) return;
    setDiscoveredAgents(prev => {
      let changed = false;
      const next = new Map(prev);
      pendingDiscoveries.current.forEach((v, k) => {
        if (!next.has(k)) { next.set(k, v); changed = true; }
      });
      pendingDiscoveries.current.clear();
      return changed ? next : prev;
    });
  }, [events]); // runs after events update, not during render

  function resolveAgent(event: EventPayload): AgentConfig | null {
    // Prefer explicit agent field
    if (event.agent) {
      const key = normalizeAgentKey(event.agent);
      if (agentsMap.has(key)) return agentsMap.get(key)!;
      // Queue discovery for next effect (never setState during render)
      const discovered: AgentConfig = {
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        avatar: '🤖',
        color: DEFAULT_COLOR,
      };
      pendingDiscoveries.current.set(key, discovered);
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

  // Mobile safety: the /live office canvas can be heavy in mobile browsers.
  // Avoid loading it on small screens and for reduced-motion users.
  useEffect(() => {
    if (variant === 'embed') return;
    if (typeof window === 'undefined') return;
    const mmMobile = window.matchMedia('(max-width: 768px)');
    const mmReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setShowStage(!(mmMobile.matches || mmReduced.matches));
    update();
    mmMobile.addEventListener?.('change', update);
    mmReduced.addEventListener?.('change', update);
    return () => {
      mmMobile.removeEventListener?.('change', update);
      mmReduced.removeEventListener?.('change', update);
    };
  }, [variant]);

  useEffect(() => {
    if (variant === 'embed') return;
    if (typeof window === 'undefined') return;
    const mm = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mm.matches);
    update();
    mm.addEventListener?.('change', update);
    return () => mm.removeEventListener?.('change', update);
  }, [variant]);

  // Event polling — use ref for `since` to avoid re-creating the effect on every poll
  const sinceRef = useRef(since);
  sinceRef.current = since;

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const maxEvents = isMobile ? 150 : 500;
    const interval = () => isMobile ? 6000 : (document.hidden ? 8000 : 3000);

    const poll = async () => {
      try {
        const res = await fetch(`${eventsUrl}?since=${sinceRef.current}&limit=100`);
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!active || !Array.isArray(data.events)) return;
        const evts = data.events as EventPayload[];
        if (evts.length) {
          const newSince = evts[evts.length - 1].ts || Date.now();
          setSince(newSince);
          setEvents((prev) => [...prev, ...evts].slice(-maxEvents));
        }
      } catch {
        // ignore
      }
      if (active) timer = setTimeout(poll, interval());
    };
    poll();
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [eventsUrl, isMobile]); // stable deps — no `since`

  // Auto-scroll terminal
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [events]);

  // Derived stats (memoized to avoid calling resolveAgent during render)
  const totalEvents = events.length;
  const agentsSeen = useMemo(() => {
    const s = new Set<string>();
    for (const e of events) {
      if (e.agent) s.add(normalizeAgentKey(e.agent));
    }
    return s;
  }, [events]);
  const recentEvents = useMemo(() => events.filter(e => e.ts && Date.now() - e.ts < 86_400_000), [events]);

  const displayEvents: DisplayEvent[] = useMemo(() => {
    return events
      .map((e) => ({ ...e, displayText: fallbackEventText(e) }))
      .filter((e) => e.displayText && !isNoise(e.displayText));
  }, [events]);

  const tickerItems = useMemo(() =>
    displayEvents.filter(e => e.ts).slice(-15).reverse(),
  [displayEvents]);

  const activityItems = useMemo(() =>
    displayEvents.filter(e => e.ts).slice(-12).reverse(),
  [displayEvents]);

  // All known agents (configured + discovered)
  const allAgents = Array.from(agentsMap.values());

  // Build rich lines from events (type-aware rendering)
  const richLinesCap = isMobile ? 40 : 150;
  const richLines: RichLine[] = useMemo(() => {
    return displayEvents
      .slice(-richLinesCap)
      .map(e => {
        const agent = resolveAgent(e);
        const agentName = agent?.name;
        const agentColor = agent?.color;

        // Resolve target agent for conversations
        let targetName: string | undefined;
        let targetColor: string | undefined;
        if (e.type === 'conversation' && e.task) {
          const target = agentsMap.get(normalizeAgentKey(e.task));
          targetName = target?.name || e.task;
          targetColor = target?.color;
        }

        // Classify event into rendering kind
        let kind = 'default';
        switch (e.type) {
          case 'emote':
            if (e.kind === 'gather') kind = 'standup';
            else if (e.kind === 'follow') kind = 'chat';
            else if (e.kind === 'patrol') kind = 'status';
            else kind = 'default';
            break;
          case 'follow': kind = 'chat'; break;
          case 'gather': kind = 'standup'; break;
          case 'patrol': kind = 'status'; break;
          case 'conversation': kind = 'chat'; break;
          case 'thinking': kind = 'think'; break;
          case 'task.started': kind = 'task-start'; break;
          case 'task.done': kind = 'task-done'; break;
          case 'task.error': kind = 'task-error'; break;
          case 'task.delegated': kind = 'delegated'; break;
          case 'tool_call': kind = 'tool'; break;
          case 'mission.created': kind = 'mission'; break;
          case 'mission.completed': kind = 'mission-done'; break;
          case 'insight': kind = 'insight'; break;
          case 'file.shared': kind = 'file'; break;
          case 'coffee': case 'smoke': kind = 'break'; break;
          case 'standup': kind = 'standup'; break;
          case 'celebrate': kind = 'celebrate'; break;
          case 'agent.status': kind = 'status'; break;
        }

        const actor = inferActor(e);
        const source = inferSource(e);
        return { text: e.displayText, kind, agentName, agentColor, targetName, targetColor, actor, source };
      });
  }, [displayEvents, agentsMap, richLinesCap]);

  return (
    <>
      {/* ── Live Ticker ── */}
      <div className="ms-ticker">
        <div className="ms-ticker-track">
          {(tickerItems.length > 0 ? tickerItems : [
            { displayText: 'Waiting for live data...', ts: Date.now() },
          ]).slice(0, isMobile ? 8 : 15).map((item, i) => (
            <span key={i} className="ms-ticker-item">
              <span className="ms-ticker-dot" />
              <span className="ms-ticker-text">{(item.displayText || '').slice(0, 80)}</span>
              {item.ts && <span className="ms-ticker-time">{timeAgo(item.ts)}</span>}
            </span>
          ))}
          {!isMobile && tickerItems.slice(0, 15).map((item, i) => (
            <span key={`d-${i}`} className="ms-ticker-item" aria-hidden>
              <span className="ms-ticker-dot" />
              <span className="ms-ticker-text">{(item.displayText || '').slice(0, 80)}</span>
              {item.ts && <span className="ms-ticker-time">{timeAgo(item.ts)}</span>}
            </span>
          ))}
        </div>
      </div>

      {variant === 'full' && (
        <>
          {/* ── Stats Bar (hidden on mobile) ── */}
          {!isMobile && (
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
          )}

          {/* ── Live Stage (marsquad only) ── */}
          {roomId === 'marsquad' && (showStage || stageOptIn) && (
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

          {/* Mobile: provide a link to the office view instead of embedding it */}
          {roomId === 'marsquad' && !showStage && !stageOptIn && (
            <section className="ms-stage" id="stage">
              <div className="ms-stage-chrome" style={{ padding: 14 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Office view</div>
                    <div className="sub">Tap to load (may use more battery). Or open in a new tab.</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="lp-btn lp-btn--primary"
                      onClick={() => setStageOptIn(true)}
                    >
                      Load office
                      <span className="lp-btn-arrow">→</span>
                    </button>
                    <a className="lp-btn lp-btn--ghost" href="/live" target="_blank" rel="noreferrer">
                      Open /live
                    </a>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── Agent Cards ── */}
          {showAgents !== false && !isMobile && (
            <section className="ms-agents" id="agents">
              <h2 className="ms-section-title">Agents</h2>
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
          )}
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
            {richLines.length === 0 && (
              <div className="ms-terminal-empty">
                <span className="ms-terminal-cursor" />
                Connecting to live feed...
              </div>
            )}
            {richLines.map((rl, idx) => {
              const tag = tagEvent(rl.text);
              return (
                <div className={`ms-terminal-line ms-evt-${rl.kind}`} key={`${idx}-${rl.text.slice(0, 20)}`}>
                  {rl.agentName && <span className="ms-evt-agent" style={{ color: rl.agentColor || 'var(--muted)' }}>{rl.agentName}</span>}
                  {rl.targetName && <span className="ms-evt-arrow">{'>'}</span>}
                  {rl.targetName && <span className="ms-evt-target" style={{ color: rl.targetColor || 'var(--muted)' }}>{rl.targetName}</span>}
                  {tag && <span className="ms-tag" style={{ background: TAG_COLORS[tag] || '#666' }}>{tag}</span>}
                  {(rl.actor || rl.source) && (
                    <span className={`ms-prov ms-prov-${rl.actor || 'agent'}`} title={[
                      rl.actor ? `actor: ${rl.actor}` : '',
                      rl.source ? `source: ${rl.source}` : '',
                      // keep tooltip small but useful
                    ].filter(Boolean).join(' · ')}>
                      {rl.actor || 'agent'}{rl.source ? `:${rl.source}` : ''}
                    </span>
                  )}
                  <span className="ms-evt-text">{rl.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {variant === 'full' && (
        /* ── Recent Activity Grid ── */
        !isMobile && (
          <section className="ms-activity" id="activity">
            <h2 className="ms-section-title">Recent Activity</h2>
            <div className="ms-activity-grid">
              {(activityItems.length > 0 ? activityItems : Array.from({ length: 6 }, (_, i) => ({
                displayText: 'Awaiting agent output...',
                ts: Date.now() - i * 60_000,
              }))).map((item, i) => {
                const agentData = resolveAgent(item);
                const actor = inferActor(item);
                const source = inferSource(item);
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
                      {(() => { const t = tagEvent(item.displayText || ''); return t ? <span className="ms-tag" style={{ background: TAG_COLORS[t] || '#666' }}>{t}</span> : null; })()}
                      <span className={`ms-prov ms-prov-${actor}`} title={`actor: ${actor} · source: ${source}`}>
                        {actor}:{source}
                      </span>
                      {item.ts && <span className="ms-activity-time">{timeAgo(item.ts)}</span>}
                    </div>
                    <p className="ms-activity-text">{(item.displayText || '').slice(0, 140)}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )
      )}
    </>
  );
}
