import { useState } from 'react';
import { CARDS } from '../data/cards.js';
import { SPREADS } from '../data/spreads.js';
import { byId, REVERSAL_CHANCE } from '../lib/deck.js';
import { loadDaily, saveDaily } from '../lib/storage.js';
import TarotCard from '../components/TarotCard.jsx';
import CardModal from '../components/CardModal.jsx';
import Logo from '../components/Logo.jsx';

const today = () => new Date().toLocaleDateString('en-CA');

function getDaily() {
  const d = loadDaily();
  if (d && d.date === today()) return d;
  const card = CARDS[Math.floor(Math.random() * CARDS.length)];
  const fresh = { date: today(), cardId: card.id, reversed: Math.random() < REVERSAL_CHANCE, revealed: false };
  saveDaily(fresh);
  return fresh;
}

export default function HomePage({ navigate }) {
  const [daily, setDaily] = useState(getDaily);
  const [open, setOpen] = useState(false);
  const card = byId[daily.cardId];

  const reveal = () => {
    if (daily.revealed) { setOpen(true); return; }
    const d = { ...daily, revealed: true }; setDaily(d); saveDaily(d);
  };

  return (
    <div className="page fade-up">
      <section className="hero">
        <Logo size={120} className="hero-logo" />
        <p className="eyebrow">The Noctis Tarot</p>
        <h1 className="hero-title">Tarot <span className="amp">&amp;</span> Tea</h1>
        <p className="lead">Pour a cup, quiet your mind, and ask the cards. Choose a spread, draw your cards in order, and receive a reading made for your question.</p>
        <div className="actions center-actions">
          <button className="btn btn-gold" onClick={() => navigate('read')}>Begin a Reading</button>
          <button className="btn btn-ghost" onClick={() => navigate('learn')}>How Tarot Works</button>
        </div>
      </section>

      <section className="daily">
        <div className="daily-card">
          <TarotCard card={card} reversed={daily.reversed} faceUp={daily.revealed} onClick={reveal} glow={!daily.revealed} title="Your card of the day" />
        </div>
        <div className="daily-text">
          <p className="eyebrow">Card of the Day · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          {daily.revealed ? (
            <>
              <h2>{card.name}{daily.reversed && <span className="rev-tag">Reversed</span>}</h2>
              <p>{daily.reversed ? card.reversed : card.upright}</p>
              <p className="topic-line">Today's advice: {card.advice}</p>
              <button className="btn btn-ghost small-btn" onClick={() => setOpen(true)}>Full meaning</button>
            </>
          ) : (
            <>
              <h2>A card is waiting for you</h2>
              <p>Take a breath and tap the card to reveal the energy of your day. You get one card each day.</p>
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="section-title center">Spreads</h2>
        <div className="spread-pills">
          {SPREADS.map((s) => (
            <button key={s.id} className="spread-pill" onClick={() => navigate('read', s.id)}>
              <span className="pill-icon">{s.icon}</span>
              <span><strong>{s.name}</strong><small>{s.count} {s.count === 1 ? 'card' : 'cards'}</small></span>
            </button>
          ))}
        </div>
      </section>

      {open && <CardModal card={card} reversed={daily.reversed} onClose={() => setOpen(false)} />}
    </div>
  );
}
