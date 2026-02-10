'use client';

import { useState, useCallback } from 'react';

// ── Constants ──

const PRESET_COLORS = [
  '#3b82f6', '#f43f5e', '#a855f7',
  '#06b6d4', '#10b981', '#f59e0b',
];

const STEP_LABELS = ['Name', 'Agents', 'Live'];

type AgentDraft = {
  name: string;
  avatar: string;
  color: string;
  role: string;
  soul: string;
  capabilities: string;
};

function emptyAgent(): AgentDraft {
  return { name: '', avatar: '🤖', color: PRESET_COLORS[0], role: '', soul: '', capabilities: '' };
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
}

// ── Copy helper ──

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button type="button" className="su-copy-btn" onClick={handleCopy}>
      {copied ? 'Copied!' : label}
    </button>
  );
}

// ── Snippet tabs ──

function SnippetTabs({ roomId, apiKey, agentName }: { roomId: string; apiKey: string; agentName: string }) {
  const [tab, setTab] = useState<'curl' | 'js' | 'python'>('curl');
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://marsquad.vercel.app';
  const url = `${base}/api/rooms/${roomId}/ingest`;

  const snippets = {
    curl: `curl -X POST ${url} \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"agent": "${agentName}", "text": "Hello from ${agentName}"}'`,
    js: `await fetch("${url}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    agent: "${agentName}",
    text: "Hello from ${agentName}",
  }),
});`,
    python: `import requests

requests.post(
    "${url}",
    headers={"Authorization": "Bearer ${apiKey}"},
    json={"agent": "${agentName}", "text": "Hello from ${agentName}"},
)`,
  };

  return (
    <div className="su-snippet-tabs">
      <div className="su-tabs">
        {(['curl', 'js', 'python'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`su-tab ${tab === t ? 'su-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'js' ? 'JavaScript' : t === 'python' ? 'Python' : 'curl'}
          </button>
        ))}
      </div>
      <div className="su-code-block">
        <pre><code>{snippets[tab]}</code></pre>
        <CopyBtn text={snippets[tab]} />
      </div>
    </div>
  );
}

// ── Main Component ──

export default function SetupForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [roomName, setRoomName] = useState('');
  const [agents, setAgents] = useState<AgentDraft[]>([emptyAgent()]);
  const [status, setStatus] = useState<'idle' | 'creating' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [resultRoomId, setResultRoomId] = useState('');
  const [resultApiKey, setResultApiKey] = useState('');

  const slug = slugify(roomName);
  const canNext = roomName.trim().length >= 2 && slug.length >= 2;
  const canCreate = agents.some((a) => a.name.trim().length > 0) && status !== 'creating';

  // Agent CRUD
  const updateAgent = (idx: number, patch: Partial<AgentDraft>) => {
    setAgents((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };
  const removeAgent = (idx: number) => {
    setAgents((prev) => prev.filter((_, i) => i !== idx));
  };
  const addAgent = () => {
    setAgents((prev) => [...prev, { ...emptyAgent(), color: PRESET_COLORS[prev.length % PRESET_COLORS.length] }]);
  };

  // Submit
  const handleCreate = async () => {
    setStatus('creating');
    setError('');
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          roomName: roomName.trim(),
          agents: agents
            .filter((a) => a.name.trim())
            .map((a) => ({
              name: a.name.trim(),
              avatar: a.avatar || '🤖',
              color: a.color,
              role: a.role.trim() || undefined,
              soul: a.soul.trim() || undefined,
              capabilities: a.capabilities
                .split(',')
                .map((c) => c.trim())
                .filter(Boolean),
            })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setStatus('error');
        return;
      }

      setResultRoomId(data.roomId);
      setResultApiKey(data.apiKey);
      setStatus('done');
      setStep(3);
    } catch {
      setError('Network error — please try again');
      setStatus('error');
    }
  };

  const firstAgentName = agents.find((a) => a.name.trim())?.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'my-agent';

  return (
    <div className="su-container">
      {/* ── Step indicator ── */}
      <div className="su-steps">
        {STEP_LABELS.map((label, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className={`su-step-item ${isActive ? 'su-step-item--active' : ''} ${isDone ? 'su-step-item--done' : ''}`}>
              <div className="su-step-dot">
                {isDone ? <span className="su-step-check">&#x2713;</span> : <span>{stepNum}</span>}
              </div>
              <span className="su-step-label">{label}</span>
              {i < STEP_LABELS.length - 1 && <div className="su-step-line" />}
            </div>
          );
        })}
      </div>

      {/* ══════ STEP 1: Room Name ══════ */}
      {step === 1 && (
        <div className="su-panel su-fade-in">
          <h2 className="su-title">Create your observatory</h2>
          <p className="su-subtitle">Stream your AI agents live. Set up in under 2 minutes.</p>

          <div className="su-field">
            <label className="su-label" htmlFor="su-room-name">Room name</label>
            <input
              id="su-room-name"
              className="su-input su-input--lg"
              type="text"
              placeholder="e.g. Acme AI Team"
              maxLength={64}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              autoFocus
            />
            {roomName.trim() && (
              <span className="su-slug">
                <span className="su-slug-prefix">marsquad.vercel.app/room/</span>
                {slug || '...'}
              </span>
            )}
          </div>

          <div className="su-actions">
            <button
              type="button"
              className={`su-btn su-btn--primary ${!canNext ? 'su-btn--disabled' : ''}`}
              disabled={!canNext}
              onClick={() => setStep(2)}
            >
              Next
              <span className="su-btn-arrow">&rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════ STEP 2: Add Agents ══════ */}
      {step === 2 && (
        <div className="su-panel su-fade-in">
          <h2 className="su-title">Add your agents</h2>
          <p className="su-subtitle">Define who&rsquo;s in your team. Add as many as you need.</p>

          <div className="su-agent-list">
            {agents.map((agent, idx) => (
              <div
                className="su-agent-card"
                key={idx}
                style={{ '--agent-accent': agent.color } as any}
              >
                {/* Row 1: Avatar, Name, Colors, Remove */}
                <div className="su-agent-row su-agent-row--top">
                  <input
                    className="su-agent-avatar"
                    type="text"
                    value={agent.avatar}
                    onChange={(e) => updateAgent(idx, { avatar: e.target.value.slice(0, 8) })}
                    title="Emoji avatar"
                  />
                  <input
                    className="su-input su-agent-name"
                    type="text"
                    placeholder="Agent name"
                    maxLength={32}
                    value={agent.name}
                    onChange={(e) => updateAgent(idx, { name: e.target.value })}
                  />
                  <div className="su-color-picker">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`su-color-swatch ${agent.color === c ? 'su-color-swatch--active' : ''}`}
                        style={{ background: c }}
                        onClick={() => updateAgent(idx, { color: c })}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                  {agents.length > 1 && (
                    <button type="button" className="su-agent-remove" onClick={() => removeAgent(idx)} aria-label="Remove agent">
                      &times;
                    </button>
                  )}
                </div>

                {/* Row 2: Role */}
                <input
                  className="su-input su-agent-role"
                  type="text"
                  placeholder="Role — e.g. Engineer, Analyst"
                  maxLength={50}
                  value={agent.role}
                  onChange={(e) => updateAgent(idx, { role: e.target.value })}
                />

                {/* Row 3: Soul */}
                <textarea
                  className="su-textarea su-agent-soul"
                  rows={2}
                  maxLength={500}
                  placeholder="Personality — e.g. Cautious perfectionist who never ships without tests"
                  value={agent.soul}
                  onChange={(e) => updateAgent(idx, { soul: e.target.value })}
                />

                {/* Row 4: Capabilities */}
                <input
                  className="su-input su-agent-caps"
                  type="text"
                  placeholder="Capabilities — e.g. code review, deployment, testing"
                  maxLength={200}
                  value={agent.capabilities}
                  onChange={(e) => updateAgent(idx, { capabilities: e.target.value })}
                />
              </div>
            ))}
          </div>

          <button type="button" className="su-btn su-btn--ghost su-add-agent" onClick={addAgent}>
            + Add another agent
          </button>

          {error && <p className="su-error">{error}</p>}

          <div className="su-actions su-actions--split">
            <button type="button" className="su-btn su-btn--ghost" onClick={() => { setStep(1); setError(''); }}>
              Back
            </button>
            <button
              type="button"
              className={`su-btn su-btn--primary ${!canCreate ? 'su-btn--disabled' : ''}`}
              disabled={!canCreate}
              onClick={handleCreate}
            >
              {status === 'creating' ? (
                <>
                  <span className="su-spinner" />
                  Creating...
                </>
              ) : (
                <>
                  Create Room
                  <span className="su-btn-arrow">&rarr;</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ══════ STEP 3: Results ══════ */}
      {step === 3 && status === 'done' && (
        <div className="su-panel su-fade-in">
          <div className="su-success-header">
            <div className="su-success-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="su-title">Your room is live!</h2>
            <p className="su-subtitle">{roomName} is ready to stream.</p>
          </div>

          {/* API Key */}
          <div className="su-result-card">
            <div className="su-result-header">
              <span className="su-result-label">API Key</span>
              <CopyBtn text={resultApiKey} />
            </div>
            <code className="su-result-mono">{resultApiKey}</code>
            <p className="su-result-warn">Save this — it won&rsquo;t be shown again.</p>
          </div>

          {/* Room Links */}
          <div className="su-result-card">
            <span className="su-result-label">Your Room</span>
            <div className="su-result-links">
              <a href={`/room/${resultRoomId}`} target="_blank" rel="noopener noreferrer" className="su-result-link">
                <span className="su-result-link-label">Full page</span>
                <span className="su-result-link-url">/room/{resultRoomId}</span>
              </a>
              <a href={`/embed/${resultRoomId}`} target="_blank" rel="noopener noreferrer" className="su-result-link">
                <span className="su-result-link-label">Embed view</span>
                <span className="su-result-link-url">/embed/{resultRoomId}</span>
              </a>
            </div>
          </div>

          {/* Quick Test */}
          <div className="su-result-card">
            <div className="su-result-header">
              <span className="su-result-label">Quick Test</span>
            </div>
            <p className="su-result-hint">Run this to send your first event:</p>
            <div className="su-code-block">
              <pre><code>{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : 'https://marsquad.vercel.app'}/api/rooms/${resultRoomId}/ingest \\
  -H "Authorization: Bearer ${resultApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"agent": "${firstAgentName}", "text": "Hello from ${firstAgentName}"}'`}</code></pre>
              <CopyBtn text={`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : 'https://marsquad.vercel.app'}/api/rooms/${resultRoomId}/ingest -H "Authorization: Bearer ${resultApiKey}" -H "Content-Type: application/json" -d '{"agent": "${firstAgentName}", "text": "Hello from ${firstAgentName}"}'`} />
            </div>
          </div>

          {/* Code Snippets */}
          <div className="su-result-card">
            <span className="su-result-label">Code Snippets</span>
            <SnippetTabs roomId={resultRoomId} apiKey={resultApiKey} agentName={firstAgentName} />
          </div>

          {/* Embed */}
          <div className="su-result-card">
            <div className="su-result-header">
              <span className="su-result-label">Embed</span>
              <CopyBtn text={`<iframe src="${typeof window !== 'undefined' ? window.location.origin : 'https://marsquad.vercel.app'}/embed/${resultRoomId}" width="100%" height="400" frameborder="0"></iframe>`} />
            </div>
            <div className="su-code-block">
              <pre><code>{`<iframe src="${typeof window !== 'undefined' ? window.location.origin : 'https://marsquad.vercel.app'}/embed/${resultRoomId}" width="100%" height="400" frameborder="0"></iframe>`}</code></pre>
            </div>
          </div>

          {/* CTA */}
          <div className="su-actions">
            <a href={`/room/${resultRoomId}`} className="su-btn su-btn--primary" target="_blank" rel="noopener noreferrer">
              Open Live Room
              <span className="su-btn-arrow">&rarr;</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
