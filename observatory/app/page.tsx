import RoomFeed from '../components/RoomFeed';
import BeautyIntakeForm from '../components/BeautyIntakeForm';
import LastPacks from '../components/LastPacks';
import type { AgentConfig } from '../lib/types';

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

const TIERS = [
  {
    name: 'Starter',
    price: '$2,000',
    interval: '/mo',
    desc: 'Weekly intel pack. Enough to keep ads fresh without spinning your wheels.',
    features: ['Weekly pack', 'Competitor ad board', '30 angles/hooks', '10 UGC scripts', '5 landing/copy tests', '1-page plan'],
    accent: false,
  },
  {
    name: 'Growth',
    price: '$3,500',
    interval: '/mo',
    desc: 'Weekly pack plus a midweek refresh. Delivered on WhatsApp so you actually use it.',
    features: ['Everything in Starter', 'Midweek refresh', 'WhatsApp delivery', 'Priority turnaround', 'Creative angle backlog'],
    accent: true,
  },
  {
    name: 'Scale',
    price: '$5,000',
    interval: '/mo',
    desc: 'More volume, multiple product lines, tighter iteration loops.',
    features: ['Everything in Growth', 'More volume', 'Multiple lines/brands', 'Custom reporting', 'Team workflows'],
    accent: false,
  },
];

const SAMPLE_PACK = {
  name: 'Single sample pack',
  price: '$99',
  desc: 'One-time sample to prove the quality before you choose a retainer.',
};

const BEAUTY_DELIVERABLES = [
  { icon: '🧾', title: 'Competitor ad board (weekly)', desc: 'Snapshot of what top competitors are running: angles, formats, creators, and offers.' },
  { icon: '🪝', title: '30 angles/hooks (weekly)', desc: 'Ready-to-test hooks and frames mapped to your category and price point.' },
  { icon: '🎥', title: '10 UGC scripts (weekly)', desc: 'Creator-style scripts with beats, b‑roll notes, and CTA variants.' },
  { icon: '🧪', title: '5 landing/copy tests (weekly)', desc: 'Specific tests to run: headline, offer, proof, FAQ, and layout variants.' },
  { icon: '🗺️', title: '1‑page “what to run next” plan', desc: 'A single page that tells you exactly what to run next and why.' },
];

