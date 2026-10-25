import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Spinner } from '../../components/common';
import { SayIt } from '../../components/practice/SayIt';
import { studentSidebarItems } from '../../config/studentSidebar';
import { videoService, type Video } from '../../services/videos';
import { submissionService, type Submission } from '../../services/submissions';
import { useLanguage } from '../../i18n';

// A recording about the whole lesson, not one vocab word (matches the backend).
const LESSON_RECORDING_WORD = '';

// Every published lesson, each with a place to record yourself and send it to
// the teacher. No setup needed from the teacher beyond publishing the video.
export default function StudentPronunciation() {
  const { t } = useLanguage();
  const location = useLocation();
  const [lessons, setLessons] = useState<Video[]>([]);
  // This student's lesson recordings, by lesson id.
  const [sent, setSent] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      videoService.list({ status: 'READY', limit: 100 }),
      submissionService.mine().catch(() => [] as Submission[]),
    ])
      .then(([videos, mine]) => {
        if (cancelled) return;
        setLessons(videos.data);
        setSent(
          Object.fromEntries(mine.filter((s) => s.word === LESSON_RECORDING_WORD).map((s) => [s.videoId, s])),
        );
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Coming from a lesson page (#<videoId>): scroll to that lesson.
  useEffect(() => {
    if (loading || !location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, location.hash]);

  return (
    <DashboardLayout sidebarItems={studentSidebarItems} title={t('pnTitle')}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{t('spHeading')}</h2>
        <p className="mt-1 text-gray-500">{t('spIntro')}</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : failed ? (
        <Card className="p-8 text-center">
          <p role="alert" className="text-red-600">
            {t('spLoadFailed')}
          </p>
        </Card>
      ) : lessons.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">{t('noLessonsYet')}</h3>
          <p className="text-gray-500">{t('lessonsAppearHere')}</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {lessons.map((lesson) => {
            const wordCount = lesson.practice?.vocab?.length ?? 0;
            return (
              <Card key={lesson.id} id={lesson.id} padding="none" className="scroll-mt-24 p-4 sm:p-6">
                <div className="mb-4 flex items-center gap-4">
                  <div className="h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {lesson.thumbnailUrl && (
                      <img
                        src={videoService.getThumbnailUrl(lesson.id)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <Link to={`/student/watch/${lesson.id}`} className="text-primary hover:underline">
                        ▶ {t('spWatch')}
                      </Link>
                      {wordCount > 0 && (
                        <Link to={`/student/practice?lesson=${lesson.id}`} className="text-primary hover:underline">
                          🔤 {t('spWords')} ({wordCount})
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <SayIt
                  lessonId={lesson.id}
                  word={LESSON_RECORDING_WORD}
                  heading={t('spLessonHeading')}
                  hint={t('spLessonHint')}
                  submission={sent[lesson.id]}
                  onSent={(submission) => setSent((current) => ({ ...current, [lesson.id]: submission }))}
                />
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
