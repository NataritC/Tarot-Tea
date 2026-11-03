import TarotCard from './TarotCard.jsx';

const CELL_H = 1.58; // slot height relative to slot width (card 1.28 + label)

// Renders a spread's positions in its layout shape.
// slots[i] = { card, reversed, revealed } or null (empty).
export default function SpreadLayout({ spread, slots = [], activeIndex = -1, onSlotClick, compact = false, showLabels = true, maxVh = 72 }) {
  const cols = Math.max(...spread.positions.map((p) => p.x)) + 1;
  const rows = Math.max(...spread.positions.map((p) => p.y)) + 1;
  const aspect = cols / (rows * CELL_H);
  const maxSlot = compact ? 70 : 132;

  return (
    <div
      className={`spread-layout ${compact ? 'is-compact' : ''}`}
      style={{ aspectRatio: aspect, maxWidth: `min(100%, ${cols * maxSlot}px, calc(${compact ? 40 : maxVh}dvh * ${aspect}))` }}
    >
      {spread.positions.map((pos, i) => {
        const slot = slots[i];
        const rotated = pos.rotate === 90;
        const hideLabel = !showLabels || (spread.id === 'celtic' && i === 1);
        return (
          <div
            key={i}
            className={`slot ${slot ? 'is-filled' : ''} ${i === activeIndex ? 'is-active' : ''} ${rotated ? 'is-rotated' : ''}`}
            style={{
              left: `${((pos.x + 0.1) / cols) * 100}%`,
              top: `${(pos.y / rows) * 100}%`,
              width: `${(0.8 / cols) * 100}%`,
              zIndex: rotated ? 3 : 1,
            }}
          >
            <div className="slot-card">
              {slot ? (
                <TarotCard
                  card={slot.card}
                  reversed={slot.reversed}
                  faceUp={slot.revealed}
                  onClick={onSlotClick ? () => onSlotClick(i) : undefined}
                  glow={i === activeIndex}
                  className="drop-in"
                  title={slot.revealed ? `${pos.name}: ${slot.card.name}${slot.reversed ? ' (reversed)' : ''}` : `${i + 1}. ${pos.name}`}
                />
              ) : (
                <div className="slot-empty"><span>{i + 1}</span></div>
              )}
              <span className="slot-num">{i + 1}</span>
            </div>
            {!hideLabel && (
              <div className="slot-label">
                {spread.id === 'celtic' && i === 0 ? `${pos.name} / Challenge` : pos.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
