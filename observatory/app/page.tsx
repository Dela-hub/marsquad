import AgentIllustration from '../components/AgentIllustration';
import LandingLive from '../components/LandingLive';

export default function Page() {
  return (
    <main className="lp">
      {/* Grain overlay */}
      <div className="lp-grain" aria-hidden="true" />

      {/* ── Nav ── */}
      <nav className="lp-nav">
        <a href="/" className="lp-logo">
          <span className="lp-logo-icon">◈</span>
          <span className="lp-logo-text">marsquad</span>
        </a>
        <div className="lp-nav-links">
          <a href="#terminal" className="lp-nav-link">live feed</a>
          <a href="/setup" className="lp-nav-link">create room</a>
          <a href="#integrate" className="lp-nav-link">integrate</a>
          <a href="#how" className="lp-nav-link">how it works</a>
          <a href="/setup" className="lp-nav-cta">
            <span className="lp-pulse" />
            get started
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-text">
          <div className="lp-hero-badge">
            <span className="lp-pulse" />
            <span>live agent observability</span>
          </div>
          <h1 className="lp-h1">
            <span className="lp-h1-line lp-h1-line--1">Watch your agents</span>
            <span className="lp-h1-line lp-h1-line--2">work <em>in real time.</em></span>
          </h1>
          <p className="lp-hero-sub">
            A live viewer + ingest API for agentic systems.
            Stream tool calls, handoffs, and status updates into a shareable room or embed.
          </p>
          {/* Proof loop — shows a trace flowing through the system */}
          <div className="lp-proof" aria-label="Example task flow">
            <div className="lp-proof-step lp-proof-step--1">
              <span className="lp-proof-tag lp-proof-tag--in">Event in</span>
              <span>&ldquo;tool_call: web scraper (pricing page)&rdquo;</span>
            </div>
            <div className="lp-proof-step lp-proof-step--2">
              <span className="lp-proof-tag lp-proof-tag--dilo">Ingest</span>
              <span>POST /api/rooms/:roomId/ingest</span>
            </div>
            <div className="lp-proof-step lp-proof-step--3">
              <span className="lp-proof-tag lp-proof-tag--nyx">Viewer</span>
              <span>Live feed updates with types, agents, and provenance</span>
            </div>
            <div className="lp-proof-step lp-proof-step--4">
              <span className="lp-proof-tag lp-proof-tag--done">Share</span>
              <span>/room/:roomId and /embed/:roomId</span>
            </div>
          </div>

          <div className="lp-hero-actions">
            <a href="/setup" className="lp-btn lp-btn--primary">
              Create your room
              <span className="lp-btn-arrow">→</span>
            </a>
            <a href="#terminal" className="lp-btn lp-btn--ghost">Watch the demo</a>
          </div>

          {/* Signal chips (what you can stream) */}
          <div className="lp-roster">
            {[
              { name: 'thinking', role: 'trace', color: '#6366f1' },
              { name: 'tool_call', role: 'receipt', color: '#06b6d4' },
              { name: 'task.started', role: 'lifecycle', color: '#10b981' },
              { name: 'task.done', role: 'lifecycle', color: '#22c55e' },
              { name: 'conversation', role: 'handoff', color: '#3b82f6' },
              { name: 'agent.move', role: 'motion', color: '#f43f5e' },
              { name: 'insight', role: 'signal', color: '#f59e0b' },
            ].map((a, i) => (
              <div
                key={a.name}
                className="lp-chip"
                style={{ '--chip-color': a.color, '--chip-i': i } as any}
              >
                <span className="lp-chip-dot" />
                <span className="lp-chip-name">{a.name}</span>
                <span className="lp-chip-role">{a.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero illustration */}
        <AgentIllustration />
      </section>

      {/* ── Live sections (client component) ── */}
      <LandingLive />

      {/* ── Integrate ── */}
      <section className="lp-how" id="integrate">
        <h2 className="lp-h2">Integrate</h2>
        <div className="lp-steps">
          {[
            {
              num: 'API',
              title: 'Ingest events',
              desc: 'Send typed events into your room with a single POST. Your UI updates live.',
              icon: '⇢',
            },
            {
              num: 'EMBED',
              title: 'Embed anywhere',
              desc: 'Drop /embed/:roomId into your docs, dashboard, or marketing site.',
              icon: '▣',
            },
            {
              num: 'TRACE',
              title: 'Provenance',
              desc: 'Mark events as human/agent/system and include source/session IDs.',
              icon: '✓',
            },
          ].map((s, i) => (
            <div
              key={s.num}
              className="lp-step"
              style={{ '--step-i': i } as any}
            >
              <div className="lp-step-icon">{s.icon}</div>
              <div className="lp-step-num">{s.num}</div>
              <h3 className="lp-step-title">{s.title}</h3>
              <p className="lp-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="su-code-block" style={{ marginTop: 18 }}>
          <pre><code>{`curl -X POST https://marsquad.vercel.app/api/rooms/ROOM_ID/ingest \\\\
  -H "Authorization: Bearer ROOM_API_KEY" \\\\
  -H "Content-Type: application/json" \\\\
  -d '{
    "type": "tool_call",
    "agent": "my-bot",
    "text": "tool_call: web scraper (pricing page)",
    "actor": "agent",
    "source": "openclaw",
    "ts": 1730000000000
  }'`}</code></pre>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-how" id="how">
        <h2 className="lp-h2">How it works</h2>
        <div className="lp-steps">
          {[
            {
              num: '01',
              title: 'Create a room',
              desc: 'Define your agents and get a roomId + API key in under 2 minutes.',
              icon: '⌘',
            },
            {
              num: '02',
              title: 'Stream events',
              desc: 'Your bots send typed events (thinking, tool calls, tasks, handoffs).',
              icon: '◇',
            },
            {
              num: '03',
              title: 'Watch and share',
              desc: 'Open your room page, or embed it anywhere. Everything stays visible.',
              icon: '◎',
            },
            {
              num: '04',
              title: 'Prove autonomy',
              desc: 'Separate human/agent/system events and attach source/session IDs for auditing.',
              icon: '↗',
            },
          ].map((s, i) => (
            <div
              key={s.num}
              className="lp-step"
              style={{ '--step-i': i } as any}
            >
              <div className="lp-step-icon">{s.icon}</div>
              <div className="lp-step-num">{s.num}</div>
              <h3 className="lp-step-title">{s.title}</h3>
              <p className="lp-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="ms-cta" id="submit">
        <div className="ms-cta-inner">
          <h2 className="ms-cta-title">Create your observatory.</h2>
          <p className="ms-cta-desc">
            Get a roomId + API key, stream events, and embed the live feed anywhere.
          </p>
          <div className="lp-hero-actions" style={{ justifyContent: 'center', marginTop: 10 }}>
            <a href="/setup" className="lp-btn lp-btn--primary">
              Create a room
              <span className="lp-btn-arrow">→</span>
            </a>
            <a href="#terminal" className="lp-btn lp-btn--ghost">Watch demo</a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-brand">
          <span className="lp-logo-icon">◈</span> marsquad
        </div>
        <p className="lp-footer-sub">
          observability for agentic systems
        </p>
      </footer>
    </main>
  );
}
