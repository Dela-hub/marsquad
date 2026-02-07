/**
 * Dilo Office Client
 *
 * API-compatible-ish helper for emitting agent activity events to
 * ClawdStore Ralph Fresh "Dilo Office" endpoints.
 *
 * Default targets:
 *  - UI:      http://localhost:3000/admin/dilo-office
 *  - Webhook: POST http://localhost:3000/api/admin/dilo-office/webhook
 */

const DILO_OFFICE_URL = process.env.DILO_OFFICE_URL || 'http://localhost:3000';
const DILO_OFFICE_API_KEY = process.env.DILO_OFFICE_API_KEY || 'dilo-office-dev-key';

let defaultAgentId = 'openclaw';

function setAgentId(agentId) {
  defaultAgentId = agentId;
}

async function log(params) {
  try {
    const res = await fetch(`${DILO_OFFICE_URL}/api/admin/dilo-office/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DILO_OFFICE_API_KEY}`,
      },
      body: JSON.stringify({
        agentId: params.agentId || defaultAgentId,
        type: params.type,
        content: params.content,

        // Optional
        talkingTo: params.talkingTo,
        sentiment: params.sentiment,
        metadata: params.metadata,

        // Status updates (optional)
        status: params.status,
        currentTask: params.currentTask,
        energy: params.energy,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: data?.error || `HTTP ${res.status}` };
    return { success: true, activityId: data.activityId };
  } catch (e) {
    return { success: false, error: e?.message || String(e) };
  }
}

async function updateStatus(status, currentTask) {
  return log({
    type: 'heartbeat',
    content: currentTask || `Status: ${status}`,
    status,
    currentTask,
  });
}

async function thinking(content, options = {}) {
  return log({
    type: 'thinking',
    content,
    status: 'thinking',
    currentTask: content,
    ...options,
  });
}

async function toolCall(toolName, content, options = {}) {
  return log({
    type: 'tool_call',
    content: content || `Called ${toolName}`,
    metadata: { toolName, ...(options.metadata || {}) },
    ...options,
  });
}

async function message(content, options = {}) {
  return log({ type: 'message', content, sentiment: 'supportive', ...options });
}

async function task(content, options = {}) {
  return log({ type: 'task', content, ...options });
}

async function error(content, options = {}) {
  return log({ type: 'error', content, sentiment: 'error', status: 'error', ...options });
}

async function conversation(talkingTo, content, options = {}) {
  return log({ type: 'conversation', content, talkingTo, sentiment: 'curious', ...options });
}

async function insight(content, options = {}) {
  return log({ type: 'insight', content, sentiment: 'curious', ...options });
}

function createSubAgent(agentId) {
  return {
    log: (params) => log({ ...params, agentId }),
    updateStatus: (status, currentTask) => log({
      type: 'heartbeat',
      content: currentTask || `Status: ${status}`,
      status,
      currentTask,
      agentId,
    }),
    thinking: (content, options) => thinking(content, { ...options, agentId }),
    toolCall: (toolName, content, options) => toolCall(toolName, content, { ...options, agentId }),
    message: (content, options) => message(content, { ...options, agentId }),
    task: (content, options) => task(content, { ...options, agentId }),
    error: (content, options) => error(content, { ...options, agentId }),
    conversation: (talkingTo, content, options) => conversation(talkingTo, content, { ...options, agentId }),
    insight: (content, options) => insight(content, { ...options, agentId }),
  };
}

module.exports = {
  setAgentId,
  log,
  updateStatus,
  thinking,
  toolCall,
  message,
  task,
  error,
  conversation,
  insight,
  createSubAgent,

  // common sub-agents
  dilo: createSubAgent('dilo'),
  scout: createSubAgent('scout'),
  herald: createSubAgent('herald'),
  sage: createSubAgent('sage'),
  minion: createSubAgent('minion'),
  observer: createSubAgent('observer'),
};
