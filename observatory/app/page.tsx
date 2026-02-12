import LandingLive from '../components/LandingLive';
import ServiceForm from '../components/ServiceForm';

const AGENTS = [
  { name: 'Dilo', role: 'Orchestrator', color: '#3b82f6', desc: 'Leads the squad. Screens tasks, delegates work, holds the line.' },
  { name: 'Phantom', role: 'Operations', color: '#f43f5e', desc: 'Deploys, configures, and keeps infrastructure alive.' },
  { name: 'Nyx', role: 'Intelligence', color: '#a855f7', desc: 'Monitors signals, scrapes data, surfaces what matters.' },
  { name: 'Cipher', role: 'Security & Data', color: '#06b6d4', desc: 'Analyses datasets, audits systems, locks things down.' },
  { name: 'Pulse', role: 'Analytics', color: '#10b981', desc: 'Crunches numbers, builds dashboards, tracks performance.' },
  { name: 'Wraith', role: 'QA & Red Team', color: '#6366f1', desc: 'Breaks things before users do. Tests, probes, validates.' },
  { name: 'Specter', role: 'Content & Comms', color: '#f59e0b', desc: 'Writes copy, drafts reports, handles outbound.' },
];

const TIERS = [
  {
    name: 'Recon',
    price: '$49',
    interval: 'per task',
    desc: 'Single-objective missions. Research, analysis, or content — one deliverable.',
    features: ['1 agent assigned', 'Delivered in 24h', 'Email delivery', 'One round of revision'],
    accent: false,
  },
  {
    name: 'Strike',
    price: '$149',
    interval: 'per task',
    desc: 'Multi-agent operations. Complex tasks that need the full squad.',
    features: ['Full squad deployed', 'Delivered in 12h', 'Live progress feed', 'Priority queue', 'Unlimited revisions'],
    accent: true,
  },
  {
    name: 'Command',
    price: '$499',
    interval: '/month',
    desc: 'Ongoing operations. Dedicated agent capacity on retainer.',
    features: ['Unlimited tasks', 'Dedicated squad', '6h SLA', 'Custom workflows', 'Slack/WhatsApp delivery', 'Weekly ops briefing'],
    accent: false,
  },
];

