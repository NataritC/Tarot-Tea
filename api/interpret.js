// Vercel serverless function adapter. The reading logic lives in server/reader.js.
import { handleReading } from '../server/reader.js';

export default async function handler(req, res) {
  const { status, body } = await handleReading(req.method, req.body, { apiKey: process.env.ANTHROPIC_API_KEY });
  res.status(status).json(body);
}
