/**
 * GET /api/health — tiny uptime check for an outside pinger (e.g. cron-job.org every 5 minutes).
 * Answers from this app's server function and also pings the API's /health, so one request keeps
 * both warm. 200 when both are up, 503 when the API can't be reached (so the pinger can alert).
 * No auth, no database, no personal data.
 */
import { connection } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api/v1";

const headers = { "Cache-Control": "no-store, max-age=0", "Content-Type": "application/json" };

export async function GET() {
  // always run on request (never pre-built or cached at deploy time)
  await connection();
  const started = Date.now();
  let api = false;
  try {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
    api = res.ok;
  } catch {
    api = false;
  }
  const body = JSON.stringify({ ok: api, web: true, api, ms: Date.now() - started });
  return new Response(body, { status: api ? 200 : 503, headers });
}

/** HEAD for pingers that only look at the status code. */
export async function HEAD() {
  const res = await GET();
  return new Response(null, { status: res.status, headers });
}
