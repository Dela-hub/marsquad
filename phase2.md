# Phase 2: Connecting Landing Page Services → Existing Backend

## What Already Exists
- **Frontend → Bridge flow** is fully wired: `/api/prompt` validates, rate-limits, and forwards to `LOCAL_BRIDGE_URL/api/prompt` with Bearer auth
- **Events flow back** via `/api/ingest` → KV → `/api/events` polling → canvas + terminal display
- **6 services** are displayed on the landing page (Market Research, Content Writing, Data Analysis, Social Media, Tech Docs, Monitoring & Alerts)
- **Backend** (Codex/OpenClaw on VPS) already processes tasks through the bridge
- **Observatory prompt route** already tags submissions with `source: 'observatory'` and `needsReview: true`

## What Needs Building

### 1. Service Order Form (Frontend)
- Replace the "Coming Soon" CTA with a service selection + brief form
- User picks a service type, enters a description of what they need, optionally provides contact (email/WhatsApp)
- No payment yet — this is a "request a job" flow, payment can come later

### 2. Extended Prompt Payload
- Currently the prompt route sends `{ text, ts, source, needsReview }`
- Extend to include: `{ text, ts, source, needsReview, serviceType, contactMethod, contactValue }`
- `serviceType` would be one of: `market-research`, `content-writing`, `data-analysis`, `social-media`, `tech-docs`, `monitoring`
- This lets Dilo on the backend know what kind of job it is and which agents to dispatch

### 3. New API Route: `/api/jobs`
- POST: Create a new job (wraps the prompt route but with service metadata)
- GET: List recent jobs and their status (derived from events)
- Stores job records in KV with status tracking: `pending` → `screening` → `in-progress` → `delivered`

### 4. Dilo Screening Gate
- The `needsReview: true` flag is already sent for observatory submissions
- On the bridge/backend side, Dilo should check this flag and screen before executing
- The bridge likely needs to understand the new `serviceType` field to route to the right agent workflow
- **Question**: Does the bridge already handle `needsReview`? If not, the VPS backend needs a small update

### 5. Job Status Tracking
- Backend posts events tagged with a `jobId` back through `/api/ingest`
- Frontend can filter events by `jobId` to show per-job progress
- Add a "My Jobs" or job status section on the landing page (keyed by session/email)

### 6. Contact/Delivery
- For now: results visible in the observatory live feed
- Later: WhatsApp delivery once the number is configured
- Email delivery could be a quick win if agents can send email

## Architecture Diagram

```
Landing Page (Service Form)
    ↓ POST /api/jobs
    { serviceType, text, contact, ts }
    ↓
/api/jobs route
    → Validates & stores job in KV
    → Forwards to /api/prompt with enriched payload
    ↓
Bridge (LOCAL_BRIDGE_URL/api/prompt)
    → Receives { text, serviceType, needsReview, ... }
    → Dilo screens the request
    → Dispatches to specialist agents
    ↓
Events stream back via /api/ingest
    → Tagged with jobId
    → Visible in observatory + terminal
    ↓
Job status updates in KV
    → User can check progress
```

## Implementation Order
1. **Service order form component** — simple form with service picker + text area + contact
2. **`/api/jobs` route** — stores job, forwards enriched payload to bridge
3. **Job status in KV** — track lifecycle from submission to delivery
4. **Landing page integration** — replace "Coming Soon" with working form
5. **Bridge payload update** — ensure bridge accepts `serviceType` and routes correctly
6. **Job status display** — show users their job progress

## Open Questions
- Does the bridge already handle `needsReview` and route differently?
- Should jobs require payment before execution, or run free initially?
- Do you want a public job board (everyone sees all jobs) or private per-user tracking?
