'use client';

import { useMemo, useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'rate_limited';

const SPEND_RANGES = [
  'Under $10k/mo',
  '$10k-$25k/mo',
  '$25k-$50k/mo',
  '$50k-$100k/mo',
  '$100k+/mo',
] as const;

const MARKET_OPTIONS = ['US', 'UK', 'EU', 'AU', 'Global'] as const;
const CHANNEL_OPTIONS = ['Meta', 'TikTok', 'Both'] as const;
const DELIVERY_OPTIONS = ['Email', 'WhatsApp', 'Both'] as const;

export default function BeautyIntakeForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [brandUrl, setBrandUrl] = useState('');
  const [category, setCategory] = useState('');
  const [spendRange, setSpendRange] = useState<(typeof SPEND_RANGES)[number] | ''>('');
  const [contact, setContact] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [markets, setMarkets] = useState<(typeof MARKET_OPTIONS)[number] | ''>('');
  const [primaryChannel, setPrimaryChannel] = useState<(typeof CHANNEL_OPTIONS)[number] | ''>('');
  const [deliveryPreference, setDeliveryPreference] = useState<(typeof DELIVERY_OPTIONS)[number] | ''>('');
  const [goals, setGoals] = useState('');
  const [leadId, setLeadId] = useState('');

  const canSubmit = useMemo(() => {
    if (status === 'sending') return false;
    if (brandUrl.trim().length < 6) return false;
    if (contact.trim().length < 5) return false;
    return true;
  }, [status, brandUrl, contact]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          brandUrl: brandUrl.trim(),
          category: category.trim(),
          spendRange: spendRange || undefined,
          contact: contact.trim(),
          competitors: competitors.trim() || undefined,
          markets: markets || undefined,
          primaryChannel: primaryChannel || undefined,
          deliveryPreference: deliveryPreference || undefined,
          goals: goals.trim(),
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
          We&apos;ll send a sample pack to your contact shortly. If it&apos;s a fit, we&apos;ll follow up with a simple monthly retainer.
        </p>
        {leadId && <p className="sf-success-id">Ref: {leadId}</p>}
        <button
          className="sf-btn sf-btn--ghost"
          onClick={() => {
            setStatus('idle');
            setLeadId('');
            setBrandUrl('');
            setCategory('');
            setSpendRange('');
            setContact('');
            setCompetitors('');
            setMarkets('');
            setPrimaryChannel('');
            setDeliveryPreference('');
            setGoals('');
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
        <label className="sf-label" htmlFor="bi-brand">
          Brand URL
        </label>
        <input
          id="bi-brand"
          className="sf-input"
          type="url"
          inputMode="url"
          placeholder="https://yourbrand.com"
          value={brandUrl}
          onChange={(e) => setBrandUrl(e.target.value)}
          maxLength={300}
        />
      </div>

      <div className="sf-field">
        <label className="sf-label" htmlFor="bi-category">
          Category <span className="sf-optional">(optional)</span>
        </label>
        <input
          id="bi-category"
          className="sf-input"
          type="text"
          placeholder="e.g. skincare, haircare, fragrance"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          maxLength={300}
        />
      </div>

      <div className="sf-field">
        <label className="sf-label" htmlFor="bi-spend">
          Ad spend range <span className="sf-optional">(optional)</span>
        </label>
        <select
          id="bi-spend"
          className="sf-input"
          value={spendRange}
          onChange={(e) => setSpendRange(e.target.value as any)}
        >
          <option value="">Select</option>
          {SPEND_RANGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="sf-field">
        <label className="sf-label" htmlFor="bi-contact">
          Email or WhatsApp
        </label>
        <input
          id="bi-contact"
          className="sf-input"
          type="text"
          inputMode="email"
          placeholder="name@brand.com or +1 555..."
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          maxLength={300}
        />
      </div>

      <div className="sf-field">
        <label className="sf-label" htmlFor="bi-competitors">
          Competitors (3-10)
        </label>
        <textarea
          id="bi-competitors"
          className="sf-textarea"
          rows={3}
          maxLength={1200}
          placeholder="paste URLs/handles (IG/TikTok/Meta pages) — one per line"
          value={competitors}
          onChange={(e) => setCompetitors(e.target.value)}
        />
        <span className="sf-charcount">If you don&apos;t have them, paste 1-2 and we&apos;ll fill the rest.</span>
      </div>

      <div className="sf-field">
        <label className="sf-label" htmlFor="bi-markets">
          Markets <span className="sf-optional">(optional)</span>
        </label>
        <select
          id="bi-markets"
          className="sf-input"
          value={markets}
          onChange={(e) => setMarkets(e.target.value as any)}
        >
          <option value="">Select</option>
          {MARKET_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="sf-field">
        <label className="sf-label" htmlFor="bi-channel">
          Primary channel <span className="sf-optional">(optional)</span>
        </label>
        <select
          id="bi-channel"
          className="sf-input"
          value={primaryChannel}
          onChange={(e) => setPrimaryChannel(e.target.value as any)}
        >
          <option value="">Select</option>
          {CHANNEL_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="sf-field">
        <label className="sf-label" htmlFor="bi-delivery">
          Delivery preference <span className="sf-optional">(optional)</span>
        </label>
        <select
          id="bi-delivery"
          className="sf-input"
          value={deliveryPreference}
          onChange={(e) => setDeliveryPreference(e.target.value as any)}
        >
          <option value="">Select</option>
          {DELIVERY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="sf-field">
        <label className="sf-label" htmlFor="bi-goals">
          Goals <span className="sf-optional">(optional)</span>
        </label>
        <textarea
          id="bi-goals"
          className="sf-textarea"
          rows={3}
          maxLength={800}
          placeholder="What are you trying to improve? (CPA, CTR, AOV, retention, new angles...)"
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
        />
        <span className="sf-charcount">{goals.length}/800</span>
      </div>

      <div className="sf-actions">
        <button
          type="submit"
          className={`sf-btn sf-btn--primary ${!canSubmit ? 'sf-btn--disabled' : ''}`}
          disabled={!canSubmit}
        >
          {status === 'sending' ? 'Sending...' : 'Send sample pack'}
          {status !== 'sending' && <span className="sf-btn-arrow">&rarr;</span>}
        </button>
      </div>

      {status === 'rate_limited' && (
        <p className="sf-error">
          Already received—check your inbox/WhatsApp in a minute.
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
