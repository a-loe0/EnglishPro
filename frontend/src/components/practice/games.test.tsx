import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/utils';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '../../i18n';
import {
  getActivity,
  type QuizActivity,
  type PositionActivity,
  type MatchActivity,
  type VocabActivity,
} from '../../data/practice';
import { QuizGame } from './QuizGame';
import { PositionGame } from './PositionGame';
import { MatchGame } from './MatchGame';
import { VocabReview } from './VocabReview';

const wrap = (ui: React.ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);

describe('QuizGame', () => {
  it('scores correct answers and reports at the end', async () => {
    const quiz = getActivity('vocabulary-quiz') as QuizActivity;
    const onFinish = vi.fn();
    wrap(<QuizGame activity={quiz} onFinish={onFinish} />);
    const user = userEvent.setup();

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      // Answer the first four correctly and the last one wrong.
      const pick = i < 4 ? q.answer : (q.answer + 1) % q.options.length;
      await user.click(screen.getByRole('button', { name: new RegExp(`^${q.options[pick]}`) }));
      await user.click(screen.getByRole('button', { name: /next|finish/i }));
    }
    expect(onFinish).toHaveBeenCalledExactlyOnceWith(4, 5);
  });
});

describe('PositionGame', () => {
  it('only advances after the correct spot, and a miss costs the point', async () => {
    const base = getActivity('where-does-it-go') as PositionActivity;
    const activity = { ...base, rounds: [base.rounds[0]] }; // cat "on" dog
    const onFinish = vi.fn();
    wrap(<PositionGame activity={activity} onFinish={onFinish} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'cat' }));
    await user.click(screen.getByRole('button', { name: 'below' }));
    expect(screen.getByText(/try again/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'cat' }));
    await user.click(screen.getByRole('button', { name: 'above' }));
    await user.click(screen.getByRole('button', { name: /finish/i }));
    expect(onFinish).toHaveBeenCalledWith(0, 1);
  });
});

describe('MatchGame', () => {
  it('finishes once every pair is matched', async () => {
    const base = getActivity('picture-match') as MatchActivity;
    const activity = { ...base, pairs: base.pairs.slice(0, 2) };
    const onFinish = vi.fn();
    wrap(<MatchGame activity={activity} onFinish={onFinish} />);
    const user = userEvent.setup();

    for (const pair of activity.pairs) {
      await user.click(screen.getByText(pair.emoji ?? ''));
      await user.click(screen.getByRole('button', { name: pair.word }));
    }
    expect(onFinish).toHaveBeenCalledWith(2, 2);
  });
});

describe('VocabReview', () => {
  const activity: VocabActivity = {
    id: 'lesson-v1-vocab',
    kind: 'vocab',
    category: 'vocab',
    level: 'beginner',
    icon: '🔊',
    lessonId: 'v1',
    title: { en: 'Vocabulary', zh: '單字複習' },
    description: { en: '', zh: '' },
    words: [
      { word: 'apple', zh: '蘋果', example: 'I eat an apple.', audio: 'a.mp3' },
      { word: 'bus', zh: '公車' },
    ],
  };

  it('plays the teacher\'s recording, hides the meaning until asked, and finishes after the last word', async () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const created: string[] = [];
    vi.stubGlobal(
      'Audio',
      class {
        constructor(src: string) {
          created.push(src);
        }
        play = play;
        pause = vi.fn();
      },
    );
    const onFinish = vi.fn();
    wrap(<VocabReview activity={activity} onFinish={onFinish} />);
    const user = userEvent.setup();

    expect(screen.getByText('apple')).toBeInTheDocument();
    expect(screen.queryByText('蘋果')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /listen/i }));
    expect(play).toHaveBeenCalledOnce();
    expect(created[0]).toMatch(/\/videos\/v1\/vocab-audio\/a\.mp3$/);

    await user.click(screen.getByRole('button', { name: /show meaning/i }));
    expect(screen.getByText('蘋果')).toBeInTheDocument();
    expect(screen.getByText('I eat an apple.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^next$/i }));
    expect(screen.getByText('bus')).toBeInTheDocument();
    expect(screen.queryByText('公車')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /finish/i }));
    expect(onFinish).toHaveBeenCalledExactlyOnceWith(2, 2);
    vi.unstubAllGlobals();
  });
});
