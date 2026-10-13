import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Button, Card, Spinner } from '../../components/common';
import { videoService, type LessonPractice } from '../../services/videos';
import { draftLessonPractice, TutorError } from '../../services/tutor';
import { teacherSidebarItems } from '../../config/teacherSidebar';
import { useTranslation } from '../../i18n';

const EMPTY: LessonPractice = { quiz: [], match: [], scramble: [] };

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="shrink-0 text-sm text-red-600 hover:underline">
      {label}
    </button>
  );
}

export default function TeacherLessonPractice() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const t = useTranslation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState<string | null>(null);
  const [practice, setPractice] = useState<LessonPractice>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      if (!videoId) return;
      try {
        const video = await videoService.getById(videoId);
        setTitle(video.title);
        setDescription(video.description);
        setPractice(video.practice ?? EMPTY);
      } catch {
        setMessage({ type: 'error', text: t('lpLoadFailed') });
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const hasContent = practice.quiz.length + practice.match.length + practice.scramble.length > 0;

  const handleDraft = async () => {
    if (hasContent && !window.confirm(t('lpConfirmReplace'))) return;
    setDrafting(true);
    setMessage(null);
    try {
      setPractice(await draftLessonPractice(title, description));
      setMessage({ type: 'success', text: t('lpDrafted') });
    } catch (err) {
      const unavailable = err instanceof TutorError && err.code === 'AI_UNAVAILABLE';
      setMessage({ type: 'error', text: unavailable ? t('tutorErrorUnavailable') : t('lpDraftFailed') });
    } finally {
      setDrafting(false);
    }
  };

  // Drop rows the teacher left half-filled so one blank field can't block saving.
  const cleaned = (): LessonPractice => ({
    quiz: practice.quiz
      .map((q) => {
        // Keep the correct answer pointing at the same option after blanks are dropped.
        const kept = q.options.map((o, i) => ({ text: o.trim(), correct: i === q.answer })).filter((o) => o.text);
        return {
          ...q,
          prompt: q.prompt.trim(),
          options: kept.map((o) => o.text),
          answer: Math.max(0, kept.findIndex((o) => o.correct)),
          // The correct option was blank: this question can't be saved.
          valid: kept.some((o) => o.correct),
        };
      })
      .filter((q) => q.valid && q.prompt && q.options.length >= 2)
      .map((q) => ({
        prompt: q.prompt,
        promptZh: q.promptZh,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation?.trim() || undefined,
        explanationZh: q.explanationZh,
      })),
    match: practice.match
      .map((m) => ({ word: m.word.trim(), zh: m.zh.trim() }))
      .filter((m) => m.word && m.zh),
    scramble: practice.scramble
      .map((s) => ({ text: s.text.trim(), zh: s.zh?.trim() || undefined }))
      .filter((s) => s.text.split(/\s+/).length >= 2),
  });

  const handleSave = async () => {
    if (!videoId) return;
    const toSave = cleaned();
    setSaving(true);
    setMessage(null);
    try {
      await videoService.savePractice(videoId, toSave);
      setPractice(toSave);
      setMessage({ type: 'success', text: t('lpSaved') });
    } catch (err: unknown) {
      const apiMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setMessage({ type: 'error', text: apiMessage || t('lpSaveFailed') });
    } finally {
      setSaving(false);
    }
  };

  const setQuiz = (i: number, patch: Partial<LessonPractice['quiz'][number]>) =>
    setPractice({ ...practice, quiz: practice.quiz.map((q, idx) => (idx === i ? { ...q, ...patch } : q)) });
  const setMatch = (i: number, patch: Partial<LessonPractice['match'][number]>) =>
    setPractice({ ...practice, match: practice.match.map((m, idx) => (idx === i ? { ...m, ...patch } : m)) });
  const setScramble = (i: number, patch: Partial<LessonPractice['scramble'][number]>) =>
    setPractice({ ...practice, scramble: practice.scramble.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });

  if (loading) {
    return (
      <DashboardLayout sidebarItems={teacherSidebarItems} title={t('lpTitle')}>
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={teacherSidebarItems} title={t('lpTitle')}>
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate('/teacher/videos')}
          className="mb-4 text-sm text-gray-600 hover:text-gray-900"
        >
          ← {t('myVideos')}
        </button>

        <h2 className="text-2xl font-bold text-gray-900">{t('lpTitle')}</h2>
        <p className="mb-1 mt-1 font-medium text-gray-800">{title}</p>
        <p className="mb-6 text-gray-500">{t('lpIntro')}</p>

        <div className="mb-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleDraft} isLoading={drafting}>
            ✨ {t('lpDraft')}
          </Button>
          <Button variant="gradient" onClick={handleSave} isLoading={saving}>
            {t('save')}
          </Button>
        </div>

        {message && (
          <div
            role="status"
            className={`mb-6 rounded-lg border p-3 text-sm ${
              message.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-600'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Quiz */}
        <Card className="mb-6">
          <h3 className="mb-1 text-lg font-semibold text-gray-900">📝 {t('lpQuiz')}</h3>
          <p className="mb-4 text-sm text-gray-500">{t('lpQuizHelp')}</p>
          <div className="space-y-5">
            {practice.quiz.map((q, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-3">
                <input
                  className={`${inputClass} mb-2`}
                  placeholder={t('lpQuestion')}
                  aria-label={`${t('lpQuestion')} ${i + 1}`}
                  value={q.prompt}
                  onChange={(e) => setQuiz(i, { prompt: e.target.value })}
                />
                {q.options.map((option, oi) => (
                  <div key={oi} className="mb-2 flex items-center gap-2">
                    <input
                      type="radio"
                      name={`answer-${i}`}
                      checked={q.answer === oi}
                      onChange={() => setQuiz(i, { answer: oi })}
                      aria-label={`${t('lpQuestion')} ${i + 1} ${t('lpCorrect')} ${oi + 1}`}
                    />
                    <input
                      className={inputClass}
                      placeholder={`${t('lpOption')} ${oi + 1}`}
                      aria-label={`${t('lpQuestion')} ${i + 1} ${t('lpOption')} ${oi + 1}`}
                      value={option}
                      onChange={(e) =>
                        setQuiz(i, { options: q.options.map((o, idx) => (idx === oi ? e.target.value : o)) })
                      }
                    />
                  </div>
                ))}
                <input
                  className={`${inputClass} mb-2`}
                  placeholder={t('lpExplanation')}
                  aria-label={`${t('lpQuestion')} ${i + 1} ${t('lpExplanation')}`}
                  value={q.explanation ?? ''}
                  onChange={(e) => setQuiz(i, { explanation: e.target.value })}
                />
                <RemoveButton
                  label={t('lpRemove')}
                  onClick={() => setPractice({ ...practice, quiz: practice.quiz.filter((_, idx) => idx !== i) })}
                />
              </div>
            ))}
          </div>
          {practice.quiz.length < 10 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() =>
                setPractice({
                  ...practice,
                  quiz: [...practice.quiz, { prompt: '', options: ['', '', '', ''], answer: 0 }],
                })
              }
            >
              + {t('lpAddQuestion')}
            </Button>
          )}
        </Card>

        {/* Match */}
        <Card className="mb-6">
          <h3 className="mb-1 text-lg font-semibold text-gray-900">🃏 {t('lpMatch')}</h3>
          <p className="mb-4 text-sm text-gray-500">{t('lpMatchHelp')}</p>
          <div className="space-y-2">
            {practice.match.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={inputClass}
                  placeholder={t('lpEnglishWord')}
                  aria-label={`${t('lpEnglishWord')} ${i + 1}`}
                  value={m.word}
                  onChange={(e) => setMatch(i, { word: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder={t('lpChinese')}
                  aria-label={`${t('lpEnglishWord')} ${i + 1} ${t('lpChinese')}`}
                  value={m.zh}
                  onChange={(e) => setMatch(i, { zh: e.target.value })}
                />
                <RemoveButton
                  label={t('lpRemove')}
                  onClick={() => setPractice({ ...practice, match: practice.match.filter((_, idx) => idx !== i) })}
                />
              </div>
            ))}
          </div>
          {practice.match.length < 8 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => setPractice({ ...practice, match: [...practice.match, { word: '', zh: '' }] })}
            >
              + {t('lpAddPair')}
            </Button>
          )}
        </Card>

        {/* Scramble */}
        <Card className="mb-6">
          <h3 className="mb-1 text-lg font-semibold text-gray-900">🧩 {t('lpScramble')}</h3>
          <p className="mb-4 text-sm text-gray-500">{t('lpScrambleHelp')}</p>
          <div className="space-y-2">
            {practice.scramble.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={inputClass}
                  placeholder={t('lpSentence')}
                  aria-label={`${t('lpSentence')} ${i + 1}`}
                  value={s.text}
                  onChange={(e) => setScramble(i, { text: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder={t('lpChinese')}
                  aria-label={`${t('lpSentence')} ${i + 1} ${t('lpChinese')}`}
                  value={s.zh ?? ''}
                  onChange={(e) => setScramble(i, { zh: e.target.value })}
                />
                <RemoveButton
                  label={t('lpRemove')}
                  onClick={() =>
                    setPractice({ ...practice, scramble: practice.scramble.filter((_, idx) => idx !== i) })
                  }
                />
              </div>
            ))}
          </div>
          {practice.scramble.length < 8 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => setPractice({ ...practice, scramble: [...practice.scramble, { text: '', zh: '' }] })}
            >
              + {t('lpAddSentence')}
            </Button>
          )}
        </Card>

        <Button variant="gradient" onClick={handleSave} isLoading={saving}>
          {t('save')}
        </Button>
      </div>
    </DashboardLayout>
  );
}
