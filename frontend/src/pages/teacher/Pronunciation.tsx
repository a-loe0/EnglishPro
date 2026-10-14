import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout';
import { Button, Card, Spinner, PrivateAudio } from '../../components/common';
import { teacherSidebarItems } from '../../config/teacherSidebar';
import { useLanguage } from '../../i18n';
import { submissionService, type TeacherSubmission } from '../../services/submissions';
import { useAudioRecorder, useClip } from '../../hooks/useAudioRecorder';

type Tab = 'pending' | 'reviewed';

function SubmissionCard({ submission, onDone }: { submission: TeacherSubmission; onDone: () => void }) {
  const { t, language } = useLanguage();
  const [text, setText] = useState(submission.feedbackText ?? '');
  const [reply, setReply] = useClip();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { recording, toggle } = useAudioRecorder(
    (recorded) => setReply(recorded),
    () => setError(t('lpMicFailed')),
  );

  const canSend = !!text.trim() || !!reply || submission.hasFeedbackAudio;

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await submissionService.sendFeedback(submission.id, text, reply ?? undefined);
      onDone();
    } catch (err: unknown) {
      const apiMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(apiMessage || t('pnSendFailed'));
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(t('pnConfirmDelete'))) return;
    setBusy(true);
    setError(null);
    try {
      await submissionService.remove(submission.id);
      onDone();
    } catch {
      setError(t('pnDeleteFailed'));
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <span className="text-lg font-semibold text-gray-900">{submission.student.name}</span>
          <span className="mx-2 text-gray-300">·</span>
          <span className="text-lg font-bold text-primary">{submission.word}</span>
        </div>
        <span className="text-sm text-gray-500">
          {submission.video.title} ·{' '}
          {new Date(submission.createdAt).toLocaleString(language === 'zh' ? 'zh-TW' : 'en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </span>
      </div>

      <div className="mb-3">
        <PrivateAudio
          load={() => submissionService.fetchAudio(submission.id, 'student')}
          playLabel={t('pnPlayStudent')}
          errorLabel={t('sayPlayFailed')}
        />
      </div>

      <textarea
        className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        rows={2}
        maxLength={500}
        placeholder={t('pnFeedbackPlaceholder')}
        aria-label={`${t('pnFeedbackPlaceholder')} ${submission.student.name} ${submission.word}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={recording}
          disabled={busy}
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
          {recording
            ? `■ ${t('lpStopRecording')}`
            : `🎙 ${reply || submission.hasFeedbackAudio ? t('pnRecordReplyAgain') : t('pnRecordReply')}`}
        </button>
        {reply && !recording && (
          <>
            <audio controls src={reply.url} className="h-8 max-w-[14rem]" />
            <button type="button" onClick={() => setReply(null)} className="text-sm text-red-600 hover:underline">
              {t('pnRemoveReply')}
            </button>
          </>
        )}
        {!reply && submission.hasFeedbackAudio && (
          <PrivateAudio
            load={() => submissionService.fetchAudio(submission.id, 'feedback')}
            playLabel={t('pnPlayReply')}
            errorLabel={t('sayPlayFailed')}
          />
        )}
      </div>

      {error && (
        <p role="alert" className="mb-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="gradient" size="sm" onClick={send} isLoading={busy} disabled={!canSend || recording}>
          {submission.reviewedAt ? t('pnUpdate') : t('pnSend')}
        </Button>
        <button type="button" disabled={busy} onClick={remove} className="text-sm text-red-600 hover:underline">
          {t('pnDelete')}
        </button>
      </div>
    </Card>
  );
}

export default function TeacherPronunciation() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('pending');
  const [items, setItems] = useState<TeacherSubmission[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (which: Tab) => {
    setFailed(false);
    try {
      const res = await submissionService.list(which);
      setItems(res.data);
      setPendingCount(res.pendingCount);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pending', label: pendingCount > 0 ? `${t('pnTabPending')} (${pendingCount})` : t('pnTabPending') },
    { id: 'reviewed', label: t('pnTabReviewed') },
  ];

  return (
    <DashboardLayout sidebarItems={teacherSidebarItems} title={t('pnTitle')}>
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-bold text-gray-900">{t('pnHeading')}</h2>
        <p className="mb-6 mt-1 text-gray-500">{t('pnIntro')}</p>

        <div className="mb-6 flex flex-wrap gap-2" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => {
                if (item.id === tab) return;
                setLoading(true);
                setTab(item.id);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === item.id ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : failed ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {t('pnLoadFailed')}
          </p>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-gray-500">
            {tab === 'pending' ? t('pnEmptyPending') : t('pnEmptyReviewed')}
          </p>
        ) : (
          <div className="space-y-4">
            {items.map((submission) => (
              // Remount when the recording or reply changes so the form resets.
              <SubmissionCard
                key={`${submission.id}-${submission.createdAt}-${submission.reviewedAt}`}
                submission={submission}
                onDone={() => load(tab)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
