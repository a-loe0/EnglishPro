import { useState } from 'react';
import { useLanguage } from '../../i18n';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth';
import { submissionService, type Submission } from '../../services/submissions';
import { useAudioRecorder, useClip } from '../../hooks/useAudioRecorder';
import { PrivateAudio } from '../common/PrivateAudio';

interface Props {
  lessonId: string;
  word: string;
  // What the student last sent for this word, if anything.
  submission?: Submission;
  onSent: (submission: Submission) => void;
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

// A visitor who hasn't told us who they are yet (see GUEST_NAME on the backend).
const GUEST_NAME = 'Guest';

// The student records themselves saying the word and sends it to the teacher,
// then sees the teacher's reply here.
export function SayIt({ lessonId, word, submission, onSent }: Props) {
  const { t } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [clip, setClip] = useClip();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askingName, setAskingName] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const { recording, toggle } = useAudioRecorder(
    (recorded) => setClip(recorded),
    () => setError(t('sayMicFailed')),
  );

  const send = async () => {
    if (!clip) return;
    setSending(true);
    setError(null);
    try {
      onSent(await submissionService.send(lessonId, word, clip.blob, clip.filename));
      setClip(null);
      setAskingName(false);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; code?: string } } })?.response?.data;
      if (data?.code === 'NAME_REQUIRED') setAskingName(true);
      else setError(data?.error || t('saySendFailed'));
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    // The teacher needs a name to know whose voice this is.
    if (!user || user.name === GUEST_NAME) setAskingName(true);
    else send();
  };

  const saveNameAndSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!firstName.trim() || !lastName.trim()) return;
    setSending(true);
    setError(null);
    try {
      setUser(await authService.updateProfile({ name }));
    } catch {
      setError(t('saySendFailed'));
      setSending(false);
      return;
    }
    await send();
  };

  const hasSomething = !!clip || !!submission;

  return (
    <div className="mb-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white px-4 py-5 text-center">
      <p className="mb-1 font-semibold text-gray-900">🎙 {t('sayHeading')}</p>
      <p className="mb-3 text-sm text-gray-500">{t('sayHint')}</p>

      {submission && !clip && (
        <div className="mb-4 rounded-xl bg-gray-50 p-3 text-left">
          {submission.reviewedAt ? (
            <>
              <p className="mb-1 text-sm font-semibold text-green-700">💬 {t('sayTeacherSays')}</p>
              {submission.feedbackText && (
                <p className="mb-2 whitespace-pre-wrap text-gray-800">{submission.feedbackText}</p>
              )}
              {submission.hasFeedbackAudio && (
                <PrivateAudio
                  key={`${submission.id}-${submission.reviewedAt}`}
                  load={() => submissionService.fetchAudio(submission.id, 'feedback')}
                  playLabel={t('sayPlayTeacher')}
                  errorLabel={t('sayPlayFailed')}
                />
              )}
            </>
          ) : (
            <p className="text-sm text-gray-700">✅ {t('saySent')}</p>
          )}
          <div className="mt-2">
            <PrivateAudio
              key={`${submission.id}-${submission.createdAt}`}
              load={() => submissionService.fetchAudio(submission.id, 'student')}
              playLabel={t('sayPlayMine')}
              errorLabel={t('sayPlayFailed')}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        aria-pressed={recording}
        disabled={sending}
        onClick={() => {
          setError(null);
          toggle();
        }}
        className={`rounded-full px-5 py-2.5 font-medium transition-colors disabled:opacity-50 ${
          recording
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'border-2 border-primary text-primary hover:bg-primary/10'
        }`}
      >
        {recording ? `■ ${t('sayStop')}` : hasSomething ? t('sayRecordAgain') : t('sayRecord')}
      </button>

      {clip && !recording && (
        <div className="mt-4">
          <audio controls src={clip.url} className="mx-auto mb-3 h-9 max-w-full" />
          {askingName ? (
            <form onSubmit={saveNameAndSend} className="mx-auto max-w-xs text-left">
              <p className="mb-2 text-sm text-gray-700">{t('sayNamePrompt')}</p>
              <input
                className={`${inputClass} mb-2`}
                placeholder={t('sayFirstName')}
                aria-label={t('sayFirstName')}
                autoComplete="given-name"
                maxLength={38}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                className={`${inputClass} mb-3`}
                placeholder={t('sayLastName')}
                aria-label={t('sayLastName')}
                autoComplete="family-name"
                maxLength={38}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <button
                type="submit"
                disabled={sending || !firstName.trim() || !lastName.trim()}
                className="w-full rounded-lg bg-primary px-5 py-2 text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {t('saySend')}
              </button>
            </form>
          ) : (
            <button
              type="button"
              disabled={sending}
              onClick={handleSend}
              className="rounded-lg bg-primary px-5 py-2 text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {t('saySend')}
            </button>
          )}
          <p className="mt-2 text-xs text-gray-400">{t('sayPrivacy')}</p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
