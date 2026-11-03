# Tarot & Tea ☕🔮

A tarot reading web app using the **Noctis Tarot** deck: choose a spread, ask a question, shuffle, pick your cards in order, flip them, and get a reading made for your question.

## Features
- **8 spreads**: Daily Card (1), Past·Present·Future (3), The Decision (4), Five-Card Cross (5), The Relationship (6), The Horseshoe (7), The Moon Cycle (8), Celtic Cross (10). Each position has its own meaning and is filled in draw order.
- **Upright and reversed cards** (can be switched off).
- **Question-aware readings**: detects love / work / money questions and yes/no questions, then interprets every card in its position and gives overall patterns and advice.
- **Deep Tarot Reading (optional AI reading)**: Claude writes a personal reading weaving all the cards together with your question.
- **Card of the Day**, **Card Library** (all 78 cards with meanings), **Journal** (saved on the device), and a **How Tarot Works** guide.

## Run locally
```bash
npm install
npm run dev
```
The built-in readings work without any setup. The AI reading needs a deployment (below).

## Deploy (Vercel, with AI readings)
1. Import this repo at https://vercel.com/new (it auto-detects Vite and the `api/` folder).
2. In **Project → Settings → Environment Variables**, add `ANTHROPIC_API_KEY` (get one at https://console.anthropic.com).
3. Deploy. The "Get a Deep Tarot Reading" button appears automatically when the key is set.

**Never commit your API key**: this repo is public.

## Card images
`public/cards/*.webp` were cut from the deck overview poster with `scripts/crop-cards.py`, so they are low resolution (~97px wide). For crisp cards, export each card at about 600×970px and save them with the same file names (e.g. `the-fool.webp`, `ace-of-cups.webp`, `card-back.webp`).
