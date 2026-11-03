import { useState } from 'react';
import { interpretClarifier } from '../lib/interpret.js';
import { renderMarkdown } from '../lib/markdown.js';
import { cardImage } from '../data/cards.js';
import TarotCard from './TarotCard.jsx';
import CardModal from './CardModal.jsx';

export const MAX_FOLLOW_UPS = 3;

const FOLLOW_UP_IDEAS = [
  'What should I do next?',
  'What is blocking me?',
  'Tell me more about the outcome',
  'What do I need to let go of?',
  'How will they feel about this?',
];

const cardPayload = (drawn) =>
  drawn.map((d) => ({ position: d.position.name, positionMeaning: d.position.meaning, card: d.card.name, reversed: d.reversed }));

// One answered follow-up: the question, its clarifier card and the interpretation.
export function FollowUpItem({ item, index, question, drawn }) {
  const [detail, setDetail] = useState(false);
  const r = interpretClarifier({ question, followUp: item.question, card: item.card, reversed: item.reversed, drawn });
  return (
    <li className="followup fade-up">
      <p className="followup-q"><span className="eyebrow">Follow-up {index + 1}</span>“{item.question}”</p>
      <div className="card-reading">
        <button className="card-thumb" onClick={() => setDetail(true)} aria-label={`More about ${item.card.name}`}>
          <img src={cardImage(item.card.id)} alt={item.card.name} className={item.reversed ? 'is-reversed' : ''} />
        </button>
        <div>
          <p className="eyebrow">Clarifier</p>
          <h4>{item.card.name}{item.reversed && <span className="rev-tag">Reversed</span>}</h4>
          {r.answer && <p className={`mini-verdict verdict-${r.answer.verdict.toLowerCase()}`}><strong>{r.answer.verdict}.</strong> {r.answer.text}</p>}
          <div className="chips">{r.keywords.map((k) => <span key={k} className={`chip ${item.reversed ? 'chip-dim' : ''}`}>{k}</span>)}</div>
          <p>{r.meaning}</p>
          <p>{r.relation}</p>
          {r.echo && <p className="muted">{r.echo}</p>}
          {r.topicLine && <p className="topic-line">{r.topicLine}</p>}
          <p className="followup-advice"><strong>Advice:</strong> {r.advice}</p>
        </div>
      </div>
      {item.aiStatus === 'loading' && <div className="oracle-loading deep-loading"><span className="spinner" /> The tarot reader is answering…</div>}
      {item.aiStatus === 'error' && <p className="error small">{item.aiError}</p>}
      {item.ai && <div className="ai-text followup-ai" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.ai) }} />}
      {detail && <CardModal card={item.card} reversed={item.reversed} onClose={() => setDetail(false)} />}
    </li>
  );
}

// "What next?" panel shown after a reading: ask a follow-up, end, or start over.
export default function NextSteps({ question, spread, drawn, nextCard, followUps, setFollowUps, aiAvailable, onEnd, onNew }) {
  const [mode, setMode] = useState('menu'); // menu | asking | drawing
  const [text, setText] = useState('');
  const [pending, setPending] = useState(null);
  const limitReached = followUps.length >= MAX_FOLLOW_UPS;

  function draw() {
    const q = text.trim();
    if (!q || !nextCard) return;
    setPending({ question: q, ...nextCard, revealed: false });
    setMode('drawing');
  }

  function reveal() {
    if (!pending || pending.revealed) return;
    setPending({ ...pending, revealed: true });
    const item = { question: pending.question, card: pending.card, reversed: pending.reversed, deckIndex: pending.deckIndex, aiStatus: aiAvailable ? 'loading' : null };
    const history = followUps.map((f) => ({ question: f.question, card: f.card.name, reversed: f.reversed }));
    // Let the flip finish, then add the answer to the list (and ask the AI if it is set up).
    setTimeout(() => {
      setFollowUps((list) => [...list, item]);
      setPending(null); setText(''); setMode('menu');
      if (aiAvailable) askAi(item, history);
    }, 900);
  }

  async function askAi(item, history) {
    const update = (patch) => setFollowUps((list) => list.map((f) => (f.deckIndex === item.deckIndex ? { ...f, ...patch } : f)));
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question, spread: spread.name, cards: cardPayload(drawn), history,
          followUp: { question: item.question, card: item.card.name, reversed: item.reversed },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'The tarot reader is unavailable.');
      update({ ai: data.text, aiStatus: 'done' });
    } catch (e) {
      update({ aiStatus: 'error', aiError: e.message });
    }
  }

  return (
    <section className="next-steps">
      {followUps.length > 0 && (
        <>
          <h3 className="section-title">Follow-up Questions</h3>
          <ol className="followups">
            {followUps.map((f, i) => <FollowUpItem key={i} item={f} index={i} question={question} drawn={drawn} />)}
          </ol>
        </>
      )}

      {mode === 'menu' && (
        <div className="next-panel">
          <h3>What would you like to do next?</h3>
          <div className="next-options">
            <button className="next-option" onClick={() => setMode('asking')} disabled={limitReached || !nextCard}>
              <span className="next-icon">?</span>
              <span><strong>Ask a follow-up</strong><small>{limitReached ? 'Three clarifiers is the limit for one reading' : 'Draw a clarifier card for a new question about this reading'}</small></span>
            </button>
            <button className="next-option" onClick={onEnd}>
              <span className="next-icon">☾</span>
              <span><strong>End the reading</strong><small>Close with your key message</small></span>
            </button>
            <button className="next-option" onClick={onNew}>
              <span className="next-icon">✦</span>
              <span><strong>New reading</strong><small>Shuffle again with a new question</small></span>
            </button>
          </div>
        </div>
      )}

      {mode === 'asking' && (
        <div className="next-panel fade-up">
          <h3>Ask a Follow-up Question</h3>
          <p className="muted">Ask something about this reading. You will draw one clarifier card from the remaining deck to answer it.</p>
          <textarea
            className="question-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. What should I do about the challenge?"
            rows={2}
            maxLength={300}
            autoFocus
          />
          <div className="idea-chips">
            {FOLLOW_UP_IDEAS.map((q) => <button key={q} className="chip chip-btn" onClick={() => setText(q)}>{q}</button>)}
          </div>
          <div className="actions">
            <button className="btn btn-ghost" onClick={() => setMode('menu')}>Cancel</button>
            <button className="btn btn-gold" onClick={draw} disabled={!text.trim()}>Draw a Clarifier</button>
          </div>
        </div>
      )}

      {mode === 'drawing' && pending && (
        <div className="next-panel clarifier-draw fade-up">
          <p className="followup-q">“{pending.question}”</p>
          <div className="clarifier-card">
            <TarotCard card={pending.card} reversed={pending.reversed} faceUp={pending.revealed} onClick={reveal} glow={!pending.revealed} className="drop-in" title="Your clarifier card" />
          </div>
          <p className="muted small">{pending.revealed ? pending.card.name : 'Tap the card to reveal your clarifier'}</p>
        </div>
      )}
    </section>
  );
}
