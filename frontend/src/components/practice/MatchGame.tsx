import { useState } from 'react';
import { useLanguage } from '../../i18n';
import type { MatchActivity } from '../../data/practice';
import type { ActivityProps } from './types';
import { shuffle } from './shuffle';

export function MatchGame({ activity, onFinish }: ActivityProps<MatchActivity>) {
  const { t, language } = useLanguage();
  const count = activity.pairs.length;
  const [pictureOrder] = useState(() => shuffle(activity.pairs.map((_, i) => i)));
  const [wordOrder] = useState(() => shuffle(activity.pairs.map((_, i) => i)));
  const [picked, setPicked] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [misses, setMisses] = useState(0);
  const [flash, setFlash] = useState<number | null>(null);

  const pickWord = (wordIndex: number) => {
    if (picked === null || matched.has(wordIndex)) return;
    if (picked === wordIndex) {
      const nextMatched = new Set(matched).add(wordIndex);
      setMatched(nextMatched);
      setPicked(null);
      if (nextMatched.size === count) onFinish(Math.max(0, count - misses), count);
    } else {
      setMisses((m) => m + 1);
      setFlash(wordIndex);
      setPicked(null);
      window.setTimeout(() => setFlash(null), 500);
    }
  };

  return (
    <div>
      <p className="text-gray-500 mb-4">{t('prMatchHint')}</p>
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          {pictureOrder.map((i) => (
            <button
              key={i}
              type="button"
              disabled={matched.has(i)}
              onClick={() => setPicked(i)}
              aria-label={`item ${i}`}
              className={`rounded-xl border-2 py-2 text-4xl transition-colors ${
                matched.has(i)
                  ? 'border-green-300 bg-green-50 opacity-50'
                  : picked === i
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 bg-white hover:border-primary'
              }`}
            >
              {activity.pairs[i].emoji ?? <span className="px-2 text-lg font-medium">{activity.pairs[i].zh}</span>}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {wordOrder.map((i) => (
            <button
              key={i}
              type="button"
              disabled={matched.has(i)}
              onClick={() => pickWord(i)}
              className={`rounded-xl border-2 py-4 text-lg font-medium transition-colors ${
                matched.has(i)
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : flash === i
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-gray-200 bg-white hover:border-primary'
              }`}
            >
              {activity.pairs[i].word}
              {matched.has(i) && activity.pairs[i].emoji && language === 'zh' && (
                <span className="ml-2 text-sm text-gray-500">{activity.pairs[i].zh}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
