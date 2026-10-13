import { useState } from 'react';
import { useLanguage } from '../../i18n';
import type { ScrambleActivity } from '../../data/practice';
import type { ActivityProps } from './types';
import { shuffleDifferent } from './shuffle';

function makeTiles(text: string) {
  const words = text.split(' ').map((word, id) => ({ id, word }));
  return shuffleDifferent(words);
}

export function ScrambleGame({ activity, onFinish }: ActivityProps<ScrambleActivity>) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [tiles, setTiles] = useState(() => makeTiles(activity.sentences[0].text));
  const [built, setBuilt] = useState<number[]>([]);
  const [missed, setMissed] = useState(false);
  const [solved, setSolved] = useState(false);

  const sentence = activity.sentences[index];
  const words = sentence.text.split(' ');
  const wordOf = (id: number) => words[id];

  const check = () => {
    const attempt = built.map(wordOf).join(' ');
    if (attempt === sentence.text) {
      setSolved(true);
      if (!missed) setScore((s) => s + 1);
    } else {
      setMissed(true);
    }
  };

  const next = () => {
    if (index + 1 >= activity.sentences.length) {
      onFinish(score, activity.sentences.length);
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setTiles(makeTiles(activity.sentences[nextIndex].text));
    setBuilt([]);
    setMissed(false);
    setSolved(false);
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">
        {t('prRound')} {index + 1} / {activity.sentences.length}
      </p>
      <p className="text-gray-500 mb-4">{t('prBuildHint')}</p>

      <div
        aria-label={t('prYourSentence')}
        className={`mb-4 flex min-h-[4rem] flex-wrap gap-2 rounded-xl border-2 border-dashed p-3 ${
          solved ? 'border-green-400 bg-green-50' : 'border-gray-300'
        }`}
      >
        {built.map((id) => (
          <button
            key={id}
            type="button"
            disabled={solved}
            onClick={() => setBuilt(built.filter((b) => b !== id))}
            className="rounded-lg bg-primary px-3 py-2 text-lg text-white"
          >
            {wordOf(id)}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tiles
          .filter((tile) => !built.includes(tile.id))
          .map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => setBuilt([...built, tile.id])}
              className="rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-lg shadow-card hover:border-primary"
            >
              {tile.word}
            </button>
          ))}
      </div>

      <div role="status" className="min-h-[3rem] text-center">
        {missed && !solved && <p className="mb-2 text-amber-600 font-medium">{t('prTryAgain')}</p>}
        {solved ? (
          <div>
            <p className="mb-1 font-semibold text-green-600">{sentence.text}. ✔</p>
            {sentence.zh && <p className="mb-3 text-gray-500">{sentence.zh}</p>}
            <button type="button" onClick={next} className="rounded-lg bg-primary px-5 py-2 text-white hover:bg-primary-dark">
              {index + 1 >= activity.sentences.length ? t('prFinish') : t('next')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={check}
            disabled={built.length !== words.length}
            className="rounded-lg bg-primary px-5 py-2 text-white hover:bg-primary-dark disabled:opacity-40"
          >
            {t('prCheck')}
          </button>
        )}
      </div>
    </div>
  );
}
