import { useState } from 'react';
import { CARDS, cardImage, SUITS } from '../data/cards.js';
import CardModal from '../components/CardModal.jsx';

const FILTERS = [['all', 'All 78'], ['major', 'Major Arcana'], ...Object.entries(SUITS).map(([k, s]) => [k, s.name])];

export default function LibraryPage() {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null);
  const q = query.trim().toLowerCase();
  const cards = CARDS.filter((c) =>
    (filter === 'all' || (filter === 'major' ? c.arcana === 'major' : c.suit === filter)) &&
    (!q || c.name.toLowerCase().includes(q) || [...c.keywords.upright, ...c.keywords.reversed].some((k) => k.includes(q))));

  return (
    <div className="page fade-up">
      <header className="page-head">
        <p className="eyebrow">The Noctis Tarot</p>
        <h1>Card Library</h1>
        <p className="lead">All 78 cards: 22 Major Arcana for life's big lessons, and 56 Minor Arcana for everyday life.</p>
      </header>
      <div className="filters">
        {FILTERS.map(([k, label]) => (
          <button key={k} className={`chip chip-btn ${filter === k ? 'is-on' : ''}`} onClick={() => setFilter(k)}>{label}</button>
        ))}
        <input className="search" type="search" placeholder="Search name or keyword…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {filter !== 'all' && filter !== 'major' && (
        <p className="suit-note">{SUITS[filter].name} · {SUITS[filter].element}: {SUITS[filter].theme}.</p>
      )}
      <div className="library-grid">
        {cards.map((c) => (
          <button key={c.id} className="library-card" onClick={() => setOpen(c)}>
            <img src={cardImage(c.id)} alt="" loading="lazy" />
            <span>{c.name}</span>
          </button>
        ))}
        {cards.length === 0 && <p className="muted">No cards match “{query}”.</p>}
      </div>
      {open && <CardModal card={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
