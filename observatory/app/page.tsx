import BeautyIntakeForm from '../components/BeautyIntakeForm';

/* ── Agent SVG Icons ── */
function IconDilo({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Command diamond — orchestrator, central authority */}
      <rect x="24" y="4" width="20" height="20" rx="2" transform="rotate(45 24 4)" stroke={color} strokeWidth="2" fill={`${color}15`} />
      <rect x="24" y="12" width="12" height="12" rx="1" transform="rotate(45 24 12)" stroke={color} strokeWidth="1.5" fill={`${color}25`} />
      <circle cx="24" cy="24" r="3" fill={color} />
      {/* Radiating lines — delegation */}
      <line x1="24" y1="4" x2="24" y2="10" stroke={color} strokeWidth="1.5" opacity=".5" />
      <line x1="24" y1="38" x2="24" y2="44" stroke={color} strokeWidth="1.5" opacity=".5" />
      <line x1="4" y1="24" x2="10" y2="24" stroke={color} strokeWidth="1.5" opacity=".5" />
      <line x1="38" y1="24" x2="44" y2="24" stroke={color} strokeWidth="1.5" opacity=".5" />
    </svg>
  );
}

function IconPhantom({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Terminal bracket — ops/deployment */}
      <path d="M10 8 L4 24 L10 40" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M38 8 L44 24 L38 40" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Lightning bolt — execution speed */}
      <path d="M26 12 L20 24 L28 24 L22 36" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={`${color}20`} />
    </svg>
  );
}

function IconNyx({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Eye — surveillance, intelligence */}
      <ellipse cx="24" cy="24" rx="18" ry="11" stroke={color} strokeWidth="2" fill={`${color}08`} />
      <circle cx="24" cy="24" r="7" stroke={color} strokeWidth="1.5" fill={`${color}15`} />
      <circle cx="24" cy="24" r="3" fill={color} />
      {/* Signal arcs */}
      <path d="M6 10 Q4 24 6 38" stroke={color} strokeWidth="1" opacity=".3" fill="none" />
      <path d="M42 10 Q44 24 42 38" stroke={color} strokeWidth="1" opacity=".3" fill="none" />
      {/* Highlight */}
      <circle cx="22" cy="22" r="1.5" fill="white" opacity=".6" />
    </svg>
  );
}

function IconCipher({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shield — security */}
      <path d="M24 4 L40 12 L40 28 Q40 38 24 44 Q8 38 8 28 L8 12 Z" stroke={color} strokeWidth="2" fill={`${color}10`} />
      {/* Lock */}
      <rect x="18" y="22" width="12" height="10" rx="2" stroke={color} strokeWidth="1.5" fill={`${color}20`} />
      <path d="M20 22 V18 Q20 14 24 14 Q28 14 28 18 V22" stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="28" r="1.5" fill={color} />
    </svg>
  );
}

function IconPulse({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Heartbeat/signal line — analytics pulse */}
      <polyline points="2,24 10,24 14,10 20,38 26,16 30,30 34,20 38,24 46,24" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Data circles */}
      <circle cx="14" cy="10" r="2.5" fill={color} opacity=".4" />
      <circle cx="20" cy="38" r="2.5" fill={color} opacity=".4" />
      <circle cx="26" cy="16" r="2.5" fill={color} opacity=".4" />
      <circle cx="34" cy="20" r="2" fill={color} opacity=".3" />
    </svg>
  );
}

function IconWraith({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Crosshair — targeting, QA, red team */}
      <circle cx="24" cy="24" r="16" stroke={color} strokeWidth="1.5" fill={`${color}06`} />
      <circle cx="24" cy="24" r="9" stroke={color} strokeWidth="1.5" fill={`${color}10`} strokeDasharray="4 3" />
      <circle cx="24" cy="24" r="2.5" fill={color} />
      {/* Crosshair lines */}
      <line x1="24" y1="4" x2="24" y2="14" stroke={color} strokeWidth="1.5" />
      <line x1="24" y1="34" x2="24" y2="44" stroke={color} strokeWidth="1.5" />
      <line x1="4" y1="24" x2="14" y2="24" stroke={color} strokeWidth="1.5" />
      <line x1="34" y1="24" x2="44" y2="24" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function IconSpecter({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Quill/pen nib — writing, comms */}
      <path d="M34 6 L14 34 L12 40 L18 38 L38 10 Z" stroke={color} strokeWidth="2" fill={`${color}12`} strokeLinejoin="round" />
      <path d="M30 10 L38 14" stroke={color} strokeWidth="1.5" />
      {/* Writing lines */}
      <line x1="8" y1="42" x2="24" y2="42" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".4" />
      <line x1="10" y1="46" x2="20" y2="46" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".25" />
      {/* Ink dot */}
      <circle cx="13" cy="37" r="2" fill={color} opacity=".5" />
    </svg>
  );
}

