#!/usr/bin/env node
/**
 * Standalone Dilo Office Bridge
 *
 * Mirrors OpenClaw session JSONL logs into the standalone Dilo Office server.
 *
 * Start office server:
 *   node office/server.js
 * Start bridge:
 *   node office-bridge.js
 */

const fs = require('fs');
const path = require('path');
const office = require('./office-client');

const SESSIONS_DIR = process.env.OPENCLAW_SESSIONS_DIR
  || path.join(process.env.HOME || process.env.USERPROFILE || '', '.openclaw/agents/main/sessions');

const state = new Map();
const seen = new Set();
const lastMove = new Map(); // agent -> ts

const GRID_W = 14;
const GRID_H = 10;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function safeJson(line) { try { return JSON.parse(line); } catch { return null; } }

function agentIdFromFile(file) {
  const base = path.basename(file, '.jsonl');
  // Use something stable + human for main + subagents
  if (base.startsWith('agent:main:main')) return 'dilo';
  if (base.startsWith('agent:main:subagent:')) return `sub:${base.slice(-8)}`;
  return base.length > 18 ? base.slice(0, 18) : base;
}

function maybeMove(agent) {
  const t = Date.now();
  const lm = lastMove.get(agent) || 0;
  if (t - lm < 2500) return;
  lastMove.set(agent, t);
  const pos = { x: Math.floor(Math.random() * GRID_W), y: Math.floor(Math.random() * GRID_H) };
  // Fire and forget
  office.agentMove(agent, pos).catch(() => {});
}

async function handleObj(file, obj) {
  if (!obj || typeof obj !== 'object') return;

  const agent = agentIdFromFile(file);

  const safe = async (fn) => {
    try { return await fn(); } catch { return null; }
  };

  const key = obj.id ? `${file}:${obj.id}` : null;
  if (key) {
    if (seen.has(key)) return;
    seen.add(key);
    if (seen.size > 8000) {
      for (const k of Array.from(seen).slice(0, 2000)) seen.delete(k);
    }
  }

  if (obj.type === 'session') {
    await safe(() => office.agentStatus(agent, 'active', 'online'));
    maybeMove(agent);
    return;
  }

  if (obj.type === 'message' && obj.message) {
    const m = obj.message;

    // User message arriving into session
    if (m.role === 'user') {
      const text = (m.content || []).map(p => p?.text).filter(Boolean).join(' ').slice(0, 240);
      if (text) await safe(() => office.message(agent, `User: ${text}`));
      maybeMove(agent);
      return;
    }

    // Assistant content parts: thinking + tool calls
    if (m.role === 'assistant' && Array.isArray(m.content)) {
      for (const part of m.content) {
        if (part?.type === 'thinking') {
          await safe(() => office.thinking(agent, (part.thinking || 'thinking…').toString().slice(0, 240)));
          await safe(() => office.agentStatus(agent, 'working'));
          maybeMove(agent);
        }
        if (part?.type === 'toolCall') {
          const tool = part?.name || 'tool';
          await safe(() => office.toolCall(agent, tool, `tool: ${tool}`));
          await safe(() => office.agentStatus(agent, 'working'));
          // If we are spawning subagents or messaging them, show as conversation
          if (tool === 'sessions_spawn') {
            await safe(() => office.conversation(agent, 'subagents', 'spawn'));
          }
          if (tool === 'sessions_send') {
            await safe(() => office.conversation(agent, 'subagents', 'message'));
          }
          maybeMove(agent);
        }
      }

      // Regular assistant text
      const text = m.content
        .filter(p => p?.type === 'text' && typeof p.text === 'string')
        .map(p => p.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 240);

      if (text) {
        await safe(() => office.message(agent, text));
        // treat as finishing a step
        await safe(() => office.agentStatus(agent, 'idle'));
        maybeMove(agent);
      }

      return;
    }

    if (m.role === 'toolResult') {
      const toolName = m.toolName || 'tool';
      await safe(() => office.taskDone(agent, toolName));
      maybeMove(agent);
      return;
    }
  }

  if (obj.type === 'error' || obj.customType === 'error') {
    await safe(() => office.taskError(agent, 'error', 'error'));
    await safe(() => office.agentStatus(agent, 'error'));
    maybeMove(agent);
  }
}

async function pollFile(file) {
  const cur = state.get(file) || { pos: 0, buf: '' };
  let st;
  try { st = fs.statSync(file); } catch { return; }

  if (st.size < cur.pos) { cur.pos = 0; cur.buf = ''; }
  if (st.size === cur.pos) { state.set(file, cur); return; }

  const fd = fs.openSync(file, 'r');
  try {
    const len = st.size - cur.pos;
    const buf = Buffer.allocUnsafe(len);
    fs.readSync(fd, buf, 0, len, cur.pos);
    cur.pos = st.size;
    cur.buf += buf.toString('utf8');

    let idx;
    while ((idx = cur.buf.indexOf('\n')) >= 0) {
      const line = cur.buf.slice(0, idx);
      cur.buf = cur.buf.slice(idx + 1);
      if (!line.trim()) continue;
      const obj = safeJson(line);
      // eslint-disable-next-line no-await-in-loop
      await handleObj(file, obj);
    }
  } finally {
    fs.closeSync(fd);
    state.set(file, cur);
  }
}

function listJsonl() {
  try {
    return fs.readdirSync(SESSIONS_DIR)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => path.join(SESSIONS_DIR, f));
  } catch {
    return [];
  }
}

async function main() {
  console.log(`[office-bridge] sessions dir: ${SESSIONS_DIR}`);
  await office.message('dilo', 'Office bridge online').catch(() => {});

  while (true) {
    const files = listJsonl();
    for (const f of files) {
      // eslint-disable-next-line no-await-in-loop
      await pollFile(f);
    }
    await sleep(800);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
