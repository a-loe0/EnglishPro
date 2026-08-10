import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Card, Spinner, Button } from '../../components/common';
import { studentSidebarItems } from '../../config/studentSidebar';
import { courseService, type CourseWithVideos } from '../../services/courses';
import { videoService } from '../../services/videos';
import { useTranslation } from '../../i18n';

export default function StudentCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const t = useTranslation();
  const [course, setCourse] = useState<CourseWithVideos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourse() {
      if (!courseId) return;

      try {
        setLoading(true);
        const data = await courseService.getById(courseId, true) as CourseWithVideos;
        setCourse(data);
      } catch (err) {
        console.error('Failed to load course:', err);
        setError('Failed to load course');
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [courseId]);

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <DashboardLayout sidebarItems={studentSidebarItems} title={t('loading')}>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !course) {
    return (
      <DashboardLayout sidebarItems={studentSidebarItems} title={t('courses')}>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Course not found'}
          </h2>
          <Button variant="gradient" onClick={() => navigate('/student/courses')}>
            {t('back')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={studentSidebarItems} title={course.title}>
      {/* Back button */}
      <button
        onClick={() => navigate('/student/courses')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>{t('back')}</span>
      </button>

      {/* Course Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{course.title}</h2>
        {course.description && (
          <p className="text-gray-500 mt-2">{course.description}</p>
        )}
        {course.teacher && (
          <p className="text-sm text-gray-400 mt-2">
            {t('instructor')}: {course.teacher.name}
          </p>
        )}
      </div>

      {/* Videos List */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('videos')} ({course.videos?.length || 0})
        </h3>
      </div>

      {!course.videos || course.videos.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noVideosYet')}</h3>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {course.videos
            .filter(video => video.status === 'READY')
            .map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/student/watch/${video.id}`)}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {video.thumbnailUrl ? (
                    <img
                      src={videoService.getThumbnailUrl(video.id)}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  {video.duration && (
                    <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{video.title}</h3>
                  {video.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{video.description}</p>
                  )}
                </div>
              </Card>
            ))}
        </div>
      )}
    </DashboardLayout>
  );
}
