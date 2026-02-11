if (window.__officeAppLoaded) {
  console.warn("office-app already loaded");
} else {
  window.__officeAppLoaded = true;
/* ── Observatory · Dilo Office ── */
const __officeDisableStream = window.__officeDisableStream === true;

const feedEl = document.getElementById('feed');
const clockEl = document.getElementById('clock');
const statsEl = document.getElementById('stats');
const statusEl = document.getElementById('status');
const feedCountEl = document.getElementById('feedCount');
const agentLayerEl = document.getElementById('agentLayer');
const lineLayerEl = document.getElementById('lineLayer');
const particlesEl = document.getElementById('particles');
const statusbarAgentsEl = document.getElementById('statusbarAgents');
const missionTextEl = document.getElementById('missionText');
const modalEl = document.getElementById('agentModal');
const modalCardEl = document.getElementById('modalCard');
const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');

/* ── Agent definitions ── */
const AGENT_DEFS = {
  dilo:    { name: 'Dilo',    avatar: 'face-dilo',    role: 'Primary Agent',           accent: 'linear-gradient(135deg,#3b82f6,#6366f1)', glow: 'rgba(59,130,246,.4)', boss: true },
  phantom: { name: 'Phantom', avatar: 'face-phantom', role: 'Ops / Execution',         accent: 'linear-gradient(135deg,#f43f5e,#be123c)', glow: 'rgba(244,63,94,.4)' },
  nyx:     { name: 'Nyx',     avatar: 'face-nyx',     role: 'Monitoring / Watch',     accent: 'linear-gradient(135deg,#a855f7,#7c3aed)', glow: 'rgba(168,85,247,.4)' },
  cipher:  { name: 'Cipher',  avatar: 'face-cipher',  role: 'Security / Privacy',     accent: 'linear-gradient(135deg,#06b6d4,#0e7490)', glow: 'rgba(6,182,212,.4)' },
  pulse:   { name: 'Pulse',   avatar: 'face-pulse',   role: 'Data Analyst (Stocks, Trends)',     accent: 'linear-gradient(135deg,#10b981,#047857)', glow: 'rgba(16,185,129,.4)' },
  wraith:  { name: 'Wraith',  avatar: 'face-wraith',  role: 'QA / Red-team',          accent: 'linear-gradient(135deg,#6366f1,#4338ca)', glow: 'rgba(99,102,241,.4)' },
  specter: { name: 'Specter', avatar: 'face-specter', role: 'Comms / Drafts / Copy',  accent: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,.4)' },
  visitor: { name: 'Visitor', avatar: '👤', role: 'Observatory Visitor',
    accent: 'linear-gradient(135deg,#64748b,#475569)', glow: 'rgba(148,163,184,.4)' },
};

const FALLBACK_AVATARS = ['🔧', '⚙️', '🛠️', '🔨', '💻', '📝', '🎯', '🔍', '📊', '🚀'];
let fallbackIdx = 0;

/* ── Desk positions (computed dynamically in computeDeskPositions) ── */
let DESK_POSITIONS = [];

function computeDeskPositions() {
  const wrap = canvas.parentElement;
  if (!wrap) return;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;

  // Slot 0: Boss desk (Dilo) centered at top
  // Slots 1-3: Row 1 (3 worker desks)
  // Slots 4-6: Row 2 (3 worker desks)
  const isMobile = w < 500;
  const marginX = isMobile ? Math.max(30, w * 0.08) : Math.max(60, w * 0.06);
  const bossY = h * 0.14;
  const row1Y = h * 0.44;
  const row2Y = h * 0.72;
  const usableW = w - marginX * 2;

  DESK_POSITIONS = [];

  // Boss desk — center top
  DESK_POSITIONS.push({ x: w * 0.5, y: bossY, boss: true });

  // Worker rows: 3 + 3
  for (const rowY of [row1Y, row2Y]) {
    const count = 3;
    const cellW = usableW / count;
    for (let i = 0; i < count; i++) {
      DESK_POSITIONS.push({ x: marginX + cellW * i + cellW / 2, y: rowY });
    }
  }
}

/* ── State ── */
const agents = new Map(); // id -> { pos, status, task, def, energy, el, bubbleEl, msgs, tasks }
let signalCount = 0;
let tasksDone = 0;
let messageCount = 0;
let isPaused = false;

/* ── Agent mood / workload tracking ── */
const _workloadEvents = new Map(); // agentId -> [timestamp, timestamp, ...]
const WORKLOAD_WINDOW = 30000; // 30s rolling window
const MOOD_CLASSES = ['mood-calm', 'mood-warm', 'mood-hot', 'mood-glitch', 'mood-golden'];

function recordWorkload(id) {
  if (!_workloadEvents.has(id)) _workloadEvents.set(id, []);
  const events = _workloadEvents.get(id);
  events.push(Date.now());
  // Trim old events outside window
  const cutoff = Date.now() - WORKLOAD_WINDOW;
  while (events.length > 0 && events[0] < cutoff) events.shift();
}

function getWorkloadIntensity(id) {
  const events = _workloadEvents.get(id);
  if (!events) return 0;
  const cutoff = Date.now() - WORKLOAD_WINDOW;
  while (events.length > 0 && events[0] < cutoff) events.shift();
  return events.length;
}

function getAgentMood(id) {
  const a = agents.get(id);
  if (!a) return null;
  // Glitch takes priority (error state)
  if (a.status === 'error') return 'mood-glitch';
  // Golden aura (recently completed)
  if (a._goldenUntil && Date.now() < a._goldenUntil) return 'mood-golden';
  // Workload-based
  const intensity = getWorkloadIntensity(id);
  if (intensity >= 6) return 'mood-hot';
  if (intensity >= 3) return 'mood-warm';
  // Sleeping agents stay as-is (no mood class)
  if (a.el && a.el.classList.contains('sleeping')) return null;
  // Idle = calm
  if (a.status === 'idle' || a.status === 'waiting' || !a.status) return 'mood-calm';
  return null;
}

function applyMood(id) {
  const a = agents.get(id);
  if (!a || !a.el) return;
  const mood = getAgentMood(id);
  // Remove all mood classes, then add current
  for (const cls of MOOD_CLASSES) a.el.classList.remove(cls);
  if (mood) a.el.classList.add(mood);
}

/* ── Normalize agent IDs ── */
const agentAliases = new Map();
let aliasCounter = 0;
const ALIAS_NAMES = ['phantom', 'nyx', 'cipher', 'pulse', 'wraith', 'specter', 'echo', 'flux'];
function normalizeAgentId(raw) {
  if (!raw) return 'unknown';
  if (raw.length <= 16 && !raw.includes('-')) return raw;
  if (agentAliases.has(raw)) return agentAliases.get(raw);
  const alias = ALIAS_NAMES[aliasCounter % ALIAS_NAMES.length] + (aliasCounter >= ALIAS_NAMES.length ? `-${Math.floor(aliasCounter / ALIAS_NAMES.length)}` : '');
  aliasCounter++;
  agentAliases.set(raw, alias);
  return alias;
}

/* ── Get or create agent def ── */
function getAgentDef(id) {
  if (AGENT_DEFS[id]) return AGENT_DEFS[id];
  // Generate for unknown agents
  const avatar = FALLBACK_AVATARS[fallbackIdx % FALLBACK_AVATARS.length];
  fallbackIdx++;
  const hue = (fallbackIdx * 47) % 360;
  const def = {
    name: id.charAt(0).toUpperCase() + id.slice(1),
    avatar,
    role: 'Agent',
    accent: `linear-gradient(135deg,hsl(${hue},70%,55%),hsl(${(hue + 30) % 360},70%,45%))`,
    glow: `hsla(${hue},70%,55%,.4)`,
  };
  AGENT_DEFS[id] = def;
  return def;
}

/* ── Floating particles ── */
function spawnParticles() {
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 3 + 1;
    p.style.cssText = `left:${Math.random() * 100}%;bottom:${Math.random() * 20}%;width:${size}px;height:${size}px;opacity:${Math.random() * .3 + .1};animation-duration:${Math.random() * 20 + 10}s;animation-delay:${i * .5}s`;
    particlesEl.appendChild(p);
  }
}

/* ── Canvas: draw desks & decorations ── */
function resizeCanvas() {
  const wrap = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = wrap.clientWidth * dpr;
  canvas.height = wrap.clientHeight * dpr;
  canvas.style.width = wrap.clientWidth + 'px';
  canvas.style.height = wrap.clientHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  computeDeskPositions();
  drawOffice();
  repositionAgents();
}

/* ── Debounced canvas redraw ── */
let _redrawQueued = false;
function queueRedraw() {
  if (_redrawQueued) return;
  _redrawQueued = true;
  requestAnimationFrame(() => { _redrawQueued = false; drawOffice(); });
}

