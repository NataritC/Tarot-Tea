// Cloudflare Pages Function adapter (serves /api/interpret).
// Set ANTHROPIC_API_KEY as an encrypted variable in the Pages project settings.
import { handleReading } from '../../server/reader.js';

export async function onRequest({ request, env }) {
  let payload = null;
  if (request.method === 'POST') {
    try { payload = await request.json(); } catch { payload = null; }
  }
  const { status, body } = await handleReading(request.method, payload, env.ANTHROPIC_API_KEY);
  return Response.json(body, { status });
}
