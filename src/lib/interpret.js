import { SUITS } from '../data/cards.js';

const TOPICS = {
  love: ['love', 'crush', 'boyfriend', 'girlfriend', 'partner', 'relationship', 'date', 'dating', 'marry', 'marriage', 'ex', 'feel about me', 'like me', 'romance', 'soulmate', 'husband', 'wife', 'heart', 'breakup', 'break up', 'together'],
  work: ['job', 'work', 'career', 'boss', 'interview', 'promotion', 'business', 'project', 'school', 'exam', 'study', 'university', 'college', 'company', 'colleague', 'hired', 'quit'],
  money: ['money', 'finance', 'financial', 'salary', 'pay', 'rich', 'debt', 'invest', 'buy', 'afford', 'savings', 'income', 'loan', 'rent', 'price'],
};
const TOPIC_LABEL = { love: 'love', work: 'work and career', money: 'money' };

// Deterministic variety: the same reading always reads the same, different readings read differently.
function hashSeed(question = '', drawn = []) {
  const str = question + drawn.map((d) => d.card.id + (d.reversed ? 'r' : '')).join('|');
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const pick = (options, seed, offset = 0) => options[(seed + offset * 7919) % options.length];

// Overall mood, from heavy (0) to bright (4). {out} = the outcome card.
const MOODS = [
  ['The cards are heavy, and {out} does not hide it. Something difficult needs to be faced, but the reading also shows where the turning point lies.',
   'This is a demanding reading. With {out} at the end of the story, it is time to face what is hard rather than look away; that is where change begins.',
   'A serious reading. {out} asks you to meet a real difficulty head-on, and the other cards show you how to come through it.'],
  ['The cards show challenges. With {out} as the outcome, care, honesty and patience will serve you better than force.',
   'This reading asks for caution. {out} suggests slowing down and seeing clearly before you act.',
   'There is tension here. {out} points to a path that needs patience and honest choices to turn in your favor.'],
  ['The cards are mixed, and {out} shows the outcome is not fixed yet. Your choices will tip the balance.',
   'This reading is balanced on a knife\'s edge. {out} leaves the door open both ways, so what you do next matters most.',
   'Light and shadow are both present. With {out} as the outcome, the result depends on how you act on the guidance here.'],
  ['The cards lean positive. {out} points in a good direction, with some lessons along the way.',
   'A hopeful reading. With {out} as your outcome, things are moving the right way if you stay engaged.',
   'Encouraging energy overall. {out} suggests progress, as long as you heed the advice in the spread.'],
  ['The cards are bright and encouraging. With {out} as your outcome, the energy around your question is strongly in your favor.',
   'This is a beautiful reading. {out} crowns the spread with real promise.',
   'A strongly positive reading. Everything points toward {out}, and the cards are on your side.'],
];

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

  const moodLevel = avg >= 1 ? 4 : avg >= 0.3 ? 3 : avg > -0.3 ? 2 : avg > -1 ? 1 : 0;
  const seed = hashSeed(question, drawn);
  const outName = `${outcome.card.name}${outcome.reversed ? ' reversed' : ''}`;
  const mood = pick(MOODS[moodLevel], seed).replace(/\{out\}/g, outName);

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

  return { topic, yesNo, answer, cards, themes, mood, moodLevel, avg, seed, outcome, adviceCard, advice };
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

// ---------- Tailored summary ----------

// What a position "does" in the story, so each card is described in the right voice.
const POSITION_KIND = {
  'Past': 'past', 'The Recent Past': 'past', 'The Foundation': 'root', 'Root Cause': 'root',
  'Present': 'present', 'The Present': 'present', 'Situation': 'present', 'The Message': 'message',
  'Challenge': 'challenge', 'The Challenge': 'challenge', 'Challenges': 'challenge', 'Obstacles': 'challenge', 'First Quarter': 'challenge',
  'Future': 'future', 'The Near Future': 'future',
  'Hidden Influences': 'hidden', 'Hopes & Fears': 'hopes',
  'You': 'self', 'Yourself': 'self', 'Them': 'them', 'People Around You': 'others', 'Environment': 'others',
  'The Connection': 'bond', 'Strengths': 'strength',
  'Advice': 'advice', 'Last Quarter': 'release', 'Waxing Crescent': 'step', 'Waning Crescent': 'rest',
  'New Moon': 'intention', 'Waxing Gibbous': 'refine', 'Waning Gibbous': 'gratitude',
  'Outcome': 'outcome', 'The Outcome': 'outcome', 'Potential': 'outcome', 'The Crown': 'goal', "Where It's Heading": 'outcome', 'Full Moon': 'outcome',
};

// {c} = card name, {m} = card meaning (first sentence, in that orientation), {a} = card advice
const KIND_TEMPLATES = {
  past: ['Behind you lies {c}: {m}', 'The story starts with {c} in your past. {m}', 'Looking back, {c} shaped where you are. {m}'],
  root: ['At the root of it all is {c}: {m}', 'Deep underneath, the foundation is {c}. {m}'],
  present: ['Right now, {c} sets the scene: {m}', 'At the heart of things today is {c}. {m}', 'Your present is shown by {c}. {m}'],
  message: ['Your card is {c}. {m}', '{c} answers you directly: {m}'],
  softChallenge: ['Even the challenge here is a gentle one: {c}. {m} The test is to accept this good energy rather than doubt it.',
    'The obstacle, {c}, is a kind one: {m} Do not let fear stop you from welcoming it.'],
  challenge: ['What stands in your way is {c}: {m}', 'The test here is {c}. {m}', '{c} is the obstacle to work through: {m}'],
  future: ['Coming toward you is {c}: {m}', 'Next, {c} appears on the horizon. {m}'],
  hidden: ['Beneath the surface, {c} is at work: {m}', 'Quietly, behind the scenes, there is {c}. {m}'],
  hopes: ['Your hopes and fears are wrapped up in {c}: {m}', 'What you secretly hope for, or fear, is {c}. {m}'],
  self: ['You appear as {c}: {m}', 'Your own role is shown by {c}. {m}'],
  them: ['They are represented by {c}: {m}', 'On their side of things, {c} appears. {m}'],
  others: ['The people and forces around you show up as {c}: {m}', 'Your surroundings bring {c}. {m}'],
  bond: ['Between you, the bond is {c}: {m}', 'The connection itself is {c}. {m}'],
  strength: ['What holds things together is {c}: {m}', 'Your shared strength is {c}. {m}'],
  advice: ['The cards advise {c}: {a}', 'Your guidance comes from {c}: {a}'],
  release: ['To move on, {c} shows what to release: {m}', '{c} names what you must let go of. {m}'],
  step: ['Your first step is {c}: {a}', '{c} shows how to begin: {a}'],
  rest: ['To rest and prepare, {c} advises: {a}'],
  intention: ['The intention you are planting is {c}: {m}'],
  refine: ['What needs refining is {c}: {m}'],
  gratitude: ['What to be grateful for is {c}: {m}'],
  goal: ['The best you can reach for is {c}: {m}', 'Your highest goal here is {c}. {m}'],
  outcome: ['Where it is all leading is {c}: {m}', 'The story ends with {c}. {m}', 'The outcome rests on {c}. {m}'],
  generic: ['In {p}, {c} appears: {m}'],
};

const TOPIC_OPENERS = {
  love: ['In matters of the heart,', 'For your love life,', 'Where love is concerned,'],
  work: ['On the work front,', 'For your career,', 'Where work is concerned,'],
  money: ['Where money is concerned,', 'For your finances,', 'On the money side,'],
};

const COMBOS = [
  [['the-tower', 'the-star'], 'The Tower and The Star together tell a classic story: after the upheaval comes real healing.'],
  [['the-lovers', 'two-of-cups'], 'The Lovers alongside the Two of Cups is one of the strongest signs of mutual love in the whole deck.'],
  [['the-sun', 'the-world'], 'The Sun and The World together promise success and a deeply fulfilling result.'],
  [['the-moon', 'the-high-priestess'], 'The Moon and The High Priestess both ask you to trust your intuition over appearances.'],
  [['the-devil', 'the-lovers'], 'The Devil beside The Lovers warns of temptation or unhealthy attachment tangled up with love.'],
  [['wheel-of-fortune', 'the-chariot'], 'The Wheel of Fortune with The Chariot: luck is turning, and your own drive can steer it.'],
  [['ten-of-swords', 'the-star'], 'The Ten of Swords and The Star: rock bottom becomes the starting point of recovery.'],
  [['the-hermit', 'four-of-swords'], 'The Hermit and the Four of Swords both call for rest and solitude before your next move.'],
  [['the-empress', 'the-emperor'], 'The Empress and The Emperor together show a powerful balance of care and structure.'],
  [['five-of-pentacles', 'six-of-pentacles'], 'The Five and Six of Pentacles together: hardship is met by help. Let others support you.'],
  [['three-of-swords', 'six-of-swords'], 'The Three and Six of Swords: heartbreak is real, but you are already moving toward calmer waters.'],
  [['death', 'the-star'], 'Death and The Star: an ending leads to renewal and fresh hope.'],
  [['the-tower', 'death'], 'The Tower and Death together mark a major, life-changing turning point.'],
  [['the-fool', 'the-world'], 'The Fool and The World: one cycle completes as an exciting new one begins.'],
];

const NUMBER_THEMES = ['', 'new beginnings', 'choices and partnership', 'growth and collaboration', 'stability and rest',
  'conflict and change', 'harmony and generosity', 'reflection and tests', 'movement and mastery', 'near-completion', 'endings and completion'];
const NUMBER_WORDS = ['', 'Aces', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes', 'Sevens', 'Eights', 'Nines', 'Tens'];
const COURT_TRAITS = { Page: 'curious and just beginning', Knight: 'restless and in motion', Queen: 'mature, caring and intuitive', King: 'confident, in charge and outward-facing' };

const firstSentence = (text) => (text.match(/^.*?[.!?](\s|$)/) || [text])[0].trim();
const lowerFirst = (t) => t.charAt(0).toLowerCase() + t.slice(1);

export function summarize({ question, drawn, result }) {
  const seed = result.seed ?? hashSeed(question, drawn);
  const topic = result.topic;
  const n = drawn.length;
  const name = (d) => `${d.card.name}${d.reversed ? ' reversed' : ''}`;

  // 1. The story, card by card, in the voice of each position.
  const sentences = drawn.map((d, i) => {
    let kind = POSITION_KIND[d.position.name] || 'generic';
    if (kind === 'challenge' && effectiveTone(d) >= 1) kind = 'softChallenge';
    let meaning = firstSentence(d.reversed ? d.card.reversed : d.card.upright);
    // Use the love/work/money meaning for the positions that matter most.
    if (topic && !d.reversed && ['present', 'message', 'outcome', 'bond', 'them', 'self'].includes(kind)) {
      meaning = `${meaning} For ${TOPIC_LABEL[topic]}: ${lowerFirst(d.card.topics[topic])}`;
    }
    const template = pick(KIND_TEMPLATES[kind], seed, i);
    return template
      .replace('{c}', name(d))
      .replace('{m}', template.includes(': {m}') ? lowerFirst(meaning) : meaning)
      .replace('{a}', lowerFirst(d.card.advice))
      .replace('{p}', d.position.name);
  });
  let opening = '';
  if (topic) opening = `${pick(TOPIC_OPENERS[topic], seed)} `;
  const story = (opening ? opening + lowerFirst(sentences[0]) : sentences[0]) + (sentences.length > 1 ? ' ' + sentences.slice(1).join(' ') : '');

  // 2. Insights: the arc of the story, famous combinations, numbers, people, elements.
  const insights = [];
  const outcome = result.outcome;
  if (n >= 3) {
    const early = drawn.filter((d) => d !== outcome && ['past', 'root', 'present', 'challenge'].includes(POSITION_KIND[d.position.name]));
    if (early.length) {
      const e = early.reduce((sum, d) => sum + effectiveTone(d), 0) / early.length;
      const o = effectiveTone(outcome);
      if (e < 0 && o > 0.5) insights.push(`The arc is hopeful: a difficult start gives way to ${name(outcome)}.`);
      else if (e > 0.5 && o < 0) insights.push(`Stay alert: a promising start turns more complicated by ${name(outcome)}, so do not coast.`);
      else if (e > 0.5 && o > 0.5) insights.push('From beginning to end the energy is supportive. Keep going the way you are.');
      else if (e < 0 && o < 0) insights.push('This is a demanding chapter from start to finish; patience and honesty will carry you through.');
    }
  }
  const ids = new Set(drawn.map((d) => d.card.id));
  COMBOS.forEach(([pair, text]) => { if (pair.every((id) => ids.has(id))) insights.push(text); });
  const aces = drawn.filter((d) => d.card.rank === 'Ace');
  if (ids.has('death') && aces.length) insights.push(`Death with the ${aces[0].card.name}: an ending clears space for a genuine new beginning.`);
  if (ids.has('the-magician') && aces.length) insights.push(`The Magician with the ${aces[0].card.name}: you already have what you need to begin.`);
  const counts = {};
  drawn.forEach((d) => { if (d.card.arcana === 'minor' && !d.card.court) counts[d.card.number] = (counts[d.card.number] || 0) + 1; });
  Object.entries(counts).forEach(([num, c]) => { if (c >= 2) insights.push(`${c === 2 ? 'Two' : c === 3 ? 'Three' : 'Four'} ${NUMBER_WORDS[num]} appear, so ${NUMBER_THEMES[num]} is a recurring theme.`); });
  // Court cards in You/Them positions already describe people, so only mention the others.
  const courts = drawn.filter((d) => d.card.court && !['self', 'them'].includes(POSITION_KIND[d.position.name]));
  if (courts.length) {
    const c = courts[0];
    insights.push(courts.length === 1
      ? `The ${c.card.name} may be a real person in this story, or a side of you that is ${COURT_TRAITS[c.card.rank]}.`
      : `${courts.map((x) => x.card.name).join(' and ')} suggest other people play an important part here.`);
  }
  if (n >= 7) {
    const present = new Set(drawn.map((d) => d.card.suit).filter(Boolean));
    const missing = Object.keys(SUITS).filter((k) => !present.has(k));
    if (missing.length === 1) insights.push(`No ${SUITS[missing[0]].name} appear, so ${SUITS[missing[0]].theme.split(',')[0]} may need more of your attention.`);
  }

  // 3. In short: the answer, the mood and one piece of advice, in varied words.
  const parts = [];
  if (result.answer) {
    const v = result.answer.verdict.toLowerCase();
    parts.push(pick([
      `To “${question}”, the cards lean ${v === 'maybe' ? 'neither way yet' : `toward ${v}`}.`,
      `Your answer: ${v === 'maybe' ? 'not settled yet' : v}.`,
    ], seed));
  }
  parts.push(result.mood);
  const adviceSource = result.adviceCard || outcome;
  parts.push(`Above all: ${lowerFirst(adviceSource.card.advice)}`);

  return { story, insights, takeaway: parts.join(' ') };
}