function drawOffice() {
  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;
  ctx.clearRect(0, 0, w, h);

  const _mobile = w < 500;

  // Windows along the top wall
  const winY = 20;
  ctx.fillStyle = 'rgba(99,102,241,.12)';
  ctx.strokeStyle = 'rgba(255,255,255,.06)';
  ctx.lineWidth = 1;
  const winW = _mobile ? 50 : 100;
  const windowPositions = _mobile ? [w * 0.3, w * 0.55, w * 0.8] : [w * 0.28, w * 0.42, w * 0.56, w * 0.70];
  windowPositions.forEach(wx => {
    ctx.beginPath();
    ctx.roundRect(wx - winW / 2, winY, winW, _mobile ? 40 : 65, 8);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(251,191,36,.15)';
    ctx.beginPath(); ctx.arc(wx - 8, winY + (_mobile ? 28 : 48), 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(wx + 8, winY + (_mobile ? 25 : 44), 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(99,102,241,.12)';
  });

  // Clock display (top right) — hide on very small screens
  if (!_mobile) {
    ctx.fillStyle = 'rgba(30,41,59,.6)';
    ctx.strokeStyle = 'rgba(71,85,105,.5)';
    ctx.beginPath();
    ctx.roundRect(w - 130, 25, 100, 36, 10);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.font = '14px "SF Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(nowStr(), w - 80, 48);
  }

  // Focus display (top left) — hide on mobile
  if (!_mobile) {
    ctx.fillStyle = 'rgba(30,41,59,.7)';
    ctx.strokeStyle = 'rgba(71,85,105,.5)';
    ctx.beginPath();
    ctx.roundRect(24, 22, 120, 70, 10);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font = '8px ui-sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("TODAY'S FOCUS", 36, 40);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px ui-sans-serif';
    ctx.fillText('Ship the office', 36, 56);
    ctx.fillText('visualization', 36, 70);
    ctx.fillStyle = '#10b981';
    [0, 1].forEach((i) => { ctx.beginPath(); ctx.arc(38 + i * 10, 82, 3, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#334155';
    ctx.beginPath(); ctx.arc(58, 82, 3, 0, Math.PI * 2); ctx.fill();
  }

  // Build desk → agent glow color map
  const deskGlowMap = new Map();
  let dIdx = 0;
  for (const [, a] of agents) {
    if (!a.hasDesk) continue;
    const isActive = a.status === 'working' || a.status === 'active';
    if (isActive) {
      // Extract base color from glow (e.g. "rgba(59,130,246,.4)" → use the rgb portion)
      const match = a.def.glow.match(/rgba?\(([^)]+)\)/);
      if (match) deskGlowMap.set(dIdx, match[1]);
    }
    dIdx++;
  }

  // Desks — only draw ones that have agents, plus the boss desk always
  DESK_POSITIONS.forEach((d, i) => {
    // Boss desk always drawn; worker desks only if an agent occupies them
    const occupied = i === 0 || i < countDeskAgents();
    const agentGlow = deskGlowMap.get(i) || null;
    drawDesk(d.x, d.y, occupied, d.boss, agentGlow);
  });

  // Meeting room (center-right, between desk rows)
  const mrx = _mobile ? w * 0.52 : w * 0.62;
  const mry = h * 0.35;
  const mrW = _mobile ? 140 : 260, mrH = _mobile ? 100 : 180;
  ctx.fillStyle = 'rgba(139,92,246,.06)';
  ctx.strokeStyle = 'rgba(139,92,246,.12)';
  ctx.beginPath();
  ctx.roundRect(mrx - 20, mry - 20, mrW, mrH, 14);
  ctx.fill(); ctx.stroke();
  // "STANDUP" label
  ctx.fillStyle = 'rgba(139,92,246,.25)';
  ctx.font = 'bold 8px ui-sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('STANDUP', mrx + mrW / 2 - 20, mry - 6);
  // Conference table (centered in room)
  ctx.fillStyle = 'rgba(71,85,105,.3)';
  ctx.strokeStyle = 'rgba(139,92,246,.15)';
  const tblW = _mobile ? 70 : 140, tblH = _mobile ? 45 : 85;
  const tblX = _mobile ? mrx + 20 : mrx + 40, tblY = _mobile ? mry + 15 : mry + 25;
  ctx.beginPath();
  ctx.roundRect(tblX, tblY, tblW, tblH, _mobile ? 8 : 12);
  ctx.fill(); ctx.stroke();
  // Chair dots (seats around table)
  ctx.fillStyle = 'rgba(139,92,246,.12)';
  const chairR = _mobile ? 4 : 7;
  const chairPositions = _mobile ? [
    [tblX + tblW / 2, tblY - 8],
    [tblX - 8, tblY + tblH / 2], [tblX + tblW + 8, tblY + tblH / 2],
    [tblX + tblW / 2, tblY + tblH + 8],
  ] : [
    [mrx + 110, mry + 5],
    [mrx + 55,  mry + 15],  [mrx + 165, mry + 15],
    [mrx + 15,  mry + 65],  [mrx + 205, mry + 65],
    [mrx + 55,  mry + 125], [mrx + 165, mry + 125],
  ];
  chairPositions.forEach(([cx, cy]) => {
    ctx.beginPath(); ctx.arc(cx, cy, chairR, 0, Math.PI * 2); ctx.fill();
  });

  // Server rack (bottom right) — hide on mobile
  if (!_mobile) {
    const rx = w - 40, ry = h - 160;
    ctx.fillStyle = 'rgba(30,41,59,.9)';
    ctx.strokeStyle = 'rgba(71,85,105,.5)';
    ctx.beginPath();
    ctx.roundRect(rx - 22, ry, 44, 130, 8);
    ctx.fill(); ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const ly = ry + 8 + i * 13;
      const colors = ['#10b981', '#06b6d4', '#f59e0b'];
      ctx.fillStyle = colors[i % 3];
      ctx.globalAlpha = Math.random() > .3 ? .8 : .3;
      ctx.beginPath(); ctx.arc(rx - 12, ly + 4, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(71,85,105,.3)';
      ctx.globalAlpha = 1;
      ctx.fillRect(rx - 6, ly + 2, 22, 2.5);
    }
  }

  // Smoke spot (bottom left — near the "exit")
  const exitW = _mobile ? 36 : 56, exitH = _mobile ? 40 : 60;
  ctx.fillStyle = 'rgba(30,41,59,.5)';
  ctx.strokeStyle = 'rgba(71,85,105,.3)';
  ctx.beginPath();
  ctx.roundRect(10, h - exitH - 20, exitW, exitH, 8);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(99,102,241,.12)';
  ctx.font = (_mobile ? '6' : '8') + 'px ui-sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', 10 + exitW / 2, h - exitH - 8);
  ctx.strokeStyle = 'rgba(99,102,241,.2)';
  ctx.beginPath();
  ctx.moveTo(10 + exitW / 2, h - exitH - 2);
  ctx.lineTo(10 + exitW / 2, h - 24);
  ctx.stroke();

  // Plants
  ctx.font = (_mobile ? '14' : '24') + 'px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🪴', _mobile ? 60 : 80, h - (_mobile ? 10 : 20));
  if (!_mobile) ctx.fillText('🌿', w - 150, h - 16);
  ctx.fillText('🪻', w * 0.5, h - (_mobile ? 10 : 18));
}

function drawDesk(x, y, hasAgent, isBoss, agentGlow) {
  // Monitor
  const _mob = (canvas.parentElement?.clientWidth || 800) < 500;
  const mw = _mob ? (isBoss ? 50 : 38) : (isBoss ? 80 : 60);
  const mh = _mob ? (isBoss ? 34 : 28) : (isBoss ? 52 : 44);
  ctx.fillStyle = hasAgent
    ? 'rgba(30,41,59,.9)'
    : 'rgba(15,23,42,.9)';
  ctx.strokeStyle = 'rgba(71,85,105,.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - mw / 2, y - mh - 10, mw, mh, [6, 6, 0, 0]);
  ctx.fill(); ctx.stroke();

  // Screen glow — uses agent color when active, default cyan otherwise
  if (hasAgent) {
    ctx.save();
    const glowColor = agentGlow
      ? `rgba(${agentGlow.split(',').slice(0, 3).join(',')},.12)`
      : 'rgba(6,182,212,.06)';
    ctx.globalAlpha = agentGlow ? 0.12 : 0.06;
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.roundRect(x - mw / 2 - 8, y - mh - 18, mw + 16, mh + 10, 12);
    ctx.fill();
    ctx.restore();
  }

  // LED — agent color when active, default emerald
  const ledColor = agentGlow
    ? `rgba(${agentGlow.split(',').slice(0, 3).join(',')},1)`
    : '#10b981';
  ctx.fillStyle = ledColor;
  ctx.globalAlpha = .8;
  ctx.beginPath(); ctx.arc(x + mw / 2 - 8, y - mh - 4, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Stand
  ctx.fillStyle = 'rgba(71,85,105,.6)';
  ctx.fillRect(x - 5, y - 10, 10, 8);

  // Desk surface
  const dw = _mob ? (isBoss ? 80 : 60) : (isBoss ? 140 : 104);
  const dh = _mob ? (isBoss ? 30 : 26) : (isBoss ? 46 : 40);
  ctx.fillStyle = isBoss ? 'rgba(59,130,246,.12)' : 'rgba(51,65,85,.4)';
  ctx.strokeStyle = isBoss ? 'rgba(59,130,246,.2)' : 'rgba(71,85,105,.2)';
  ctx.beginPath();
  ctx.roundRect(x - dw / 2, y, dw, dh, 8);
  ctx.fill(); ctx.stroke();

  // Boss desk extras: nameplate
  if (isBoss) {
    ctx.fillStyle = 'rgba(59,130,246,.15)';
    ctx.beginPath();
    ctx.roundRect(x - 25, y + dh - 14, 50, 12, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(147,197,253,.7)';
    ctx.font = 'bold 7px ui-sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE BOSS', x, y + dh - 5);
  }
}

/* ── Create / update agent DOM elements ── */
/* Max visible agents in office (7 desks) */
const MAX_DESK_AGENTS = 7;

function countDeskAgents() {
  let n = 0;
  for (const [, a] of agents) { if (a.hasDesk) n++; }
  return n;
}

/* ── Agent face SVGs ── */

function diloFaceSvg() {
  return `<svg class="agent-face face-dilo" viewBox="0 0 28 28" fill="none">
    <ellipse class="dilo-eye dilo-blink" cx="9" cy="11" rx="3.5" ry="4"/>
    <ellipse class="dilo-eye dilo-blink" cx="19" cy="11" rx="3.5" ry="4"/>
    <ellipse class="dilo-pupil" cx="9.5" cy="11.5" rx="1.8" ry="2.2"/>
    <ellipse class="dilo-pupil" cx="19.5" cy="11.5" rx="1.8" ry="2.2"/>
    <circle cx="8" cy="9.5" r="1" fill="rgba(255,255,255,.8)"/>
    <circle cx="18" cy="9.5" r="1" fill="rgba(255,255,255,.8)"/>
    <path class="dilo-mouth" d="M 9 19 Q 14 24 19 19"/>
  </svg>`;
}

function phantomFaceSvg() {
  return `<svg class="agent-face face-phantom" viewBox="0 0 28 28" fill="none">
    <rect class="phantom-visor" x="3" y="10" width="22" height="5" rx="2.5" fill="rgba(244,63,94,.15)" stroke="rgba(244,63,94,.6)" stroke-width=".8"/>
    <line class="phantom-scan" x1="5" y1="12.5" x2="23" y2="12.5" stroke="#f43f5e" stroke-width="1.5" stroke-linecap="round" opacity=".9"/>
    <ellipse class="phantom-pupil" cx="10" cy="12.5" rx="1.6" ry="1.8" fill="#fff" opacity=".9"/>
    <ellipse class="phantom-pupil" cx="18" cy="12.5" rx="1.6" ry="1.8" fill="#fff" opacity=".9"/>
    <circle cx="9.3" cy="11.8" r=".6" fill="rgba(244,63,94,.5)"/>
    <circle cx="17.3" cy="11.8" r=".6" fill="rgba(244,63,94,.5)"/>
    <line x1="10" y1="20" x2="14" y2="18" stroke="rgba(244,63,94,.3)" stroke-width=".6"/>
    <line x1="18" y1="20" x2="14" y2="18" stroke="rgba(244,63,94,.3)" stroke-width=".6"/>
  </svg>`;
}

function nyxFaceSvg() {
  return `<svg class="agent-face face-nyx" viewBox="0 0 28 28" fill="none">
    <ellipse class="nyx-eye nyx-blink" cx="9" cy="12" rx="3.2" ry="2.5" fill="rgba(168,85,247,.2)" stroke="rgba(168,85,247,.7)" stroke-width=".8"/>
    <ellipse class="nyx-eye nyx-blink" cx="19" cy="12" rx="3.2" ry="2.5" fill="rgba(168,85,247,.2)" stroke="rgba(168,85,247,.7)" stroke-width=".8"/>
    <ellipse class="nyx-pupil" cx="9" cy="12" rx="1.5" ry="1.8" fill="#e9d5ff"/>
    <ellipse class="nyx-pupil" cx="19" cy="12" rx="1.5" ry="1.8" fill="#e9d5ff"/>
    <circle cx="8" cy="10.5" r=".8" fill="rgba(255,255,255,.7)"/>
    <circle cx="18" cy="10.5" r=".8" fill="rgba(255,255,255,.7)"/>
    <path class="nyx-moon" d="M 22 4 A 4 4 0 0 1 22 10" stroke="rgba(168,85,247,.5)" stroke-width=".8" fill="none"/>
    <circle cx="22.5" cy="5" r=".5" fill="rgba(168,85,247,.3)"/>
  </svg>`;
}

function cipherFaceSvg() {
  return `<svg class="agent-face face-cipher" viewBox="0 0 28 28" fill="none">
    <rect class="cipher-eye cipher-blink" x="5" y="9" width="6" height="5" rx="1" fill="rgba(6,182,212,.15)" stroke="rgba(6,182,212,.7)" stroke-width=".8"/>
    <rect class="cipher-eye cipher-blink" x="17" y="9" width="6" height="5" rx="1" fill="rgba(6,182,212,.15)" stroke="rgba(6,182,212,.7)" stroke-width=".8"/>
    <rect class="cipher-led cipher-pupil" x="6.5" y="10.5" width="3" height="2" rx=".5" fill="#06b6d4"/>
    <rect class="cipher-led cipher-pupil" x="18.5" y="10.5" width="3" height="2" rx=".5" fill="#06b6d4"/>
    <line class="cipher-data" x1="4" y1="19" x2="24" y2="19" stroke="rgba(6,182,212,.4)" stroke-width=".6" stroke-dasharray="2,2"/>
    <circle class="cipher-dot" cx="8" cy="19" r="1" fill="#06b6d4"/>
    <circle class="cipher-dot" cx="14" cy="19" r="1" fill="#06b6d4" opacity=".6"/>
    <circle class="cipher-dot" cx="20" cy="19" r="1" fill="#06b6d4" opacity=".3"/>
  </svg>`;
}

function pulseFaceSvg() {
  return `<svg class="agent-face face-pulse" viewBox="0 0 28 28" fill="none">
    <circle class="pulse-eye pulse-blink" cx="9" cy="11" r="3" fill="rgba(16,185,129,.15)" stroke="rgba(16,185,129,.7)" stroke-width=".8"/>
    <circle class="pulse-eye pulse-blink" cx="19" cy="11" r="3" fill="rgba(16,185,129,.15)" stroke="rgba(16,185,129,.7)" stroke-width=".8"/>
    <circle class="pulse-pupil" cx="9" cy="11" r="1.5" fill="#6ee7b7"/>
    <circle class="pulse-pupil" cx="19" cy="11" r="1.5" fill="#6ee7b7"/>
    <circle cx="8" cy="10" r=".7" fill="rgba(255,255,255,.7)"/>
    <circle cx="18" cy="10" r=".7" fill="rgba(255,255,255,.7)"/>
    <path class="pulse-wave" d="M 3 6 Q 8 3 14 6 Q 20 9 25 6" stroke="rgba(16,185,129,.35)" stroke-width=".7" fill="none"/>
    <path class="pulse-wave2" d="M 3 4 Q 8 1 14 4 Q 20 7 25 4" stroke="rgba(16,185,129,.2)" stroke-width=".5" fill="none"/>
    <path class="pulse-smile" d="M 9 18 Q 14 22 19 18" stroke="rgba(16,185,129,.6)" stroke-width="1" fill="none" stroke-linecap="round"/>
  </svg>`;
}

function wraithFaceSvg() {
  return `<svg class="agent-face face-wraith" viewBox="0 0 28 28" fill="none">
    <ellipse class="wraith-eye wraith-blink" cx="9" cy="12" rx="2.5" ry="3.5" fill="none" stroke="rgba(99,102,241,.5)" stroke-width=".7"/>
    <ellipse class="wraith-eye wraith-blink" cx="19" cy="12" rx="2.5" ry="3.5" fill="none" stroke="rgba(99,102,241,.5)" stroke-width=".7"/>
    <circle class="wraith-core wraith-pupil" cx="9" cy="12" r="1.5" fill="#a5b4fc"/>
    <circle class="wraith-core wraith-pupil" cx="19" cy="12" r="1.5" fill="#a5b4fc"/>
    <path class="wraith-wisp" d="M 4 8 Q 2 12 5 16" stroke="rgba(99,102,241,.25)" stroke-width=".6" fill="none"/>
    <path class="wraith-wisp" d="M 24 8 Q 26 12 23 16" stroke="rgba(99,102,241,.25)" stroke-width=".6" fill="none"/>
    <path class="wraith-wisp" d="M 6 20 Q 14 24 22 20" stroke="rgba(99,102,241,.15)" stroke-width=".5" fill="none"/>
  </svg>`;
}

function specterFaceSvg() {
  return `<svg class="agent-face face-specter" viewBox="0 0 28 28" fill="none">
    <path class="specter-visor specter-blink" d="M 4 10 L 24 10 L 22 15 L 6 15 Z" fill="rgba(245,158,11,.12)" stroke="rgba(245,158,11,.6)" stroke-width=".8" stroke-linejoin="round"/>
    <rect class="specter-led specter-pupil" x="9" y="11.5" width="3" height="2" rx=".5" fill="#fbbf24"/>
    <rect class="specter-led specter-pupil" x="16" y="11.5" width="3" height="2" rx=".5" fill="#fbbf24"/>
    <circle class="specter-clock" cx="14" cy="21" r="3" fill="none" stroke="rgba(245,158,11,.4)" stroke-width=".7"/>
    <line class="specter-hand" x1="14" y1="21" x2="14" y2="19" stroke="#f59e0b" stroke-width=".7" stroke-linecap="round"/>
    <line class="specter-hand2" x1="14" y1="21" x2="15.5" y2="21.5" stroke="#f59e0b" stroke-width=".5" stroke-linecap="round"/>
  </svg>`;
}

/* ── Per-agent screen content ── */
const SCREEN_CONTENT = {
  dilo: () => `<div class="scr-line scr-prompt">$ overview --agents</div><div class="scr-line scr-dim">agents: <span class="scr-hl">${agents.size}</span>  tasks: <span class="scr-hl">${tasksDone}</span></div><div class="scr-line scr-dim">signals: ${signalCount}</div>`,
  phantom: () => `<div class="scr-line scr-prompt">exec: stealth_op</div><div class="scr-bar"><div class="scr-bar-fill phantom-fill"></div></div><div class="scr-line scr-dim">pid: ${Math.floor(Math.random()*9000+1000)}</div>`,
  nyx: () => `<div class="scr-line scr-prompt">search: intel</div><div class="scr-line scr-result">&#9656; result_${Math.floor(Math.random()*99)}.json</div><div class="scr-line scr-result">&#9656; source_${Math.floor(Math.random()*50)}.md</div>`,
  cipher: () => {const bars = [0.3,0.7,0.5,0.9,0.4].map(v=>`<div class="scr-chart-bar" style="height:${v*100}%"></div>`).join('');return `<div class="scr-chart">${bars}</div><div class="scr-line scr-hl">BTC ${(60000+Math.random()*5000).toFixed(0)}</div>`;},
  pulse: () => `<div class="scr-line scr-in">&#9664; incoming</div><div class="scr-line scr-out">&#9654; delivered</div><div class="scr-line scr-dim">queue: ${Math.floor(Math.random()*5)}</div>`,
  wraith: () => `<div class="scr-line scr-prompt">[mem] index: ${(2800+Math.floor(Math.random()*200)).toLocaleString()}</div><div class="scr-line scr-dim">sync: <span class="scr-ok">ok</span></div>`,
  specter: () => {const h=new Date().getHours(),m=new Date().getMinutes();return `<div class="scr-line scr-prompt">cron ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}</div><div class="scr-line scr-dim">jobs: ${3+Math.floor(Math.random()*4)} queued</div><div class="scr-line scr-ok">&#10003; last run ok</div>`;},
};

function getScreenContent(agentId) {
  const fn = SCREEN_CONTENT[agentId];
  return fn ? fn() : `<div class="scr-line scr-dim">standby</div>`;
}

function getAgentFaceSvg(avatarType) {
  switch (avatarType) {
    case 'face-dilo':    return diloFaceSvg();
    case 'face-phantom': return phantomFaceSvg();
    case 'face-nyx':     return nyxFaceSvg();
    case 'face-cipher':  return cipherFaceSvg();
    case 'face-pulse':   return pulseFaceSvg();
    case 'face-wraith':  return wraithFaceSvg();
    case 'face-specter': return specterFaceSvg();
    default:             return null;
  }
}

function createAgentEl(id) {
  const def = getAgentDef(id);
  const isBoss = !!def.boss;

  // Count how many agents already have desk positions
  let deskAgents = 0;
  for (const [, a] of agents) { if (a.hasDesk) deskAgents++; }
  const hasDesk = deskAgents < MAX_DESK_AGENTS && DESK_POSITIONS.length > 0;

  let pos;
  if (hasDesk) {
    const deskIdx = deskAgents % DESK_POSITIONS.length;
    const desk = DESK_POSITIONS[deskIdx];
    pos = { x: desk.x, y: desk.y + (isBoss ? 40 : 30) };
  } else {
    pos = { x: -200, y: -200 };
  }

  // Avatar content: SVG face or emoji fallback
  const faceSvg = def.avatar.startsWith('face-') ? getAgentFaceSvg(def.avatar) : null;
  const avatarContent = faceSvg
    ? faceSvg
    : `<span class="agent-emoji" style="font-size:24px">${def.avatar}</span>`;

  // Leg color derived from agent glow
  const legColor = def.glow.replace(/[\d.]+\)$/, '0.7)');
  const shoeColor = 'rgba(30,41,59,.9)';

  const el = document.createElement('div');
  el.className = 'agent-char' + (isBoss ? ' boss' : '');
  if (!hasDesk) el.style.display = 'none';
  el.style.cssText += `;left:${pos.x}px;top:${pos.y}px;transform:translate(-50%,-50%);--agent-glow:${def.glow}`;
  el.innerHTML = `
    <div class="agent-shadow" style="width:${isBoss ? 50 : 40}px;height:14px;background:radial-gradient(ellipse,${def.glow} 0%,transparent 70%)"></div>
    <div class="agent-work-dots" style="display:none">
      <div class="agent-work-dot" style="animation-delay:0s"></div>
      <div class="agent-work-dot" style="animation-delay:.15s"></div>
      <div class="agent-work-dot" style="animation-delay:.3s"></div>
    </div>
    <div class="agent-body" style="width:${isBoss ? 58 : 48}px;height:${isBoss ? 58 : 48}px;background:linear-gradient(135deg,${def.glow} 0%,transparent 100%)">
      <div class="agent-body-inner" style="background:${def.accent}"></div>
      ${avatarContent}
      <div class="agent-ping" style="display:none"></div>
      <div class="agent-energy"><div class="agent-energy-bar" style="width:100%"></div></div>
    </div>
    <div class="agent-chair" style="--chair-color:${def.glow.replace(/[\d.]+\)$/, '0.25)')}"></div>
    <div class="agent-legs" style="--leg-color:${legColor};--shoe-color:${shoeColor}">
      <div class="agent-leg agent-leg-l"><div class="agent-leg-shoe"></div></div>
      <div class="agent-leg agent-leg-r"><div class="agent-leg-shoe"></div></div>
    </div>
    <div class="agent-name" style="background:linear-gradient(135deg,${def.glow} 0%,transparent 100%)">${def.name}</div>
  `;
  el.style.pointerEvents = 'auto';
  el.addEventListener('click', () => showModal(id));
  agentLayerEl.appendChild(el);

  // Monitor screen overlay (DOM element positioned over the canvas monitor)
  let screenEl = null;
  if (hasDesk) {
    const deskIdx = deskAgents % DESK_POSITIONS.length;
    const desk = DESK_POSITIONS[deskIdx];
    screenEl = document.createElement('div');
    screenEl.className = 'monitor-screen';
    screenEl.innerHTML = getScreenContent(id);
    // Position over the desk's monitor area
    const mw = isBoss ? 80 : 60, mh = isBoss ? 52 : 44;
    screenEl.style.left = (desk.x - mw / 2 + 4) + 'px';
    screenEl.style.top = (desk.y - mh - 6) + 'px';
    screenEl.style.width = (mw - 8) + 'px';
    screenEl.style.height = (mh - 8) + 'px';
    agentLayerEl.appendChild(screenEl);
  }

  const agent = { pos, status: 'idle', task: null, def, energy: 100, el, bubbleEl: null, msgs: 0, tasks: 0, hasDesk, homePos: { ...pos }, screenEl };
  agents.set(id, agent);
  markActivity(id);
  if (id === 'wraith') scheduleWraithSmoke();
  else scheduleCoffeeBreak(id);
  updateStatCards();
  renderStatusbar();
  return agent;
}

function updateAgentEl(id) {
  const a = agents.get(id);
  if (!a || !a.el) return;
  a.el.style.left = a.pos.x + 'px';
  a.el.style.top = a.pos.y + 'px';

  const isWorking = a.status === 'working' || a.status === 'active';
  const dots = a.el.querySelector('.agent-work-dots');
  const ping = a.el.querySelector('.agent-ping');
  if (dots) dots.style.display = isWorking && !a.bubbleEl ? 'flex' : 'none';
  if (ping) ping.style.display = isWorking ? 'block' : 'none';

  // Working class for face animations
  const hasFace = a.def.avatar && a.def.avatar.startsWith('face-');
  if (hasFace && isWorking) a.el.classList.add('working');
  else if (hasFace) a.el.classList.remove('working');

  const energyBar = a.el.querySelector('.agent-energy-bar');
  if (energyBar) energyBar.style.width = a.energy + '%';

  // Screen overlay: active glow + content refresh
  if (a.screenEl) {
    if (isWorking) {
      a.screenEl.classList.add('screen-active');
      a.screenEl.innerHTML = getScreenContent(id);
    } else {
      a.screenEl.classList.remove('screen-active');
    }
  }

  // Mood system
  applyMood(id);

  queueRedraw();
}

/* ── Footstep trails ── */
let _footstepSide = false; // alternates left/right

function brightGlow(agentId) {
  const def = AGENT_DEFS[agentId];
  const g = def?.glow || 'rgba(148,163,184,.6)';
  return g.replace(/,\s*[\d.]+\)$/, ',.9)');
}

function spawnFootstep(x, y, agentId) {
  const dot = document.createElement('div');
  dot.className = 'footstep ' + (_footstepSide ? 'left' : 'right');
  _footstepSide = !_footstepSide;
  const bright = brightGlow(agentId);
  dot.style.cssText = `left:${x}px;top:${y + 25}px;background:${bright};box-shadow:0 0 10px ${bright},0 0 4px ${bright}`;
  agentLayerEl.appendChild(dot);
  setTimeout(() => dot.remove(), 1800);
}

function spawnDustPuff(x, y, agentId) {
  const bright = brightGlow(agentId);
  for (let i = 0; i < 3; i++) {
    const p = document.createElement('div');
    p.className = 'dust-puff';
    const ox = (Math.random() - .5) * 14;
    const oy = Math.random() * 5;
    p.style.cssText = `left:${x + ox}px;top:${y + 22 + oy}px;background:${bright};box-shadow:0 0 8px ${bright}`;
    agentLayerEl.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}

function spawnDustBurst(x, y, agentId) {
  const bright = brightGlow(agentId);
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 / 6) * i + Math.random() * .5;
    const p = document.createElement('div');
    p.className = 'dust-puff';
    const dx = Math.cos(angle) * (12 + Math.random() * 10);
    const dy = Math.sin(angle) * (8 + Math.random() * 6);
    p.style.cssText = `left:${x}px;top:${y + 20}px;background:${bright};box-shadow:0 0 8px ${bright};--dx:${dx}px;--dy:${dy}px;animation:dust-burst-expand .8s ease-out forwards`;
    agentLayerEl.appendChild(p);
    setTimeout(() => p.remove(), 800);
  }
}

