import { useEffect, useRef, useState } from 'react';
import { useLanguage, useTranslation } from '../../i18n';
import type { TranslationKey } from '../../i18n';
import { useTutorStore } from '../../store/tutorStore';
import { streamTutorReply, TutorError } from '../../services/tutor';
import type { TutorMessage } from '../../services/tutor';
import { formatTutorText } from './formatTutorText';

const MAX_INPUT_CHARS = 1500;

const ERROR_KEYS: Record<string, TranslationKey> = {
  RATE_LIMITED: 'tutorErrorRateLimited',
  AI_UNAVAILABLE: 'tutorErrorUnavailable',
  UNAUTHORIZED: 'tutorErrorAuth',
};

export function TutorChat() {
  const t = useTranslation();
  const { language } = useLanguage();
  const lesson = useTutorStore((s) => s.lesson);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || isStreaming) return;

    const history: TutorMessage[] = [...messages, { role: 'user', content }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setError(null);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamTutorReply(
        { messages: history, lesson, language },
        (delta) => {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            next[next.length - 1] = { ...last, content: last.content + delta };
            return next;
          });
        },
        controller.signal,
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const key = err instanceof TutorError ? ERROR_KEYS[err.code] : undefined;
        setError(t(key ?? 'tutorErrorGeneric'));
      }
    } finally {
      // Drop an empty assistant bubble left by a failed or stopped request.
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return last?.role === 'assistant' && !last.content ? prev.slice(0, -1) : prev;
      });
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  const newChat = () => {
    stop();
    setMessages([]);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  const suggestions: { key: TranslationKey; sendNow: boolean }[] = [
    ...(lesson ? [{ key: 'tutorSuggestExplain' as const, sendNow: true }] : []),
    { key: 'tutorSuggestCheck', sendNow: false },
    { key: 'tutorSuggestPractice', sendNow: true },
  ];

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-3 text-white shadow-lg transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label={t('tutorOpen')}
      >
        <ChatIcon className="h-5 w-5" />
        <span className="hidden text-sm font-medium sm:inline">{t('tutorOpen')}</span>
      </button>
    );
  }

  return (
    <section
      role="dialog"
      aria-label={t('tutorTitle')}
      className="fixed inset-x-3 bottom-3 z-40 flex h-[min(600px,calc(100vh-1.5rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96"
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-2 bg-gradient-to-r from-primary to-accent px-4 py-3 text-white">
        <div className="min-w-0">
          <h2 className="font-semibold">{t('tutorTitle')}</h2>
          <p className="truncate text-xs text-white/85">
            {lesson ? `${t('tutorHelpingWith')} ${lesson.title}` : t('tutorGeneralSubtitle')}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={newChat}
              className="rounded-lg px-2 py-1 text-xs hover:bg-white/15"
            >
              {t('tutorNewChat')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 hover:bg-white/15"
            aria-label={t('tutorClose')}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        <Bubble role="assistant" content={t('tutorGreeting')} />
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} pending={isStreaming && i === messages.length - 1} />
        ))}

        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {suggestions.map(({ key, sendNow }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (sendNow) {
                    send(t(key));
                  } else {
                    setInput(t(key));
                    inputRef.current?.focus();
                  }
                }}
                className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-left text-xs text-primary hover:bg-primary/10"
              >
                {t(key)}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      {/* Input */}
      <form
        className="border-t border-gray-100 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_CHARS))}
            onKeyDown={handleKeyDown}
            placeholder={t('tutorPlaceholder')}
            aria-label={t('tutorPlaceholder')}
            rows={1}
            className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={stop}
              className="rounded-xl bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              {t('tutorStop')}
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {t('tutorSend')}
            </button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-gray-400">{t('tutorDisclaimer')}</p>
      </form>
    </section>
  );
}

function Bubble({ role, content, pending }: TutorMessage & { pending?: boolean }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] break-words rounded-2xl px-3 py-2 text-sm ${
          isUser ? 'whitespace-pre-wrap rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-gray-100 text-gray-800'
        }`}
      >
        {content ? (isUser ? content : formatTutorText(content)) : pending ? <TypingDots /> : null}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1" aria-hidden="true">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
    </span>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default TutorChat;
