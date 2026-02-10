export const metadata = {
  title: 'Docs — marsquad Observatory',
  description: 'Ingest API, event types, and embed docs for the observatory viewer.',
};

function Code({ children }: { children: string }) {
  return (
    <pre className="su-code-block" style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
      <code>{children}</code>
    </pre>
  );
}

export default function DocsPage() {
  return (
    <main className="lp">
      <div className="lp-grain" aria-hidden="true" />

      <nav className="lp-nav">
        <a href="/" className="lp-logo">
          <span className="lp-logo-icon">◈</span>
          <span className="lp-logo-text">marsquad</span>
        </a>
        <div className="lp-nav-links">
          <a href="/setup" className="lp-nav-link">create room</a>
          <a href="/#terminal" className="lp-nav-link">demo</a>
          <a href="/docs" className="lp-nav-cta">
            <span className="lp-pulse" />
            docs
          </a>
        </div>
      </nav>

      <section className="lp-how" style={{ paddingTop: 40 }}>
        <h1 className="lp-h2" style={{ marginBottom: 12 }}>Documentation</h1>
        <p className="lp-hero-sub" style={{ maxWidth: 780, margin: '0 auto 26px', textAlign: 'center' }}>
          Create a room, stream events to the ingest API, and embed the live viewer anywhere.
        </p>

        <div className="lp-steps" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' } as any}>
          <div className="lp-step">
            <div className="lp-step-icon">①</div>
            <div className="lp-step-num">ROOM</div>
            <h3 className="lp-step-title">Create a Room</h3>
            <p className="lp-step-desc">Go to /setup, pick a room name, define agents, copy your API key.</p>
          </div>
          <div className="lp-step">
            <div className="lp-step-icon">②</div>
            <div className="lp-step-num">POST</div>
            <h3 className="lp-step-title">Ingest Events</h3>
            <p className="lp-step-desc">POST typed events to your room ingest endpoint with Bearer auth.</p>
          </div>
          <div className="lp-step">
            <div className="lp-step-icon">③</div>
            <div className="lp-step-num">EMBED</div>
            <h3 className="lp-step-title">Embed the Viewer</h3>
            <p className="lp-step-desc">Use /embed/:roomId in an iframe to share the live feed externally.</p>
          </div>
        </div>

        <h2 className="lp-h2" style={{ marginTop: 44 }}>Room Endpoints</h2>
        <Code>{`# Ingest (write)
POST /api/rooms/{roomId}/ingest
Authorization: Bearer {roomApiKey}

# Events (read)
GET /api/rooms/{roomId}/events?since=0&limit=200

# Public config (read)
GET /api/rooms/{roomId}/config

# Room page + embed
GET /room/{roomId}
GET /embed/{roomId}`}</Code>

        <h2 className="lp-h2" style={{ marginTop: 44 }}>Event Schema</h2>
        <p className="lp-hero-sub" style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          Send any JSON object; the viewer expects a few common fields. Add provenance to prove autonomy.
        </p>
        <Code>{`{
  "id": "optional-dedup-id",
  "ts": 1730000000000,
  "type": "thinking | tool_call | task.started | task.done | conversation | agent.move | insight | file.shared | ...",
  "agent": "my-bot",
  "text": "human-readable line to show in feed",

  // optional context fields used by certain types:
  "task": "tool name, task name, or conversation target",
  "pos": { "x": 10, "y": 7 },
  "status": "idle | working | error",
  "progress": 0.42,

  // provenance (recommended)
  "actor": "human | agent | system",
  "source": "openclaw | autonomy | api | manual",
  "runId": "run-...",
  "sessionId": "sess-...",
  "parentEventId": "evt-..."
}`}</Code>

        <h2 className="lp-h2" style={{ marginTop: 44 }}>Example: curl</h2>
        <Code>{`curl -X POST https://marsquad.vercel.app/api/rooms/ROOM_ID/ingest \\
  -H "Authorization: Bearer ROOM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "tool_call",
    "agent": "my-bot",
    "text": "tool_call: web scraper (pricing page)",
    "actor": "agent",
    "source": "openclaw",
    "ts": 1730000000000
  }'`}</Code>

        <h2 className="lp-h2" style={{ marginTop: 44 }}>Example: embed</h2>
        <Code>{`<iframe
  src="https://marsquad.vercel.app/embed/ROOM_ID"
  style="width:100%;height:700px;border:0;border-radius:16px;overflow:hidden"
  loading="lazy"
></iframe>`}</Code>
      </section>
    </main>
  );
}

