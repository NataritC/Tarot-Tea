import { useEffect } from 'react';
import { cardImage, SUITS } from '../data/cards.js';

export default function CardModal({ card, reversed = false, position, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!card) return null;
  const suit = card.suit && SUITS[card.suit];
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={card.name}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="modal-grid">
          <img className={`modal-img ${reversed ? 'is-reversed' : ''}`} src={cardImage(card.id)} alt={card.name} />
          <div>
            <p className="eyebrow">
              {card.arcana === 'major' ? `Major Arcana · ${card.numeral}` : `${suit.name} · ${suit.element}`}
              {reversed && ' · Reversed'}
            </p>
            <h2>{card.name}</h2>
            {position && <p className="modal-position">In position <strong>{position.name}</strong>: {position.meaning}</p>}
            <div className="meaning-block">
              <h4>Upright</h4>
              <div className="chips">{card.keywords.upright.map((k) => <span key={k} className="chip">{k}</span>)}</div>
              <p>{card.upright}</p>
            </div>
            <div className="meaning-block">
              <h4>Reversed</h4>
              <div className="chips">{card.keywords.reversed.map((k) => <span key={k} className="chip chip-dim">{k}</span>)}</div>
              <p>{card.reversed}</p>
            </div>
            <dl className="topic-list">
              <dt>Love</dt><dd>{card.topics.love}</dd>
              <dt>Work</dt><dd>{card.topics.work}</dd>
              <dt>Money</dt><dd>{card.topics.money}</dd>
              <dt>Advice</dt><dd>{card.advice}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
