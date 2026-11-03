import { SPREADS } from '../data/spreads.js';
import { SUITS, cardImage } from '../data/cards.js';
import SpreadLayout from '../components/SpreadLayout.jsx';

export default function LearnPage({ navigate }) {
  return (
    <div className="page narrow fade-up learn">
      <header className="page-head">
        <p className="eyebrow">A Beginner's Guide</p>
        <h1>How Tarot Works</h1>
        <p className="lead">You do not need to memorize 78 cards to read tarot. You only need to understand a few simple rules.</p>
      </header>

      <section>
        <h2>1. Spreads: every position has a meaning</h2>
        <p>A <strong>spread</strong> is a layout of cards on the table. Each spot in the layout is a <strong>position</strong>, and each position asks its own question, such as “What is in the past?” or “What is the obstacle?”</p>
        <p>This is why the same card can mean different things. <em>The Tower</em> in the <strong>Past</strong> position means an upheaval you have already lived through. In the <strong>Outcome</strong> position, it warns of one ahead.</p>
      </section>

      <section>
        <h2>2. The order you draw matters</h2>
        <p>Positions are filled <strong>in the order the cards are drawn</strong>. The first card you pick goes to position 1, the second to position 2, and so on. That is why every slot on the table is numbered, and why the app tells you which position you are choosing for before each pick.</p>
        <div className="learn-demo">
          <SpreadLayout spread={SPREADS[1]} />
        </div>
        <p className="muted small center">Past · Present · Future: card 1 is drawn first, card 3 last.</p>
      </section>

      <section>
        <h2>3. Upright and reversed cards</h2>
        <div className="learn-rev">
          <img src={cardImage('the-star')} alt="The Star upright" />
          <img src={cardImage('the-star')} alt="The Star reversed" className="is-reversed" />
        </div>
        <p>When a card comes out <strong>upside down</strong>, it is <strong>reversed</strong>. A reversed card does not simply mean “the opposite”. It usually means the card's energy is <strong>blocked, delayed, weakened or turned inward</strong>. Reversed <em>Star</em> is not “no hope”; it is hope you have temporarily lost touch with.</p>
        <p>Some readers do not use reversals at all. You can switch them off before each reading.</p>
      </section>

      <section>
        <h2>4. Major and Minor Arcana</h2>
        <p>The deck has <strong>78 cards</strong> in two groups:</p>
        <ul>
          <li><strong>22 Major Arcana</strong> (The Fool to The World): life's big lessons, turning points and forces of fate. Many Major cards in one reading means something important is happening.</li>
          <li><strong>56 Minor Arcana</strong>: everyday situations and choices, split into four suits of 14 cards (Ace to Ten, plus four court cards).</li>
        </ul>
        <div className="suit-table">
          {Object.values(SUITS).map((s) => (
            <div key={s.name}><strong>{s.name}</strong><span>{s.element}</span><p>{s.theme}</p></div>
          ))}
        </div>
        <p>If one suit dominates your spread, it tells you what the story is really about.</p>
        <p><strong>Court cards</strong> (Page, Knight, Queen, King) often represent people in your life, or a side of your own personality: the Page is curious and new, the Knight is in action, the Queen is mature on the inside, and the King is mature on the outside.</p>
      </section>

      <section>
        <h2>5. The spreads in this app</h2>
        <div className="learn-spreads">
          {SPREADS.map((s) => (
            <div key={s.id} className="learn-spread">
              <div className="learn-spread-head">
                <h3>{s.name}</h3><span className="muted small">{s.count} {s.count === 1 ? 'card' : 'cards'}</span>
              </div>
              <p>{s.description}</p>
              <div className="learn-spread-body">
                <SpreadLayout spread={s} compact showLabels={false} />
                <ol>{s.positions.map((p) => <li key={p.name}><strong>{p.name}</strong>: {p.meaning}</li>)}</ol>
              </div>
              <button className="btn btn-ghost small-btn" onClick={() => navigate('read', s.id)}>Try this spread</button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>6. Asking a good question</h2>
        <ul>
          <li><strong>Open questions</strong> give the richest answers: “What do I need to know about…”, “How can I…”, “What is blocking…”.</li>
          <li><strong>Yes/no questions</strong> (“Will…”, “Should…”) work too; the app gives you a leaning based on how positive the cards are, especially the outcome card.</li>
          <li>Focus on <strong>yourself</strong> and what you can do, rather than trying to control other people.</li>
          <li>Tarot shows the current path, not a fixed fate. Your choices can always change the outcome.</li>
        </ul>
      </section>

      <div className="actions center-actions">
        <button className="btn btn-gold" onClick={() => navigate('read')}>Try a Reading</button>
      </div>
    </div>
  );
}
