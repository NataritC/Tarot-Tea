// Each spread: positions in DRAW ORDER. The 1st card drawn fills position 1, and so on.
// x / y are layout coordinates in "card slots" (1 = one card width / height incl. gap).
// rotate: 90 lays the card sideways (used for the Celtic Cross "crossing" card).

const p = (name, meaning, x, y, extra = {}) => ({ name, meaning, x, y, ...extra });

export const SPREADS = [
  {
    id: 'daily', name: 'Daily Card', count: 1, icon: '☾',
    description: 'One card for the energy, message or lesson of the day. Perfect for a quick question.',
    positions: [p('The Message', 'the core energy or answer to your question', 0, 0, { role: 'outcome' })],
  },
  {
    id: 'three', name: 'Past · Present · Future', count: 3, icon: '⋯',
    description: 'The classic three-card timeline: where you came from, where you are, and where things are heading.',
    positions: [
      p('Past', 'what led to this situation; influences behind you', 0, 0),
      p('Present', 'where you stand right now', 1, 0),
      p('Future', 'where things are heading if nothing changes', 2, 0, { role: 'outcome' }),
    ],
  },
  {
    id: 'decision', name: 'The Decision', count: 4, icon: '◇',
    description: 'For when you are at a crossroads: understand the situation, what stands in the way, and what to do.',
    positions: [
      p('Situation', 'the heart of the matter as it is now', 0, 0.5),
      p('Challenge', 'the obstacle or what complicates the choice', 1, 0),
      p('Advice', 'the best approach to take', 1, 1, { role: 'advice' }),
      p('Outcome', 'the likely result if you follow the advice', 2, 0.5, { role: 'outcome' }),
    ],
  },
  {
    id: 'cross', name: 'Five-Card Cross', count: 5, icon: '✚',
    description: 'A deeper look at a situation: its past, future, root cause and hidden potential.',
    positions: [
      p('Present', 'the current situation at the center of it all', 1, 1),
      p('Past', 'what has influenced things up to now', 0, 1),
      p('Future', 'what is approaching', 2, 1),
      p('Root Cause', 'the underlying reason, the foundation beneath it', 1, 2),
      p('Potential', 'the best possible outcome to aim for', 1, 0, { role: 'outcome' }),
    ],
  },
  {
    id: 'relationship', name: 'The Relationship', count: 6, icon: '♡',
    description: 'For love, friendship or any bond between two people: both sides, the connection and where it is going.',
    positions: [
      p('You', 'your feelings and role in this connection', 0, 0),
      p('Them', 'their feelings and role in this connection', 2, 0),
      p('The Connection', 'the bond that exists between you', 1, 0),
      p('Strengths', 'what holds you together', 0, 1.15),
      p('Challenges', 'what tests or strains the relationship', 2, 1.15),
      p("Where It's Heading", 'the direction this relationship is moving in', 1, 1.15, { role: 'outcome' }),
    ],
  },
  {
    id: 'horseshoe', name: 'The Horseshoe', count: 7, icon: '∩',
    description: 'A lucky horseshoe of seven cards: past to outcome, with hidden influences and advice along the way.',
    positions: [
      p('Past', 'what has shaped the situation', 0, 0),
      p('Present', 'where you stand now', 1, 0.75),
      p('Hidden Influences', 'what is working beneath the surface', 2, 1.4),
      p('Obstacles', 'what stands in your way', 3, 1.7),
      p('People Around You', 'how others influence the situation', 4, 1.4),
      p('Advice', 'what you should do', 5, 0.75, { role: 'advice' }),
      p('Outcome', 'the most likely result', 6, 0, { role: 'outcome' }),
    ],
  },
  {
    id: 'moon', name: 'The Moon Cycle', count: 8, icon: '◐',
    description: 'A Noctis original: eight cards for the eight phases of the moon, a full cycle of intention, growth and release.',
    positions: [
      p('New Moon', 'the intention you are planting', 1.5, 0),
      p('Waxing Crescent', 'the first step to take', 2.6, 0.45),
      p('First Quarter', 'the challenge that will test you', 3, 1.5),
      p('Waxing Gibbous', 'what to refine and adjust', 2.6, 2.55),
      p('Full Moon', 'what will be revealed or achieved', 1.5, 3, { role: 'outcome' }),
      p('Waning Gibbous', 'what to be grateful for and share', 0.4, 2.55),
      p('Last Quarter', 'what you must release', 0, 1.5, { role: 'advice' }),
      p('Waning Crescent', 'how to rest and prepare for the next cycle', 0.4, 0.45),
    ],
  },
  {
    id: 'celtic', name: 'The Celtic Cross', count: 10, icon: '✠',
    description: 'The most famous spread: a complete, in-depth picture of a situation, from its roots to its final outcome.',
    positions: [
      p('The Present', 'the heart of the situation', 1, 1.25),
      p('The Challenge', 'what crosses you, the immediate obstacle', 1, 1.25, { rotate: 90 }),
      p('The Foundation', 'the root of the matter, deep in the past', 1, 2.5),
      p('The Recent Past', 'what is just behind you', 0, 1.25),
      p('The Crown', 'your conscious goal; the best that can be achieved', 1, 0),
      p('The Near Future', 'what is coming next', 2, 1.25),
      p('Yourself', 'your attitude and how you see yourself', 3.3, 3),
      p('Environment', 'the people and forces around you', 3.3, 2),
      p('Hopes & Fears', 'what you secretly hope for, or fear', 3.3, 1),
      p('The Outcome', 'where everything is leading', 3.3, 0, { role: 'outcome' }),
    ],
  },
];

export const getSpread = (id) => SPREADS.find((s) => s.id === id);
