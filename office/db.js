const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.OFFICE_DB_PATH || path.join(__dirname, 'events.jsonl');
const RETENTION_MS = 24 * 60 * 60 * 1000;

function nowMs() { return Date.now(); }

function ensureDir() {
  const dir = path.dirname(DB_PATH);
  fs.mkdirSync(dir, { recursive: true });
}

function appendEvent(evt) {
  ensureDir();
  const line = JSON.stringify(evt);
  fs.appendFileSync(DB_PATH, line + '\n', 'utf8');
}

function readRecentEvents({ limit = 200 } = {}) {
  ensureDir();
  if (!fs.existsSync(DB_PATH)) return [];

  // Simple approach: read whole file (24h retention + pruning keeps it bounded).
  const txt = fs.readFileSync(DB_PATH, 'utf8');
  const cutoff = nowMs() - RETENTION_MS;

  const events = [];
  for (const line of txt.split('\n')) {
    if (!line.trim()) continue;
    try {
      const evt = JSON.parse(line);
      if (evt.ts && evt.ts >= cutoff) events.push(evt);
    } catch {}
  }

  // return most recent first
  events.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  return events.slice(0, limit);
}

function prune() {
  ensureDir();
  if (!fs.existsSync(DB_PATH)) return;

  const cutoff = nowMs() - RETENTION_MS;
  const input = fs.readFileSync(DB_PATH, 'utf8');
  const kept = [];
  for (const line of input.split('\n')) {
    if (!line.trim()) continue;
    try {
      const evt = JSON.parse(line);
      if (evt.ts && evt.ts >= cutoff) kept.push(JSON.stringify(evt));
    } catch {}
  }
  fs.writeFileSync(DB_PATH, kept.join('\n') + (kept.length ? '\n' : ''), 'utf8');
}

module.exports = {
  DB_PATH,
  RETENTION_MS,
  appendEvent,
  readRecentEvents,
  prune,
};
