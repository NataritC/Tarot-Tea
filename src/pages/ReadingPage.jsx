import { useEffect, useMemo, useRef, useState } from 'react';
import { SPREADS, getSpread } from '../data/spreads.js';
import { shuffleDeck } from '../lib/deck.js';
import { loadJournal, saveJournal, loadSettings, saveSettings } from '../lib/storage.js';
import SpreadLayout from '../components/SpreadLayout.jsx';
import ReadingResult from '../components/ReadingResult.jsx';
import TarotCard from '../components/TarotCard.jsx';
import NextSteps from '../components/NextSteps.jsx';
import { interpret } from '../lib/interpret.js';

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
  const [followUps, setFollowUps] = useState([]); // [{ question, card, reversed, deckIndex, ai }]
  const aiText = useRef(null);
  const [aiSummary, setAiSummary] = useState(null);
  const fanRef = useRef(null);
  const spread = spreadId && getSpread(spreadId);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  // Start the fanned deck centred so both ends can be reached by swiping.
  useEffect(() => {
    const fan = fanRef.current;
    if (step === 'pick' && fan) fan.scrollLeft = (fan.scrollWidth - fan.clientWidth) / 2;
  }, [step]);

  function chooseSpread(id) { setSpreadId(id); setStep('question'); }

  function startShuffle() {
    setDeck(shuffleDeck(settings.reversals));
    setPicked([]); setRevealed([]); setSavedId(null); setFollowUps([]); setAiSummary(null); aiText.current = null;
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

  // The next unused card in the shuffled deck becomes the clarifier for a follow-up.
  const nextCard = useMemo(() => {
    const used = new Set([...picked, ...followUps.map((f) => f.deckIndex)]);
    const i = deck.findIndex((_, idx) => !used.has(idx));
    return i === -1 ? null : { ...deck[i], deckIndex: i };
  }, [deck, picked, followUps]);

  const followUpsForJournal = (list) => list.map((f) => ({ question: f.question, id: f.card.id, reversed: f.reversed, ai: f.ai || null }));

  // Keep a saved journal entry in sync when follow-ups are added after saving.
  useEffect(() => {
    if (!savedId) return;
    const entries = loadJournal();
    const next = entries.map((e) => (e.id === savedId ? { ...e, followUps: followUpsForJournal(followUps), aiSummary: aiSummary || e.aiSummary || null } : e));
    saveJournal(next);
  }, [followUps, savedId, aiSummary]);

  const newReading = () => { setQuestion(''); setFollowUps([]); setStep('spread'); };

  function save(note, ai) {
    const entry = {
      id: Date.now().toString(36),
      date: new Date().toISOString(),
      question: question.trim(),
      spreadId,
      cards: drawn.map((d) => ({ id: d.card.id, reversed: d.reversed })),
      note: (note || '').trim(),
      ai: ai || aiText.current,
      followUps: followUpsForJournal(followUps),
      aiSummary,
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

  // ---------- Step: reading ended ----------
  if (step === 'ended') {
    const result = interpret({ question: question.trim(), spread, drawn });
    return (
      <div className="page narrow fade-up ending">
        <header className="page-head">
          <p className="eyebrow">{spread.name} · Reading complete</p>
          <h1>Your Reading Is Complete</h1>
          {question && <p className="reading-question">“{question}”</p>}
        </header>
        <div className="table-felt ending-table">
          <SpreadLayout spread={spread} slots={drawn.map((d) => ({ ...d, revealed: true }))} maxVh={40} />
        </div>
        <div className="ending-message">
          <p className="eyebrow">Your key message</p>
          {result.answer && <p className="ending-verdict">{result.answer.verdict}: {result.answer.text}</p>}
          <p>{result.mood}</p>
          <p className="ending-advice">{result.advice[0]}</p>
          {followUps.length > 0 && <p className="muted small">With {followUps.length} follow-up {followUps.length === 1 ? 'question' : 'questions'} answered by clarifier cards.</p>}
        </div>
        <p className="ending-blessing">✦ Take what resonates, leave what does not. Your choices shape what comes next. ✦</p>
        <div className="actions center-actions">
          {savedId
            ? <button className="btn" onClick={() => navigate('journal')}>Open Journal</button>
            : <button className="btn" onClick={() => save('', null)}>Save to Journal</button>}
          <button className="btn btn-gold" onClick={newReading}>New Reading</button>
          <button className="btn btn-ghost" onClick={() => navigate('home')}>Home</button>
        </div>
      </div>
    );
  }

  // ---------- Steps: pick + reveal + reading ----------
  const nextPos = spread.positions[picked.length];
  return (
    <div className={`page fade-up ${step === 'pick' ? 'is-picking' : ''}`}>
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
        {question && step !== 'reveal' && <p className={`reading-question ${step === 'pick' ? 'hide-phone' : ''}`}>“{question}”</p>}
      </header>

      <div className="table-felt">
        <SpreadLayout
          spread={spread}
          slots={slots}
          activeIndex={step === 'pick' ? picked.length : allRevealed ? -1 : revealed.length}
          onSlotClick={step === 'reveal' ? reveal : undefined}
          maxVh={step === 'pick' ? 34 : 72}
        />
      </div>

      {step === 'pick' && (
        <div className="fan-wrap">
          <p className="fan-hint">Swipe the deck ↔ and tap a card</p>
          <div className="fan" role="list" ref={fanRef}>
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
          autoAiSummary
          onAiSummary={setAiSummary}
        />
      )}

      {allRevealed && (
        <NextSteps
          question={question.trim()}
          spread={spread}
          drawn={drawn}
          nextCard={nextCard}
          followUps={followUps}
          setFollowUps={setFollowUps}
          aiAvailable={aiAvailable}
          onEnd={() => setStep('ended')}
          onNew={newReading}
        />
      )}
    </div>
  );
}
