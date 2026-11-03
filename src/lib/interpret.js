import { SUITS } from '../data/cards.js';

const TOPICS = {
  love: ['love', 'crush', 'boyfriend', 'girlfriend', 'partner', 'relationship', 'date', 'dating', 'marry', 'marriage', 'ex', 'feel about me', 'like me', 'romance', 'soulmate', 'husband', 'wife', 'heart', 'breakup', 'break up', 'together'],
  work: ['job', 'work', 'career', 'boss', 'interview', 'promotion', 'business', 'project', 'school', 'exam', 'study', 'university', 'college', 'company', 'colleague', 'hired', 'quit'],
  money: ['money', 'finance', 'financial', 'salary', 'pay', 'rich', 'debt', 'invest', 'buy', 'afford', 'savings', 'income', 'loan', 'rent', 'price'],
};
const TOPIC_LABEL = { love: 'love', work: 'work and career', money: 'money' };

export function detectTopic(question = '') {
  const q = ` ${question.toLowerCase()} `;
  let best = null, bestScore = 0;
  for (const [topic, words] of Object.entries(TOPICS)) {
    const score = words.filter((w) => new RegExp(`\\b${w}`).test(q)).length;
    if (score > bestScore) { best = topic; bestScore = score; }
  }
  return best;
}

export function isYesNo(question = '') {
  return /^(will|should|is|are|does|do|did|can|could|would|am|has|have|was|shall)\b/i.test(question.trim());
}

const effectiveTone = (d) => (d.reversed ? -d.card.tone * 0.5 - 0.25 : d.card.tone);

// drawn: [{ card, reversed, position }]
export function interpret({ question, spread, drawn }) {
  const topic = detectTopic(question);
  const yesNo = isYesNo(question);

  const cards = drawn.map((d, i) => {
    const { card, reversed, position } = d;
    const kw = reversed ? card.keywords.reversed : card.keywords.upright;
    const meaning = reversed ? card.reversed : card.upright;
    let topicLine = null;
    if (topic) {
      topicLine = reversed
        ? `For ${TOPIC_LABEL[topic]}: the usual promise of this card ("${card.topics[topic].replace(/\.$/, '')}") is blocked, delayed or turned inward right now.`
        : `For ${TOPIC_LABEL[topic]}: ${card.topics[topic]}`;
    }
    return {
      index: i + 1,
      position,
      card,
      reversed,
      keywords: kw,
      text: meaning,
      topicLine,
      advice: card.advice,
    };
  });

  // ---- Overall reading ----
  const n = drawn.length;
  const majors = drawn.filter((d) => d.card.arcana === 'major');
  const reversedCount = drawn.filter((d) => d.reversed).length;
  const suitCounts = {};
  drawn.forEach((d) => { if (d.card.suit) suitCounts[d.card.suit] = (suitCounts[d.card.suit] || 0) + 1; });
  const topSuit = Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0];

  const outcome = drawn.find((d) => d.position.role === 'outcome') || drawn[n - 1];
  const adviceCard = drawn.find((d) => d.position.role === 'advice');

  let score = 0;
  drawn.forEach((d) => { score += effectiveTone(d) * (d === outcome ? 2 : 1); });
  const avg = score / (n + 1);

  const themes = [];
  if (n > 1 && majors.length >= Math.ceil(n / 2)) {
    themes.push(`Many Major Arcana cards (${majors.length} of ${n}) appear. This is not a small, everyday matter: big life lessons and forces beyond your control are at work.`);
  } else if (n > 2 && majors.length === 0) {
    themes.push('No Major Arcana appear, so this situation is in your hands. Everyday choices will shape how it turns out.');
  }
  if (topSuit && topSuit[1] >= 2 && topSuit[1] >= n / 3) {
    const s = SUITS[topSuit[0]];
    themes.push(`${s.name} (${s.element}) dominate the spread, so the story is mostly about ${s.theme}.`);
  }
  if (n > 1 && reversedCount >= Math.ceil(n / 2)) {
    themes.push(`${reversedCount} of ${n} cards are reversed: energy is blocked, delayed or needs to be worked through inside you before it can flow outward.`);
  }

  let mood;
  if (avg >= 1) mood = 'Overall, the cards are bright and encouraging. The energy around your question is strongly in your favor.';
  else if (avg >= 0.3) mood = 'Overall, the cards lean positive. There are lessons along the way, but things are moving in a good direction.';
  else if (avg > -0.3) mood = 'Overall, the cards are mixed. The outcome is not fixed yet; your choices will tip the balance.';
  else if (avg > -1) mood = 'Overall, the cards show challenges. This is a time to be careful, honest and patient rather than to force things.';
  else mood = 'Overall, the cards are heavy. Something difficult needs to be faced, but the cards show where the turning point is.';

  let answer = null;
  if (yesNo) {
    if (avg >= 0.6) answer = { verdict: 'Yes', text: 'The cards lean toward yes.' };
    else if (avg <= -0.4) answer = { verdict: 'No', text: 'The cards lean toward no, or not right now.' };
    else answer = { verdict: 'Maybe', text: 'The answer is not settled. It depends on what you do next.' };
  }

  const outcomeName = `${outcome.card.name}${outcome.reversed ? ' reversed' : ''}`;
  const advice = [];
  if (adviceCard) advice.push(`Your advice card, ${adviceCard.card.name}${adviceCard.reversed ? ' reversed' : ''}, says: ${adviceCard.card.advice}`);
  advice.push(`${n > 1 ? `The outcome rests on ${outcomeName}` : `${outcomeName} answers`}: ${outcome.reversed ? outcome.card.reversed : outcome.card.upright}`);
  if (!adviceCard || adviceCard === outcome) advice.push(`Its advice: ${outcome.card.advice}`);
  if (topic && !outcome.reversed) advice.push(`For your question about ${TOPIC_LABEL[topic]}: ${outcome.card.topics[topic]}`);

  return { topic, yesNo, answer, cards, themes, mood, advice };
}
