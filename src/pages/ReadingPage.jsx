import { useEffect, useMemo, useRef, useState } from 'react';
import { SPREADS, getSpread } from '../data/spreads.js';
import { shuffleDeck } from '../lib/deck.js';
import { loadJournal, saveJournal, loadSettings, saveSettings } from '../lib/storage.js';
import SpreadLayout from '../components/SpreadLayout.jsx';
import ReadingResult from '../components/ReadingResult.jsx';
import TarotCard from '../components/TarotCard.jsx';

const QUESTION_IDEAS = [
  'What do I need to know about my love life right now?',
  'Should I take the new job offer?',
  'How can I improve my finances this month?',
  'What is blocking me from moving forward?',
  'Will my relationship with them grow?',
];

export default function ReadingPage({ initialSpread, aiAvailable, navigate }) {
  const [step, setStep] = useState(initialSpread ? 'question' : 'spread');
  const [spreadId, setSpreadId] = useState(initialSpread || null);
  const [question, setQuestion] = useState('');
  const [settings, setSettings] = useState(loadSettings);
  const [deck, setDeck] = useState([]);
  const [picked, setPicked] = useState([]); // indexes into deck, in draw order
  const [revealed, setRevealed] = useState([]);
  const [savedId, setSavedId] = useState(null);
  const aiText = useRef(null);
  const spread = spreadId && getSpread(spreadId);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  function chooseSpread(id) { setSpreadId(id); setStep('question'); }

  function startShuffle() {
    setDeck(shuffleDeck(settings.reversals));
    setPicked([]); setRevealed([]); setSavedId(null); aiText.current = null;
    setStep('shuffle');
    setTimeout(() => setStep('pick'), 2200);
  }

  function pick(deckIndex) {
    if (picked.includes(deckIndex) || picked.length >= spread.count) return;
    const next = [...picked, deckIndex];
    setPicked(next);
    if (next.length === spread.count) setTimeout(() => setStep('reveal'), 900);
  }

  function reveal(i) {
    if (step !== 'reveal' || revealed.includes(i)) return;
    // Cards are revealed in draw order.
    if (i !== revealed.length) return;
    setRevealed([...revealed, i]);
  }
  const revealAll = () => setRevealed(spread.positions.map((_, i) => i));

  const drawn = useMemo(
    () => picked.map((di, i) => ({ ...deck[di], position: spread.positions[i] })),
    [picked, deck, spread],
  );
  const slots = drawn.map((d, i) => ({ ...d, revealed: revealed.includes(i) }));
  const allRevealed = spread && revealed.length === spread.count;

  function save(note, ai) {
    const entry = {
      id: Date.now().toString(36),
      date: new Date().toISOString(),
      question: question.trim(),
      spreadId,
      cards: drawn.map((d) => ({ id: d.card.id, reversed: d.reversed })),
      note: note.trim(),
      ai: ai || aiText.current,
    };
    saveJournal([entry, ...loadJournal()]);
    setSavedId(entry.id);
  }

  // ---------- Step: choose spread ----------
  if (step === 'spread') {
    return (
      <div className="page fade-up">
        <header className="page-head">
          <p className="eyebrow">Step 1 of 4</p>
          <h1>Choose Your Spread</h1>
          <p className="lead">Each spread is a layout where every position has its own meaning. The more cards, the deeper the reading.</p>
        </header>
        <div className="spread-grid">
          {SPREADS.map((s) => (
            <button key={s.id} className="spread-card" onClick={() => chooseSpread(s.id)}>
              <div className="spread-card-top">
                <span className="spread-count">{s.count}</span>
                <span className="spread-count-label">{s.count === 1 ? 'card' : 'cards'}</span>
              </div>
              <SpreadLayout spread={s} compact showLabels={false} />
              <h3>{s.name}</h3>
              <p>{s.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---------- Step: question ----------
  if (step === 'question') {
    return (
      <div className="page narrow fade-up">
        <header className="page-head">
          <p className="eyebrow">Step 2 of 4 · {spread.name}</p>
          <h1>Ask Your Question</h1>
          <p className="lead">Hold your question in your mind. Open questions (“What…”, “How…”) give the richest readings; yes/no questions get a clear leaning.</p>
        </header>
        <textarea
          className="question-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What would you like to ask the cards?"
          rows={3}
          maxLength={300}
          autoFocus
        />
        <div className="idea-chips">
          {QUESTION_IDEAS.map((q) => <button key={q} className="chip chip-btn" onClick={() => setQuestion(q)}>{q}</button>)}
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.reversals}
            onChange={(e) => { const s = { ...settings, reversals: e.target.checked }; setSettings(s); saveSettings(s); }}
          />
          <span>Include reversed (upside-down) cards</span>
        </label>
        <div className="positions-preview">
          <h4>Your positions, in draw order</h4>
          <ol>{spread.positions.map((p) => <li key={p.name}><strong>{p.name}</strong>: {p.meaning}</li>)}</ol>
        </div>
        <div className="actions">
          <button className="btn btn-ghost" onClick={() => setStep('spread')}>← Change spread</button>
          <button className="btn btn-gold" onClick={startShuffle}>Shuffle the Deck</button>
        </div>
      </div>
    );
  }

  // ---------- Step: shuffle animation ----------
  if (step === 'shuffle') {
    return (
      <div className="page center fade-up">
        <div className="shuffle-stage" aria-hidden="true">
          {Array.from({ length: 7 }).map((_, i) => (
            <TarotCard key={i} className="shuffle-card" style={{ '--i': i }} />
          ))}
        </div>
        <p className="shuffle-text">Shuffling… focus on your question</p>
      </div>
    );
  }

  // ---------- Steps: pick + reveal + reading ----------
  const nextPos = spread.positions[picked.length];
  return (
    <div className="page fade-up">
      <header className="page-head">
        <p className="eyebrow">{step === 'pick' ? 'Step 3 of 4' : 'Step 4 of 4'} · {spread.name}</p>
        {step === 'pick' && nextPos && (
          <>
            <h1>Choose card {picked.length + 1} of {spread.count}</h1>
            <p className="lead">This card becomes <strong className="gold">{nextPos.name}</strong>: {nextPos.meaning}. Let your hand be drawn to it.</p>
          </>
        )}
        {step === 'pick' && !nextPos && <h1>The cards are chosen</h1>}
        {step === 'reveal' && !allRevealed && (
          <>
            <h1>Reveal Your Cards</h1>
            <p className="lead">Tap the glowing card to turn it over, in order from 1 to {spread.count}.</p>
          </>
        )}
        {allRevealed && <h1>Your Reading</h1>}
        {question && step !== 'reveal' && <p className="reading-question">“{question}”</p>}
      </header>

      <div className="table-felt">
        <SpreadLayout
          spread={spread}
          slots={slots}
          activeIndex={step === 'pick' ? picked.length : allRevealed ? -1 : revealed.length}
          onSlotClick={step === 'reveal' ? reveal : undefined}
        />
      </div>

      {step === 'pick' && (
        <div className="fan-wrap">
          <p className="fan-hint">Scroll the deck ↔ and tap a card</p>
          <div className="fan" role="list">
            <div className="fan-inner" style={{ width: `${deck.length * 20 + 80}px` }}>
              {deck.map((d, i) => {
                const mid = (deck.length - 1) / 2;
                const off = (i - mid) / mid; // -1 … 1
                const taken = picked.includes(i);
                return (
                  <button
                    key={d.card.id}
                    className={`fan-card ${taken ? 'is-taken' : ''}`}
                    style={{ left: `${i * 20 + 10}px`, '--rot': `${off * 14}deg`, '--lift': `${off * off * 26}px` }}
                    onClick={() => pick(i)}
                    disabled={taken}
                    aria-label={`Face-down card ${i + 1}`}
                  >
                    <TarotCard />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {step === 'reveal' && !allRevealed && (
        <div className="actions center-actions">
          <button className="btn btn-ghost" onClick={revealAll}>Reveal all</button>
        </div>
      )}

      {allRevealed && (
        <ReadingResult
          question={question.trim()}
          spread={spread}
          drawn={drawn}
          aiAvailable={aiAvailable}
          onSave={save}
          saved={Boolean(savedId)}
          onAiText={(t) => { aiText.current = t; }}
        />
      )}

      {allRevealed && (
        <div className="actions center-actions">
          <button className="btn btn-ghost" onClick={() => { setQuestion(''); setStep('spread'); }}>New Reading</button>
          {savedId && <button className="btn" onClick={() => navigate('journal')}>Open Journal</button>}
        </div>
      )}
    </div>
  );
}
