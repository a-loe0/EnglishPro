import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { VideoPlayer } from '../../components/video';
import { Button, Badge, Card } from '../../components/common';
import { videoService, type Video } from '../../services/videos';
import { progressService } from '../../services/progress';
import { studentSidebarItems } from '../../config/studentSidebar';
import { useTranslation } from '../../i18n';

export default function VideoWatch() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const t = useTranslation();

  const [video, setVideo] = useState<Video | null>(null);
  const [initialProgress, setInitialProgress] = useState(0);
  const [initialPosition, setInitialPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    async function loadVideo() {
      if (!videoId) return;

      setIsLoading(true);
      setError(null);

      try {
        const [videoData, progressData] = await Promise.all([
          videoService.getById(videoId),
          progressService.getVideoProgress(videoId),
        ]);

        setVideo(videoData);
        setInitialProgress(progressData.watchPercentage || 0);
        setInitialPosition(progressData.lastPosition || 0);
        setIsCompleted(progressData.completed || false);
      } catch (err) {
        console.error('Failed to load video:', err);
        setError('Failed to load video. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadVideo();
  }, [videoId]);

  const handleProgress = async (percentage: number, position: number) => {
    if (!videoId) return;
    try {
      await progressService.updateProgress({ videoId, watchPercentage: percentage, lastPosition: position });
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const handleComplete = async () => {
    if (!videoId) return;
    try {
      await progressService.markCompleted(videoId);
      setIsCompleted(true);
    } catch (err) {
      console.error('Failed to mark complete:', err);
    }
  };

  const handleUncomplete = async () => {
    if (!videoId) return;
    try {
      await progressService.markUncompleted(videoId);
      setIsCompleted(false);
    } catch (err) {
      console.error('Failed to mark incomplete:', err);
    }
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <DashboardLayout sidebarItems={studentSidebarItems} title={t('loading')}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
          <div className="aspect-video bg-gray-200 rounded-lg mb-4" />
          <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !video) {
    return (
      <DashboardLayout sidebarItems={studentSidebarItems} title={t('videoNotFound')}>
        <div className="text-center py-12">
          <ErrorIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || t('videoNotFound')}
          </h2>
          <p className="text-gray-500 mb-4">
            {t('videoNotFoundDesc')}
          </p>
          <Button variant="gradient" onClick={() => navigate('/student/dashboard')}>
            {t('backToDashboard')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={studentSidebarItems} title={video.title}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <BackIcon className="w-5 h-5" />
        <span>{t('back')}</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          {video.hlsUrl ? (
            <VideoPlayer
              videoId={video.id}
              hlsUrl={video.hlsUrl}
              title={video.title}
              thumbnailUrl={video.thumbnailUrl}
              initialProgress={initialProgress}
              initialPosition={initialPosition}
              onProgress={handleProgress}
              onComplete={handleComplete}
            />
          ) : (
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <ProcessingIcon className="w-12 h-12 mx-auto mb-3 animate-spin" />
                <p className="text-lg font-medium">{t('videoProcessing')}</p>
                <p className="text-sm text-gray-400">
                  {t('checkBackLater')}
                </p>
              </div>
            </div>
          )}

          {/* Video Info */}
          <div className="mt-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                  {video.duration && (
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {formatDuration(video.duration)}
                    </span>
                  )}
                  {video.views !== undefined && (
                    <span className="flex items-center gap-1">
                      <EyeIcon className="w-4 h-4" />
                      {video.views} {t('views')}
                    </span>
                  )}
                </div>
              </div>
              {isCompleted && (
                <Badge variant="success" className="flex-shrink-0">
                  <CheckIcon className="w-4 h-4 mr-1" />
                  {t('completed')}
                </Badge>
              )}
            </div>

            {video.description && (
              <p className="mt-4 text-gray-600">{video.description}</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Course Info */}
          {video.course && (
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{t('fromCourse')}</h3>
              <button
                onClick={() => navigate(`/student/courses/${video.course?.id}`)}
                className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <p className="font-medium text-gray-900">{video.course.title}</p>
                <p className="text-sm text-gray-500 mt-1">{t('viewCourse')}</p>
              </button>
            </Card>
          )}

          {/* Actions */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">{t('actions')}</h3>
            <div className="space-y-2">
              {!isCompleted ? (
                <Button
                  variant="secondary"
                  fullWidth
                  leftIcon={<CheckIcon className="w-4 h-4" />}
                  onClick={handleComplete}
                >
                  {t('markAsComplete')}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  fullWidth
                  leftIcon={<UndoIcon className="w-4 h-4" />}
                  onClick={handleUncomplete}
                >
                  {t('markAsIncomplete')}
                </Button>
              )}
            </div>
          </Card>

          {/* Teacher Info */}
          {video.teacher && (
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{t('instructor')}</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-medium">
                  {video.teacher.name?.charAt(0) || 'T'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{video.teacher.name}</p>
                  <p className="text-sm text-gray-500">{t('teacher')}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Icon components
function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function ProcessingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function UndoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  );
}
