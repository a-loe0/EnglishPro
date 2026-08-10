import { useEffect, useState } from 'react';
import { Spinner } from '../common';
import { videoService } from '../../services/videos';
import type { VideoStatus } from '../../services/videos';

interface TranscodeProgressProps {
  videoId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function TranscodeProgress({ videoId, onComplete, onError }: TranscodeProgressProps) {
  const [status, setStatus] = useState<VideoStatus | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!polling) return;

    const fetchStatus = async () => {
      try {
        const data = await videoService.getStatus(videoId);
        setStatus(data);

        if (data.videoStatus === 'READY') {
          setPolling(false);
          onComplete?.();
        } else if (data.videoStatus === 'FAILED') {
          setPolling(false);
          onError?.('Video processing failed');
        }
      } catch (err) {
        console.error('Failed to fetch status:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    return () => clearInterval(interval);
  }, [videoId, polling, onComplete, onError]);

  if (!status) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <Spinner size="sm" />
        <span className="text-sm text-gray-600">Checking status...</span>
      </div>
    );
  }

  const { videoStatus, job } = status;
  const progress = job?.progress || 0;

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {videoStatus === 'PROCESSING' && <Spinner size="sm" />}
          {videoStatus === 'READY' && <CheckIcon className="w-5 h-5 text-green-500" />}
          {videoStatus === 'FAILED' && <XIcon className="w-5 h-5 text-red-500" />}
          <span className="text-sm font-medium text-gray-900">
            {videoStatus === 'PROCESSING' && 'Processing video...'}
            {videoStatus === 'READY' && 'Video ready!'}
            {videoStatus === 'FAILED' && 'Processing failed'}
          </span>
        </div>
        {videoStatus === 'PROCESSING' && (
          <span className="text-sm text-gray-500">{progress}%</span>
        )}
      </div>

      {videoStatus === 'PROCESSING' && (
        <>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FilmIcon className="w-4 h-4" />
            <span>
              Transcoding to multiple resolutions (1080p, 720p, 480p, 360p)
            </span>
          </div>
        </>
      )}

      {videoStatus === 'READY' && (
        <p className="text-sm text-gray-600">
          Your video is now available in multiple quality options.
        </p>
      )}

      {videoStatus === 'FAILED' && job?.error && (
        <p className="text-sm text-red-600">{job.error}</p>
      )}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function FilmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
    </svg>
  );
}

export default TranscodeProgress;
