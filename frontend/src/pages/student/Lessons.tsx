import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Spinner } from '../../components/common';
import { studentSidebarItems } from '../../config/studentSidebar';
import { progressService } from '../../services/progress';
import { getFullUrl } from '../../services/api';
import type { Progress } from '../../services/progress';
import { useTranslation } from '../../i18n';

export default function StudentLessons() {
  const navigate = useNavigate();
  const t = useTranslation();
  const [lessons, setLessons] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    async function fetchLessons() {
      try {
        const data = await progressService.getAll();
        setLessons(data);
      } catch (error) {
        console.error('Failed to load lessons:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLessons();
  }, []);

  const filteredLessons = lessons.filter((lesson) => {
    if (filter === 'completed') return lesson.completed;
    if (filter === 'in-progress') return !lesson.completed && lesson.watchPercentage > 0;
    return true;
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <DashboardLayout sidebarItems={studentSidebarItems} title={t('lessons')}>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={studentSidebarItems} title={t('lessons')}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{t('myLessons')}</h2>
        <p className="text-gray-500 mt-1">{t('allVideosStarted')}</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'in-progress', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? t('all') : f === 'in-progress' ? t('inProgress') : t('completed')}
          </button>
        ))}
      </div>

      {filteredLessons.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noLessonsYet')}</h3>
          <p className="text-gray-500">{t('startWatching')}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLessons.map((lesson) => (
            <Card
              key={lesson.id}
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/student/watch/${lesson.videoId}`)}
            >
              <div className="flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                  {lesson.video?.thumbnailUrl ? (
                    <img
                      src={getFullUrl(lesson.video.thumbnailUrl) || ''}
                      alt={lesson.video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {lesson.completed && (
                    <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {lesson.video?.title || 'Untitled Video'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('duration')}: {formatDuration(lesson.video?.duration || null)}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{lesson.completed ? t('completed') : t('inProgress')}</span>
                      <span>{Math.round(lesson.watchPercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          lesson.completed ? 'bg-green-500' : 'bg-gradient-to-r from-primary to-accent'
                        }`}
                        style={{ width: `${lesson.watchPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