const AGENT_ICONS: Record<string, (props: { color: string }) => React.ReactElement> = {
  Dilo: IconDilo,
  Phantom: IconPhantom,
  Nyx: IconNyx,
  Cipher: IconCipher,
  Pulse: IconPulse,
  Wraith: IconWraith,
  Specter: IconSpecter,
};

const AGENTS = [
  { name: 'Dilo', role: 'Orchestrator', color: '#3b82f6', desc: 'Leads the squad. Screens tasks, delegates work, holds the line.' },
  { name: 'Phantom', role: 'Operations', color: '#f43f5e', desc: 'Deploys, configures, and keeps infrastructure alive.' },
  { name: 'Nyx', role: 'Intelligence', color: '#a855f7', desc: 'Monitors signals, scrapes data, surfaces what matters.' },
  { name: 'Cipher', role: 'Security & Data', color: '#06b6d4', desc: 'Analyses datasets, audits systems, locks things down.' },
  { name: 'Pulse', role: 'Analytics', color: '#10b981', desc: 'Crunches numbers, builds dashboards, tracks performance.' },
  { name: 'Wraith', role: 'QA & Red Team', color: '#6366f1', desc: 'Breaks things before users do. Tests, probes, validates.' },
  { name: 'Specter', role: 'Content & Comms', color: '#f59e0b', desc: 'Writes copy, drafts reports, handles outbound.' },
];

const SINGLE_PLAN = {
  name: 'One-time setup',
  price: '$99.99',
  interval: 'one-time',
  desc: 'Private WhatsApp assistant setup. One number. One thread. Always on.',
  features: [
    'Reminders + follow-ups that actually stick',
    'Turn messages into tasks and weekly plans',
    'Daily focus in 2 minutes',
    'Optional calendar/email connect later',
  ],
};