function spawnGhostTrail(agentEl, x, y) {
  const ghost = agentEl.cloneNode(true);
  ghost.className = 'ghost-trail';
  ghost.style.left = x + 'px';
  ghost.style.top = y + 'px';
  ghost.style.width = agentEl.offsetWidth + 'px';
  ghost.style.height = agentEl.offsetHeight + 'px';
  agentLayerEl.appendChild(ghost);
  setTimeout(() => ghost.remove(), 800);
}

/* ── Agent walking animation ── */
const _walkIds = new Map(); // agentId -> walkSeq (cancel previous walks)
let _walkSeq = 0;

function walkAgentTo(id, targetX, targetY, onDone, opts) {
  const a = agents.get(id);
  if (!a || !a.hasDesk) return;

  // Cancel any in-progress walk for this agent
  const seq = ++_walkSeq;
  _walkIds.set(id, seq);

  a.el.classList.add('walking');

  const startX = a.pos.x, startY = a.pos.y;
  const dist = Math.sqrt((targetX - startX) ** 2 + (targetY - startY) ** 2);
  const duration = Math.min(Math.max(dist * 5, 800), 6000);
  const startTime = performance.now();
  const ghostMode = opts?.ghost || false;
  let lastFootstepT = 0;
  let lastGhostT = 0;

  function step(now) {
    // If a newer walk started, abort this one
    if (_walkIds.get(id) !== seq) return;

    const t = Math.min((now - startTime) / duration, 1);
    const ease = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    a.pos.x = startX + (targetX - startX) * ease;
    a.pos.y = startY + (targetY - startY) * ease;
    a.el.style.left = a.pos.x + 'px';
    a.el.style.top = a.pos.y + 'px';

    // Spawn footsteps every ~12% of walk progress
    if (t - lastFootstepT > 0.12 && t < 0.95) {
      lastFootstepT = t;
      spawnFootstep(a.pos.x, a.pos.y, id);
    }

    // Ghost trail mode: spawn afterimage every ~8%
    if (ghostMode && t - lastGhostT > 0.08 && t < 0.9) {
      lastGhostT = t;
      spawnGhostTrail(a.el, a.pos.x, a.pos.y);
    }

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      a.el.classList.remove('walking');
      // Small dust puff on arrival
      spawnDustPuff(a.pos.x, a.pos.y, id);
      if (onDone) onDone();
    }
  }
  requestAnimationFrame(step);
}

