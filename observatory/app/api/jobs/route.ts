export const dynamic = 'force-dynamic';

const COOLDOWN_MS = 5 * 60 * 1000;
const MAX_DESC = 500;

const VALID_SERVICES = [
  'market-research',
  'content-writing',
  'data-analysis',
  'social-media',
  'tech-docs',
  'monitoring',
] as const;

type ServiceType = (typeof VALID_SERVICES)[number];

function getClientIp(req: Request) {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return 'unknown';
}

export async function POST(req: Request) {
  const hasKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  // Rate-limit via KV
  if (hasKv) {
    const ip = getClientIp(req);
    const key = `observatory:job:rate:${ip}`;
    const { kv } = await import('@vercel/kv');
    const last = await kv.get<number>(key);
    if (last && Date.now() - last < COOLDOWN_MS) {
      return new Response('rate limited', { status: 429 });
    }
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  const serviceType = body?.serviceType as ServiceType;
  if (!VALID_SERVICES.includes(serviceType)) {
    return new Response('invalid service type', { status: 400 });
  }

  const description = String(body?.description || '').trim();
  if (!description || description.length > MAX_DESC) {
    return new Response('invalid description', { status: 400 });
  }

  const contact = String(body?.contact || '').trim().slice(0, 200);

  const local = process.env.LOCAL_BRIDGE_URL;
  const auth = process.env.OBSERVATORY_API_KEY;
  if (!local || !auth) {
    return new Response('misconfigured', { status: 500 });
  }

  const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ts = Date.now();

  // Store job record in KV
  if (hasKv) {
    const { kv } = await import('@vercel/kv');
    const ip = getClientIp(req);
    await kv.set(`observatory:job:rate:${ip}`, ts, { ex: Math.ceil(COOLDOWN_MS / 1000) });
    await kv.set(`observatory:job:${jobId}`, {
      jobId,
      serviceType,
      description,
      contact,
      status: 'pending',
      ts,
    }, { ex: 7 * 24 * 3600 }); // 7-day TTL
  }

  // Forward to bridge as enriched prompt
  const label = serviceType.replace(/-/g, ' ');
  const text = `[Service Request: ${label}] ${description}`;

  try {
    const res = await fetch(`${local}/api/prompt`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${auth}`,
      },
      body: JSON.stringify({
        text,
        ts,
        source: 'observatory',
        needsReview: true,
        jobId,
        serviceType,
        contact: contact || undefined,
      }),
    });

    if (!res.ok) {
      return new Response('upstream error', { status: 502 });
    }
  } catch (e: any) {
    return new Response(e.message || 'bridge unreachable', { status: 502 });
  }

  return Response.json({ ok: true, jobId });
}
