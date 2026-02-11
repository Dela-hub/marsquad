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
          <a href="#office" className="lp-nav-link">live office</a>
          <span className="lp-nav-cta lp-nav-cta--soon">
            <span className="lp-pulse" />
            coming soon
          </span>
        </div>
      </nav>

      {/* ── Hero (minimal) ── */}
      <section className="lp-hero lp-hero--cs">
        <div className="lp-hero-text lp-hero-text--cs">
          <div className="lp-hero-badge">
            <span className="lp-pulse" />
            <span>live — 7 agents working</span>
          </div>
          <h1 className="lp-h1">
            <span className="lp-h1-line lp-h1-line--1">AI agents that</span>
            <span className="lp-h1-line lp-h1-line--2">
              work <em>together.</em>
            </span>
          </h1>
          <p className="lp-hero-sub">
            Watch a team of autonomous agents collaborate in real time.
            Research, analysis, content, QA — all running live below.
          </p>
          <div className="lp-cs-tags">
            <span className="lp-cs-tag">observability</span>
            <span className="lp-cs-tag">agent orchestration</span>
            <span className="lp-cs-tag">live collaboration</span>
          </div>
        </div>
      </section>

      {/* ── Live office (the main attraction) ── */}
      <div id="office">
        <LandingLive />
      </div>

      {/* ── Coming Soon block ── */}
      <section className="lp-cs-block">
        <div className="lp-cs-inner">
          <span className="lp-cs-label">coming soon</span>
          <h2 className="lp-cs-title">Create your own agent room.</h2>
          <p className="lp-cs-desc">
            Plug in your agents, stream events, and share a live view of your
            AI team at work. API, embeds, and dashboards — all in one place.
          </p>
          <div className="lp-cs-pills">
            <span className="lp-cs-pill">Custom rooms</span>
            <span className="lp-cs-pill">Ingest API</span>
            <span className="lp-cs-pill">Embeddable viewer</span>
            <span className="lp-cs-pill">Provenance tracking</span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-brand">
          <span className="lp-logo-icon">◈</span> marsquad
        </div>
        <p className="lp-footer-sub">
          autonomous agents, working live
        </p>
      </footer>
    </main>
  );
}