function walkAgentToAndBack(id, targetX, targetY) {
  const a = agents.get(id);
  if (!a || !a.hasDesk || !a.homePos) return;
  const home = { ...a.homePos };
  // Walk partway toward target (not all the way, stop ~40px away)
  const dx = targetX - a.pos.x, dy = targetY - a.pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const stopDist = Math.max(dist - 50, dist * 0.4);
  const ratio = stopDist / dist;
  const midX = a.pos.x + dx * ratio, midY = a.pos.y + dy * ratio;

  walkAgentTo(id, midX, midY, () => {
    setTimeout(() => walkAgentTo(id, home.x, home.y), 2000);
  });
}

/* ── Thinking pace: small loop near desk ── */
const _pacingAgents = new Set();
function startThinkingPace(id) {
  const a = agents.get(id);
  if (!a || !a.hasDesk || _pacingAgents.has(id) || a.el.classList.contains('walking') || _standupInProgress) return;
  _pacingAgents.add(id);
  const home = { ...a.homePos };
  const offsets = [{x:12,y:-5},{x:-12,y:-5},{x:8,y:4},{x:-8,y:4}];
  let step = 0;
  function nextStep() {
    if (!_pacingAgents.has(id)) return;
    const off = offsets[step % offsets.length];
    walkAgentTo(id, home.x + off.x, home.y + off.y, () => {
      step++;
      if (_pacingAgents.has(id)) setTimeout(nextStep, 600);
    });
  }
  nextStep();
}
function stopThinkingPace(id) {
  if (!_pacingAgents.has(id)) return;
  _pacingAgents.delete(id);
  const a = agents.get(id);
  if (a && a.homePos) walkAgentTo(id, a.homePos.x, a.homePos.y);
}

/* ── Error shake ── */
function triggerErrorShake(id) {
  const a = agents.get(id);
  if (!a || !a.el) return;
  a.el.classList.add('error-shake');
  setTimeout(() => a.el.classList.remove('error-shake'), 1300);
}

/* ── Screen flash on task completion ── */
function flashScreen(id, type) {
  const a = agents.get(id);
  if (!a || !a.screenEl) return;
  const cls = type === 'error' ? 'screen-flash-error' : 'screen-flash-success';
  a.screenEl.classList.add(cls);
  setTimeout(() => a.screenEl.classList.remove(cls), 700);
}

/* ── Document pass: floating icon along conversation line ── */
function animateDocPass(fromId, toId) {
  const a = agents.get(fromId), b = agents.get(toId);
  if (!a || !b || !a.hasDesk || !b.hasDesk) return;
  const el = document.createElement('div');
  el.className = 'doc-pass';
  el.textContent = '📄';
  el.style.cssText = `left:${a.pos.x}px;top:${a.pos.y - 20}px`;
  agentLayerEl.appendChild(el);
  const startX = a.pos.x, startY = a.pos.y - 20;
  const endX = b.pos.x, endY = b.pos.y - 20;
  const midX = (startX + endX) / 2, midY = Math.min(startY, endY) - 40;
  const dur = 1200;
  const t0 = performance.now();
  function step(now) {
    const t = Math.min((now - t0) / dur, 1);
    // Quadratic bezier
    const u = 1 - t;
    const px = u*u*startX + 2*u*t*midX + t*t*endX;
    const py = u*u*startY + 2*u*t*midY + t*t*endY;
    el.style.left = px + 'px';
    el.style.top = py + 'px';
    el.style.opacity = t > 0.8 ? (1 - t) * 5 : 1;
    if (t < 1) requestAnimationFrame(step);
    else el.remove();
  }
  requestAnimationFrame(step);
}

/* ── High-five burst on mission complete ── */
function highfiveBurst(agentIds) {
  const emojis = ['🙌', '✨', '🎉', '⚡'];
  agentIds.forEach((id, i) => {
    const a = agents.get(id);
    if (!a || !a.hasDesk) return;
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'highfive-burst';
      el.textContent = emojis[i % emojis.length];
      el.style.cssText = `left:${a.pos.x}px;top:${a.pos.y - 35}px`;
      agentLayerEl.appendChild(el);
      setTimeout(() => el.remove(), 900);
    }, i * 150);
  });
}

/* ── Standup meeting: agents walk to meeting room, give updates, disperse ── */
let _standupInProgress = false;

// Standup lines per role — randomly selected, feel natural
const STANDUP_LINES = {
  dilo: {
    status: [
      "Alright team, quick standup.",
      "Morning sync — let's go round.",
      "Standup time. Keep it tight.",
    ],
    assign: [
      "Good. Let's execute. Back to desks.",
      "Clear plan. Move fast, stay sharp.",
      "Assignments locked in. Let's ship it.",
    ],
  },
  phantom: {
    status: [
      "Ops running clean. No blockers.",
      "All pipelines green. Standing by for tasks.",
      "Execution queue clear. Ready to deploy.",
    ],
  },
  nyx: {
    status: [
      "Monitoring feeds. Nothing unusual yet.",
      "Scanning sources. Few leads to follow up.",
      "Research queue has 3 items. Working through them.",
    ],
  },
  cipher: {
    status: [
      "Markets stable. Watching BTC closely.",
      "Data pipelines synced. No anomalies.",
      "Security checks passed. Keys rotated.",
    ],
  },
  pulse: {
    status: [
      "Comms delivered. Queue at zero.",
      "All messages sent. Engagement looks good.",
      "Analytics dashboard updated. Trends normal.",
    ],
  },
  wraith: {
    status: [
      "Memory index synced. Context is current.",
      "QA pass done. Two minor flags, nothing critical.",
      "Red-team check clean. No vulnerabilities.",
    ],
  },
  specter: {
    status: [
      "Cron jobs all healthy. Next batch in 20min.",
      "Draft queue: 3 posts ready for review.",
      "Automation scripts green. No failures overnight.",
    ],
  },
};

