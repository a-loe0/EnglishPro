import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { Button, Card, Spinner } from '../../components/common';
import { VideoPlayer } from '../../components/video';
import { videoService } from '../../services/videos';
import type { Video } from '../../services/videos';
import { teacherSidebarItems } from '../../config/teacherSidebar';

export default function VideoDetail() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideo() {
      if (!videoId) return;
      try {
        setLoading(true);
        const data = await videoService.getById(videoId);
        setVideo(data);
      } catch (err) {
        setError('Failed to load video');
        console.error('Error fetching video:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchVideo();
  }, [videoId]);

  if (loading) {
    return (
      <DashboardLayout sidebarItems={teacherSidebarItems} title="Video">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !video) {
    return (
      <DashboardLayout sidebarItems={teacherSidebarItems} title="Video">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error || 'Video not found'}</p>
          <Button variant="secondary" onClick={() => navigate('/teacher/videos')}>
            Back to Videos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={teacherSidebarItems} title={video.title}>
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/teacher/videos')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Videos
        </button>

        {/* Video Player */}
        <Card className="overflow-hidden mb-6">
          {video.status === 'READY' ? (
            <VideoPlayer
              videoId={video.id}
              hlsUrl={videoService.getStreamUrl(video.id)}
              title={video.title}
            />
          ) : video.status === 'PROCESSING' ? (
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <Spinner size="lg" className="mb-4" />
                <p>Video is still processing...</p>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              <p className="text-white">Video unavailable</p>
            </div>
          )}
        </Card>

        {/* Video Info */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                <span>{video.views || 0} views</span>
                {video.duration && (
                  <span>{Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate(`/teacher/videos/${video.id}/edit`)}>
                Edit
              </Button>
            </div>
          </div>

          {video.description && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{video.description}</p>
            </div>
          )}

          {video.course && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Course</h3>
              <p className="text-gray-600">{video.course.title}</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
