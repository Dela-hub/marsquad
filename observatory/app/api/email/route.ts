export const dynamic = 'force-dynamic';

const MAX_SUBJECT = 200;
const MAX_FROM = 200;
const MAX_SNIPPET = 200;

function clean(v: any, max: number) {
  return String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function getBearer(req: Request): string {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

function toList(raw?: string | null): string[] {
  return String(raw || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function matchesAllowlist(from: string, subject: string, fromAllow: string[], subjAllow: string[]): boolean {
  const f = from.toLowerCase();
  const s = subject.toLowerCase();
  for (const a of fromAllow) {
    const needle = a.toLowerCase();
    if (needle && f.includes(needle)) return true;
  }
  for (const a of subjAllow) {
    const needle = a.toLowerCase();
    if (needle && s.includes(needle)) return true;
  }
  return false;
}

function classify(subject: string, from: string): { label: string; security: boolean } {
  const s = subject.toLowerCase();
  const f = from.toLowerCase();

  const security = /security|verification|verify|password|login|sign-in|signin|suspicious|new device|2fa|otp|code/.test(s);
  if (security) return { label: 'security', security: true };

  if (/(payment|paid|invoice|receipt|payout|charge|subscription|stripe)/.test(s) || f.includes('stripe')) return { label: 'payment', security: false };
  if (/(booking|booked|scheduled|rescheduled|calendly)/.test(s) || f.includes('calendly')) return { label: 'lead', security: false };
  if (/(support|ticket|help|issue|bug|error)/.test(s)) return { label: 'support', security: false };

  return { label: 'lead', security: false };
}

export async function POST(req: Request) {
  const hasKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  if (!hasKv) return new Response('service unavailable', { status: 503 });

  // Auth (use the same shared key used for /api/ingest bridging)
  const token = getBearer(req);
  const expected = process.env.OBSERVATORY_API_KEY || '';
  if (!expected || token !== expected) return new Response('unauthorized', { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  const messageId = clean(body?.messageId, 260);
  const date = clean(body?.date, 60);
  const from = clean(body?.from, MAX_FROM);
  const subject = clean(body?.subject, MAX_SUBJECT);
  const snippet = clean(body?.snippet, MAX_SNIPPET);

  if (!from || !subject) return new Response('missing fields', { status: 400 });

  const fromAllow = toList(process.env.EMAIL_FROM_ALLOWLIST).length
    ? toList(process.env.EMAIL_FROM_ALLOWLIST)
    : ['stripe', 'calendly', 'typeform', '@marsquad', 'marsquad', '@gmail.com'];

  const subjAllow = toList(process.env.EMAIL_SUBJECT_ALLOWLIST).length
    ? toList(process.env.EMAIL_SUBJECT_ALLOWLIST)
    : ['new lead', 'payment', 'paid', 'booking', 'support', 'task'];

  const { label, security } = classify(subject, from);

  // Security emails: never store body/snippet. Return signal for caller to alert.
  if (security) {
    return Response.json({ ok: true, stored: false, label: 'security' });
  }

  // Only store allowlisted mail. Everything else should be lightweight event-only.
  const allowed = matchesAllowlist(from, subject, fromAllow, subjAllow);
  if (!allowed) {
    return Response.json({ ok: true, stored: false, label });
  }

  const { kv } = await import('@vercel/kv');
  const ts = Date.now();
  const id = messageId || `email_${ts}_${Math.random().toString(36).slice(2, 8)}`;
  const retentionDays = Math.max(7, Math.min(30, Number(process.env.EMAIL_RETENTION_DAYS || 14)));
  const ex = retentionDays * 24 * 60 * 60;

  const record = {
    id,
    ts,
    messageId: messageId || undefined,
    date: date || undefined,
    from,
    subject,
    snippet: snippet || undefined,
    label,
  };

  await kv.set(`observatory:email:${id}`, record, { ex });
  await kv.zadd('observatory:emails', { score: ts, member: id });

  // Retention: prune index older than retention window
  const cutoff = ts - retentionDays * 24 * 60 * 60 * 1000;
  await kv.zremrangebyscore('observatory:emails', 0, cutoff);

  return Response.json({ ok: true, stored: true, id, label });
}