function getStandupLine(agentId, type) {
  const pool = STANDUP_LINES[agentId]?.[type] || STANDUP_LINES.phantom.status;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getMeetingChairPositions() {
  const wrap = canvas.parentElement;
  const w = wrap?.clientWidth || 800;
  const h = wrap?.clientHeight || 500;
  const mrx = w * 0.62, mry = h * 0.35;
  return [
    { x: mrx + 110, y: mry + 5 },    // head of table (Dilo)
    { x: mrx + 55,  y: mry + 15 },   // top-left
    { x: mrx + 165, y: mry + 15 },   // top-right
    { x: mrx + 15,  y: mry + 65 },   // mid-left
    { x: mrx + 205, y: mry + 65 },   // mid-right
    { x: mrx + 55,  y: mry + 125 },  // bottom-left
    { x: mrx + 165, y: mry + 125 },  // bottom-right
  ];
}

let _standupSeq = 0; // sequence token — incremented on cancel to invalidate pending timeouts
const _standupTimers = []; // track all setTimeout IDs for cleanup

function standupTimeout(fn, ms) {
  const seq = _standupSeq;
  const id = setTimeout(() => {
    if (_standupSeq !== seq) return; // cancelled
    fn();
  }, ms);
  _standupTimers.push(id);
  return id;
}

function startStandup(agentIds, missionTask) {
  if (_standupInProgress || _threatActive) return; // threats take priority
  _standupInProgress = true;
  _standupSeq++;
  _standupTimers.length = 0;

  const chairs = getMeetingChairPositions();
  const seated = [];
  let arrivedCount = 0;
  let sequenceStarted = false;
  const seq = _standupSeq;

  function tryStartSequence() {
    if (sequenceStarted || _standupSeq !== seq) return;
    sequenceStarted = true;
    runStandupSequence(seated, missionTask);
  }

  agentIds.forEach((id, i) => {
    const a = agents.get(id);
    if (!a || !a.hasDesk) return;
    cancelCoffeeBreak(id);
    stopThinkingPace(id);
    if (id === 'wraith' && _smokeInterval) { clearInterval(_smokeInterval); _smokeInterval = null; }
    markActivity(id);
    a.el.classList.add('huddling');
    seated.push(id);

    const chair = chairs[i % chairs.length];
    walkAgentTo(id, chair.x, chair.y, () => {
      if (_standupSeq !== seq) return;
      spawnDustBurst(chair.x, chair.y, id);
      arrivedCount++;
      if (arrivedCount >= seated.length) tryStartSequence();
    });
  });

  // Fallback: start sequence after 4s even if not all walks completed
  standupTimeout(() => tryStartSequence(), 4000);
}

function runStandupSequence(agentIds, missionTask) {
  const leader = agentIds[0] || 'dilo';
  let delay = 800;

  // Show projected meeting screen
  showMeetingScreen(missionTask, agentIds);

  // 1. Dilo opens the standup
  const openLine = getStandupLine(leader, 'status');
  standupTimeout(() => {
    showThoughtBubble(leader, openLine);
    addMeetingScreenLine(leader, openLine, true);
  }, delay);
  delay += 3500;

  // 2. If there's a mission, Dilo states it
  if (missionTask) {
    const focusLine = `Focus: ${missionTask.slice(0, 50)}`;
    standupTimeout(() => {
      showThoughtBubble(leader, focusLine);
      addMeetingScreenLine(leader, focusLine, true);
    }, delay);
    delay += 3500;
  }

  // 3. Each non-leader agent gives their update (one at a time)
  agentIds.slice(1).forEach((id) => {
    const line = getStandupLine(id, 'status');
    standupTimeout(() => {
      showThoughtBubble(id, line);
      addMeetingScreenLine(id, line, true);
    }, delay);
    delay += 3200;
  });

  // 4. Dilo wraps up with assignments
  const closeLine = getStandupLine(leader, 'assign');
  standupTimeout(() => {
    showThoughtBubble(leader, closeLine);
    finishMeetingScreen();
    addMeetingScreenLine(leader, closeLine, true);
  }, delay);
  delay += 3500;

  // 5. Fade screen + disperse back to desks
  standupTimeout(() => {
    finishMeetingScreen();
    removeMeetingScreen();
    agentIds.forEach(id => {
      const a = agents.get(id);
      if (!a || !a.hasDesk || !a.homePos) return;
      a.el.classList.remove('huddling');
      walkAgentTo(id, a.homePos.x, a.homePos.y);
    });
    _standupInProgress = false;
  }, delay);
}

function disperseAgents(agentIds) {
  agentIds.forEach(id => {
    const a = agents.get(id);
    if (!a || !a.hasDesk || !a.homePos) return;
    a.el.classList.remove('huddling');
    walkAgentTo(id, a.homePos.x, a.homePos.y);
  });
}

/* ── Sleep / idle animation ── */
const _lastActivity = new Map(); // agentId -> timestamp
const SLEEP_THRESHOLD = 60000; // 60s idle

function markActivity(id) {
  _lastActivity.set(id, Date.now());
  const a = agents.get(id);
  if (!a || !a.el) return;
  if (a.el.classList.contains('sleeping')) {
    a.el.classList.remove('sleeping');
    // Remove zzz elements
    a.el.querySelectorAll('.agent-zzz').forEach(z => z.remove());
  }
}

function checkSleepStates() {
  const now = Date.now();
  for (const [id, a] of agents) {
    if (!a.hasDesk) continue;
    const last = _lastActivity.get(id) || now;
    const idle = a.status === 'idle' || a.status === 'waiting' || !a.status;
    if (idle && (now - last > SLEEP_THRESHOLD) && !a.el.classList.contains('sleeping') && !a.el.classList.contains('walking')) {
      a.el.classList.add('sleeping');
      // Add zzz floaters if not present
      if (!a.el.querySelector('.agent-zzz')) {
        for (let i = 0; i < 3; i++) {
          const z = document.createElement('div');
          z.className = 'agent-zzz';
          z.textContent = 'z';
          a.el.appendChild(z);
        }
      }
    }
  }
}
setInterval(checkSleepStates, 5000);

// Periodic mood refresh — lets moods decay as workload window slides
setInterval(() => {
  for (const [id] of agents) applyMood(id);
}, 5000);

/* ── Coffee break: idle agents wander to break area ── */
const _coffeeTimers = new Map();
function scheduleCoffeeBreak(id) {
  if (_coffeeTimers.has(id)) return;
  // Random delay 45-120s
  const delay = (45 + Math.random() * 75) * 1000;
  const timer = setTimeout(() => {
    _coffeeTimers.delete(id);
    const a = agents.get(id);
    if (!a || !a.hasDesk || !a.homePos) return;
    if (_standupInProgress || _threatActive) return; // don't wander during standups/threats
    // Only go if still idle
    const idle = a.status === 'idle' || a.status === 'waiting' || !a.status;
    if (!idle || a.el.classList.contains('walking')) return;
    // Walk to break area (meeting area on right side of canvas)
    const wrap = canvas.parentElement;
    const breakX = (wrap?.clientWidth || 800) - 95;
    const breakY = (wrap?.clientHeight || 500) * 0.35 + 45;
    markActivity(id); // wake up if sleeping
    walkAgentTo(id, breakX, breakY, () => {
      // Hang out for 4-8s, then walk back
      setTimeout(() => {
        const a2 = agents.get(id);
        if (a2 && a2.homePos) walkAgentTo(id, a2.homePos.x, a2.homePos.y);
      }, 4000 + Math.random() * 4000);
    });
  }, delay);
  _coffeeTimers.set(id, timer);
}

function cancelCoffeeBreak(id) {
  const t = _coffeeTimers.get(id);
  if (t) { clearTimeout(t); _coffeeTimers.delete(id); }
}

/* ── Wraith smoke break ── */
let _smokeInterval = null;
function spawnSmokeParticle(x, y) {
  const el = document.createElement('div');
  el.className = 'smoke-puff';
  el.style.cssText = `left:${x + (Math.random() - .5) * 10}px;top:${y}px`;
  agentLayerEl.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

function scheduleWraithSmoke() {
  // Override Wraith's coffee break — he goes for a smoke instead
  cancelCoffeeBreak('wraith');
  const delay = (35 + Math.random() * 60) * 1000;
  const timer = setTimeout(() => {
    _coffeeTimers.delete('wraith');
    const a = agents.get('wraith');
    if (!a || !a.hasDesk || !a.homePos) return;
    if (_standupInProgress || _threatActive) { scheduleWraithSmoke(); return; } // defer during standups/threats
    const idle = a.status === 'idle' || a.status === 'waiting' || !a.status;
    if (!idle || a.el.classList.contains('walking')) { scheduleWraithSmoke(); return; }
    const wrap = canvas.parentElement;
    const smokeX = 42;
    const smokeY = (wrap?.clientHeight || 500) - 50;
    markActivity('wraith');
    walkAgentTo('wraith', smokeX, smokeY, () => {
      // Smoke particles while hanging out
      _smokeInterval = setInterval(() => spawnSmokeParticle(smokeX, smokeY - 25), 400);
      setTimeout(() => {
        if (_smokeInterval) { clearInterval(_smokeInterval); _smokeInterval = null; }
        const a2 = agents.get('wraith');
        if (a2 && a2.homePos) walkAgentTo('wraith', a2.homePos.x, a2.homePos.y, () => {
          scheduleWraithSmoke(); // schedule next one
        });
      }, 6000 + Math.random() * 4000);
    });
  }, delay);
  _coffeeTimers.set('wraith', timer);
}

/* ── Speech bubbles ── */
function showSpeechBubble(agentId, text) {
  const a = agents.get(agentId);
  if (!a || !a.hasDesk) return;
  // Remove existing
  if (a.bubbleEl && a.bubbleEl.parentNode) a.bubbleEl.parentNode.removeChild(a.bubbleEl);

  const canvasW = canvas.parentElement?.clientWidth || 800;
  const dir = a.pos.x > canvasW * 0.5 ? 'left' : 'right';
  const el = document.createElement('div');
  el.className = `speech-bubble dir-${dir}`;
  el.textContent = text.length > 70 ? text.slice(0, 67) + '...' : text;
  const offX = dir === 'right' ? 30 : -30;
  el.style.cssText = `left:${a.pos.x + offX}px;top:${a.pos.y - 40}px;${dir === 'left' ? 'transform:translateX(-100%)' : ''}`;
  agentLayerEl.appendChild(el);
  a.bubbleEl = el;

  const dots = a.el.querySelector('.agent-work-dots');
  if (dots) dots.style.display = 'none';

  setTimeout(() => {
    if (el.parentNode) {
      el.style.opacity = '0';
      el.style.transition = 'opacity .5s';
      setTimeout(() => el.parentNode && el.parentNode.removeChild(el), 500);
    }
    if (a.bubbleEl === el) a.bubbleEl = null;
    updateAgentEl(agentId);
  }, 4000);
}

/* ── Visitor message (temporary agent at door) ── */
let _visitorEl = null;
let _visitorTimeout = null;

function showVisitorMessage(text) {
  const wrap = canvas.parentElement;
  const w = wrap?.clientWidth || 800;
  const h = wrap?.clientHeight || 500;
  const vx = 60;
  const vy = h - 60;
  const def = AGENT_DEFS.visitor;

  if (!_visitorEl) {
    const el = document.createElement('div');
    el.className = 'agent-char visitor-agent';
    el.style.cssText = `left:${vx}px;top:${vy}px;transform:translate(-50%,-50%);--agent-glow:${def.glow};opacity:0;transition:opacity .5s`;
    el.innerHTML = `
      <div class="agent-shadow" style="width:40px;height:14px;background:radial-gradient(ellipse,${def.glow} 0%,transparent 70%)"></div>
      <div class="agent-body" style="width:48px;height:48px;background:linear-gradient(135deg,${def.glow} 0%,transparent 100%)">
        <div class="agent-body-inner" style="background:${def.accent}"></div>
        <span class="agent-emoji" style="font-size:24px">${def.avatar}</span>
      </div>
      <div class="agent-name" style="background:linear-gradient(135deg,${def.glow} 0%,transparent 100%)">Visitor</div>
    `;
    agentLayerEl.appendChild(el);
    _visitorEl = el;
    requestAnimationFrame(() => { el.style.opacity = '1'; });
  } else {
    _visitorEl.style.opacity = '1';
    _visitorEl.style.left = vx + 'px';
    _visitorEl.style.top = vy + 'px';
  }

  const existingBubble = _visitorEl.querySelector('.visitor-bubble');
  if (existingBubble) existingBubble.remove();

  const bubble = document.createElement('div');
  bubble.className = 'speech-bubble dir-right visitor-bubble';
  bubble.textContent = text.length > 100 ? text.slice(0, 97) + '...' : text;
  bubble.style.cssText = `left:${vx + 30}px;top:${vy - 40}px`;
  agentLayerEl.appendChild(bubble);

  if (_visitorTimeout) clearTimeout(_visitorTimeout);

  _visitorTimeout = setTimeout(() => {
    if (bubble.parentNode) {
      bubble.style.opacity = '0';
      bubble.style.transition = 'opacity .5s';
      setTimeout(() => bubble.parentNode && bubble.remove(), 500);
    }
    if (_visitorEl) {
      _visitorEl.style.opacity = '0';
      setTimeout(() => {
        if (_visitorEl && _visitorEl.parentNode) {
          _visitorEl.parentNode.removeChild(_visitorEl);
          _visitorEl = null;
        }
      }, 500);
    }
    _visitorTimeout = null;
  }, 12000);
}

/* ── Thought bubbles (standup meetings) ── */
function showThoughtBubble(agentId, text) {
  const a = agents.get(agentId);
  if (!a || !a.hasDesk) return;
  // Remove existing bubble
  if (a.bubbleEl && a.bubbleEl.parentNode) a.bubbleEl.parentNode.removeChild(a.bubbleEl);

  const def = getAgentDef(agentId);
  const el = document.createElement('div');
  el.className = 'thought-bubble';
  el.innerHTML = `<div class="thought-name">${def.name}</div>${text.length > 80 ? text.slice(0, 77) + '...' : text}`;
  el.style.cssText = `left:${a.pos.x - 20}px;top:${a.pos.y - 55}px;transform:translateX(-30%)`;
  agentLayerEl.appendChild(el);
  a.bubbleEl = el;

  setTimeout(() => {
    if (el.parentNode) {
      el.style.opacity = '0';
      el.style.transition = 'opacity .5s';
      setTimeout(() => el.parentNode && el.parentNode.removeChild(el), 500);
    }
    if (a.bubbleEl === el) a.bubbleEl = null;
  }, 3800);
}

/* ── Projected meeting screen ── */
let _meetingScreenEl = null;

function showMeetingScreen(missionTask, agentIds) {
  removeMeetingScreen();
  const wrap = canvas.parentElement;
  const w = wrap?.clientWidth || 800, h = wrap?.clientHeight || 500;
  const mrx = w * 0.62, mry = h * 0.35;

  const el = document.createElement('div');
  el.className = 'meeting-screen';
  // Position meeting screen — scale for mobile
  const isMob = w < 500;
  const scrW = isMob ? Math.min(w * 0.55, 180) : 320;
  const scrLeft = isMob ? Math.max(8, (w - scrW) / 2) : mrx - scrW - 30;
  const scrTop = isMob ? Math.max(8, mry - 10) : mry - 20;
  el.style.cssText = `left:${scrLeft}px;top:${scrTop}px;width:${scrW}px`;

  // Header
  const header = document.createElement('div');
  header.className = 'meeting-screen-header';
  header.innerHTML = `<span class="screen-dot"></span><span class="screen-title">Standup &middot; ${agentIds.length} agents</span>`;
  el.appendChild(header);

  // Agenda line
  if (missionTask) {
    const agenda = document.createElement('div');
    agenda.className = 'meeting-screen-agenda';
    agenda.textContent = missionTask.length > 60 ? missionTask.slice(0, 57) + '...' : missionTask;
    el.appendChild(agenda);
  }

  // Body (lines will be added during sequence)
  const body = document.createElement('div');
  body.className = 'meeting-screen-body';
  el.appendChild(body);

  agentLayerEl.appendChild(el);
  _meetingScreenEl = el;
  return el;
}

function addMeetingScreenLine(agentId, text, isActive) {
  if (!_meetingScreenEl) return;
  const body = _meetingScreenEl.querySelector('.meeting-screen-body');
  if (!body) return;

  // Mark previous active line as done
  const prev = body.querySelector('.meeting-screen-line.active');
  if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }

  const def = getAgentDef(agentId);
  const line = document.createElement('div');
  line.className = 'meeting-screen-line' + (isActive ? ' active' : '');
  line.innerHTML = `<span class="line-agent">${def.name}</span><span class="line-text">${text.length > 80 ? text.slice(0, 77) + '...' : text}</span><span class="line-check">&#10003;</span>`;
  body.appendChild(line);

  // Auto-scroll to latest
  body.scrollTop = body.scrollHeight;
}

function finishMeetingScreen() {
  if (!_meetingScreenEl) return;
  const body = _meetingScreenEl.querySelector('.meeting-screen-body');
  if (body) {
    const prev = body.querySelector('.meeting-screen-line.active');
    if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
  }
}

function removeMeetingScreen() {
  if (_meetingScreenEl && _meetingScreenEl.parentNode) {
    _meetingScreenEl.style.opacity = '0';
    _meetingScreenEl.style.transition = 'opacity .6s';
    const el = _meetingScreenEl;
    setTimeout(() => el.parentNode && el.parentNode.removeChild(el), 600);
  }
  _meetingScreenEl = null;
}

/* ── Threat Detection Mode ── */
let _threatActive = false;

function cancelStandupForThreat() {
  if (!_standupInProgress) return;
  // Invalidate all pending standup timeouts
  _standupSeq++;
  for (const t of _standupTimers) clearTimeout(t);
  _standupTimers.length = 0;
  _standupInProgress = false;
  // Remove meeting screen immediately
  if (_meetingScreenEl && _meetingScreenEl.parentNode) _meetingScreenEl.parentNode.removeChild(_meetingScreenEl);
  _meetingScreenEl = null;
  // Rush all agents back to desks + clear bubbles
  for (const [id, a] of agents) {
    if (!a.hasDesk || !a.homePos) continue;
    a.el.classList.remove('huddling');
    if (a.bubbleEl && a.bubbleEl.parentNode) { a.bubbleEl.parentNode.removeChild(a.bubbleEl); a.bubbleEl = null; }
    walkAgentTo(id, a.homePos.x, a.homePos.y);
  }
}

function triggerThreatMode(errorText) {
  if (_threatActive) return;

  // Override standup — rush agents back to desks first
  if (_standupInProgress) cancelStandupForThreat();

  _threatActive = true;

  const wrap = canvas.parentElement;
  const w = wrap?.clientWidth || 800, h = wrap?.clientHeight || 500;
  const cx = w * 0.5, cy = h * 0.48;

  // 1. Create overlay container
  const overlay = document.createElement('div');
  overlay.className = 'threat-overlay active';
  agentLayerEl.appendChild(overlay);

  // Add red ambient wash
  const ambient = document.createElement('div');
  ambient.className = 'threat-ambient';
  overlay.appendChild(ambient);

  // Add scanning laser
  const laser = document.createElement('div');
  laser.className = 'threat-laser';
  overlay.appendChild(laser);

  // Add red border to canvas
  agentLayerEl.classList.add('threat-active');

  // Flash all agent screens red
  for (const [id, a] of agents) {
    if (a.screenEl) flashScreen(id, 'error');
  }

  // 2. Alert banner — flashes briefly
  const banner = document.createElement('div');
  banner.className = 'threat-banner';
  banner.innerHTML = `<div class="threat-banner-inner"><div class="threat-alert-icon">\u26a0\ufe0f</div><div class="threat-alert-label">THREAT DETECTED</div></div>`;
  overlay.appendChild(banner);

  // Remove banner after 1.5s, replaced by holo
  setTimeout(() => {
    if (banner.parentNode) {
      banner.style.opacity = '0';
      banner.style.transition = 'opacity .4s';
      setTimeout(() => banner.parentNode && banner.remove(), 400);
    }
  }, 1500);

  // 3. Cipher sprints to center + holographic display
  const cipher = agents.get('cipher');
  const cipherHome = cipher?.homePos ? { ...cipher.homePos } : null;

  if (cipher && cipher.hasDesk) {
    cancelCoffeeBreak('cipher');
    stopThinkingPace('cipher');
    markActivity('cipher');
    walkAgentTo('cipher', cx, cy, () => {
      // Dust burst on dramatic arrival
      spawnDustBurst(cx, cy, 'cipher');
      // Show holographic threat display at Cipher's location
      showHolographicDisplay(cx, cy, errorText, overlay);
    }, { ghost: true });
  } else {
    // No Cipher — show holo at center anyway
    setTimeout(() => showHolographicDisplay(cx, cy, errorText, overlay), 800);
  }

  // 4. Freeze other agents — they "look" toward center
  for (const [id, a] of agents) {
    if (id === 'cipher' || !a.hasDesk) continue;
    cancelCoffeeBreak(id);
    stopThinkingPace(id);
    markActivity(id);
  }

  // 5. After 8s — Cipher resolves, green CLEAR pulse
  setTimeout(() => {
    resolveThreat(overlay, cx, cy, cipherHome);
  }, 8000);
}

function showHolographicDisplay(x, y, errorText, overlay) {
  const holo = document.createElement('div');
  holo.className = 'threat-holo';
  holo.style.cssText = `left:${x - 90}px;top:${y - 110}px`;
  holo.innerHTML = `
    <div class="threat-holo-hex">
      <div class="threat-holo-ring"></div>
      <div class="threat-holo-ring"></div>
      <div class="threat-holo-shield">
        <div class="threat-holo-icon">\ud83d\udee1\ufe0f</div>
        <div class="threat-holo-label">Analyzing</div>
        <div class="threat-holo-text">${(errorText || 'Unknown threat').slice(0, 60)}</div>
      </div>
    </div>`;
  overlay.appendChild(holo);

  // Cipher thought bubble
  const cipher = agents.get('cipher');
  if (cipher && cipher.hasDesk) {
    showThoughtBubble('cipher', 'Running threat analysis...');
  }

  // After 3s, update holo to "Contained"
  setTimeout(() => {
    const label = holo.querySelector('.threat-holo-label');
    const icon = holo.querySelector('.threat-holo-icon');
    if (label) { label.textContent = 'Contained'; label.style.color = 'rgba(16,185,129,.8)'; }
    if (icon) icon.textContent = '\u2705';
    if (cipher && cipher.hasDesk) {
      showThoughtBubble('cipher', 'Threat contained. All clear.');
    }
  }, 4000);
}

function resolveThreat(overlay, cx, cy, cipherHome) {
  // Green CLEAR pulse from center
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const pulse = document.createElement('div');
      pulse.className = 'threat-clear';
      pulse.style.cssText = `left:${cx}px;top:${cy}px`;
      overlay.appendChild(pulse);
      setTimeout(() => pulse.remove(), 1600);
    }, i * 300);
  }

  // Fade out overlay
  setTimeout(() => {
    overlay.classList.add('fading');
    agentLayerEl.classList.remove('threat-active');

    // Walk Cipher back
    if (cipherHome) {
      walkAgentTo('cipher', cipherHome.x, cipherHome.y);
    }

    // Flash all screens green — resolved
    for (const [id, a] of agents) {
      if (a.screenEl) flashScreen(id, 'success');
    }

    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
      _threatActive = false;
    }, 800);
  }, 800);
}

