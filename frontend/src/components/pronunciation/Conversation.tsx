import { useState } from 'react';
import { useLanguage } from '../../i18n';
import { PrivateAudio } from '../common/PrivateAudio';
import { submissionService, announcePronunciationChange, type Message, type Submission } from '../../services/submissions';
import { useAudioRecorder, useClip, type Recording } from '../../hooks/useAudioRecorder';

interface MessagesProps {
  submission: Submission;
  // Who is reading: their own messages say "You".
  viewer: 'student' | 'teacher';
  studentName?: string;
}

// The back-and-forth after the teacher's first reply, oldest first.
export function MessageList({ submission, viewer, studentName }: MessagesProps) {
  const { t } = useLanguage();
  if (submission.messages.length === 0) return null;

  const author = (m: Message) => {
    const mine = (viewer === 'teacher') === m.fromTeacher;
    if (mine) return t('convYou');
    return m.fromTeacher ? t('convTeacher') : studentName || t('convStudent');
  };

  return (
    <ul className="mt-3 space-y-2">
      {submission.messages.map((m) => (
        <li
          key={m.id}
          className={`rounded-xl px-3 py-2 text-left ${m.fromTeacher ? 'bg-green-50' : 'bg-primary/5'}`}
        >
          <p className={`mb-1 text-xs font-semibold ${m.fromTeacher ? 'text-green-700' : 'text-primary'}`}>
            {author(m)}
          </p>
          {m.text && <p className="whitespace-pre-wrap text-gray-800">{m.text}</p>}
          {m.hasAudio && (
            <div className="mt-1">
              <PrivateAudio
                load={() => submissionService.fetchMessageAudio(submission.id, m.id)}
                playLabel={t('convPlay')}
                errorLabel={t('sayPlayFailed')}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

interface ReplyBoxProps {
  submissionId: string;
  placeholder: string;
  onSent: (submission: Submission) => void;
}

// Write and/or record a message, then send it.
export function ReplyBox({ submissionId, placeholder, onSent }: ReplyBoxProps) {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [clip, setClip] = useClip();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { recording, toggle } = useAudioRecorder(
    (recorded: Recording) => setClip(recorded),
    () => setError(t('sayMicFailed')),
  );

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const updated = await submissionService.sendMessage(submissionId, text.trim(), clip ?? undefined);
      setText('');
      setClip(null);
      onSent(updated);
      announcePronunciationChange();
    } catch (err: unknown) {
      const apiMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(apiMessage || t('convSendFailed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-3 text-left">
      <textarea
        className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        rows={2}
        maxLength={500}
        placeholder={placeholder}
        aria-label={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={recording}
          disabled={sending}
          onClick={() => {
            setError(null);
            toggle();
          }}
          className={
            recording
              ? 'rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700'
              : 'rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50'
          }
        >
          {recording ? `■ ${t('sayStop')}` : `🎙 ${clip ? t('convRecordAgain') : t('convRecord')}`}
        </button>
        {clip && !recording && (
          <>
            <audio controls src={clip.url} className="h-8 max-w-[14rem]" />
            <button type="button" onClick={() => setClip(null)} className="text-sm text-red-600 hover:underline">
              {t('pnRemoveReply')}
            </button>
          </>
        )}
        <button
          type="button"
          disabled={sending || recording || (!text.trim() && !clip)}
          onClick={send}
          className="ml-auto rounded-lg bg-primary px-4 py-1.5 text-sm text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {t('convSend')}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
