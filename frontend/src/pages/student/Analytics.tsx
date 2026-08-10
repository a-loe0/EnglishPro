import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Button } from '../../components/common';
import {
  ProgressChart,
  CompletionDonut,
  TrendCard,
  WeeklyHeatmap,
} from '../../components/analytics';
import { analyticsService, type StudentAnalytics } from '../../services/analytics';
import { studentSidebarItems } from '../../config/studentSidebar';
import { useTranslation } from '../../i18n';

// Icon used for Videos stat card
const LessonsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function StudentAnalyticsPage() {
  const navigate = useNavigate();
  const t = useTranslation();
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await analyticsService.getStudentAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError(t('failedToLoad'));
      } finally {
        setIsLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (error) {
    return (
      <DashboardLayout sidebarItems={studentSidebarItems} title={t('progress')}>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            {t('retry')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={studentSidebarItems} title={t('myProgress')}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{t('myProgress')}</h2>
        <p className="text-gray-500">{t('trackLearning')}</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <TrendCard
          title={t('totalWatchTime')}
          value={formatTime(analytics?.overview.totalWatchTime ?? 0)}
          icon={<ClockIcon />}
          color="#6366F1"
        />
        <TrendCard
          title={t('videosCompleted')}
          value={analytics?.overview.completedVideos ?? 0}
          icon={<CheckIcon />}
          color="#10B981"
        />
        <TrendCard
          title={t('totalVideos')}
          value={analytics?.overview.totalVideos ?? 0}
          icon={<LessonsIcon />}
          color="#EC4899"
        />
        <TrendCard
          title={t('dayStreak')}
          value={analytics?.overview.streak ?? 0}
          icon={<FireIcon />}
          color="#EF4444"
        />
      </div>

      {/* Weekly Progress Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProgressChart
          data={analytics?.weeklyProgress.map((w) => ({ date: w.date, value: w.watchTime })) ?? []}
          title={t('weeklyWatchTime')}
          color="#6366F1"
          height={250}
        />
        <ProgressChart
          data={analytics?.weeklyProgress.map((w) => ({ date: w.date, value: w.videosCompleted })) ?? []}
          title={t('videosCompletedPerWeek')}
          color="#10B981"
          height={250}
        />
      </div>

      {/* Activity Heatmap & Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <WeeklyHeatmap
            data={analytics?.weeklyProgress.map((w) => ({ date: w.date, value: w.videosCompleted })) ?? []}
            title={t('learningActivity')}
            weeks={12}
          />
        </div>
        <CompletionDonut
          completed={analytics?.overview.completedVideos ?? 0}
          total={analytics?.overview.totalVideos ?? 1}
          title={t('overallProgress')}
          primaryColor="#6366F1"
        />
      </div>

      {/* Course Progress */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('courseProgress')}</h3>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-2 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : analytics?.courseProgress.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>{t('noCourseProgress')}</p>
            <Button
              variant="gradient"
              size="sm"
              className="mt-4"
              onClick={() => navigate('/student/courses')}
            >
              {t('browseCourses')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics?.courseProgress.map((course) => (
              <div
                key={course.courseId}
                className="p-4 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md cursor-pointer transition-all"
                onClick={() => navigate(`/student/courses/${course.courseId}`)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900 truncate">
                    {course.title}
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {Math.round(course.percentage)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${course.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {course.completedVideos} {t('ofVideos')} {course.totalVideos} {t('videosLabel')}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}

// Additional icons
function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function FireIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  );
}
