// Shared AI tarot reader used by every hosting adapter:
//   - Cloudflare Worker: worker/index.js      - Cloudflare Pages Function: functions/api/interpret.js
//   - Vercel serverless function: api/interpret.js
// Provider: Claude when the ANTHROPIC_API_KEY secret is set (best readings);
// otherwise Cloudflare Workers AI through the `AI` binding (free daily allowance).
import Anthropic from '@anthropic-ai/sdk';

// How a genuine reader talks: applied to every kind of answer.
const GENUINE = `How to read genuinely:
- Translate each card's symbolism into concrete, specific implications for the querent's actual situation. Example of the right depth: The World in the outcome of a question about money or starting a business means the venture can come full circle and succeed: what you build now can be completed and recognised, so finishing what you start is the key.
- Never recite textbook meanings or keyword lists. Never mention scores, tones or ratings. Do not just restate a card's name followed by its definition.
- Read the cards together as one story; let each position shape what its card means here.
- Speak directly to the querent as "you", warmly and naturally, like a skilled human reader across the table.
- If the question is short or vague, consider the most likely situations behind it (for example "if you are thinking of starting something new...") rather than staying generic.
- Be honest about difficult cards but compassionate and empowering: the future is not fixed.
- Do not give medical, legal or financial instructions; for those topics, suggest a professional alongside the reading.`;

const SYSTEM = `You are the reader of the Noctis Tarot, a warm, wise and honest tarot reader.
You receive the querent's question, the spread, and each drawn card in draw order with its position and orientation (upright or reversed).

Write the reading in this structure, using Markdown:
1. A one-paragraph opening that answers the question directly. For a yes/no question, give a clear leaning (yes / no / not yet / it depends on...) and why.
2. "## The Cards": for each card in order, a heading "### <Position>: <Card>" (add "(reversed)" if reversed), then 2-4 sentences on what this card in this position means for this person's situation.
3. "## How They Connect": the story the cards tell together for this question.
4. "## Your Advice": 3-5 concrete, kind, practical bullet points that fit their situation.
Keep it under 650 words.

${GENUINE}`;

const FOLLOW_UP_SYSTEM = `You are the reader of the Noctis Tarot, a warm, wise and honest tarot reader.
The querent already received a reading and now asks a follow-up question. To answer it, they drew one clarifier card from the remaining deck.
You receive the original question, the spread with every card in its position, any earlier follow-ups with their clarifier cards, and the new follow-up with its clarifier.

Answer the new follow-up in plain Markdown, 2-4 short paragraphs, under 250 words, no headings:
- Answer the follow-up directly first (for yes/no questions give a clear leaning).
- Say what the clarifier means for this follow-up, and connect it to the relevant cards of the original spread.
- End with one concrete, kind suggestion.

${GENUINE}`;

const SUMMARY_SYSTEM = `You are the reader of the Noctis Tarot, a warm, wise and honest tarot reader.
Write the SUMMARY of a tarot reading for this querent: what the cards, taken together, are telling them about their exact question and situation.
- 100-170 words of plain prose in one or two paragraphs. No headings, no bullet points, no Markdown.
- Do not walk through the cards one by one with their definitions (the reading above already did that). Synthesise: what is really going on, what is likely to happen, and what matters most, mentioning cards only where they explain the point.
- Finish with one sentence that starts with "In short:" and gives a clear, concrete answer to their question (for yes/no questions, a clear leaning).
- Do not write a list of advice; the advice section comes after this summary.

${GENUINE}`;

const clean = (s, max) => String(s ?? '').slice(0, max);
const cardLine = (c) => `${clean(c.card, 60)}${c.reversed ? ' (reversed)' : ' (upright)'}`;

// Cloudflare Workers AI models: a strong one first, a lighter one if it is unavailable.
const WORKERS_AI_MODELS = ['@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/meta/llama-3.1-8b-instruct'];

async function askWorkersAI(ai, system, content, maxTokens) {
  let lastError;
  for (const model of WORKERS_AI_MODELS) {
    try {
      const out = await ai.run(model, {
        messages: [{ role: 'system', content: system }, { role: 'user', content }],
        max_tokens: maxTokens,
        temperature: 0.8,
      });
      const text = (typeof out === 'string' ? out : out?.response ?? out?.choices?.[0]?.message?.content ?? '').trim();
      if (text) return text;
      lastError = new Error('Empty response');
    } catch (err) {
      lastError = err;
      console.error('Workers AI error', model, err?.message);
    }
  }
  throw lastError;
}

async function askClaude(apiKey, system, content) {
  const client = new Anthropic({ apiKey });
  const message = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 8000,
    output_config: { effort: 'medium' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system,
    messages: [{ role: 'user', content }],
  });
  if (message.stop_reason === 'refusal') return { refused: true };
  return { text: message.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim() };
}

// Returns { status, body } so each host adapter can send it in its own way.
// secrets: { apiKey } for Claude and/or { ai } (the Cloudflare Workers AI binding).
export async function handleReading(method, payload, { apiKey, ai } = {}) {
  const reply = (status, body) => ({ status, body });
  const provider = apiKey ? 'claude' : ai ? 'workers-ai' : null;
  if (method === 'GET') return reply(200, { available: Boolean(provider), provider });
  if (method !== 'POST') return reply(405, { error: 'Method not allowed' });
  if (!provider) return reply(503, { error: 'AI readings are not configured.' });

  const { question, spread, cards, followUp, history, mode } = payload || {};
  if (!Array.isArray(cards) || cards.length < 1 || cards.length > 10) {
    return reply(400, { error: 'Invalid cards.' });
  }
  const lines = cards.map((c, i) =>
    `${i + 1}. Position "${clean(c.position, 60)}" (${clean(c.positionMeaning, 160)}): ${cardLine(c)}`);
  const prompt = `Question: ${clean(question, 500) || '(no specific question: give a general reading)'}
Spread: ${clean(spread, 60)}

Cards in draw order:
${lines.join('\n')}`;

  let system = mode === 'summary' ? SUMMARY_SYSTEM : SYSTEM;
  let maxTokens = mode === 'summary' ? 500 : 1400;
  let content = prompt;
  if (followUp) {
    if (!followUp.card || !followUp.question) return reply(400, { error: 'Invalid follow-up.' });
    const earlier = (Array.isArray(history) ? history.slice(0, 3) : [])
      .map((h, i) => `${i + 1}. "${clean(h.question, 300)}": clarifier ${cardLine(h)}`);
    system = FOLLOW_UP_SYSTEM;
    maxTokens = 600;
    content = `${prompt}

${earlier.length ? `Earlier follow-ups:\n${earlier.join('\n')}\n\n` : ''}New follow-up question: "${clean(followUp.question, 300)}"
Clarifier card drawn: ${cardLine(followUp)}`;
  }

  try {
    if (provider === 'claude') {
      const out = await askClaude(apiKey, system, content);
      if (out.refused) return reply(422, { error: 'The tarot reader could not answer this question. Try rephrasing it.' });
      return reply(200, { text: out.text, provider });
    }
    const text = await askWorkersAI(ai, system, content, maxTokens);
    return reply(200, { text, provider });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return reply(429, { error: 'Too many readings right now. Try again in a minute.' });
    }
    if (err instanceof Anthropic.APIError) {
      console.error('Anthropic API error', err.status, err.message);
      return reply(502, { error: 'Deep readings are unavailable right now.' });
    }
    console.error(err);
    return reply(502, { error: 'The tarot reader is unavailable right now. Please try again later.' });
  }
}
