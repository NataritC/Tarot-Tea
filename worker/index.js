// Cloudflare Worker entry (used when the project is a Worker with static assets).
// Serves /api/interpret; everything else is the built site from ./dist.
import { handleReading } from '../server/reader.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/interpret') {
      let payload = null;
      if (request.method === 'POST') {
        try { payload = await request.json(); } catch { payload = null; }
      }
      const { status, body } = await handleReading(request.method, payload, env.ANTHROPIC_API_KEY);
      return Response.json(body, { status });
    }
    return env.ASSETS.fetch(request);
  },
};
