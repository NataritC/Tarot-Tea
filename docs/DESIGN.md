# Tarot & Tea: App Design

## Core idea: spreads, positions and order
A tarot **spread** is a layout of cards where **every position has its own meaning**.
The **order cards are drawn decides which position they fill**: the 1st card picked goes to position 1, the 2nd to position 2, and so on.
The same card reads differently depending on its position (e.g. The Tower in *Past* = an upheaval already lived through; in *Outcome* = one ahead).
Cards can be drawn **reversed** (upside down), which changes or softens the meaning.

The app must explain all of this to users in a **"How Tarot Works"** guide (and in short tooltips during a reading).

## Spreads to include
| Cards | Spread | Positions (in draw order) |
|---|---|---|
| 1 | Daily Card | 1 Energy / message for today |
| 3 | Past / Present / Future | 1 Past · 2 Present · 3 Future |
| 4 | Decision | 1 Situation · 2 Challenge · 3 Advice · 4 Outcome |
| 5 | Five-Card Cross | 1 Present · 2 Past · 3 Future · 4 Root cause · 5 Potential |
| 6 | Relationship | 1 You · 2 Them · 3 Your connection · 4 Strengths · 5 Challenges · 6 Where it's heading |
| 7 | Horseshoe | 1 Past · 2 Present · 3 Hidden influences · 4 Obstacles · 5 People around you · 6 Advice · 7 Outcome |
| 8 | (No single standard; pick one, possibly the owner's friend's favorite) | TBD |
| 10 | Celtic Cross | 1 Present · 2 Challenge (crosses it) · 3 Foundation / root · 4 Recent past · 5 Conscious goal / best outcome · 6 Near future · 7 Self · 8 Environment / others · 9 Hopes & fears · 10 Final outcome |
| any | Custom spread | User names their own positions |

## Reading flow
1. **Pick a spread**: cards showing a mini preview of the layout shape (cross, horseshoe…).
2. **Ask a question** (optional).
3. **Shuffle**: animated deck shuffle.
4. **Choose cards**: all 78 cards fanned face-down; tap the ones that call to you. Each flies to its numbered spot with the position name glowing beneath it.
5. **Reveal**: tap to flip (3D flip animation); some cards come out reversed.
6. **Interpretation**: each card's meaning *for that position* (upright/reversed), plus an overall summary.
7. **Journal**: save readings with question, date and notes.
8. **Card library**: browse all 78 cards (22 Major + 56 Minor Arcana) and their meanings.
9. **How Tarot Works**: guide explaining spreads, positions, draw order, reversals, Major vs Minor Arcana and suits.

## Later / optional
- AI-written whole-spread interpretation via the Claude API. Needs a small backend and a secret API key; **never commit keys** (this repo is public; use `.env`, gitignored).

## Open decisions
- Style: cozy "Tarot & Tea" (cream, terracotta, gold, teacups) vs dark mystical (purple, gold, stars).
- Platform: responsive website (recommended) vs native phone app.
