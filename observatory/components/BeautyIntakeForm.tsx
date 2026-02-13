'use client';

import { useMemo, useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'rate_limited';

export default function BeautyIntakeForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [name, setName] = useState('');
  const [whatsApp, setWhatsApp] = useState('');
  const [help, setHelp] = useState('');
  const [leadId, setLeadId] = useState('');

  const canSubmit = useMemo(() => {
    if (status === 'sending') return false;
    if (name.trim().length < 2) return false;
    if (whatsApp.trim().length < 8) return false;
    if (help.trim().length < 6) return false;
    return true;
  }, [status, name, whatsApp, help]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          whatsapp: whatsApp.trim(),
          help: help.trim(),
        }),
      });

      if (res.status === 429) {
        setStatus('rate_limited');
        return;
      }
      if (!res.ok) {
        setStatus('error');
        return;
      }
      const data = await res.json().catch(() => ({}));
      setLeadId(String(data?.id || ''));
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="sf-success">
        <div className="sf-success-icon">&#x2713;</div>
        <h3 className="sf-success-title">Request received</h3>
        <p className="sf-success-desc">
          We&apos;ll reply on WhatsApp with a demo thread and setup steps.
        </p>
        {leadId && <p className="sf-success-id">Ref: {leadId}</p>}
        <button
          className="sf-btn sf-btn--ghost"
          onClick={() => {
            setStatus('idle');
            setLeadId('');
            setName('');
            setWhatsApp('');
            setHelp('');
          }}
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form className="sf-form" onSubmit={submit}>
      <div className="sf-field">
        <label className="sf-label" htmlFor="ai-name">
          Name
        </label>
        <input
          id="ai-name"
          className="sf-input"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          autoComplete="name"
        />
      </div>

      <div className="sf-field">
        <label className="sf-label" htmlFor="ai-wa">
          WhatsApp number
        </label>
        <input
          id="ai-wa"
          className="sf-input"
          type="tel"
          inputMode="tel"
          placeholder="+1 555 123 4567"
          value={whatsApp}
          onChange={(e) => setWhatsApp(e.target.value)}
          maxLength={40}
          autoComplete="tel"
        />
        <span className="sf-charcount">Use international format (starts with +).</span>
      </div>

      <div className="sf-field">
        <label className="sf-label" htmlFor="ai-help">
          What do you want help with?
        </label>
        <textarea
          id="ai-help"
          className="sf-textarea"
          rows={4}
          maxLength={900}
          placeholder="Reminders, planning, follow-ups, cleaning up your inbox, organizing life admin..."
          value={help}
          onChange={(e) => setHelp(e.target.value)}
        />
        <span className="sf-charcount">{help.length}/900</span>
      </div>

      <div className="sf-actions">
        <button
          type="submit"
          className={`sf-btn sf-btn--primary ${!canSubmit ? 'sf-btn--disabled' : ''}`}
          disabled={!canSubmit}
        >
          {status === 'sending' ? 'Sending...' : 'Send'}
          {status !== 'sending' && <span className="sf-btn-arrow">&rarr;</span>}
        </button>
      </div>

      {status === 'rate_limited' && (
        <p className="sf-error">
          Already received. Give it a minute and we&apos;ll reply on WhatsApp.
        </p>
      )}
      {status === 'error' && (
        <p className="sf-error">
          Could not submit. Please try again in a few minutes.
        </p>
      )}
    </form>
  );
}