const MARSQUAD_AGENTS: AgentConfig[] = [
  { id: 'dilo', name: 'Dilo', role: 'Lead', desc: 'Orchestrator. Turns your brief into weekly packs.', color: '#3b82f6', avatar: '🤖' },
  { id: 'phantom', name: 'Phantom', role: 'Ops', desc: 'Packs, formatting, delivery.', color: '#f43f5e', avatar: '👻' },
  { id: 'nyx', name: 'Nyx', role: 'Intel', desc: 'Competitor/creator scanning.', color: '#a855f7', avatar: '🔮' },
  { id: 'cipher', name: 'Cipher', role: 'Data', desc: 'Validation and integrity.', color: '#06b6d4', avatar: '🔐' },
  { id: 'pulse', name: 'Pulse', role: 'Trends', desc: 'Pattern detection, angle scoring.', color: '#10b981', avatar: '📡' },
  { id: 'wraith', name: 'Wraith', role: 'QA', desc: 'Red-team the claims.', color: '#6366f1', avatar: '👁' },
  { id: 'specter', name: 'Specter', role: 'Copy', desc: 'Scripts and landing variants.', color: '#f59e0b', avatar: '✍️' },
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
          <a href="#deliverables" className="lp-nav-link">deliverables</a>
          <a href="#packs" className="lp-nav-link">packs</a>
          <a href="#pricing" className="lp-nav-link">pricing</a>
          <a href="#deploy" className="lp-nav-cta">
            <span className="lp-pulse" />
            Get a sample pack
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp2-hero">
        <div className="lp2-hero-inner">
          <div className="lp2-hero-badge">
            <span className="lp-pulse" />
            <span className="lp2-hero-badge-text">WEEKLY PACKS — BEAUTY AD INTEL</span>
          </div>

          <h1 className="lp2-h1">
            <span className="lp2-h1-line">Weekly Ad Intel</span>
            <span className="lp2-h1-line lp2-h1-line--accent">for Beauty Brands</span>
          </h1>

          <p className="lp2-hero-sub">
            We track competitor ads + creator trends and deliver scripts, angles, and landing tests so you ship better ads every week.
          </p>

          <div className="lp2-hero-actions">
            <a href="#deploy" className="lp-btn lp-btn--primary">Get a sample pack <span className="lp-btn-arrow">→</span></a>
            <a href="#deploy" className="lp-btn lp-btn--ghost">Book a 15‑min fit call</a>
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

      {/* ── Deliverables ── */}
      <section id="deliverables" className="lp2-services">
        <div className="lp2-services-inner">
          <div className="lp2-section-label">Deliverables</div>
          <h2 className="lp2-h2">Beauty‑specific packs. Every week.</h2>
          <div className="lp2-services-grid">
            {BEAUTY_DELIVERABLES.map((s, i) => (
              <div key={i} className="lp2-service-card" style={{ '--svc-i': i } as React.CSSProperties}>
                <span className="lp2-service-icon">{s.icon}</span>
                <h3 className="lp2-service-title">{s.title}</h3>
                <p className="lp2-service-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent Packs (default) ── */}
      <section id="packs" className="lp2-live-section">
        <LastPacks />
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
                  <div className="lp2-agent-avatar">
                    {AGENT_ICONS[a.name]?.({ color: a.color })}
                  </div>
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
          <h2 className="lp2-h2">Monthly retainers (built for brands)</h2>
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
                  {t.accent ? 'Get Growth' : 'Choose'}
                  <span className="lp-btn-arrow">→</span>
                </a>
              </div>
            ))}
          </div>
          <div className="lp2-pricing-note">
            <div className="lp2-section-label">Try it first</div>
            <div className="lp2-pricing-note-row">
              <div>
                <div className="lp2-tier-name">{SAMPLE_PACK.name}</div>
                <div className="lp2-tier-desc">{SAMPLE_PACK.desc}</div>
              </div>
              <div className="lp2-tier-price" style={{ justifyContent: 'flex-end' }}>
                <span className="lp2-tier-amount">{SAMPLE_PACK.price}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Intake (lead capture) ── */}
      <section id="deploy" className="lp2-deploy">
        <div className="lp2-deploy-inner">
          <div className="lp2-deploy-header">
            <div className="lp2-section-label">Deploy</div>
            <h2 className="lp2-h2">Send your intake. Get a sample pack.</h2>
            <p className="lp2-deploy-sub">
              Brand URL + goals is enough. We&apos;ll send a sample pack, then you can decide on a monthly retainer.
            </p>
          </div>
          <div className="lp2-deploy-form-wrap">
            <BeautyIntakeForm />
          </div>
        </div>
      </section>

      {/* Optional: live office for credibility (hidden behind explicit section, not default) */}
      <section id="office" className="lp2-live-section">
        <div className="lp2-section-label">Live</div>
        <h2 className="lp2-h2">Want to watch the system run?</h2>
        <p className="lp2-deploy-sub">This is heavy on mobile. Open in a new tab if it stutters.</p>
        <div className="lp2-live-wrap">
          <div className="lp2-live-actions">
            <a className="lp-btn lp-btn--primary" href="/live" target="_blank" rel="noreferrer">
              Open live office <span className="lp-btn-arrow">→</span>
            </a>
          </div>
          <div style={{ marginTop: 18 }}>
            <RoomFeed roomId="marsquad" agents={MARSQUAD_AGENTS} roomName="Marsquad" variant="full" showAgents={false} />
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
            <a href="#deliverables">Deliverables</a>
            <a href="#packs">Packs</a>
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
