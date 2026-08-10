import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Button, Card, Spinner } from '../../components/common';
import { videoService } from '../../services/videos';
import type { Video } from '../../services/videos';
import { teacherSidebarItems } from '../../config/teacherSidebar';
import { useTranslation } from '../../i18n';

const VideosIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

export default function Videos() {
  const navigate = useNavigate();
  const t = useTranslation();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      try {
        setLoading(true);
        const response = await videoService.list();
        setVideos(response.data);
      } catch (err) {
        setError(t('failedToLoadVideos'));
        console.error('Error fetching videos:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

  const handleTogglePublish = async (e: React.MouseEvent, video: Video) => {
    e.stopPropagation(); // Prevent card click navigation

    if (video.status !== 'READY') {
      return; // Can't publish non-ready videos
    }

    try {
      setTogglingId(video.id);
      setError(null);
      const updatedVideo = await videoService.setPublished(video.id, !video.isPublished);
      setVideos(videos.map(v => v.id === video.id ? { ...v, isPublished: updatedVideo.isPublished } : v));
    } catch (err: unknown) {
      console.error('Failed to toggle publish status:', err);
      // Show actual error message from API if available
      const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(errorMessage || t('failedToUpdatePublish'));
    } finally {
      setTogglingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'READY':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">{t('ready')}</span>;
      case 'PROCESSING':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">{t('processing')}</span>;
      case 'FAILED':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">{t('failed')}</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{status}</span>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout sidebarItems={teacherSidebarItems} title={t('myVideos')}>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={teacherSidebarItems} title={t('myVideos')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('myVideos')}</h2>
          <p className="text-gray-500 mt-1">{videos.length} {videos.length !== 1 ? t('videosUploaded') : t('videoUploaded')}</p>
        </div>
        <Button variant="gradient" onClick={() => navigate('/teacher/videos/upload')}>
          {t('uploadVideo')}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {videos.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <VideosIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noVideosUploaded')}</h3>
          <p className="text-gray-500 mb-6">{t('uploadFirstVideo')}</p>
          <Button variant="gradient" onClick={() => navigate('/teacher/videos/upload')}>
            {t('uploadVideo')}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card
              key={video.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/teacher/videos/${video.id}`)}
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                <img
                  src={videoService.getThumbnailUrl(video.id)}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                {video.duration && (
                  <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                    {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{video.title}</h3>
                  {getStatusBadge(video.status)}
                </div>
                {video.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{video.description}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                  <span>{video.views || 0} {t('views')}</span>
                </div>

                {/* Publish Toggle */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-600">
                    {video.isPublished ? t('published') : t('draft')}
                  </span>
                  <button
                    onClick={(e) => handleTogglePublish(e, video)}
                    disabled={video.status !== 'READY' || togglingId === video.id}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${video.status !== 'READY'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : video.isPublished
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                    title={video.status !== 'READY' ? t('videoMustBeReady') : ''}
                  >
                    {togglingId === video.id ? (
                      <Spinner size="sm" />
                    ) : video.isPublished ? (
                      <>
                        <EyeIcon />
                        <span>{t('public')}</span>
                      </>
                    ) : (
                      <>
                        <EyeOffIcon />
                        <span>{t('private')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
