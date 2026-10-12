import { useState } from 'react';
import { useLanguage } from '../../i18n';
import type { PositionActivity } from '../../data/practice';
import type { ActivityProps } from './types';

// Zones are shown as pictures of the spot, not as words, so the learner has to
// connect "on / under / next to" to where it is.
const ZONES = [
  { position: 'on', area: 'col-start-2 row-start-1', glyph: '⬆️' },
  { position: 'next to', area: 'col-start-3 row-start-2', glyph: '➡️' },
  { position: 'under', area: 'col-start-2 row-start-3', glyph: '⬇️' },
] as const;

export function PositionGame({ activity, onFinish }: ActivityProps<PositionActivity>) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(false);
  const [placed, setPlaced] = useState<string | null>(null);
  const [selected, setSelected] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const round = activity.rounds[index];
  const done = placed !== null;

  const choose = (position: string) => {
    if (done) return;
    setSelected(false);
    setDragOver(null);
    if (position === round.answer) {
      setPlaced(position);
      if (!missed) setScore((s) => s + 1);
    } else {
      setMissed(true);
    }
  };

  const next = () => {
    if (index + 1 >= activity.rounds.length) {
      onFinish(score, activity.rounds.length);
      return;
    }
    setIndex(index + 1);
    setMissed(false);
    setPlaced(null);
    setSelected(false);
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">
        {t('prRound')} {index + 1} / {activity.rounds.length}
      </p>
      <h3 className="text-xl font-bold text-gray-900 mb-1">
        {`Put the ${round.item.name} `}
        <span className="text-primary">{round.answer}</span>
        {` the ${round.anchor.name}.`}
      </h3>
      <p className="text-gray-500 mb-4">{t('prDragHint')}</p>

      <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full max-w-sm mx-auto mb-4">
        <div className="col-start-2 row-start-2 flex items-center justify-center text-6xl select-none" aria-label={round.anchor.name}>
          {round.anchor.emoji}
        </div>
        {ZONES.map((zone) => {
          const filled = placed === zone.position;
          return (
            <button
              key={zone.position}
              type="button"
              aria-label={zone.position === 'on' ? 'above' : zone.position === 'under' ? 'below' : 'beside'}
              onClick={() => selected && choose(zone.position)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(zone.position);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                choose(zone.position);
              }}
              className={`${zone.area} flex h-20 items-center justify-center rounded-xl border-2 border-dashed text-4xl transition-colors ${
                filled
                  ? 'border-green-400 bg-green-50'
                  : dragOver === zone.position || selected
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300'
              }`}
            >
              {filled ? round.item.emoji : <span className="opacity-40 text-2xl">{zone.glyph}</span>}
            </button>
          );
        })}
      </div>

      {!done && (
        <div className="flex justify-center mb-4">
          <button
            type="button"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', round.item.name)}
            onClick={() => setSelected((s) => !s)}
            aria-pressed={selected}
            aria-label={round.item.name}
            className={`cursor-grab rounded-2xl border-2 bg-white px-6 py-3 text-6xl shadow-card active:cursor-grabbing ${
              selected ? 'border-primary' : 'border-gray-200'
            }`}
          >
            {round.item.emoji}
          </button>
        </div>
      )}

      <div role="status" className="min-h-[3rem] text-center">
        {missed && !done && <p className="text-amber-600 font-medium">{t('prTryAgain')}</p>}
        {done && (
          <div>
            <p className="text-green-600 font-semibold mb-3">
              {`The ${round.item.name} is ${round.answer} the ${round.anchor.name}! ✔`}
            </p>
            <button type="button" onClick={next} className="rounded-lg bg-primary px-5 py-2 text-white hover:bg-primary-dark">
              {index + 1 >= activity.rounds.length ? t('prFinish') : t('next')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
