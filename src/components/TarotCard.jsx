import { cardImage, CARD_BACK } from '../data/cards.js';

// A flippable card. faceUp shows the art; reversed turns the face upside down.
export default function TarotCard({ card, reversed = false, faceUp = false, onClick, className = '', style, title, glow = false }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`tcard ${faceUp ? 'is-up' : ''} ${glow ? 'is-glow' : ''} ${className}`}
      onClick={onClick}
      style={style}
      title={title}
      aria-label={title || (faceUp && card ? `${card.name}${reversed ? ' reversed' : ''}` : 'Face-down card')}
    >
      <span className="tcard-inner">
        <span className="tcard-face tcard-back">
          <img src={CARD_BACK} alt="" draggable="false" />
        </span>
        <span className="tcard-face tcard-front">
          {card && (
            <img
              src={cardImage(card.id)}
              alt={card.name}
              draggable="false"
              className={reversed ? 'is-reversed' : ''}
            />
          )}
        </span>
      </span>
    </Tag>
  );
}
