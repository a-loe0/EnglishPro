import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Badge } from '../../components/common';
import { studentSidebarItems } from '../../config/studentSidebar';
import { useAuthStore } from '../../store/authStore';
import { useLanguage } from '../../i18n';
import { activities, lessonActivities, type Activity, type ActivityCategory } from '../../data/practice';
import { videoService } from '../../services/videos';
import {
  loadPracticeProgress,
  recordPracticeResult,
  starsFor,
} from '../../services/practiceProgress';
import {
  PositionGame,
  SortGame,
  ScrambleGame,
  MatchGame,
  QuizGame,
} from '../../components/practice';

type Tab = 'all' | ActivityCategory;

function Stars({ count }: { count: number }) {
  return (
    <span aria-label={`${count} / 3`} className="tracking-widest text-amber-400">
      {[1, 2, 3].map((n) => (n <= count ? '★' : '☆'))}
    </span>
  );
}

function ActivityRunner({ activity, onFinish }: { activity: Activity; onFinish: (s: number, t: number) => void }) {
  switch (activity.kind) {
    case 'position':
      return <PositionGame activity={activity} onFinish={onFinish} />;
    case 'sort':
      return <SortGame activity={activity} onFinish={onFinish} />;
    case 'scramble':
      return <ScrambleGame activity={activity} onFinish={onFinish} />;
    case 'match':
      return <MatchGame activity={activity} onFinish={onFinish} />;
    case 'quiz':
      return <QuizGame activity={activity} onFinish={onFinish} />;
  }
}

export default function StudentPractice() {
  const { t, language } = useLanguage();
  const userId = useAuthStore((s) => s.user?.id);
  const [searchParams, setSearchParams] = useSearchParams();
  const lessonFilter = searchParams.get('lesson');
  const [lessonItems, setLessonItems] = useState<Activity[]>([]);

  // Practice the teacher attached to published lessons.
  useEffect(() => {
    let cancelled = false;
    videoService
      .list({ status: 'READY', limit: 100 })
      .then((res) => {
        if (!cancelled) setLessonItems(res.data.flatMap((video) => lessonActivities(video)));
      })
      .catch(() => {
        // Built-in practice still works without lesson activities.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [tab, setTab] = useState<Tab>('all');
  const [progress, setProgress] = useState(() => loadPracticeProgress(userId));
  const [active, setActive] = useState<Activity | null>(null);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  // Bumped on replay so the activity remounts with fresh state and a new shuffle.
  const [run, setRun] = useState(0);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: t('prTabAll') },
    { id: 'practice', label: t('prTabPractice') },
    { id: 'games', label: t('prTabGames') },
    { id: 'quizzes', label: t('prTabQuizzes') },
  ];

  const inTab = (a: Activity) => tab === 'all' || a.category === tab;
  const lessonVisible = lessonItems.filter((a) => inTab(a) && (!lessonFilter || a.lessonId === lessonFilter));
  const visible = lessonFilter ? [] : activities.filter(inTab);

  const start = (activity: Activity) => {
    setActive(activity);
    setResult(null);
    setRun((r) => r + 1);
  };

  const finish = (score: number, total: number) => {
    if (!active) return;
    setProgress(recordPracticeResult(userId, active.id, score, total));
    setResult({ score, total });
  };

  const renderCards = (list: Activity[]) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((activity) => {
          const best = progress[activity.id];
          return (
            <Card key={activity.id} hoverable className="flex flex-col">
              <div className="mb-2 text-4xl">{activity.icon}</div>
              <h3 className="text-lg font-bold text-gray-900">{activity.title[language]}</h3>
              <p className="mb-3 flex-1 text-sm text-gray-500">{activity.description[language]}</p>
              <div className="mb-3 flex items-center justify-between text-sm">
                <Badge>{activity.lessonId ? t('prFromLesson') : activity.level === 'beginner' ? t('prBeginner') : t('prIntermediate')}</Badge>
                {best ? <Stars count={starsFor(best.best, best.total)} /> : <span className="text-gray-400">{t('prNotPlayed')}</span>}
              </div>
              <button
                type="button"
                onClick={() => start(activity)}
                className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
              >
                {best ? t('prPlayAgain') : t('prStart')}
              </button>
            </Card>
          );
        })}
      </div>
  );

  if (active) {
    const stars = result ? starsFor(result.score, result.total) : 0;
    return (
      <DashboardLayout sidebarItems={studentSidebarItems} title={t('prTitle')}>
        <button
          type="button"
          onClick={() => setActive(null)}
          className="mb-4 text-sm text-primary hover:underline"
        >
          ← {t('prBack')}
        </button>
        <Card className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            {active.icon} {active.title[language]}
          </h2>
          {result ? (
            <div className="py-6 text-center">
              <p className="mb-2 text-5xl">{stars === 3 ? '🎉' : stars === 2 ? '👏' : '💪'}</p>
              <p className="mb-1 text-xl font-bold text-gray-900">
                {t('prScore')} {result.score} / {result.total}
              </p>
              <p className="mb-1 text-3xl">
                <Stars count={stars} />
              </p>
              <p className="mb-6 text-gray-500">{stars === 3 ? t('prGreat') : t('prKeepGoing')}</p>
              <div className="flex justify-center gap-3">
                <button type="button" onClick={() => start(active)} className="rounded-lg bg-primary px-5 py-2 text-white hover:bg-primary-dark">
                  {t('prPlayAgain')}
                </button>
                <button type="button" onClick={() => setActive(null)} className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-50">
                  {t('prMoreActivities')}
                </button>
              </div>
            </div>
          ) : (
            <ActivityRunner key={run} activity={active} onFinish={finish} />
          )}
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={studentSidebarItems} title={t('prTitle')}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('prHeading')}</h2>
        <p className="mt-1 text-gray-500">{t('prSubheading')}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.id ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {lessonVisible.length > 0 && (
        <section className="mb-8">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">{t('prFromLessons')}</h3>
          {renderCards(lessonVisible)}
        </section>
      )}

      {visible.length > 0 && (
        <section>
          {lessonItems.length > 0 && <h3 className="mb-3 text-lg font-semibold text-gray-900">{t('prMorePractice')}</h3>}
          {renderCards(visible)}
        </section>
      )}

      {lessonFilter && (
        <button type="button" onClick={() => setSearchParams({})} className="mt-4 text-sm text-primary hover:underline">
          {t('prMorePractice')} →
        </button>
      )}
    </DashboardLayout>
  );
}
