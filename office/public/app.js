const statusEl = document.getElementById('status');
const feedEl = document.getElementById('feed');
const clockEl = document.getElementById('clock');
const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');

const GRID_W = 14;
const GRID_H = 10;
const TILE_W = 56;
const TILE_H = 28;
const ORIGIN = { x: 160, y: 90 };

/** agentId -> {pos:{x,y}, status, task} */
const agents = new Map();

function nowStr() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function setStatus(ok, text) {
  statusEl.textContent = text;
  statusEl.classList.toggle('ok', !!ok);
  statusEl.classList.toggle('bad', ok === false);
}

function badgeClass(type) {
  if (type.includes('error')) return 'bad';
  if (type.includes('progress')) return 'warn';
  if (type.includes('done') || type.includes('started') || type.includes('status') || type.includes('move')) return 'good';
  return '';
}

function addFeedItem(evt) {
  const div = document.createElement('div');
  div.className = 'item';

  const meta = document.createElement('div');
  meta.className = 'meta';

  const badge = document.createElement('span');
  badge.className = `badge ${badgeClass(evt.type)}`;
  badge.textContent = evt.type;

  const who = document.createElement('span');
  who.textContent = evt.agent;

  const when = document.createElement('span');
  when.textContent = new Date(evt.ts || Date.now()).toLocaleTimeString();

  meta.appendChild(badge);
  meta.appendChild(who);
  meta.appendChild(when);

  const body = document.createElement('div');
  body.className = 'small';
  const parts = [];
  if (evt.task) parts.push(`task: ${evt.task}`);
  if (typeof evt.progress === 'number') parts.push(`progress: ${Math.round(evt.progress * 100)}%`);
  if (evt.status) parts.push(`status: ${evt.status}`);
  if (evt.pos) parts.push(`pos: (${evt.pos.x},${evt.pos.y})`);
  if (evt.text) parts.push(evt.text);
  body.textContent = parts.join(' · ') || '—';

  div.appendChild(meta);
  div.appendChild(body);

  feedEl.prepend(div);
  // cap
  while (feedEl.children.length > 80) feedEl.removeChild(feedEl.lastChild);
}

function isoToScreen(ix, iy) {
  const x = (ix - iy) * (TILE_W / 2) + ORIGIN.x;
  const y = (ix + iy) * (TILE_H / 2) + ORIGIN.y;
  return { x, y };
}

function screenToIso(sx, sy) {
  const dx = sx - ORIGIN.x;
  const dy = sy - ORIGIN.y;
  const ix = Math.round((dx / (TILE_W / 2) + dy / (TILE_H / 2)) / 2);
  const iy = Math.round((dy / (TILE_H / 2) - dx / (TILE_W / 2)) / 2);
  return { x: Math.max(0, Math.min(GRID_W - 1, ix)), y: Math.max(0, Math.min(GRID_H - 1, iy)) };
}

function drawTile(ix, iy) {
  const p = isoToScreen(ix, iy);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + TILE_W / 2, p.y + TILE_H / 2);
  ctx.lineTo(p.x, p.y + TILE_H);
  ctx.lineTo(p.x - TILE_W / 2, p.y + TILE_H / 2);
  ctx.closePath();

  const c1 = 'rgba(98,208,255,0.08)';
  const c2 = 'rgba(155,176,207,0.06)';
  ctx.fillStyle = (ix + iy) % 2 === 0 ? c1 : c2;
  ctx.strokeStyle = 'rgba(155,176,207,0.14)';
  ctx.lineWidth = 1;
  ctx.fill();
  ctx.stroke();
}

function drawAgent(id, a) {
  const p = isoToScreen(a.pos.x, a.pos.y);
  const y = p.y + TILE_H * 0.35;

  // shadow
  ctx.beginPath();
  ctx.ellipse(p.x, y + 10, 14, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();

  // body
  const color = a.status === 'error' ? '#ff5a7a' : (a.status === 'working' ? '#62d0ff' : '#9bb0cf');
  ctx.beginPath();
  ctx.arc(p.x, y, 12, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.stroke();

  // label
  ctx.font = '12px ui-sans-serif, system-ui';
  ctx.fillStyle = 'rgba(232,238,249,0.92)';
  ctx.textAlign = 'center';
  const label = id.length > 14 ? id.slice(0, 12) + '…' : id;
  ctx.fillText(label, p.x, y - 18);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      drawTile(x, y);
    }
  }

  // draw agents sorted back-to-front
  const list = Array.from(agents.entries()).map(([id, a]) => ({ id, a, z: a.pos.x + a.pos.y }));
  list.sort((m, n) => m.z - n.z);
  for (const { id, a } of list) drawAgent(id, a);

  requestAnimationFrame(render);
}

function upsertAgent(id, patch) {
  const cur = agents.get(id) || { pos: { x: 2, y: 2 }, status: 'idle', task: null };
  const next = {
    ...cur,
    ...patch,
    pos: patch.pos ? patch.pos : cur.pos,
  };
  agents.set(id, next);
}

async function postEvent(evt) {
  const res = await fetch('/api/event', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(evt),
  });
  if (!res.ok) throw new Error(`POST /api/event failed: ${res.status}`);
}

function handleEvent(evt) {
  addFeedItem(evt);

  if (evt.type === 'agent.move' && evt.pos) {
    upsertAgent(evt.agent, { pos: evt.pos });
  }

  if (evt.type === 'agent.status' && evt.status) {
    upsertAgent(evt.agent, { status: evt.status });
  }

  if (evt.type === 'task.started') {
    upsertAgent(evt.agent, { status: 'working', task: evt.task || null });
  }
  if (evt.type === 'task.done') {
    upsertAgent(evt.agent, { status: 'idle', task: null });
  }
  if (evt.type === 'task.error') {
    upsertAgent(evt.agent, { status: 'error', task: evt.task || null });
  }
}

function connectSse() {
  setStatus(null, 'connecting…');
  const es = new EventSource('/events');

  es.addEventListener('hello', () => setStatus(true, 'connected'));
  es.addEventListener('ping', () => {});
  es.addEventListener('event', (e) => {
    const evt = JSON.parse(e.data);
    handleEvent(evt);
  });

  es.onerror = () => {
    setStatus(false, 'disconnected (retrying)');
    es.close();
    setTimeout(connectSse, 1500);
  };
}

// UI: click-to-move main
canvas.addEventListener('click', async (e) => {
  const rect = canvas.getBoundingClientRect();
  const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const sy = (e.clientY - rect.top) * (canvas.height / rect.height);
  const pos = screenToIso(sx, sy);
  try {
    await postEvent({ type: 'agent.move', agent: 'main', pos });
  } catch (err) {
    console.error(err);
  }
});

document.getElementById('btnTest').addEventListener('click', async () => {
  const ts = Date.now();
  await postEvent({ type: 'task.started', agent: 'main', task: 'test', ts });
  setTimeout(() => postEvent({ type: 'task.progress', agent: 'main', task: 'test', progress: 0.5, ts: Date.now() }), 400);
  setTimeout(() => postEvent({ type: 'task.done', agent: 'main', task: 'test', ts: Date.now() }), 900);
});

setInterval(() => { clockEl.textContent = nowStr(); }, 250);

// init
upsertAgent('main', { pos: { x: 4, y: 3 }, status: 'idle' });
upsertAgent('sub:alpha', { pos: { x: 8, y: 2 }, status: 'idle' });
upsertAgent('sub:beta', { pos: { x: 6, y: 6 }, status: 'idle' });

render();
connectSse();
