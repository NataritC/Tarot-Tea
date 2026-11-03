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

// A clarifier is one extra card drawn to answer a follow-up question about a reading.
export function interpretClarifier({ question, followUp, card, reversed, drawn }) {
  const topic = detectTopic(followUp) || detectTopic(question);
  const tone = effectiveTone({ card, reversed });
  const outcome = drawn.find((d) => d.position.role === 'outcome') || drawn[drawn.length - 1];
  const oTone = effectiveTone(outcome);
  const outcomeName = `${outcome.card.name}${outcome.reversed ? ' reversed' : ''}`;

  let relation;
  if (tone >= 1 && oTone >= 0.5) relation = `It supports your outcome card, ${outcomeName}. The path ahead looks good, and this card shows how to make the most of it.`;
  else if (tone >= 1) relation = `It brings light to the harder parts of your spread. Even with ${outcomeName} as the outcome, this card shows a way through.`;
  else if (tone <= -1 && oTone >= 0.5) relation = `It adds a caution to an otherwise hopeful spread. Watch for this energy so it does not undo the promise of ${outcomeName}.`;
  else if (tone <= -1) relation = `It confirms the challenges already shown in your spread. Facing them honestly is the way forward.`;
  else relation = `It is a practical, in-between card: the answer depends on how you act on it, more than on luck.`;

  let echo = null;
  const sameSuit = card.suit ? drawn.filter((d) => d.card.suit === card.suit) : [];
  if (sameSuit.length) {
    echo = `It shares the suit of ${sameSuit.map((d) => d.card.name).join(', ')} in your spread, so ${SUITS[card.suit].theme} is the thread to follow.`;
  } else if (card.arcana === 'major' && drawn.some((d) => d.card.arcana === 'major')) {
    echo = 'Another Major Arcana card: this follow-up touches a big life lesson, not a passing moment.';
  }

  let topicLine = null;
  if (topic) {
    topicLine = reversed
      ? `For ${TOPIC_LABEL[topic]}: the usual promise of this card ("${card.topics[topic].replace(/\.$/, '')}") is blocked or delayed for now.`
      : `For ${TOPIC_LABEL[topic]}: ${card.topics[topic]}`;
  }

  let answer = null;
  if (isYesNo(followUp)) {
    if (tone >= 1) answer = { verdict: 'Yes', text: 'The clarifier leans toward yes.' };
    else if (tone <= -0.5) answer = { verdict: 'No', text: 'The clarifier leans toward no, or not yet.' };
    else answer = { verdict: 'Maybe', text: 'The clarifier says it depends on your next steps.' };
  }

  return {
    keywords: reversed ? card.keywords.reversed : card.keywords.upright,
    meaning: reversed ? card.reversed : card.upright,
    relation, echo, topicLine, answer,
    advice: card.advice,
  };
}

// A short narrative that retells the whole reading in draw order, plus a one-line takeaway.
export function summarize({ question, drawn, result }) {
  const list = (words) => (words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}` : words[0]);
  const name = (d) => `${d.card.name}${d.reversed ? ' reversed' : ''}`;
  const kws = (d) => list((d.reversed ? d.card.keywords.reversed : d.card.keywords.upright).slice(0, 2));
  const n = drawn.length;

  let story;
  if (n === 1) {
    story = `Your card is ${name(drawn[0])}, which speaks of ${kws(drawn[0])}.`;
  } else {
    story = drawn.map((d, i) => {
      const pos = `the ${d.position.name.replace(/^The /, '')} position`;
      if (i === 0) return `The story begins with ${name(d)} in ${pos}, bringing ${kws(d)}.`;
      if (i === n - 1) return `Finally, ${name(d)} in ${pos} points to ${kws(d)}.`;
      const lead = ['Then', 'Next', 'After that', 'Alongside this'][(i - 1) % 4];
      return `${lead}, ${name(d)} in ${pos} adds ${kws(d)}.`;
    }).join(' ');
  }

  const parts = [];
  if (result.answer) parts.push(`To your question${question ? ` “${question}”` : ''}, the answer leans ${result.answer.verdict.toLowerCase()}.`);
  const mood = result.mood.replace(/^Overall, /, '');
  parts.push(mood.charAt(0).toUpperCase() + mood.slice(1));
  const majors = drawn.filter((d) => d.card.arcana === 'major').length;
  const rev = drawn.filter((d) => d.reversed).length;
  if (n > 1 && majors >= Math.ceil(n / 2)) parts.push('Fate is playing a big part here.');
  if (n > 1 && rev >= Math.ceil(n / 2)) parts.push('Much of the energy is blocked for now, so inner work comes first.');

  return { story, takeaway: parts.join(' ') };
}
