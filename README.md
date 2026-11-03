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

## Deploy on Cloudflare Pages (recommended)
1. Log in at https://dash.cloudflare.com, open **Workers & Pages → Create → Pages → Connect to Git**, and pick this repo.
2. Build settings: **Build command** `npm run build`, **Build output directory** `dist`.
3. **Save and Deploy**. The site goes live at `https://<project>.pages.dev` and redeploys on every push to `main`.
4. For AI readings: **Settings → Variables and Secrets → Add**, type **Secret**, name `ANTHROPIC_API_KEY` (key from https://console.anthropic.com), then redeploy.

The AI endpoint is `functions/api/interpret.js` (a Pages Function). Config lives in `wrangler.toml`.
Test locally with Cloudflare's runtime: `npm run build && npx wrangler pages dev dist` (put a test key in `.dev.vars`, which is gitignored).

## Deploy on Vercel (alternative)
Import the repo at https://vercel.com/new and add `ANTHROPIC_API_KEY` under **Settings → Environment Variables**. The adapter is `api/interpret.js`.

Both hosts share the same reading logic in `server/reader.js`. **Never commit your API key**: this repo is public.

## Card images
- **Card back**: hand-drawn vector art (`public/cards/card-back.svg`), sharp at any size.
- **Card faces** (`public/cards/*.webp`): cut from the deck overview poster and enlarged 4x with the Real-ESRGAN AI upscaler (`scripts/upscale-cards.py`). They are much sharper than before, but the source cards were only ~97px wide, so some fine detail is AI-reconstructed. For perfect quality, export each card at about 600x1000px and save it with the same file name (e.g. `the-fool.webp`, `ace-of-cups.webp`).

## iPhone
Open the site in Safari, tap **Share → Add to Home Screen**, and it runs full-screen like an app, with its own icon.