const WEEK1_WINS = [
  { icon: '🧾', title: 'Never miss bills / appointments / birthdays', desc: 'Text it once. Dilo remembers it, pings you, and follows up.' },
  { icon: '✅', title: 'Turn texts into tasks + follow-ups', desc: 'Forward messages and get a clean to-do list with deadlines and nudges.' },
  { icon: '🗓️', title: 'Plan your week + daily focus in 2 minutes', desc: 'A quick check-in turns chaos into a simple plan and next actions.' },
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
          <a href="#wins" className="lp-nav-link">week 1 wins</a>
          <a href="#pricing" className="lp-nav-link">pricing</a>
          <a href="#deploy" className="lp-nav-cta">
            <span className="lp-pulse" />
            Set up my assistant
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp2-hero">
        <div className="lp2-hero-inner">
          <div className="lp2-hero-grid">
            <div className="lp2-hero-left">
              <div className="lp2-hero-badge">
                <span className="lp-pulse" />
                <span className="lp2-hero-badge-text">A 24/7 assistant you can text</span>
              </div>

              <h1 className="lp2-h1">
                <span className="lp2-h1-line">Meet Dilo</span>
                <span className="lp2-h1-line lp2-h1-line--accent">your private 24/7 assistant.</span>
              </h1>

              <p className="lp2-hero-sub">
                Reminders, planning, follow-ups, and turning messages into an organised life.
              </p>

              <div className="lp2-hero-actions">
                <a href="#deploy" className="lp-btn lp-btn--primary">Message Dilo for a demo <span className="lp-btn-arrow">→</span></a>
                <a href="#deploy" className="lp-btn lp-btn--ghost">Set up my assistant</a>
              </div>

              {/* Proof ticker */}
              <div className="lp2-proof">
                <div className="lp2-proof-track">
                  <span className="lp2-proof-item">
                    <span className="lp2-proof-dot" style={{ background: '#3b82f6' }} />
                    reminders that stick
                  </span>
                  <span className="lp2-proof-sep">·</span>
                  <span className="lp2-proof-item">
                    <span className="lp2-proof-dot" style={{ background: '#a855f7' }} />
                    inbox → tasks in one thread
                  </span>
                  <span className="lp2-proof-sep">·</span>
                  <span className="lp2-proof-item">
                    <span className="lp2-proof-dot" style={{ background: '#f59e0b' }} />
                    follow-ups handled
                  </span>
                  <span className="lp2-proof-sep">·</span>
                  <span className="lp2-proof-item">
                    <span className="lp2-proof-dot" style={{ background: '#06b6d4' }} />
                    weekly planning in minutes
                  </span>
                  <span className="lp2-proof-sep">·</span>
                  <span className="lp2-proof-item">
                    <span className="lp2-proof-dot" style={{ background: '#f43f5e' }} />
                    calm, organised life
                  </span>
                  <span className="lp2-proof-sep">·</span>
                  <span className="lp2-proof-item">
                    <span className="lp2-proof-dot" style={{ background: '#3b82f6' }} />
                    reminders that stick
                  </span>
                  <span className="lp2-proof-sep">·</span>
                  <span className="lp2-proof-item">
                    <span className="lp2-proof-dot" style={{ background: '#a855f7' }} />
                    inbox → tasks in one thread
                  </span>
                  <span className="lp2-proof-sep">·</span>
                  <span className="lp2-proof-item">
                    <span className="lp2-proof-dot" style={{ background: '#f59e0b' }} />
                    follow-ups handled
                  </span>
                  <span className="lp2-proof-sep">·</span>
                  <span className="lp2-proof-item">
                    <span className="lp2-proof-dot" style={{ background: '#06b6d4' }} />
                    weekly planning in minutes
                  </span>
                  <span className="lp2-proof-sep">·</span>
                  <span className="lp2-proof-item">
                    <span className="lp2-proof-dot" style={{ background: '#f43f5e' }} />
                    calm, organised life
                  </span>
                </div>
              </div>
            </div>

            <div className="lp2-hero-right" aria-hidden="true">
              <div className="lp2-hero-image" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Week 1 Wins ── */}
      <section id="wins" className="lp2-services">
        <div className="lp2-services-inner">
          <div className="lp2-section-label">Week 1 wins</div>
          <h2 className="lp2-h2">The first week feels like cheating.</h2>
          <div className="lp2-services-grid">
            {WEEK1_WINS.map((s, i) => (
              <div key={i} className="lp2-service-card" style={{ '--svc-i': i } as React.CSSProperties}>
                <span className="lp2-service-icon">{s.icon}</span>
                <h3 className="lp2-service-title">{s.title}</h3>
                <p className="lp2-service-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="lp2-pricing">
        <div className="lp2-pricing-inner">
          <div className="lp2-section-label">Pricing</div>
          <h2 className="lp2-h2">One simple plan</h2>
          <div className="lp2-pricing-grid">
            <div className="lp2-tier-card lp2-tier-card--accent" style={{ '--tier-i': 0 } as React.CSSProperties}>
              <h3 className="lp2-tier-name">{SINGLE_PLAN.name}</h3>
              <div className="lp2-tier-price">
                <span className="lp2-tier-amount">{SINGLE_PLAN.price}</span>
                <span className="lp2-tier-interval">{SINGLE_PLAN.interval}</span>
              </div>
              <p className="lp2-tier-desc">{SINGLE_PLAN.desc}</p>
              <ul className="lp2-tier-features">
                {SINGLE_PLAN.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <a href="#deploy" className="lp-btn lp-btn--primary lp2-tier-btn">
                Get started
                <span className="lp-btn-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Intake (lead capture) ── */}
      <section id="deploy" className="lp2-deploy">
        <div className="lp2-deploy-inner">
          <div className="lp2-deploy-header">
            <div className="lp2-section-label">Setup</div>
            <h2 className="lp2-h2">Set up Dilo in your WhatsApp.</h2>
            <p className="lp2-deploy-sub">
              Tell us what you want help with. We&apos;ll reply with a demo thread and setup steps.
            </p>
          </div>
          <div className="lp2-deploy-form-wrap">
            <BeautyIntakeForm />
          </div>
        </div>
      </section>

      {/* ── How It Works (for nerds) ── */}
      <section id="observation" className="lp2-observation">
        <div className="lp2-observation-inner">
          <div className="lp2-section-label">How it works (for nerds)</div>
          <h2 className="lp2-h2">Optional proof: live office view</h2>
          <p className="lp2-deploy-sub">
            You don&apos;t need to care about this. If you&apos;re curious, this is the live environment where tasks and movement get emitted.
          </p>

          <div className="ms-stage">
            <div className="ms-stage-chrome">
              <div className="ms-terminal-bar">
                <div className="ms-terminal-dots"><span /><span /><span /></div>
                <span className="ms-terminal-title">marsquad — office</span>
                <div className="ms-terminal-live"><span className="lp-pulse lp-pulse--red" /><span>LIVE</span></div>
              </div>
              <div className="ms-stage-frame lp2-observation-frame">
                <iframe title="Marsquad Live Office" src="/live" loading="lazy" />
              </div>
            </div>
          </div>

          <div className="lp2-live-actions">
            <a className="lp-btn lp-btn--ghost" href="/live" target="_blank" rel="noreferrer">
              Open full live view <span className="lp-btn-arrow">→</span>
            </a>
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
            private assistant, working live
          </p>
          <div className="lp2-footer-links">
            <a href="#wins">Week 1 wins</a>
            <a href="#pricing">Pricing</a>
            <a href="/live" target="_blank" rel="noreferrer">Live</a>
          </div>
          <p className="lp2-footer-copy">
            © 2026 marsquad. All systems operational.
          </p>
        </div>
      </footer>
    </main>
  );
}
