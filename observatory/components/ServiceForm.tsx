'use client';

import { useState } from 'react';

const SERVICES = [
  { value: 'market-research', label: 'Competitor teardown', icon: '\u2694\uFE0F' },
  { value: 'monitoring', label: 'Daily brief', icon: '\uD83D\uDCF2' },
  { value: 'tech-docs', label: 'Launch doc pack', icon: '\uD83D\uDE80' },
  { value: 'content-writing', label: 'Content sprint', icon: '\u270D\uFE0F' },
  { value: 'data-analysis', label: 'Data deep-dive', icon: '\uD83D\uDCCA' },
] as const;

const DEADLINES = [
  { value: 'asap', label: 'ASAP' },
  { value: '6h', label: '6 hours' },
  { value: '12h', label: '12 hours' },
  { value: '24h', label: '24 hours' },
  { value: '3d', label: '3 days' },
  { value: 'recurring', label: 'Recurring' },
] as const;

type Status = 'hidden' | 'idle' | 'sending' | 'sent' | 'error';

export default function ServiceForm() {
  const [status, setStatus] = useState<Status>('hidden');
  const [service, setService] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [contact, setContact] = useState('');
  const [jobId, setJobId] = useState('');

  const canSubmit = service && description.trim().length > 0 && deadline && status !== 'sending';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          serviceType: service,
          description: description.trim(),
          deadline,
          contact: contact.trim() || undefined,
        }),
      });

      if (res.status === 429) {
        setStatus('error');
        return;
      }

      if (!res.ok) {
        setStatus('error');
        return;
      }

      const data = await res.json();
      setJobId(data.jobId || '');
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  // Reveal button
  if (status === 'hidden') {
    return (
      <button
        className="sf-btn sf-btn--primary sf-reveal"
        onClick={() => setStatus('idle')}
      >
        Give us a task
        <span className="sf-btn-arrow">&rarr;</span>
      </button>
    );
  }

  // Success state
  if (status === 'sent') {
    return (
      <div className="sf-success">
        <div className="sf-success-icon">&#x2713;</div>
        <h3 className="sf-success-title">Task submitted</h3>
        <p className="sf-success-desc">
          Dilo will review your request and dispatch the squad.
          Watch the live feed above to follow progress.
        </p>
        {jobId && <p className="sf-success-id">Ref: {jobId}</p>}
        <button
          className="sf-btn sf-btn--ghost"
          onClick={() => {
            setStatus('idle');
            setService('');
            setDescription('');
            setDeadline('');
            setContact('');
            setJobId('');
          }}
        >
          Submit another
        </button>
      </div>
    );
  }

  // Form
  return (
    <form className="sf-form" onSubmit={handleSubmit}>
      <div className="sf-field">
        <label className="sf-label">Service</label>
        <div className="sf-chips">
          {SERVICES.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`sf-chip ${service === s.value ? 'sf-chip--active' : ''}`}
              onClick={() => setService(s.value)}
            >
              <span className="sf-chip-icon">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sf-field">
        <label className="sf-label" htmlFor="sf-desc">
          What do you need?
        </label>
        <textarea
          id="sf-desc"
          className="sf-textarea"
          rows={3}
          maxLength={500}
          placeholder="Describe the task in detail..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <span className="sf-charcount">{description.length}/500</span>
      </div>

      <div className="sf-field">
        <label className="sf-label">Deliver by</label>
        <div className="sf-chips">
          {DEADLINES.map((d) => (
            <button
              key={d.value}
              type="button"
              className={`sf-chip sf-chip--sm ${deadline === d.value ? 'sf-chip--active' : ''}`}
              onClick={() => setDeadline(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sf-field">
        <label className="sf-label" htmlFor="sf-contact">
          Contact <span className="sf-optional">(optional)</span>
        </label>
        <input
          id="sf-contact"
          className="sf-input"
          type="text"
          maxLength={200}
          placeholder="Email or WhatsApp number for delivery"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
      </div>

      <div className="sf-actions">
        <button
          type="button"
          className="sf-btn sf-btn--ghost"
          onClick={() => setStatus('hidden')}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`sf-btn sf-btn--primary ${!canSubmit ? 'sf-btn--disabled' : ''}`}
          disabled={!canSubmit}
        >
          {status === 'sending' ? 'Sending...' : 'Send to squad'}
          {status !== 'sending' && <span className="sf-btn-arrow">&rarr;</span>}
        </button>
      </div>

      {status === 'error' && (
        <p className="sf-error">
          Could not submit. Please try again in a few minutes.
        </p>
      )}
    </form>
  );
}
