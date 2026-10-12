import { useState } from 'react';
import { useLanguage } from '../../i18n';
import type { QuizActivity } from '../../data/practice';
import type { ActivityProps } from './types';

export function QuizGame({ activity, onFinish }: ActivityProps<QuizActivity>) {
  const { t, language } = useLanguage();
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);

  const question = activity.questions[index];
  const answered = chosen !== null;

  const choose = (option: number) => {
    if (answered) return;
    setChosen(option);
    if (option === question.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 >= activity.questions.length) {
      onFinish(score, activity.questions.length);
      return;
    }
    setIndex(index + 1);
    setChosen(null);
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">
        {t('prQuestion')} {index + 1} / {activity.questions.length}
      </p>
      <h3 className="text-xl font-bold text-gray-900">{question.prompt}</h3>
      {language === 'zh' && <p className="mb-4 text-gray-500">{question.promptZh}</p>}
      {language === 'en' && <div className="mb-4" />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {question.options.map((option, i) => {
          const isAnswer = answered && i === question.answer;
          const isWrongPick = answered && i === chosen && i !== question.answer;
          return (
            <button
              key={option}
              type="button"
              disabled={answered}
              onClick={() => choose(i)}
              className={`rounded-xl border-2 px-4 py-3 text-left text-lg transition-colors ${
                isAnswer
                  ? 'border-green-400 bg-green-50'
                  : isWrongPick
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-primary'
              }`}
            >
              {option} {isAnswer && '✔'}
            </button>
          );
        })}
      </div>

      <div role="status" className="min-h-[3rem]">
        {answered && (
          <div>
            <p className={`mb-3 font-medium ${chosen === question.answer ? 'text-green-600' : 'text-red-600'}`}>
              {chosen === question.answer ? t('prCorrect') : t('prNotQuite')} {question.explanation[language]}
            </p>
            <button type="button" onClick={next} className="rounded-lg bg-primary px-5 py-2 text-white hover:bg-primary-dark">
              {index + 1 >= activity.questions.length ? t('prFinish') : t('next')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
