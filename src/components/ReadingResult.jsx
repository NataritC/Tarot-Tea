import { useMemo, useState } from 'react';
import { interpret, summarize } from '../lib/interpret.js';
import { renderMarkdown } from '../lib/markdown.js';
import { cardImage } from '../data/cards.js';
import CardModal from './CardModal.jsx';

// Shows the full reading for a completed spread.
export default function ReadingResult({ question, spread, drawn, aiAvailable, savedAi, onSave, saved, onAiText }) {
  const result = useMemo(() => interpret({ question, spread, drawn }), [question, spread, drawn]);
  const summary = useMemo(() => summarize({ question, drawn, result }), [question, drawn, result]);
  const [detail, setDetail] = useState(null);
  const [ai, setAi] = useState({ status: savedAi ? 'done' : 'idle', text: savedAi || '' });
  const [note, setNote] = useState('');

  async function askDeepReading() {
    setAi({ status: 'loading', text: '' });
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          spread: spread.name,
          cards: drawn.map((d) => ({ position: d.position.name, positionMeaning: d.position.meaning, card: d.card.name, reversed: d.reversed })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'The deep reading is unavailable.');
      setAi({ status: 'done', text: data.text });
      onAiText?.(data.text);
    } catch (e) {
      setAi({ status: 'error', text: e.message });
    }
  }

  return (
    <section className="reading fade-up">
      {question && <p className="reading-question">“{question}”</p>}

      {result.answer && (
        <div className={`verdict verdict-${result.answer.verdict.toLowerCase()}`}>
          <span className="verdict-word">{result.answer.verdict}</span>
          <span>{result.answer.text}</span>
        </div>
      )}
      <p className="mood">{result.mood}</p>

      <h3 className="section-title">The Cards</h3>
      <ol className="card-readings">
        {result.cards.map((c) => (
          <li key={c.index} className="card-reading">
            <button className="card-thumb" onClick={() => setDetail(c)} aria-label={`More about ${c.card.name}`}>
              <img src={cardImage(c.card.id)} alt={c.card.name} className={c.reversed ? 'is-reversed' : ''} />
            </button>
            <div>
              <p className="eyebrow">{c.index}. {c.position.name}</p>
              <h4>{c.card.name}{c.reversed && <span className="rev-tag">Reversed</span>}</h4>
              <p className="position-meaning">This position shows {c.position.meaning}.</p>
              <div className="chips">{c.keywords.map((k) => <span key={k} className={`chip ${c.reversed ? 'chip-dim' : ''}`}>{k}</span>)}</div>
              <p>{c.text}</p>
              {c.topicLine && <p className="topic-line">{c.topicLine}</p>}
            </div>
          </li>
        ))}
      </ol>

      {result.themes.length > 0 && (
        <>
          <h3 className="section-title">Patterns in the Spread</h3>
          <ul className="themes">{result.themes.map((t) => <li key={t}>{t}</li>)}</ul>
        </>
      )}

      <h3 className="section-title">Summary of Your Reading</h3>
      <div className="summary-box">
        <p className="summary-story">{summary.story}</p>
        <p className="summary-takeaway"><span className="eyebrow">In short</span>{summary.takeaway}</p>
      </div>

      <h3 className="section-title">Your Advice</h3>
      <div className="advice-box">{result.advice.map((a) => <p key={a}>{a}</p>)}</div>

      <div className="deep-reading">
        <h3 className="section-title">✦ Deep Tarot Reading</h3>
        {ai.status === 'done' && <div className="ai-text" dangerouslySetInnerHTML={{ __html: renderMarkdown(ai.text) }} />}
        {ai.status === 'loading' && <div className="deep-loading"><span className="spinner" /> The tarot reader is studying your cards…</div>}
        {ai.status === 'error' && <p className="error">{ai.text}</p>}
        {(ai.status === 'idle' || ai.status === 'error') && (
          aiAvailable
            ? <button className="btn btn-gold" onClick={askDeepReading}>Get a Deep Tarot Reading</button>
            : <p className="muted small">AI readings weave every card and your question into one personal story. They turn on once the app is deployed with an API key.</p>
        )}
      </div>

      {onSave && (
        <div className="save-box">
          {saved ? (
            <p className="saved">✓ Saved to your journal</p>
          ) : (
            <>
              <label htmlFor="note" className="small muted">Add a note for your journal (optional)</label>
              <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="How do you feel about this reading?" rows={3} />
              <button className="btn" onClick={() => onSave(note, ai.status === 'done' ? ai.text : null)}>Save to Journal</button>
            </>
          )}
        </div>
      )}

      {detail && <CardModal card={detail.card} reversed={detail.reversed} position={detail.position} onClose={() => setDetail(null)} />}
    </section>
  );
}
