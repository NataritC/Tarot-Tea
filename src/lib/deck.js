import { CARDS } from '../data/cards.js';

export const REVERSAL_CHANCE = 0.35;

// Fisher-Yates shuffle using crypto randomness when available.
const rand = () => {
  if (globalThis.crypto?.getRandomValues) {
    const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 2 ** 32;
  }
  return Math.random();
};

export function shuffleDeck(reversals = true) {
  const deck = CARDS.map((card) => ({ card, reversed: reversals && rand() < REVERSAL_CHANCE }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export const byId = Object.fromEntries(CARDS.map((c) => [c.id, c]));
