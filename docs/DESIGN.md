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
| 8 | The Moon Cycle (Noctis original) | 1 New Moon · 2 Waxing Crescent · 3 First Quarter · 4 Waxing Gibbous · 5 Full Moon · 6 Waning Gibbous · 7 Last Quarter · 8 Waning Crescent |
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

## Decisions
- Deck: **Noctis Tarot** (owner's deck). Style follows the deck: black, crimson and gold; Cinzel + Cormorant Garamond.
- Platform: responsive website (React + Vite), deployable on Vercel.
- Readings: built-in engine (`src/lib/interpret.js`) works offline: per-position meanings, question topic (love/work/money), yes/no leaning, patterns (Major count, dominant suit, reversals) and advice.
- AI readings: `api/interpret.js` serverless function calls Claude; enabled only when `ANTHROPIC_API_KEY` is set on the server.
- Mobile: iOS-style bottom tab bar, safe-area aware, Add to Home Screen (manifest + apple-touch-icon), bottom-sheet card popups.
- Reversal chance: 35% per card. Journal and daily card are stored in localStorage.

## Known deck art issues (to fix in the artwork)
- "THE HIGH PRIESTSS" typo (should be PRIESTESS).
- Every Cups label renders the suit as "©CUPS"/"CCUPS"; Knight of Cups is labelled "KNIGHT of WANPS".
- Wrong suit symbols: Page of Swords and Queen of Swords hold cups; King of Wands holds a sword; Six of Pentacles shows a goblet instead of coins.
- Missing or wrong counts: Two, Three and Four of Cups show no cups; Five of Cups shows two spilled cups (traditionally 3 spilled + 2 standing); Eight of Pentacles shows 4 coins.
- Card faces in the app are AI-upscaled (Real-ESRGAN x4) crops of the overview poster; replace with full-size exports when available. The card back is a vector redraw (SVG).