/* ── Conversation lines ── */
function drawConversationLine(fromId, toId) {
  const a = agents.get(fromId), b = agents.get(toId);
  if (!a || !b || !a.hasDesk || !b.hasDesk) return;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'absolute inset-0');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5';

  const midX = (a.pos.x + b.pos.x) / 2;
  const midY = Math.min(a.pos.y, b.pos.y) - 30;

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `<linearGradient id="lg-${fromId}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="rgba(139,92,246,.6)"/><stop offset="50%" stop-color="rgba(236,72,153,.6)"/><stop offset="100%" stop-color="rgba(6,182,212,.6)"/></linearGradient>`;
  svg.appendChild(defs);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${a.pos.x} ${a.pos.y - 20} Q ${midX} ${midY} ${b.pos.x} ${b.pos.y - 20}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', `url(#lg-${fromId})`);
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-dasharray', '8,4');
  path.style.animation = 'dash 1s linear infinite';
  svg.appendChild(path);

  lineLayerEl.appendChild(svg);
  setTimeout(() => svg.parentNode && svg.parentNode.removeChild(svg), 4000);
}

/* ── Agent modal ── */
function showModal(id) {
  const a = agents.get(id);
  if (!a) return;
  const d = a.def;
  const statusColor = a.status === 'error' ? '#f43f5e' : (a.status === 'working' || a.status === 'active') ? '#10b981' : '#f59e0b';

  modalCardEl.innerHTML = `
    <div class="modal-agent-header">
      <div class="modal-avatar" style="background:${d.accent};--agent-glow:${d.glow}">${d.avatar.startsWith('face-') ? getAgentFaceSvg(d.avatar) : d.avatar}</div>
      <div>
        <div class="modal-name">${d.name}</div>
        <div class="modal-role">${d.role}</div>
      </div>
    </div>
    <div class="modal-stats">
      <div class="modal-stat">
        <div class="modal-stat-label">Status</div>
        <div class="modal-stat-value" style="color:${statusColor};text-transform:capitalize">${a.status}</div>
      </div>
      <div class="modal-stat">
        <div class="modal-stat-label">Energy</div>
        <div class="modal-stat-value">${a.energy}%</div>
      </div>
    </div>
    <div class="modal-rows">
      <div class="modal-row"><span class="modal-row-label">Current Task</span><span class="modal-row-value">${a.task || 'Idle'}</span></div>
      <div class="modal-row"><span class="modal-row-label">Messages</span><span class="modal-row-value">${a.msgs}</span></div>
      <div class="modal-row"><span class="modal-row-label">Tasks Completed</span><span class="modal-row-value" style="color:#10b981">${a.tasks}</span></div>
    </div>
    <button class="modal-close" style="background:${d.accent}">Close</button>
  `;
  modalCardEl.querySelector('.modal-close').addEventListener('click', () => { modalEl.style.display = 'none'; });
  modalEl.style.display = 'flex';
}
modalEl.addEventListener('click', (e) => { if (e.target === modalEl) modalEl.style.display = 'none'; });

/* ── Status bar ── */
function renderStatusbar() {
  statusbarAgentsEl.innerHTML = '';
  for (const [id, a] of agents) {
    const d = a.def;
    const dotColor = a.status === 'error' ? '#f43f5e' : (a.status === 'working' || a.status === 'active') ? '#10b981' : '#64748b';
    const chip = document.createElement('div');
    chip.className = 'statusbar-chip';
    chip.innerHTML = `
      <div class="statusbar-chip-avatar" style="background:${d.accent}">${d.avatar.startsWith('face-') ? getAgentFaceSvg(d.avatar) : d.avatar}</div>
      <span class="statusbar-chip-name">${d.name}</span>
      <div class="statusbar-chip-dot" style="background:${dotColor};box-shadow:0 0 6px ${dotColor}"></div>
    `;
    chip.addEventListener('click', () => showModal(id));
    statusbarAgentsEl.appendChild(chip);
  }
}

/* ── Stat cards ── */
function updateStatCards() {
  document.getElementById('statAgents').textContent = agents.size;
  document.getElementById('statTasks').textContent = tasksDone;
  document.getElementById('statMessages').textContent = messageCount;
  document.getElementById('statSignals').textContent = signalCount;
}

/* ── Feed ── */
function feedTypeClass(type) {
  if (type.includes('error') || type.includes('threat')) return 'type-error';
  if (type.includes('mission')) return 'type-mission';
  if (type.includes('task') || type.includes('progress')) return 'type-task';
  if (type.includes('message')) return 'type-message';
  if (type.includes('think')) return 'type-thinking';
  if (type.includes('tool') || type.includes('done')) return 'type-tool';
  if (type.includes('conversation')) return 'type-conversation';
  if (type.includes('move')) return 'type-move';
  if (type.includes('status')) return 'type-status';
  return 'type-task';
}

function addFeedItem(evt) {
  const agentId = normalizeAgentId(evt.agent);
  const def = getAgentDef(agentId);
  const parts = [];
  if (evt.task) parts.push(evt.task);
  if (typeof evt.progress === 'number') parts.push(`${Math.round(evt.progress * 100)}%`);
  if (evt.text) parts.push(evt.text.slice(0, 120));
  const content = parts.join(' · ') || '—';

  const div = document.createElement('div');
  div.className = 'feed-item';
  div.innerHTML = `
    <div class="feed-item-avatar" style="background:${def.accent}">${def.avatar.startsWith('face-') ? getAgentFaceSvg(def.avatar) : def.avatar}</div>
    <div class="feed-item-body">
      <div class="feed-item-header">
        <span class="feed-item-name">${def.name}</span>
        <span class="feed-item-type ${feedTypeClass(evt.type)}">${evt.type}</span>
      </div>
      <div class="feed-item-content">${escHtml(content)}</div>
    </div>
    <div class="feed-item-right">
      <span class="feed-item-time">${new Date(evt.ts || Date.now()).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  `;
  feedEl.prepend(div);
  while (feedEl.children.length > 50) feedEl.removeChild(feedEl.lastChild);
  feedCountEl.textContent = `${feedEl.children.length} events`;
}

