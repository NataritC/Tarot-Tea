import { useState } from 'react';
import { loadJournal, saveJournal } from '../lib/storage.js';
import { getSpread } from '../data/spreads.js';
import { byId } from '../lib/deck.js';
import { cardImage } from '../data/cards.js';
import ReadingResult from '../components/ReadingResult.jsx';
import SpreadLayout from '../components/SpreadLayout.jsx';
import { FollowUpItem } from '../components/NextSteps.jsx';

export default function JournalPage({ aiAvailable, navigate }) {
  const [entries, setEntries] = useState(loadJournal);
  const [openId, setOpenId] = useState(null);
  const open = entries.find((e) => e.id === openId);

  const remove = (id) => {
    if (!confirm('Delete this reading from your journal?')) return;
    const next = entries.filter((e) => e.id !== id);
    setEntries(next); saveJournal(next); setOpenId(null);
  };

  if (open) {
    const spread = getSpread(open.spreadId);
    const drawn = open.cards.map((c, i) => ({ card: byId[c.id], reversed: c.reversed, position: spread.positions[i] }));
    return (
      <div className="page fade-up">
        <button className="btn btn-ghost small-btn" onClick={() => setOpenId(null)}>← Back to journal</button>
        <header className="page-head">
          <p className="eyebrow">{new Date(open.date).toLocaleString()} · {spread.name}</p>
          <h1>Saved Reading</h1>
        </header>
        <div className="table-felt">
          <SpreadLayout spread={spread} slots={drawn.map((d) => ({ ...d, revealed: true }))} />
        </div>
        {open.note && <blockquote className="journal-note">{open.note}</blockquote>}
        <ReadingResult question={open.question} spread={spread} drawn={drawn} aiAvailable={aiAvailable} savedAi={open.ai} />
        {open.followUps?.length > 0 && (
          <section className="next-steps">
            <h3 className="section-title">Follow-up Questions</h3>
            <ol className="followups">
              {open.followUps.map((f, i) => (
                <FollowUpItem key={i} index={i} question={open.question} drawn={drawn}
                  item={{ question: f.question, card: byId[f.id], reversed: f.reversed, ai: f.ai }} />
              ))}
            </ol>
          </section>
        )}
        <div className="actions center-actions">
          <button className="btn btn-danger" onClick={() => remove(open.id)}>Delete reading</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page fade-up">
      <header className="page-head">
        <p className="eyebrow">Your Readings</p>
        <h1>Journal</h1>
        <p className="lead">Look back on past readings and notice how the cards' messages unfolded. Saved privately on this device.</p>
      </header>
      {entries.length === 0 ? (
        <div className="empty">
          <p>Your journal is empty.</p>
          <button className="btn btn-gold" onClick={() => navigate('read')}>Do your first reading</button>
        </div>
      ) : (
        <ul className="journal-list">
          {entries.map((e) => {
            const spread = getSpread(e.spreadId);
            return (
              <li key={e.id}>
                <button className="journal-item" onClick={() => setOpenId(e.id)}>
                  <div className="journal-thumbs">
                    {e.cards.slice(0, 5).map((c, i) => (
                      <img key={i} src={cardImage(c.id)} alt={byId[c.id]?.name} className={c.reversed ? 'is-reversed' : ''} />
                    ))}
                  </div>
                  <div>
                    <p className="eyebrow">{new Date(e.date).toLocaleDateString(undefined, { dateStyle: 'medium' })} · {spread?.name}</p>
                    <h3>{e.question || 'General reading'}</h3>
                    {e.note && <p className="muted small">{e.note}</p>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
