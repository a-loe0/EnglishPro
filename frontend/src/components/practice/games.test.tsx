import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/utils';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '../../i18n';
import { getActivity, type QuizActivity, type PositionActivity, type MatchActivity } from '../../data/practice';
import { QuizGame } from './QuizGame';
import { PositionGame } from './PositionGame';
import { MatchGame } from './MatchGame';

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
