import { useState } from 'react';
import { useLanguage } from '../../i18n';
import type { SortActivity } from '../../data/practice';
import type { ActivityProps } from './types';
import { shuffle } from './shuffle';

export function SortGame({ activity, onFinish }: ActivityProps<SortActivity>) {
  const { t, language } = useLanguage();
  const [order] = useState(() => shuffle(activity.items.map((_, i) => i)));
  const [sorted, setSorted] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [misses, setMisses] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const remaining = order.filter((i) => sorted[i] === undefined);

  const drop = (itemIndex: number | null, bucketId: string) => {
    setDragOver(null);
    if (itemIndex === null) return;
    if (activity.items[itemIndex].bucket === bucketId) {
      const nextSorted = { ...sorted, [itemIndex]: bucketId };
      setSorted(nextSorted);
      setSelected(null);
      setWrong(null);
      if (Object.keys(nextSorted).length === activity.items.length) {
        const firstTry = activity.items.length - misses.size;
        onFinish(Math.max(0, firstTry), activity.items.length);
      }
    } else {
      setMisses((m) => new Set(m).add(itemIndex));
      setWrong(activity.items[itemIndex].name);
    }
  };

  return (
    <div>
      <p className="text-gray-500 mb-4">{t('prDragSortHint')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {activity.buckets.map((bucket) => (
          <button
            key={bucket.id}
            type="button"
            onClick={() => drop(selected, bucket.id)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(bucket.id);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              const raw = e.dataTransfer.getData('text/plain');
              drop(raw === '' ? selected : Number(raw), bucket.id);
            }}
            className={`min-h-[7rem] rounded-xl border-2 border-dashed p-3 text-left transition-colors ${
              dragOver === bucket.id || (selected !== null && dragOver === null) ? 'border-primary bg-primary/5' : 'border-gray-300'
            }`}
          >
            <p className="font-semibold text-gray-900 mb-2">
              {bucket.emoji} {bucket.label[language]}
            </p>
            <div className="flex flex-wrap gap-1 text-3xl">
              {activity.items.map((item, i) =>
                sorted[i] === bucket.id ? (
                  <span key={i} title={item.name}>
                    {item.emoji}
                  </span>
                ) : null,
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-3">
        {remaining.map((i) => {
          const item = activity.items[i];
          return (
            <button
              key={i}
              type="button"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', String(i))}
              onClick={() => setSelected(selected === i ? null : i)}
              aria-pressed={selected === i}
              className={`cursor-grab rounded-xl border-2 bg-white px-4 py-2 shadow-card ${
                selected === i ? 'border-primary' : 'border-gray-200'
              }`}
            >
              <span className="block text-4xl">{item.emoji}</span>
              <span className="block text-sm text-gray-600">{item.name}</span>
            </button>
          );
        })}
      </div>

      <div role="status" className="min-h-[1.5rem] text-center text-amber-600 font-medium">
        {wrong && t('prNotThere').replace('{item}', wrong)}
      </div>
    </div>
  );
}
