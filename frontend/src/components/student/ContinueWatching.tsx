import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../common';
import type { Progress } from '../../services/progress';
import { getFullUrl } from '../../services/api';
import { useTranslation } from '../../i18n';

interface ContinueWatchingProps {
  videos: Progress[];
  isLoading?: boolean;
}

export function ContinueWatching({ videos, isLoading }: ContinueWatchingProps) {
  const navigate = useNavigate();
  const t = useTranslation();

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-4 p-3 animate-pulse">
              <div className="w-32 h-20 bg-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
                <div className="h-2 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (videos.length === 0) {
    return (
      <Card className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('continueWatching')}</h3>
        </div>
        <div className="text-center py-8">
          <VideoIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('noVideosInProgress')}</p>
          <Button
            variant="gradient"
            size="sm"
            className="mt-4"
            onClick={() => navigate('/student/courses')}
          >
            {t('browseCourses')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('continueWatching')}</h3>
        <Button variant="ghost" size="sm" onClick={() => navigate('/student/lessons')}>
          {t('viewAll')}
        </Button>
      </div>
      <div className="space-y-4">
        {videos.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => navigate(`/student/watch/${item.videoId}`)}
          >
            {/* Thumbnail */}
            <div className="w-32 h-20 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
              {item.video?.thumbnailUrl ? (
                <img
                  src={getFullUrl(item.video.thumbnailUrl) || ''}
                  alt={item.video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <VideoIcon className="w-8 h-8 text-white" />
              )}
              {item.video?.duration && (
                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  {formatDuration(item.video.duration)}
                </span>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 mb-1 truncate">
                {item.video?.title || 'Untitled Video'}
              </h4>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${item.watchPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">
                  {Math.round(item.watchPercentage)}% {t('complete')}
                </p>
                {item.lastPosition > 0 && (
                  <p className="text-xs text-primary font-medium">
                    {t('resumeAt')} {formatDuration(item.lastPosition)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default ContinueWatching;
