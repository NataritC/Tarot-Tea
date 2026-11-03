// Cloudflare Pages Function adapter (serves /api/interpret).
// Optional: ANTHROPIC_API_KEY secret (Claude) and/or a Workers AI binding named AI (Settings → Bindings).
import { handleReading } from '../../server/reader.js';

export async function onRequest({ request, env }) {
  let payload = null;
  if (request.method === 'POST') {
    try { payload = await request.json(); } catch { payload = null; }
  }
  const { status, body } = await handleReading(request.method, payload, { apiKey: env.ANTHROPIC_API_KEY, ai: env.AI });
  return Response.json(body, { status });
}
