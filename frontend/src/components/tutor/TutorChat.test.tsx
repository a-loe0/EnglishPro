import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '../../i18n';
import { useTutorStore } from '../../store/tutorStore';
import { TutorChat } from './TutorChat';

const { streamTutorReply, TutorError } = vi.hoisted(() => {
  class TutorError extends Error {
    code: string;

    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }
  return { streamTutorReply: vi.fn(), TutorError };
});

vi.mock('../../services/tutor', () => ({ streamTutorReply, TutorError }));

function renderChat() {
  return render(
    <LanguageProvider>
      <TutorChat />
    </LanguageProvider>,
  );
}

describe('TutorChat', () => {
  beforeEach(() => {
    streamTutorReply.mockReset();
    localStorage.clear();
    useTutorStore.setState({ lesson: null });
  });

  it('streams the reply into the conversation', async () => {
    streamTutorReply.mockImplementation(async (_req, onDelta: (t: string) => void) => {
      onDelta('It means ');
      onDelta('to start a conversation.');
    });
    const user = userEvent.setup();
    renderChat();

    await user.click(screen.getByRole('button', { name: /ask the ai tutor/i }));
    await user.type(screen.getByRole('textbox'), 'What does "break the ice" mean?{Enter}');

    expect(await screen.findByText('It means to start a conversation.')).toBeInTheDocument();
    expect(screen.getByText('What does "break the ice" mean?')).toBeInTheDocument();
    expect(streamTutorReply.mock.calls[0][0]).toMatchObject({
      messages: [{ role: 'user', content: 'What does "break the ice" mean?' }],
      language: 'en',
      lesson: null,
    });
  });

  it('sends the current lesson and offers a lesson suggestion', async () => {
    streamTutorReply.mockResolvedValue(undefined);
    useTutorStore.setState({ lesson: { title: 'Ordering Food', courseTitle: 'Travel English' } });
    const user = userEvent.setup();
    renderChat();

    await user.click(screen.getByRole('button', { name: /ask the ai tutor/i }));
    expect(screen.getByText(/Helping with: Ordering Food/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /explain the key words/i }));
    await waitFor(() => expect(streamTutorReply).toHaveBeenCalled());
    expect(streamTutorReply.mock.calls[0][0].lesson).toEqual({ title: 'Ordering Food', courseTitle: 'Travel English' });
  });

  it('shows a friendly message when rate limited', async () => {
    streamTutorReply.mockRejectedValue(new TutorError('RATE_LIMITED', 'slow down'));
    const user = userEvent.setup();
    renderChat();

    await user.click(screen.getByRole('button', { name: /ask the ai tutor/i }));
    await user.type(screen.getByRole('textbox'), 'Hello{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent(/too quickly/i);
  });

  it('uses Traditional Chinese labels and sends the language when the site is in Chinese', async () => {
    localStorage.setItem('englishgopro_language', 'zh');
    streamTutorReply.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderChat();

    await user.click(screen.getByRole('button', { name: '詢問 AI 家教' }));
    await user.type(screen.getByRole('textbox'), 'Hi{Enter}');
    await waitFor(() => expect(streamTutorReply).toHaveBeenCalled());
    expect(streamTutorReply.mock.calls[0][0].language).toBe('zh');
  });
});
