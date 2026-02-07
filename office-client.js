/**
 * Standalone Dilo Office client (local)
 *
 * Posts events into the standalone office server (default http://localhost:3010).
 */

const OFFICE_URL = process.env.OFFICE_URL || 'http://localhost:3010';

async function post(evt, { retries = 6 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(`${OFFICE_URL}/api/event`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(evt),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      return data;
    } catch (e) {
      lastErr = e;
      // Backoff for transient network errors (server restarting, connection resets, etc.)
      const delay = Math.min(2000, 150 * Math.pow(1.6, i));
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

function now() { return Date.now(); }

module.exports = {
  post,
  agentMove: (agent, pos) => post({ type: 'agent.move', agent, pos, ts: now() }),
  agentStatus: (agent, status, text) => post({ type: 'agent.status', agent, status, text, ts: now() }),

  taskStarted: (agent, task) => post({ type: 'task.started', agent, task, ts: now() }),
  taskProgress: (agent, task, progress) => post({ type: 'task.progress', agent, task, progress, ts: now() }),
  taskDone: (agent, task) => post({ type: 'task.done', agent, task, ts: now() }),
  taskError: (agent, task, text) => post({ type: 'task.error', agent, task, text, ts: now() }),

  message: (agent, text) => post({ type: 'message', agent, text, ts: now() }),
  thinking: (agent, text) => post({ type: 'thinking', agent, text, ts: now() }),
  toolCall: (agent, tool, text) => post({ type: 'tool_call', agent, text: text || tool, task: tool, ts: now() }),
  conversation: (agent, to, text) => post({ type: 'conversation', agent, task: to, text, ts: now() }),
};
