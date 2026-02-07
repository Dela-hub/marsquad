/* ── Observatory · Dilo Office ── */

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
  dilo:     { name: 'Dilo',     avatar: 'face', role: 'The Boss', accent: 'linear-gradient(135deg,#3b82f6,#6366f1)', glow: 'rgba(59,130,246,.4)', boss: true },
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
  const marginX = 120;
  const bossY = h * 0.14;
  const row1Y = h * 0.44;
  const row2Y = h * 0.72;
  const usableW = w - marginX * 2;

  DESK_POSITIONS = [];

  // Boss desk — center top
  DESK_POSITIONS.push({ x: w * 0.42, y: bossY, boss: true });

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

/* ── Normalize agent IDs ── */
const agentAliases = new Map();
let aliasCounter = 0;
const ALIAS_NAMES = ['researcher', 'spark', 'echo', 'flux', 'nova', 'drift', 'pulse', 'arc'];
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

function drawOffice() {
  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;
  ctx.clearRect(0, 0, w, h);

  // Windows along the top wall
  const winY = 20;
  ctx.fillStyle = 'rgba(99,102,241,.12)';
  ctx.strokeStyle = 'rgba(255,255,255,.06)';
  ctx.lineWidth = 1;
  const windowPositions = [w * 0.28, w * 0.42, w * 0.56, w * 0.70];
  windowPositions.forEach(wx => {
    ctx.beginPath();
    ctx.roundRect(wx - 50, winY, 100, 65, 8);
    ctx.fill(); ctx.stroke();
    // City light dots
    ctx.fillStyle = 'rgba(251,191,36,.15)';
    ctx.beginPath(); ctx.arc(wx - 15, winY + 48, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(wx + 12, winY + 44, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(wx + 30, winY + 50, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(99,102,241,.12)';
  });

  // Clock display (top right)
  ctx.fillStyle = 'rgba(30,41,59,.6)';
  ctx.strokeStyle = 'rgba(71,85,105,.5)';
  ctx.beginPath();
  ctx.roundRect(w - 130, 25, 100, 36, 10);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#10b981';
  ctx.font = '14px "SF Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(nowStr(), w - 80, 48);

  // Focus display (top left)
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

  // Desks — only draw ones that have agents, plus the boss desk always
  DESK_POSITIONS.forEach((d, i) => {
    // Boss desk always drawn; worker desks only if an agent occupies them
    const occupied = i === 0 || i < countDeskAgents();
    drawDesk(d.x, d.y, occupied, d.boss);
  });

  // Meeting area (right side)
  ctx.fillStyle = 'rgba(139,92,246,.1)';
  ctx.strokeStyle = 'rgba(139,92,246,.12)';
  ctx.beginPath();
  ctx.roundRect(w - 160, h * 0.35, 130, 90, 14);
  ctx.fill(); ctx.stroke();
  // Couch
  ctx.fillStyle = 'rgba(139,92,246,.18)';
  ctx.beginPath();
  ctx.roundRect(w - 150, h * 0.35 + 15, 110, 28, 8);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(w - 150, h * 0.35 + 50, 110, 28, 8);
  ctx.fill();

  // Server rack (bottom right)
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

  // Plants
  ctx.font = '24px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🪴', 30, h - 20);
  ctx.fillText('🌿', w - 150, h - 16);
  ctx.fillText('🪻', w * 0.5, h - 18);
}

function drawDesk(x, y, hasAgent, isBoss) {
  // Monitor
  const mw = isBoss ? 80 : 60, mh = isBoss ? 52 : 44;
  ctx.fillStyle = hasAgent
    ? 'rgba(30,41,59,.9)'
    : 'rgba(15,23,42,.9)';
  ctx.strokeStyle = 'rgba(71,85,105,.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - mw / 2, y - mh - 10, mw, mh, [6, 6, 0, 0]);
  ctx.fill(); ctx.stroke();

  // Screen glow
  if (hasAgent) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.roundRect(x - mw / 2 - 8, y - mh - 18, mw + 16, mh + 10, 12);
    ctx.fill();
    ctx.restore();
  }

  // Screen content (code lines)
  if (hasAgent) {
    const sx = x - mw / 2 + 5, sy = y - mh - 4;
    const lineColors = ['rgba(16,185,129,.5)', 'rgba(139,92,246,.35)', 'rgba(6,182,212,.4)', 'rgba(245,158,11,.25)'];
    lineColors.forEach((c, i) => {
      ctx.fillStyle = c;
      const lw = 10 + Math.random() * 24;
      ctx.fillRect(sx, sy + i * 8, lw, 2.5);
    });
  }

  // LED
  ctx.fillStyle = '#10b981';
  ctx.globalAlpha = .8;
  ctx.beginPath(); ctx.arc(x + mw / 2 - 8, y - mh - 4, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Stand
  ctx.fillStyle = 'rgba(71,85,105,.6)';
  ctx.fillRect(x - 5, y - 10, 10, 8);

  // Desk surface
  const dw = isBoss ? 140 : 104, dh = isBoss ? 46 : 40;
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

/* ── Dilo face SVG ── */
function diloFaceSvg() {
  return `<svg class="dilo-face" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Eyes -->
    <ellipse class="dilo-eye dilo-blink" cx="9" cy="11" rx="3.5" ry="4"/>
    <ellipse class="dilo-eye dilo-blink" cx="19" cy="11" rx="3.5" ry="4"/>
    <ellipse class="dilo-pupil" cx="9.5" cy="11.5" rx="1.8" ry="2.2"/>
    <ellipse class="dilo-pupil" cx="19.5" cy="11.5" rx="1.8" ry="2.2"/>
    <!-- Eye shine -->
    <circle cx="8" cy="9.5" r="1" fill="rgba(255,255,255,.8)"/>
    <circle cx="18" cy="9.5" r="1" fill="rgba(255,255,255,.8)"/>
    <!-- Smile -->
    <path class="dilo-mouth" d="M 9 19 Q 14 24 19 19"/>
  </svg>`;
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
    pos = { x: desk.x, y: desk.y + (isBoss ? 75 : 65) };
  } else {
    pos = { x: -200, y: -200 };
  }

  // Avatar content: SVG face for Dilo, emoji for others
  const avatarContent = def.avatar === 'face'
    ? diloFaceSvg()
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
    <div class="agent-legs" style="--leg-color:${legColor};--shoe-color:${shoeColor}">
      <div class="agent-leg agent-leg-l"><div class="agent-leg-shoe"></div></div>
      <div class="agent-leg agent-leg-r"><div class="agent-leg-shoe"></div></div>
    </div>
    <div class="agent-name" style="background:linear-gradient(135deg,${def.glow} 0%,transparent 100%)">${def.name}</div>
  `;
  el.style.pointerEvents = 'auto';
  el.addEventListener('click', () => showModal(id));
  agentLayerEl.appendChild(el);

  const agent = { pos, status: 'idle', task: null, def, energy: 100, el, bubbleEl: null, msgs: 0, tasks: 0, hasDesk, homePos: { ...pos } };
  agents.set(id, agent);
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

  // Walking class for Dilo face
  if (id === 'dilo' && isWorking) a.el.classList.add('working');
  else if (id === 'dilo') a.el.classList.remove('working');

  const energyBar = a.el.querySelector('.agent-energy-bar');
  if (energyBar) energyBar.style.width = a.energy + '%';
}

/* ── Agent walking animation ── */
function walkAgentTo(id, targetX, targetY, onDone) {
  const a = agents.get(id);
  if (!a || !a.hasDesk) return;

  a.el.classList.add('walking');

  const startX = a.pos.x, startY = a.pos.y;
  const dist = Math.sqrt((targetX - startX) ** 2 + (targetY - startY) ** 2);
  const duration = Math.min(Math.max(dist * 3, 400), 1500); // speed proportional to distance
  const startTime = performance.now();

  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const ease = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; // easeInOutQuad
    a.pos.x = startX + (targetX - startX) * ease;
    a.pos.y = startY + (targetY - startY) * ease;
    a.el.style.left = a.pos.x + 'px';
    a.el.style.top = a.pos.y + 'px';

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      a.el.classList.remove('walking');
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
      <div class="modal-avatar" style="background:${d.accent};--agent-glow:${d.glow}">${d.avatar === 'face' ? diloFaceSvg() : d.avatar}</div>
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
      <div class="statusbar-chip-avatar" style="background:${d.accent}">${d.avatar === 'face' ? '🧠' : d.avatar}</div>
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
  if (type.includes('error')) return 'type-error';
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
    <div class="feed-item-avatar" style="background:${def.accent}">${def.avatar === 'face' ? '🧠' : def.avatar}</div>
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

  if (evt.type === 'agent.move' && evt.pos) {
    // Convert grid pos to pixel pos
    const deskIdx = agents.has(agent) ? Array.from(agents.keys()).indexOf(agent) : agents.size;
    const desk = DESK_POSITIONS[deskIdx % DESK_POSITIONS.length];
    // Use evt.pos to nudge around desk area
    const px = desk.x + (evt.pos.x % 3 - 1) * 30;
    const py = desk.y + 55 + (evt.pos.y % 3 - 1) * 15;
    upsertAgent(agent, { pos: { x: px, y: py } });
  }

  if (evt.type === 'agent.status' && evt.status) {
    upsertAgent(agent, { status: evt.status });
  }

  if (evt.type === 'task.started') {
    upsertAgent(agent, { status: 'working', task: evt.task || null });
    missionTextEl.textContent = `${getAgentDef(agent).name}: started ${evt.task || 'task'}`;
  }
  if (evt.type === 'task.progress') {
    upsertAgent(agent, { status: 'working' });
  }
  if (evt.type === 'task.done') {
    tasksDone++;
    const a = agents.get(agent);
    if (a) a.tasks++;
    upsertAgent(agent, { status: 'idle', task: null });
    missionTextEl.textContent = `${getAgentDef(agent).name}: completed ${evt.task || 'task'}`;
    updateStatCards();
  }
  if (evt.type === 'task.error') {
    upsertAgent(agent, { status: 'error', task: evt.task || null });
    missionTextEl.textContent = `${getAgentDef(agent).name}: error in ${evt.task || 'task'}`;
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
  }
  if (evt.type === 'tool_call' && evt.text) {
    upsertAgent(agent, { status: 'working', task: evt.text });
  }
  if (evt.type === 'conversation' && evt.text) {
    showSpeechBubble(agent, evt.text);
    // Draw line to a random other desk agent and walk toward them
    const others = Array.from(agents.entries()).filter(([k, a]) => k !== agent && a.hasDesk).map(([k]) => k);
    if (others.length > 0) {
      const target = others[Math.floor(Math.random() * others.length)];
      drawConversationLine(agent, target);
      const tb = agents.get(target);
      if (tb) walkAgentToAndBack(agent, tb.pos.x, tb.pos.y);
    }
  }
}

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
  await postEvent({ type: 'task.started', agent: 'dilo', task: 'test-run', ts });
  await postEvent({ type: 'message', agent: 'dilo', text: 'Running diagnostics...', ts });
  setTimeout(() => postEvent({ type: 'task.progress', agent: 'dilo', task: 'test-run', progress: 0.5, ts: Date.now() }), 600);
  setTimeout(() => {
    postEvent({ type: 'conversation', agent: 'dilo', text: 'Hey Scout, check the logs', ts: Date.now() });
  }, 800);
  setTimeout(() => postEvent({ type: 'task.done', agent: 'dilo', task: 'test-run', ts: Date.now() }), 1500);
});

/* ── Clock ── */
setInterval(() => { clockEl.textContent = nowStr(); }, 250);

/* ── Init ── */
window.addEventListener('resize', resizeCanvas);
spawnParticles();
computeDeskPositions();
resizeCanvas();

// Create Dilo — the only real agent
createAgentEl('dilo');

function repositionAgents() {
  if (DESK_POSITIONS.length === 0) return;
  let deskIdx = 0;
  for (const [id, a] of agents) {
    if (!a.hasDesk) continue;
    const desk = DESK_POSITIONS[deskIdx % DESK_POSITIONS.length];
    const isBoss = !!desk.boss;
    a.pos = { x: desk.x, y: desk.y + (isBoss ? 75 : 65) };
    a.homePos = { ...a.pos };
    updateAgentEl(id);
    deskIdx++;
  }
}

renderStatusbar();
updateStatCards();
loadRecent().then(connectSse);
