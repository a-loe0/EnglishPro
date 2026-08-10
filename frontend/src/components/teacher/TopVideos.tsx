import { Link } from 'react-router-dom';
import { videoService } from '../../services/videos';

interface TopVideo {
  id: string;
  title: string;
  views: number;
  thumbnailUrl: string | null;
}

interface TopVideosProps {
  videos: TopVideo[];
}

export function TopVideos({ videos }: TopVideosProps) {
  if (videos.length === 0) {
    return (
      <div className="bg-white rounded-card p-6 shadow-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Videos</h3>
        <div className="text-center py-8 text-gray-500">
          <VideoIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No videos yet</p>
          <p className="text-sm text-gray-400">Upload your first video to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card p-6 shadow-card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Videos</h3>
      <div className="space-y-3">
        {videos.map((video, index) => (
          <Link
            key={video.id}
            to={`/teacher/videos/${video.id}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
              <span className={`text-lg font-bold ${
                index === 0 ? 'text-primary' :
                index === 1 ? 'text-accent' :
                'text-gray-400'
              }`}>
                #{index + 1}
              </span>
            </div>
            <div className="flex-shrink-0 w-16 h-10 bg-gray-100 rounded overflow-hidden">
              <img
                src={videoService.getThumbnailUrl(video.id)}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary transition-colors">
                {video.title}
              </p>
              <p className="text-xs text-gray-500">
                {video.views} {video.views === 1 ? 'view' : 'views'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

export default TopVideos;
