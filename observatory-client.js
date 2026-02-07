/**
 * Observatory Client for OpenClaw
 *
 * This module allows OpenClaw and its sub-agents to log activities
 * to the ClawdStore Observatory for real-time monitoring.
 *
 * Usage:
 *   const observatory = require('./observatory-client');
 *
 *   // Log an activity
 *   await observatory.log({
 *     type: 'message',
 *     content: 'Responded to customer inquiry',
 *     storeCode: 'CAKE',
 *   });
 *
 *   // Update agent status
 *   await observatory.updateStatus('thinking', 'Processing order...');
 */

const OBSERVATORY_URL = process.env.OBSERVATORY_URL || 'http://localhost:3000';
const OBSERVATORY_API_KEY = process.env.OBSERVATORY_API_KEY || 'observatory-dev-key';

// Default agent ID - can be overridden
let defaultAgentId = 'openclaw';

/**
 * Set the default agent ID for this client instance
 */
function setAgentId(agentId) {
  defaultAgentId = agentId;
}

/**
 * Log an activity to the Observatory
 *
 * @param {Object} params - Activity parameters
 * @param {string} params.type - Activity type: message|order|payment|task|conversation|insight|heartbeat|thinking|tool_call|error
 * @param {string} params.content - Human-readable description
 * @param {string} [params.agentId] - Override default agent ID
 * @param {string} [params.storeCode] - Store identifier
 * @param {string} [params.storeName] - Store display name
 * @param {string} [params.talkingTo] - Who the agent is talking to
 * @param {string} [params.sentiment] - excited|supportive|curious|neutral|error
 * @param {Object} [params.metadata] - Extra data
 * @param {string} [params.status] - Agent status: active|idle|busy|thinking|error
 * @param {string} [params.currentTask] - Current task description
 * @param {number} [params.energy] - Energy level 0-100
 */
async function log(params) {
  try {
    const response = await fetch(`${OBSERVATORY_URL}/api/admin/observatory/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OBSERVATORY_API_KEY}`,
      },
      body: JSON.stringify({
        agentId: params.agentId || defaultAgentId,
        type: params.type,
        content: params.content,
        storeCode: params.storeCode,
        storeName: params.storeName,
        talkingTo: params.talkingTo,
        sentiment: params.sentiment,
        metadata: params.metadata,
        status: params.status,
        currentTask: params.currentTask,
        energy: params.energy,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Observatory] Failed to log activity:', error);
      return { success: false, error: error.error };
    }

    const result = await response.json();
    return { success: true, activityId: result.activityId };
  } catch (error) {
    console.error('[Observatory] Connection error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Convenience method to update agent status
 */
async function updateStatus(status, currentTask) {
  return log({
    type: 'heartbeat',
    content: currentTask || `Status: ${status}`,
    status,
    currentTask,
  });
}

/**
 * Log a message activity
 */
async function message(content, options = {}) {
  return log({
    type: 'message',
    content,
    sentiment: 'supportive',
    ...options,
  });
}

/**
 * Log a thinking activity
 */
async function thinking(content, options = {}) {
  return log({
    type: 'thinking',
    content,
    status: 'thinking',
    currentTask: content,
    ...options,
  });
}

/**
 * Log a tool call activity
 */
async function toolCall(toolName, content, options = {}) {
  return log({
    type: 'tool_call',
    content: content || `Called ${toolName}`,
    metadata: { toolName, ...options.metadata },
    ...options,
  });
}

/**
 * Log an order activity
 */
async function order(content, options = {}) {
  return log({
    type: 'order',
    content,
    sentiment: 'excited',
    ...options,
  });
}

/**
 * Log a payment activity
 */
async function payment(content, options = {}) {
  return log({
    type: 'payment',
    content,
    sentiment: 'excited',
    ...options,
  });
}

/**
 * Log an error activity
 */
async function error(content, options = {}) {
  return log({
    type: 'error',
    content,
    sentiment: 'error',
    status: 'error',
    ...options,
  });
}

/**
 * Log a conversation activity (agent-to-agent)
 */
async function conversation(talkingTo, content, options = {}) {
  return log({
    type: 'conversation',
    content,
    talkingTo,
    sentiment: 'curious',
    ...options,
  });
}

/**
 * Log an insight activity
 */
async function insight(content, options = {}) {
  return log({
    type: 'insight',
    content,
    sentiment: 'curious',
    ...options,
  });
}

/**
 * Create a sub-agent logger with a specific agent ID
 */
function createSubAgent(agentId) {
  return {
    log: (params) => log({ ...params, agentId }),
    message: (content, options) => message(content, { ...options, agentId }),
    thinking: (content, options) => thinking(content, { ...options, agentId }),
    toolCall: (toolName, content, options) => toolCall(toolName, content, { ...options, agentId }),
    order: (content, options) => order(content, { ...options, agentId }),
    payment: (content, options) => payment(content, { ...options, agentId }),
    error: (content, options) => error(content, { ...options, agentId }),
    conversation: (talkingTo, content, options) => conversation(talkingTo, content, { ...options, agentId }),
    insight: (content, options) => insight(content, { ...options, agentId }),
    updateStatus: (status, currentTask) => log({
      type: 'heartbeat',
      content: currentTask || `Status: ${status}`,
      status,
      currentTask,
      agentId,
    }),
  };
}

// Export all functions
module.exports = {
  setAgentId,
  log,
  updateStatus,
  message,
  thinking,
  toolCall,
  order,
  payment,
  error,
  conversation,
  insight,
  createSubAgent,

  // Sub-agent instances for common agents
  dilo: createSubAgent('dilo'),
  scout: createSubAgent('scout'),
  herald: createSubAgent('herald'),
  sage: createSubAgent('sage'),
  researcher: createSubAgent('researcher'),
  observer: createSubAgent('observer'),
};
