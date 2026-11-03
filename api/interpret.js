// Vercel serverless function: AI-written tarot reading using Claude.
// Requires the ANTHROPIC_API_KEY environment variable (set it in Vercel, never in code).
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM = `You are the reader of the Noctis Tarot, a warm, wise and honest tarot reader.
You receive the querent's question, the spread, and each drawn card in draw order with its position and orientation (upright or reversed).

Write the reading in this structure, using Markdown:
1. A one-paragraph opening that addresses the question directly. If it is a yes/no question, give a clear leaning (yes / no / not yet / it depends on...) and why.
2. "## The Cards": for each card in order, a short heading "### <Position>: <Card>" (add "(reversed)" if reversed), then 2-4 sentences interpreting that card *in that position* and *for this question*.
3. "## How They Connect": how the cards speak to each other (patterns, suits, Major Arcana, reversals, the story from first to last position).
4. "## Your Advice": 3-5 concrete, kind, practical bullet points.

Be specific to the question; never give generic filler. Be honest about challenging cards but stay compassionate and empowering: the future is not fixed.
Do not give medical, legal or financial instructions; for those topics, suggest consulting a professional alongside the reading. Keep it under 650 words.`;

const FOLLOW_UP_SYSTEM = `You are the reader of the Noctis Tarot, a warm, wise and honest tarot reader.
The querent already received a reading and now asks a follow-up question. To answer it, they drew one clarifier card from the remaining deck.
You receive the original question, the spread with every card in its position, any earlier follow-ups with their clarifier cards, and the new follow-up with its clarifier.

Answer the new follow-up in plain Markdown, 2-4 short paragraphs, under 250 words:
- Answer the follow-up directly first (for yes/no questions give a clear leaning).
- Interpret the clarifier card for this follow-up, and connect it explicitly to the relevant cards and positions of the original spread.
- End with one concrete, kind suggestion.
No headings. Be specific, never generic. Stay honest and compassionate; the future is not fixed.
Do not give medical, legal or financial instructions; suggest a professional for those.`;

const clean = (s, max) => String(s ?? '').slice(0, max);
const cardLine = (c) => `${clean(c.card, 60)}${c.reversed ? ' (reversed)' : ' (upright)'}`;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ available: Boolean(process.env.ANTHROPIC_API_KEY) });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'AI readings are not configured.' });

  const { question, spread, cards, followUp, history } = req.body || {};
  if (!Array.isArray(cards) || cards.length < 1 || cards.length > 10) {
    return res.status(400).json({ error: 'Invalid cards.' });
  }

  const lines = cards.map((c, i) =>
    `${i + 1}. Position "${clean(c.position, 60)}" (${clean(c.positionMeaning, 160)}): ${clean(c.card, 60)}${c.reversed ? ' (reversed)' : ' (upright)'}`);
  const prompt = `Question: ${clean(question, 500) || '(no specific question: give a general reading)'}
Spread: ${clean(spread, 60)}

Cards in draw order:
${lines.join('\n')}`;

  let system = SYSTEM;
  let content = prompt;
  if (followUp) {
    if (!followUp.card || !followUp.question) return res.status(400).json({ error: 'Invalid follow-up.' });
    const earlier = (Array.isArray(history) ? history.slice(0, 3) : [])
      .map((h, i) => `${i + 1}. "${clean(h.question, 300)}": clarifier ${cardLine(h)}`);
    system = FOLLOW_UP_SYSTEM;
    content = `${prompt}

${earlier.length ? `Earlier follow-ups:\n${earlier.join('\n')}\n\n` : ''}New follow-up question: "${clean(followUp.question, 300)}"
Clarifier card drawn: ${cardLine(followUp)}`;
  }

  try {
    const client = new Anthropic();
    const message = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 8000,
      output_config: { effort: 'medium' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      messages: [{ role: 'user', content }],
    });

    if (message.stop_reason === 'refusal') {
      return res.status(422).json({ error: 'The tarot reader could not answer this question. Try rephrasing it.' });
    }
    const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    return res.status(200).json({ text });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'Too many readings right now. Try again in a minute.' });
    }
    if (err instanceof Anthropic.APIError) {
      console.error('Anthropic API error', err.status, err.message);
      return res.status(502).json({ error: 'Deep readings are unavailable right now.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