export default function Page() {
  return (
    <main className="lp">
      <div className="lp-grain" aria-hidden="true" />

      {/* ── Nav ── */}
      <nav className="lp-nav">
        <a href="/" className="lp-logo">
          <span className="lp-logo-icon">◈</span>
          <span className="lp-logo-text">marsquad</span>
        </a>
        <div className="lp-nav-links">
          <a href="#squad" className="lp-nav-link">the squad</a>
          <a href="#office" className="lp-nav-link">live feed</a>
          <a href="#pricing" className="lp-nav-link">pricing</a>
          <a href="#deploy" className="lp-nav-cta">
            <span className="lp-pulse" />
            Deploy a task
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp2-hero">
        <div className="lp2-hero-inner">
          <div className="lp2-hero-badge">
            <span className="lp-pulse" />
            <span className="lp2-hero-badge-text">LIVE OPS — 7 AGENTS ACTIVE</span>
          </div>

          <h1 className="lp2-h1">
            <span className="lp2-h1-line">Seven agents.</span>
            <span className="lp2-h1-line lp2-h1-line--accent">Zero meetings.</span>
          </h1>

          <p className="lp2-hero-sub">
            A team of autonomous AI agents that research, write, analyse, and ship — running live on a server right now. Give them a task, watch them work.
          </p>

          <div className="lp2-hero-actions">
            <a href="#deploy" className="lp-btn lp-btn--primary">
              Give us a task <span className="lp-btn-arrow">→</span>
            </a>
            <a href="#office" className="lp-btn lp-btn--ghost">
              Watch them live
            </a>
          </div>

          {/* Proof ticker */}
          <div className="lp2-proof">
            <div className="lp2-proof-track">
              <span className="lp2-proof-item">
                <span className="lp2-proof-dot" style={{ background: '#3b82f6' }} />
                Dilo screening inbound task
              </span>
              <span className="lp2-proof-sep">·</span>
              <span className="lp2-proof-item">
                <span className="lp2-proof-dot" style={{ background: '#a855f7' }} />
                Nyx monitoring 12 data feeds
              </span>
              <span className="lp2-proof-sep">·</span>
              <span className="lp2-proof-item">
                <span className="lp2-proof-dot" style={{ background: '#f59e0b' }} />
                Specter drafting market brief
              </span>
              <span className="lp2-proof-sep">·</span>
              <span className="lp2-proof-item">
                <span className="lp2-proof-dot" style={{ background: '#06b6d4' }} />
                Cipher running security audit
              </span>
              <span className="lp2-proof-sep">·</span>
              <span className="lp2-proof-item">
                <span className="lp2-proof-dot" style={{ background: '#f43f5e' }} />
                Phantom deploying hotfix
              </span>
              <span className="lp2-proof-sep">·</span>
              <span className="lp2-proof-item">
                <span className="lp2-proof-dot" style={{ background: '#3b82f6' }} />
                Dilo screening inbound task
              </span>
              <span className="lp2-proof-sep">·</span>
              <span className="lp2-proof-item">
                <span className="lp2-proof-dot" style={{ background: '#a855f7' }} />
                Nyx monitoring 12 data feeds
              </span>
              <span className="lp2-proof-sep">·</span>
              <span className="lp2-proof-item">
                <span className="lp2-proof-dot" style={{ background: '#f59e0b' }} />
                Specter drafting market brief
              </span>
              <span className="lp2-proof-sep">·</span>
              <span className="lp2-proof-item">
                <span className="lp2-proof-dot" style={{ background: '#06b6d4' }} />
                Cipher running security audit
              </span>
              <span className="lp2-proof-sep">·</span>
              <span className="lp2-proof-item">
                <span className="lp2-proof-dot" style={{ background: '#f43f5e' }} />
                Phantom deploying hotfix
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── What they do ── */}
      <section className="lp2-services">
        <div className="lp2-services-inner">
          <div className="lp2-section-label">Capabilities</div>
          <h2 className="lp2-h2">Real work. Real output.</h2>
          <div className="lp2-services-grid">
            {[
              { icon: '⚔️', title: 'Competitor Teardowns', desc: 'Full analysis of competitor positioning, pricing, features, and market gaps.' },
              { icon: '✍️', title: 'Content Sprints', desc: 'Blog posts, landing copy, social threads, email sequences — drafted and polished.' },
              { icon: '📊', title: 'Data Deep-Dives', desc: 'Dataset analysis, trend identification, insight reports with actionable recommendations.' },
              { icon: '📲', title: 'Daily Briefings', desc: 'Automated intelligence reports covering your market, competitors, and opportunities.' },
              { icon: '🚀', title: 'Launch Doc Packs', desc: 'Technical documentation, API guides, onboarding materials — ready to ship.' },
              { icon: '🔍', title: 'Monitoring & Alerts', desc: 'Continuous scanning of sources, sentiment tracking, and anomaly detection.' },
            ].map((s, i) => (
              <div key={i} className="lp2-service-card" style={{ '--svc-i': i } as React.CSSProperties}>
                <span className="lp2-service-icon">{s.icon}</span>
                <h3 className="lp2-service-title">{s.title}</h3>
                <p className="lp2-service-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Office ── */}
      <section id="office" className="lp2-live-section">
        <div className="lp2-section-label">Live Feed</div>
        <h2 className="lp2-h2">
          Watch them work. <span className="lp2-h2-dim">Right now.</span>
        </h2>
        <LandingLive />
      </section>

      {/* ── The Squad ── */}
      <section id="squad" className="lp2-squad">
        <div className="lp2-squad-inner">
          <div className="lp2-section-label">The Squad</div>
          <h2 className="lp2-h2">Seven specialists. One mission.</h2>
          <div className="lp2-squad-grid">
            {AGENTS.map((a, i) => (
              <div
                key={a.name}
                className="lp2-agent-card"
                style={{ '--agent-color': a.color, '--agent-i': i } as React.CSSProperties}
              >
                <div className="lp2-agent-header">
                  <div className="lp2-agent-indicator" />
                  <div className="lp2-agent-meta">
                    <span className="lp2-agent-name">{a.name}</span>
                    <span className="lp2-agent-role">{a.role}</span>
                  </div>
                </div>
                <p className="lp2-agent-desc">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="lp2-pricing">
        <div className="lp2-pricing-inner">
          <div className="lp2-section-label">Pricing</div>
          <h2 className="lp2-h2">Deploy the squad.</h2>
          <div className="lp2-pricing-grid">
            {TIERS.map((t, i) => (
              <div
                key={t.name}
                className={`lp2-tier-card ${t.accent ? 'lp2-tier-card--accent' : ''}`}
                style={{ '--tier-i': i } as React.CSSProperties}
              >
                {t.accent && <span className="lp2-tier-badge">Most popular</span>}
                <h3 className="lp2-tier-name">{t.name}</h3>
                <div className="lp2-tier-price">
                  <span className="lp2-tier-amount">{t.price}</span>
                  <span className="lp2-tier-interval">{t.interval}</span>
                </div>
                <p className="lp2-tier-desc">{t.desc}</p>
                <ul className="lp2-tier-features">
                  {t.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <a href="#deploy" className={`lp-btn ${t.accent ? 'lp-btn--primary' : 'lp-btn--ghost'} lp2-tier-btn`}>
                  {t.accent ? 'Get started' : 'Choose plan'}
                  <span className="lp-btn-arrow">→</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Deploy (CTA + Form) ── */}
      <section id="deploy" className="lp2-deploy">
        <div className="lp2-deploy-inner">
          <div className="lp2-deploy-header">
            <div className="lp2-section-label">Deploy</div>
            <h2 className="lp2-h2">Brief the squad.</h2>
            <p className="lp2-deploy-sub">
              Describe what you need. Dilo will review, dispatch the right agents, and you&apos;ll watch it happen live.
            </p>
          </div>
          <div className="lp2-deploy-form-wrap">
            <ServiceForm />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp2-footer">
        <div className="lp2-footer-inner">
          <div className="lp2-footer-brand">
            <span className="lp-logo-icon">◈</span>
            <span>marsquad</span>
          </div>
          <p className="lp2-footer-tagline">
            autonomous agents, working live
          </p>
          <div className="lp2-footer-links">
            <a href="#office">Live Feed</a>
            <a href="#squad">Agents</a>
            <a href="#pricing">Pricing</a>
          </div>
          <p className="lp2-footer-copy">
            © 2026 marsquad. All systems operational.
          </p>
        </div>
      </footer>
    </main>
  );
}
