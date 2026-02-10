export async function GET() {
  return Response.json({
    ok: true,
    ts: Date.now(),
    kv_url: !!process.env.KV_REST_API_URL,
    kv_token: !!process.env.KV_REST_API_TOKEN,
    master_key: !!process.env.ROOMS_MASTER_KEY,
  });
}