/* ── Helpers ── */
function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function nowStr() { return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

function setStatus(ok, text) {
  statusEl.textContent = text;
  statusEl.classList.toggle('ok', !!ok);
  statusEl.classList.toggle('bad', ok === false);
}

/* ── Agent state management ── */
function upsertAgent(id, patch) {
  let a = agents.get(id);
  if (!a) a = createAgentEl(id);
  if (patch.pos) a.pos = patch.pos;
  if (patch.status) a.status = patch.status;
  if (patch.task !== undefined) a.task = patch.task;
  if (patch.energy !== undefined) a.energy = patch.energy;
  agents.set(id, a);
  updateAgentEl(id);
  renderStatusbar();
}

/* ── Event posting ── */
async function postEvent(evt) {
  const res = await fetch('/api/event', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(evt) });
  if (!res.ok) throw new Error(`POST /api/event failed: ${res.status}`);
}

/* ── Event handling ── */
function handleEvent(evt) {
  signalCount++;
  statsEl.textContent = `${signalCount} signals`;
  updateStatCards();
  addFeedItem(evt);

  const agent = normalizeAgentId(evt.agent);

  // ── Visitor messages: show at door, don't create a desk agent ──
  if (agent === 'visitor' && evt.type === 'message' && evt.text) {
    messageCount++;
    showVisitorMessage(evt.text);
    missionTextEl.textContent = `Visitor: ${evt.text.slice(0, 60)}`;
    updateStatCards();
    return;
  }

  // Track activity for sleep detection + mood workload
  markActivity(agent);
  if (['tool_call', 'thinking', 'task.started', 'task.done', 'task.error', 'message'].includes(evt.type)) {
    recordWorkload(agent);
  }

  if (evt.type === 'agent.move' && evt.pos && !_standupInProgress) {
    const wrap = canvas.parentElement;
    const w = wrap?.clientWidth || 800;
    const h = wrap?.clientHeight || 500;
    let px, py;
    if (evt.pos.x <= 1 && evt.pos.y <= 1 && evt.pos.x >= 0 && evt.pos.y >= 0) {
      // Normalized 0-1 coordinates → pixel position on canvas
      px = Math.max(40, Math.min(w - 40, evt.pos.x * w));
      py = Math.max(70, Math.min(h - 90, evt.pos.y * h));
    } else {
      // Grid coordinates → offset from desk
      const deskIdx = agents.has(agent) ? Array.from(agents.keys()).indexOf(agent) : agents.size;
      const desk = DESK_POSITIONS[deskIdx % DESK_POSITIONS.length];
      px = desk.x + (evt.pos.x % 3 - 1) * 30;
      py = desk.y + 30 + (evt.pos.y % 3 - 1) * 8;
    }
    // Animate walk instead of teleporting
    if (!agents.has(agent)) upsertAgent(agent, { status: 'idle' });
    walkAgentTo(agent, px, py);
  }

  if (evt.type === 'agent.status' && evt.status) {
    upsertAgent(agent, { status: evt.status });
    if (evt.status === 'error') triggerErrorShake(agent);
    // Cancel coffee/smoke break when agent becomes active
    if (evt.status === 'working' || evt.status === 'active') {
      cancelCoffeeBreak(agent);
      stopThinkingPace(agent);
      if (agent === 'wraith' && _smokeInterval) { clearInterval(_smokeInterval); _smokeInterval = null; }
    }
    // Schedule break when agent goes idle
    if (evt.status === 'idle' || evt.status === 'waiting') {
      if (agent === 'wraith') scheduleWraithSmoke();
      else scheduleCoffeeBreak(agent);
    }
  }

  if (evt.type === 'task.started') {
    cancelCoffeeBreak(agent);
    stopThinkingPace(agent);
    upsertAgent(agent, { status: 'working', task: evt.task || null });
    // Fast typing for tool-heavy tasks
    const a = agents.get(agent);
    if (a && a.el) a.el.classList.remove('fast-typing');
    missionTextEl.textContent = `${getAgentDef(agent).name}: started ${evt.task || 'task'}`;
  }
  if (evt.type === 'task.progress') {
    upsertAgent(agent, { status: 'working' });
  }
  if (evt.type === 'task.done') {
    tasksDone++;
    const a = agents.get(agent);
    if (a) a.tasks++;
    stopThinkingPace(agent);
    if (a && a.el) a.el.classList.remove('fast-typing');
    upsertAgent(agent, { status: 'idle', task: null });
    flashScreen(agent, 'success');
    missionTextEl.textContent = `${getAgentDef(agent).name}: completed ${evt.task || 'task'}`;
    updateStatCards();
    // Schedule break now that agent is idle
    if (agent === 'wraith') scheduleWraithSmoke();
    else scheduleCoffeeBreak(agent);
  }
  if (evt.type === 'task.error') {
    stopThinkingPace(agent);
    upsertAgent(agent, { status: 'error', task: evt.task || null });
    triggerErrorShake(agent);
    flashScreen(agent, 'error');
    missionTextEl.textContent = `${getAgentDef(agent).name}: error in ${evt.task || 'task'}`;
    // Trigger threat detection — only for recent events (not history replay)
    const evtAge = Date.now() - (evt.ts || Date.now());
    if (evtAge < 30000) triggerThreatMode(evt.text || evt.task || 'Error detected');
  }

  if (evt.type === 'message' && evt.text) {
    messageCount++;
    const a = agents.get(agent);
    if (a) a.msgs++;
    showSpeechBubble(agent, evt.text);
    missionTextEl.textContent = `${getAgentDef(agent).name}: ${evt.text.slice(0, 60)}`;
    updateStatCards();
  }
  if (evt.type === 'thinking' && evt.text) {
    showSpeechBubble(agent, evt.text);
    upsertAgent(agent, { status: 'working' });
    // Start thinking pace (small wander near desk)
    startThinkingPace(agent);
    // Slower typing bob for thinking
    const a = agents.get(agent);
    if (a && a.el) a.el.classList.remove('fast-typing');
  }
  if (evt.type === 'tool_call' && evt.text) {
    stopThinkingPace(agent);
    upsertAgent(agent, { status: 'working', task: evt.text });
    // Fast typing for tool calls
    const a = agents.get(agent);
    if (a && a.el) a.el.classList.add('fast-typing');
  }
  // Mission events
  if (evt.type.startsWith('mission.')) {
    handleMissionEvent(evt);
  }

  // Standup trigger — can be called via POST /api/event { type: "standup", agent: "dilo", text: "agenda" }
  if (evt.type === 'standup') {
    const attendees = ['dilo'];
    for (const [id, a] of agents) {
      if (id !== 'dilo' && a.hasDesk) attendees.push(id);
    }
    if (attendees.length > 1) {
      startStandup(attendees, evt.text || 'Team standup');
    }
  }

  // Threat detection — can be triggered via POST /api/event { type: "threat", text: "description" }
  if (evt.type === 'threat') {
    triggerThreatMode(evt.text || 'Threat detected');
  }

  // Celebrate / high-five — POST { type: "celebrate" }
  if (evt.type === 'celebrate') {
    const all = Array.from(agents.entries()).filter(([, a]) => a.hasDesk).map(([id]) => id);
    highfiveBurst(all);
    for (const [id, a] of agents) { if (a.screenEl) flashScreen(id, 'success'); }
  }

  // Coffee break — POST { type: "coffee", agent: "phantom" } or all
  if (evt.type === 'coffee') {
    if (agent && agents.has(agent) && agent !== 'all') {
      cancelCoffeeBreak(agent);
      scheduleCoffeeBreak(agent);
      // Trigger immediately by clearing idle check
      const a = agents.get(agent);
      if (a) { a.status = 'idle'; }
    }
  }

  // Smoke break for Wraith — POST { type: "smoke" }
  if (evt.type === 'smoke') {
    if (_smokeInterval) { clearInterval(_smokeInterval); _smokeInterval = null; }
    cancelCoffeeBreak('wraith');
    scheduleWraithSmoke();
  }

  if (evt.type === 'conversation' && evt.text) {
    showSpeechBubble(agent, evt.text);
    const targetId = evt.task && agents.has(normalizeAgentId(evt.task)) ? normalizeAgentId(evt.task) : null;
    let target;
    if (targetId && targetId !== agent) {
      target = targetId;
    } else {
      const others = Array.from(agents.entries()).filter(([k, a]) => k !== agent && a.hasDesk).map(([k]) => k);
      target = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : null;
    }
    if (target) {
      if (!agents.has(target)) upsertAgent(target, { status: 'idle' });
      drawConversationLine(agent, target);
      animateDocPass(agent, target); // floating document icon
      const tb = agents.get(target);
      const sa = agents.get(agent);
      if (tb && tb.hasDesk && sa && sa.hasDesk && !_standupInProgress) {
        // Sender walks toward target
        walkAgentToAndBack(agent, tb.pos.x, tb.pos.y);
        // Target walks toward sender (meet halfway then return)
        cancelCoffeeBreak(target);
        if (target === 'wraith' && _smokeInterval) { clearInterval(_smokeInterval); _smokeInterval = null; }
        walkAgentToAndBack(target, sa.pos.x, sa.pos.y);
      }
    }
  }
}

/* ── Mission Board ── */
const missionBoardEl = document.getElementById('missionBoard');
const missions = new Map(); // missionId -> { agent, task, progress, latestStep, status, ts, fadeAt }

function handleMissionEvent(evt) {
  if (!evt.missionId) return;

  if (evt.type === 'mission.created') {
    // Skip missions older than 10 minutes (history replay guard)
    const age = Date.now() - (evt.ts || Date.now());
    if (age > 10 * 60 * 1000) return;
    missions.set(evt.missionId, {
      agent: normalizeAgentId(evt.agent),
      task: evt.task || 'Mission',
      progress: 0,
      latestStep: '',
      status: 'active',
      ts: evt.ts || Date.now(),
      fadeAt: null,
      involvedAgents: new Set([normalizeAgentId(evt.agent)]),
    });
    // Standup meeting: agents walk to meeting room, give updates, then disperse
    const leaderId = normalizeAgentId(evt.agent);
    const leaderAgent = agents.get(leaderId);
    if (leaderAgent && leaderAgent.hasDesk && !_standupInProgress) {
      const attendees = [leaderId];
      for (const [id, a] of agents) {
        if (id !== leaderId && a.hasDesk) attendees.push(id);
      }
      if (attendees.length > 1) {
        startStandup(attendees, evt.task || 'Mission briefing');
      }
    }
  }

  if (evt.type === 'mission.step') {
    const m = missions.get(evt.missionId);
    if (m) {
      m.progress = evt.progress || m.progress;
      m.latestStep = evt.text || m.latestStep;
      m.status = 'active';
      // Track which agents participated
      if (m.involvedAgents) m.involvedAgents.add(normalizeAgentId(evt.agent));
    }
  }

  if (evt.type === 'mission.completed') {
    const m = missions.get(evt.missionId);
    if (m) {
      m.progress = 1;
      m.status = 'completed';
      m.fadeAt = (evt.ts || Date.now()) + 30000;
      // High-five celebration for all involved agents
      const involved = m.involvedAgents ? [...m.involvedAgents] : [normalizeAgentId(evt.agent)];
      highfiveBurst(involved);
      // Golden aura for all involved agents (5s)
      for (const aid of involved) {
        const ag = agents.get(aid);
        if (ag) { ag._goldenUntil = Date.now() + 5000; applyMood(aid); }
      }
    }
  }

  if (evt.type === 'mission.failed') {
    const m = missions.get(evt.missionId);
    if (m) {
      m.status = 'failed';
      m.latestStep = evt.text || 'Failed';
      m.fadeAt = (evt.ts || Date.now()) + 30000;
    }
    const mAge = Date.now() - (evt.ts || Date.now());
    if (mAge < 30000) triggerThreatMode(evt.text || evt.task || 'Mission failed');
  }

  renderMissionBoard();
}

function renderMissionBoard() {
  // Prune faded missions
  const now = Date.now();
  for (const [id, m] of missions) {
    if (m.fadeAt && now > m.fadeAt) missions.delete(id);
  }

  if (missions.size === 0) {
    missionBoardEl.style.display = 'none';
    return;
  }

  missionBoardEl.style.display = 'block';

  // Show up to 4 most recent
  const sorted = [...missions.entries()]
    .sort(([, a], [, b]) => b.ts - a.ts)
    .slice(0, 4);

  missionBoardEl.innerHTML = `<div class="mission-board-title">Missions</div>` +
    sorted.map(([id, m]) => {
      const def = getAgentDef(m.agent);
      const faceSvg = def.avatar.startsWith('face-') ? getAgentFaceSvg(def.avatar) : null;
      const avatarHtml = faceSvg || def.avatar;
      const pct = Math.round(m.progress * 100);
      const statusClass = m.status === 'completed' ? 'mission-done' : m.status === 'failed' ? 'mission-fail' : 'mission-active';
      const fading = m.fadeAt ? ' mission-fading' : '';
      return `<div class="mission-card ${statusClass}${fading}">
        <div class="mission-card-avatar" style="background:${def.accent}">${avatarHtml}</div>
        <div class="mission-card-body">
          <div class="mission-card-task">${escHtml(m.task.slice(0, 50))}</div>
          <div class="mission-card-bar"><div class="mission-card-fill" style="width:${pct}%;background:${m.status === 'failed' ? '#f43f5e' : m.status === 'completed' ? '#10b981' : 'var(--accent)'}"></div></div>
          <div class="mission-card-step">${escHtml(m.latestStep.slice(0, 60)) || '...'}</div>
        </div>
        <div class="mission-card-status">
          <div class="mission-dot-${m.status}"></div>
        </div>
      </div>`;
    }).join('');
}

