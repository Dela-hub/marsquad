export const dynamic = 'force-dynamic';

import nodemailer from 'nodemailer';

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

const VALID_DEADLINES = ['asap', '6h', '12h', '24h', '3d', 'recurring'] as const;

const SERVICE_LABELS: Record<string, string> = {
  'market-research': 'Competitor teardown',
  'content-writing': 'Content sprint',
  'data-analysis': 'Data deep-dive',
  'tech-docs': 'Launch doc pack',
  'monitoring': 'Daily brief',
  'social-media': 'Social media',
};

type ServiceType = (typeof VALID_SERVICES)[number];
type Deadline = (typeof VALID_DEADLINES)[number];

function getClientIp(req: Request) {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return 'unknown';
}

async function notifyByEmail(job: {
  jobId: string;
  serviceType: string;
  description: string;
  deadline: string;
  contact: string;
}) {
  const user = process.env.AGENT_EMAIL;
  const pass = process.env.AGENT_EMAIL_APP_PASSWORD;
  if (!user || !pass) return;

  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  const label = SERVICE_LABELS[job.serviceType] || job.serviceType;

  await transport.sendMail({
    from: `Marsquad <${user}>`,
    to: user,
    subject: `New task: ${label} [${job.deadline}]`,
    text: [
      `Job ID: ${job.jobId}`,
      `Service: ${label}`,
      `Deadline: ${job.deadline}`,
      `Contact: ${job.contact || 'none'}`,
      '',
      job.description,
    ].join('\n'),
  });
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

  const deadline = body?.deadline as Deadline;
  if (!VALID_DEADLINES.includes(deadline)) {
    return new Response('invalid deadline', { status: 400 });
  }

  const contact = String(body?.contact || '').trim().slice(0, 200);

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
      deadline,
      contact,
      status: 'pending',
      ts,
    }, { ex: 7 * 24 * 3600 }); // 7-day TTL
  }

  // Notify Dilo via email
  try {
    await notifyByEmail({ jobId, serviceType, description, deadline, contact });
  } catch {
    // Email failed — job is still stored in KV, don't block the user
  }

  return Response.json({ ok: true, jobId });
}
