#!/usr/bin/env node
/**
 * Dilo Office Bridge
 *
 * Watches OpenClaw session JSONL logs and mirrors notable events into
 * ClawdStore Ralph Fresh "Dilo Office".
 *
 * Usage:
 *   node dilo-office-bridge.js
 *
 * Env:
 *   DILO_OFFICE_URL=http://localhost:3000
 *   DILO_OFFICE_API_KEY=dilo-office-dev-key
 *   OPENCLAW_SESSIONS_DIR=/Users/<you>/.openclaw/agents/main/sessions
 */

const fs = require('fs');
const path = require('path');

const office = require('./dilo-office-client');

const SESSIONS_DIR = process.env.OPENCLAW_SESSIONS_DIR
  || path.join(process.env.HOME || process.env.USERPROFILE || '', '.openclaw/agents/main/sessions');

/** file -> { pos:number, buf:string } */
const state = new Map();
/** Dedup key set */
const seen = new Set();

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function safeJsonParse(line) {
  try { return JSON.parse(line); } catch { return null; }
}

function getAgentIdFromFile(file) {
  const base = path.basename(file, '.jsonl');
  // Keep main session as 'openclaw' if it looks like current agent:main logs; otherwise name by session id.
  return base === 'main' ? 'openclaw' : `sub:${base.slice(0, 8)}`;
}

function extractTextParts(contentArr) {
  if (!Array.isArray(contentArr)) return [];
  const out = [];
  for (const p of contentArr) {
    if (!p) continue;
    if (p.type === 'text' && typeof p.text === 'string') out.push(p.text);
    if (p.type === 'toolCall' && typeof p.name === 'string') out.push(`[tool:${p.name}]`);
  }
  return out;
}

async function handleEvent(file, obj) {
  if (!obj || typeof obj !== 'object') return;

  const agentId = getAgentIdFromFile(file);

  // Dedup by event id when available
  const key = obj.id ? `${file}:${obj.id}` : null;
  if (key) {
    if (seen.has(key)) return;
    seen.add(key);
    if (seen.size > 5000) {
      // basic GC
      for (const k of Array.from(seen).slice(0, 1000)) seen.delete(k);
    }
  }

  // Session started
  if (obj.type === 'session') {
    await office.log({ agentId, type: 'heartbeat', content: 'Session started', status: 'active' });
    return;
  }

  // Messages from model/tool
  if (obj.type === 'message' && obj.message) {
    const m = obj.message;

    // Tool call from assistant
    if (m.role === 'assistant' && Array.isArray(m.content)) {
      for (const part of m.content) {
        if (part?.type === 'toolCall') {
          const toolName = part.name || 'tool';
          await office.toolCall(toolName, `Calling ${toolName}`, { agentId });

          // Special-case: sub-agent spawn/send looks like "sessions_spawn" / "sessions_send" tool calls
          if (toolName === 'sessions_spawn') {
            await office.conversation('subagents', 'Spawning a sub-agent task', { agentId });
          }
          if (toolName === 'sessions_send') {
            await office.conversation('subagents', 'Sending message to a sub-agent', { agentId });
          }
        }
        if (part?.type === 'thinking') {
          // Sometimes thinking text is empty; still mark status
          const t = (part.thinking || 'Thinking…').toString().slice(0, 200);
          await office.thinking(t, { agentId });
        }
      }

      // If assistant produced normal text, log a task/message summary
      const texts = extractTextParts(m.content).filter(t => !t.startsWith('[tool:'));
      if (texts.length) {
        const joined = texts.join(' ').replace(/\s+/g, ' ').trim();
        if (joined) await office.message(joined.slice(0, 220), { agentId });
      }
      return;
    }

    // User message into that session
    if (m.role === 'user') {
      const texts = extractTextParts(m.content);
      const joined = texts.join(' ').replace(/\s+/g, ' ').trim();
      if (joined) {
        await office.log({ agentId, type: 'message', content: `User: ${joined.slice(0, 220)}`, sentiment: 'neutral' });
      }
      return;
    }
  }

  // Tool results (toolResult message)
  if (obj.type === 'message' && obj.message?.role === 'toolResult') {
    const toolName = obj.message.toolName || 'tool';
    await office.task(`Tool result: ${toolName}`, { agentId });
    return;
  }

  // Errors
  if (obj.type === 'error' || obj.customType === 'error') {
    await office.error('Error event', { agentId });
    return;
  }
}

async function pollFile(file) {
  const cur = state.get(file) || { pos: 0, buf: '' };
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    return;
  }

  // Truncation handling
  if (stat.size < cur.pos) {
    cur.pos = 0;
    cur.buf = '';
  }

  if (stat.size === cur.pos) {
    state.set(file, cur);
    return;
  }

  const fd = fs.openSync(file, 'r');
  try {
    const len = stat.size - cur.pos;
    const buf = Buffer.allocUnsafe(len);
    fs.readSync(fd, buf, 0, len, cur.pos);
    cur.pos = stat.size;
    cur.buf += buf.toString('utf8');

    let idx;
    while ((idx = cur.buf.indexOf('\n')) >= 0) {
      const line = cur.buf.slice(0, idx);
      cur.buf = cur.buf.slice(idx + 1);
      if (!line.trim()) continue;
      const obj = safeJsonParse(line);
      // eslint-disable-next-line no-await-in-loop
      await handleEvent(file, obj);
    }
  } finally {
    fs.closeSync(fd);
    state.set(file, cur);
  }
}

function listJsonlFiles() {
  try {
    return fs.readdirSync(SESSIONS_DIR)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => path.join(SESSIONS_DIR, f));
  } catch {
    return [];
  }
}

async function main() {
  console.log(`[dilo-office-bridge] sessions dir: ${SESSIONS_DIR}`);
  await office.updateStatus('active', 'Bridge online');

  while (true) {
    const files = listJsonlFiles();
    for (const f of files) {
      // eslint-disable-next-line no-await-in-loop
      await pollFile(f);
    }
    await sleep(800);
  }
}

main().catch(async (e) => {
  console.error(e);
  try { await office.error(`Bridge crashed: ${e?.message || e}`, { agentId: 'openclaw' }); } catch {}
  process.exit(1);
});