// Periodic cleanup of faded missions
setInterval(renderMissionBoard, 10000);

/* ── SSE + data loading ── */
async function loadRecent() {
  try {
    const res = await fetch('/api/events?limit=120');
    const data = await res.json();
    if (data?.events?.length) {
      const ordered = [...data.events].sort((a, b) => (a.ts || 0) - (b.ts || 0));
      for (const evt of ordered) handleEvent(evt);
    }
  } catch {}
}

function connectSse() {
  setStatus(null, 'connecting...');
  const es = new EventSource('/events');
  es.addEventListener('hello', () => setStatus(true, 'live'));
  es.addEventListener('ping', () => {});
  es.addEventListener('event', (e) => {
    if (isPaused) return;
    const evt = JSON.parse(e.data);
    handleEvent(evt);
  });
  es.onerror = () => {
    setStatus(false, 'reconnecting');
    es.close();
    setTimeout(connectSse, 1500);
  };
}

/* ── Toggle feed ── */
document.getElementById('btnToggleFeed').addEventListener('click', () => {
  const pane = document.getElementById('feedPane');
  const mainEl = document.querySelector('main');
  pane.classList.toggle('collapsed');
  mainEl.classList.toggle('feed-collapsed');
  // Re-layout office after transition
  setTimeout(resizeCanvas, 320);
});

/* ── Pause ── */
document.getElementById('btnPause').addEventListener('click', () => {
  isPaused = !isPaused;
  document.getElementById('pauseIcon').style.display = isPaused ? 'none' : 'block';
  document.getElementById('playIcon').style.display = isPaused ? 'block' : 'none';
  const btn = document.getElementById('btnPause');
  btn.classList.toggle('active', isPaused);
});

/* ── Test button ── */
document.getElementById('btnTest').addEventListener('click', async () => {
  const ts = Date.now();
  const mid = `test-${ts}`;
  // User message arrives → mission created
  await postEvent({ type: 'message', agent: 'dilo', text: 'User: Investigate BTC price drop and post summary', ts });
  await postEvent({ type: 'mission.created', agent: 'dilo', missionId: mid, task: 'Investigate BTC price drop', ts });
  setTimeout(() => postEvent({ type: 'task.started', agent: 'dilo', task: 'investigate-btc', ts: Date.now() }), 400);
  // Dilo delegates research to Nyx
  setTimeout(() => {
    postEvent({ type: 'conversation', agent: 'dilo', task: 'nyx', text: 'Nyx, investigate the BTC drop', ts: Date.now() });
    postEvent({ type: 'mission.step', agent: 'nyx', missionId: mid, text: 'Dispatching intel gatherer', progress: 0.1, ts: Date.now() });
  }, 800);
  setTimeout(() => postEvent({ type: 'task.started', agent: 'nyx', task: 'research-btc', ts: Date.now() }), 1200);
  setTimeout(() => {
    postEvent({ type: 'tool_call', agent: 'nyx', text: 'tool: web_search', ts: Date.now() });
    postEvent({ type: 'mission.step', agent: 'nyx', missionId: mid, text: 'tool: web_search', progress: 0.25, ts: Date.now() });
  }, 1600);
  // Dilo delegates data analysis to Cipher
  setTimeout(() => {
    postEvent({ type: 'conversation', agent: 'dilo', task: 'cipher', text: 'Cipher, pull the price charts', ts: Date.now() });
    postEvent({ type: 'mission.step', agent: 'cipher', missionId: mid, text: 'Dispatching data analyst', progress: 0.35, ts: Date.now() });
  }, 2000);
  setTimeout(() => postEvent({ type: 'task.started', agent: 'cipher', task: 'analyze-charts', ts: Date.now() }), 2400);
  setTimeout(() => {
    postEvent({ type: 'thinking', agent: 'cipher', text: 'Analyzing 24h price movement...', ts: Date.now() });
    postEvent({ type: 'mission.step', agent: 'cipher', missionId: mid, text: 'Analyzing charts', progress: 0.5, ts: Date.now() });
  }, 2800);
  // Nyx reports back
  setTimeout(() => {
    postEvent({ type: 'conversation', agent: 'nyx', task: 'dilo', text: 'Found: whale liquidation triggered cascade', ts: Date.now() });
    postEvent({ type: 'mission.step', agent: 'nyx', missionId: mid, text: 'Intel received', progress: 0.6, ts: Date.now() });
  }, 3500);
  setTimeout(() => postEvent({ type: 'task.done', agent: 'nyx', task: 'research-btc', ts: Date.now() }), 3800);
  // Cipher reports back
  setTimeout(() => {
    postEvent({ type: 'conversation', agent: 'cipher', task: 'dilo', text: 'Charts confirm -4.2% in 6h, support at 62k', ts: Date.now() });
    postEvent({ type: 'mission.step', agent: 'cipher', missionId: mid, text: 'Data analysis complete', progress: 0.75, ts: Date.now() });
  }, 4200);
  setTimeout(() => postEvent({ type: 'task.done', agent: 'cipher', task: 'analyze-charts', ts: Date.now() }), 4500);
  // Dilo sends to Pulse to post
  setTimeout(() => {
    postEvent({ type: 'conversation', agent: 'dilo', task: 'pulse', text: 'Pulse, post the BTC summary', ts: Date.now() });
    postEvent({ type: 'mission.step', agent: 'pulse', missionId: mid, text: 'Posting via Pulse', progress: 0.85, ts: Date.now() });
  }, 5000);
  setTimeout(() => postEvent({ type: 'task.started', agent: 'pulse', task: 'post-summary', ts: Date.now() }), 5300);
  setTimeout(() => postEvent({ type: 'tool_call', agent: 'pulse', text: 'tool: moltbook_post', ts: Date.now() }), 5600);
  setTimeout(() => postEvent({ type: 'task.done', agent: 'pulse', task: 'post-summary', ts: Date.now() }), 6000);
  // Dilo wraps up → mission completed
  setTimeout(() => postEvent({ type: 'message', agent: 'dilo', text: 'Done — BTC analysis posted. Whale liquidation cascaded.', ts: Date.now() }), 6500);
  setTimeout(() => {
    postEvent({ type: 'task.done', agent: 'dilo', task: 'investigate-btc', ts: Date.now() });
    postEvent({ type: 'mission.completed', agent: 'dilo', missionId: mid, task: 'Investigate BTC price drop', ts: Date.now() });
  }, 6800);
});

/* ── Idle Chatter System (AI-powered) ── */
let _chatterTimer = null;
let _chatterActive = false;

function getIdleAgents() {
  const idle = [];
  for (const [id, a] of agents) {
    if (!a.hasDesk) continue;
    if (a.el && a.el.classList.contains('walking')) continue;
    if (_pacingAgents.has(id)) continue;
    const isIdle = a.status === 'idle' || a.status === 'waiting' || !a.status;
    if (isIdle) idle.push(id);
  }
  return idle;
}

function startIdleChatter() {
  if (_chatterTimer) return;
  scheduleNextChatter();
}

function scheduleNextChatter() {
  // 20-40s random interval
  const delay = (20 + Math.random() * 20) * 1000;
  _chatterTimer = setTimeout(() => {
    _chatterTimer = null;
    doIdleChatter();
    scheduleNextChatter();
  }, delay);
}

async function fetchChatterLines(nameA, roleA, nameB, roleB) {
  try {
    const res = await fetch('/api/chatter', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nameA, roleA, nameB, roleB }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.lineA && data.lineB) return data;
    return null;
  } catch {
    return null;
  }
}

async function doIdleChatter() {
  if (_standupInProgress || _threatActive || _chatterActive) return;
  const idle = getIdleAgents();
  if (idle.length < 2) return;

  // Pick two random idle agents
  const shuffled = idle.sort(() => Math.random() - 0.5);
  const agentA = shuffled[0];
  const agentB = shuffled[1];

  const defA = getAgentDef(agentA);
  const defB = getAgentDef(agentB);

  // Fetch AI-generated lines
  const lines = await fetchChatterLines(defA.name, defA.role, defB.name, defB.role);
  if (!lines) return;

  _chatterActive = true;

  // Agent A speaks first
  showSpeechBubble(agentA, lines.lineA);
  drawConversationLine(agentA, agentB);

  // Both walk toward each other
  const a = agents.get(agentA), b = agents.get(agentB);
  if (a && b && a.homePos && b.homePos) {
    cancelCoffeeBreak(agentA);
    cancelCoffeeBreak(agentB);
    if (agentA === 'wraith' && _smokeInterval) { clearInterval(_smokeInterval); _smokeInterval = null; }
    if (agentB === 'wraith' && _smokeInterval) { clearInterval(_smokeInterval); _smokeInterval = null; }
    walkAgentToAndBack(agentA, b.pos.x, b.pos.y);
    walkAgentToAndBack(agentB, a.pos.x, a.pos.y);
  }

  // Agent B responds after a short delay
  setTimeout(() => {
    showSpeechBubble(agentB, lines.lineB);
  }, 2200);

  // Reset chatter lock after conversation ends
  setTimeout(() => {
    _chatterActive = false;
    // Re-schedule breaks for agents if still idle
    for (const id of [agentA, agentB]) {
      const ag = agents.get(id);
      if (ag) {
        const isIdle = ag.status === 'idle' || ag.status === 'waiting' || !ag.status;
        if (isIdle) {
          if (id === 'wraith') scheduleWraithSmoke();
          else scheduleCoffeeBreak(id);
        }
      }
    }
  }, 6000);

  // Log to feed
  addFeedItem({ type: 'chatter', agent: agentA, text: `${defA.name} → ${defB.name}: "${lines.lineA}"`, ts: Date.now() });
}

// Start chatter system after a short warmup
setTimeout(startIdleChatter, 10000);

/* ── Clock ── */
setInterval(() => { clockEl.textContent = nowStr(); }, 250);

/* ── Periodic screen content refresh for active agents ── */
setInterval(() => {
  for (const [id, a] of agents) {
    if (!a.screenEl) continue;
    const isActive = a.status === 'working' || a.status === 'active';
    if (isActive) a.screenEl.innerHTML = getScreenContent(id);
  }
}, 3000);

/* ── Init ── */
window.addEventListener('resize', resizeCanvas);
spawnParticles();
computeDeskPositions();
resizeCanvas();

// Pre-create all known agents so standup/huddle can find them immediately
for (const id of Object.keys(AGENT_DEFS)) {
  createAgentEl(id);
  markActivity(id);
  if (id === 'wraith') scheduleWraithSmoke();
  else scheduleCoffeeBreak(id);
}

function repositionAgents() {
  if (DESK_POSITIONS.length === 0) return;
  let deskIdx = 0;
  for (const [id, a] of agents) {
    if (!a.hasDesk) continue;
    const desk = DESK_POSITIONS[deskIdx % DESK_POSITIONS.length];
    const isBoss = !!desk.boss;
    a.pos = { x: desk.x, y: desk.y + (isBoss ? 40 : 30) };
    a.homePos = { ...a.pos };
    updateAgentEl(id);
    // Position screen overlay over monitor
    if (a.screenEl) {
      const mw = isBoss ? 80 : 60, mh = isBoss ? 52 : 44;
      a.screenEl.style.left = (desk.x - mw / 2 + 4) + 'px';
      a.screenEl.style.top = (desk.y - mh - 6) + 'px';
      a.screenEl.style.width = (mw - 8) + 'px';
      a.screenEl.style.height = (mh - 8) + 'px';
    }
    deskIdx++;
  }
}

renderStatusbar();
updateStatCards();
if (!__officeDisableStream) {
loadRecent().then(() => { renderMissionBoard(); connectSse(); });
}

// Seed all known agents so they appear on canvas even without events
for (const id of Object.keys(AGENT_DEFS)) {
  if (id === 'visitor') continue;
  if (!agents.has(id)) upsertAgent(id, { status: 'idle' });
}

window.__officeHandleEvent = handleEvent;
}
