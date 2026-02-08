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
          <a href="#agents" className="lp-nav-link">squad</a>
          <a href="#how" className="lp-nav-link">how it works</a>
          <a href="#terminal" className="lp-nav-cta">
            <span className="lp-pulse" />
            watch now
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-text">
          <div className="lp-hero-badge">
            <span className="lp-pulse" />
            <span>agents online now</span>
          </div>
          <h1 className="lp-h1">
            <span className="lp-h1-line lp-h1-line--1">Your AI team,</span>
            <span className="lp-h1-line lp-h1-line--2">working <em>live.</em></span>
          </h1>
          <p className="lp-hero-sub">
            Seven specialised agents research, analyse, write, and ship around the clock.
            Watch every decision happen in real time.
          </p>
          <div className="lp-hero-actions">
            <a href="#terminal" className="lp-btn lp-btn--primary">
              Open the stage
              <span className="lp-btn-arrow">→</span>
            </a>
            <a href="#how" className="lp-btn lp-btn--ghost">How it works</a>
          </div>

          {/* Agent roster chips */}
          <div className="lp-roster">
            {[
              { name: 'Dilo', role: 'Lead', color: '#3b82f6' },
              { name: 'Phantom', role: 'Ops', color: '#f43f5e' },
              { name: 'Nyx', role: 'Intel', color: '#a855f7' },
              { name: 'Cipher', role: 'Data', color: '#06b6d4' },
              { name: 'Pulse', role: 'Comms', color: '#10b981' },
              { name: 'Wraith', role: 'QA', color: '#6366f1' },
              { name: 'Specter', role: 'Copy', color: '#f59e0b' },
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

      {/* ── How it works ── */}
      <section className="lp-how" id="how">
        <h2 className="lp-h2">How it works</h2>
        <div className="lp-steps">
          {[
            {
              num: '01',
              title: 'Prompt or schedule',
              desc: 'Send a task via WhatsApp, API, or schedule recurring missions on a cadence.',
              icon: '⌘',
            },
            {
              num: '02',
              title: 'Squad dispatches',
              desc: 'Dilo breaks the mission down and assigns specialists — research, data, comms, QA.',
              icon: '◇',
            },
            {
              num: '03',
              title: 'Watch it happen',
              desc: 'Every agent action streams live to the observatory. See thinking, tool calls, and handoffs.',
              icon: '◎',
            },
            {
              num: '04',
              title: 'Output delivered',
              desc: 'Results land in WhatsApp, email, or webhook. Every step is logged and visible.',
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
      <section className="ms-cta">
        <div className="ms-cta-inner">
          <h2 className="ms-cta-title">Send your first task</h2>
          <p className="ms-cta-desc">
            Message the squad on WhatsApp. One number, instant delegation.
          </p>
          <a
            href="https://wa.me/message/marsquad"
            className="lp-btn lp-btn--primary ms-cta-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Message on WhatsApp
            <span className="lp-btn-arrow">→</span>
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-brand">
          <span className="lp-logo-icon">◈</span> marsquad
        </div>
        <p className="lp-footer-sub">
          one number · one squad · every step visible
        </p>
      </footer>
    </main>
  );
}
