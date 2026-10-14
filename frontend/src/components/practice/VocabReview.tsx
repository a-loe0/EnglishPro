import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n';
import type { VocabActivity } from '../../data/practice';
import { videoService } from '../../services/videos';
import type { ActivityProps } from './types';

const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function VocabReview({ activity, onFinish }: ActivityProps<VocabActivity>) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const total = activity.words.length;
  const item = activity.words[index];
  const isLast = index + 1 >= total;

  const stop = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (canSpeak()) window.speechSynthesis.cancel();
    setPlaying(false);
  };

  // Stop whatever is playing when the learner leaves the activity.
  useEffect(() => stop, []);

  const listen = () => {
    stop();
    if (item.audio) {
      const audio = new Audio(videoService.getVocabAudioUrl(activity.lessonId, item.audio));
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      setPlaying(true);
      audio.play().catch(() => setPlaying(false));
      return;
    }
    // No recording from the teacher yet: let the browser read the word.
    const utterance = new SpeechSynthesisUtterance(item.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    setPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const go = (to: number) => {
    stop();
    setIndex(to);
    setRevealed(false);
  };

  const next = () => {
    if (isLast) {
      stop();
      onFinish(total, total);
      return;
    }
    go(index + 1);
  };

  return (
    <div>
      <p className="mb-1 text-sm text-gray-500">
        {t('prWord')} {index + 1} / {total}
      </p>
      <p className="mb-4 text-sm text-gray-500">{t('prVocabHint')}</p>

      <div className="mb-4 rounded-2xl border-2 border-gray-200 bg-white px-4 py-8 text-center">
        <p className="mb-4 break-words text-4xl font-bold text-gray-900">{item.word}</p>

        {(item.audio || canSpeak()) && (
          <button
            type="button"
            onClick={listen}
            className={`mb-5 rounded-full px-6 py-3 text-lg font-medium text-white transition-colors ${
              playing ? 'bg-primary-dark' : 'bg-primary hover:bg-primary-dark'
            }`}
          >
            🔊 {t('prListen')}
          </button>
        )}

        <div className="min-h-[5rem]">
          {revealed && (
            <div>
              <p className="text-2xl text-gray-800">{item.zh}</p>
              {item.example && <p className="mt-2 text-gray-500">{item.example}</p>}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-pressed={revealed}
          onClick={() => setRevealed((r) => !r)}
          className="text-sm text-primary hover:underline"
        >
          {revealed ? t('prHideMeaning') : t('prShowMeaning')}
        </button>
      </div>

      <div className="flex justify-between gap-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => go(index - 1)}
          className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          {t('prPrevious')}
        </button>
        <button type="button" onClick={next} className="rounded-lg bg-primary px-5 py-2 text-white hover:bg-primary-dark">
          {isLast ? t('prFinish') : t('next')}
        </button>
      </div>
    </div>
  );
}
