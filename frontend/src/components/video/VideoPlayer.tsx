import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { progressService } from '../../services/progress';
import api, { getFullUrl } from '../../services/api';

interface VideoPlayerProps {
  videoId: string;
  hlsUrl: string;
  title?: string;
  thumbnailUrl?: string | null;
  initialProgress?: number;
  initialPosition?: number; // Position in seconds to resume from
  onProgress?: (percentage: number, position: number) => void;
  onComplete?: () => void;
  autoPlay?: boolean;
}

interface QualityLevel {
  index: number;
  height: number;
  bitrate: number;
  label: string;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const PROGRESS_UPDATE_INTERVAL = 5000; // 5 seconds (more frequent saves)
const PROGRESS_STORAGE_KEY = 'video_progress_backup';

export function VideoPlayer({
  videoId,
  hlsUrl,
  title,
  thumbnailUrl,
  initialProgress = 0,
  initialPosition = 0,
  onProgress,
  onComplete,
  autoPlay = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedProgressRef = useRef(initialProgress);
  const lastSavedPositionRef = useRef(initialPosition);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = auto
  const [showSettings, setShowSettings] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const initHls = () => {
      if (Hls.isSupported()) {
        const token = localStorage.getItem('accessToken');
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          xhrSetup: (xhr) => {
            if (token) {
              xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
          },
        });

        // Construct full URL - hlsUrl is like /api/videos/.../stream/master.m3u8
        // We need to use the backend base URL (without /api suffix)
        const baseUrl = api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:8000';
        const fullHlsUrl = hlsUrl.startsWith('http') ? hlsUrl : `${baseUrl}${hlsUrl}`;

        hls.loadSource(fullHlsUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          setIsLoading(false);

          // Extract quality levels
          const levels: QualityLevel[] = data.levels.map((level, index) => ({
            index,
            height: level.height,
            bitrate: level.bitrate,
            label: `${level.height}p`,
          }));

          setQualityLevels([
            { index: -1, height: 0, bitrate: 0, label: 'Auto' },
            ...levels.sort((a, b) => b.height - a.height),
          ]);

          // Resume from last position (prefer exact position over percentage)
          if (initialPosition > 0) {
            video.currentTime = initialPosition;
          } else if (initialProgress > 0 && video.duration) {
            video.currentTime = (initialProgress / 100) * video.duration;
          }

          if (autoPlay) {
            video.play().catch(console.error);
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, () => {
          if (currentQuality === -1) {
            // Auto mode - update display
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS - need full URL with token for auth
        const token = localStorage.getItem('accessToken');
        const baseUrl = api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:8000';
        const fullHlsUrl = hlsUrl.startsWith('http') ? hlsUrl : `${baseUrl}${hlsUrl}`;
        video.src = token ? `${fullHlsUrl}?token=${token}` : fullHlsUrl;
        setIsLoading(false);
      }
    };

    initHls();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl, initialProgress, initialPosition, autoPlay]);

  // Save progress to localStorage as backup (synchronous, survives navigation)
  const saveProgressToStorage = useCallback((percentage: number, position: number) => {
    try {
      const backup = {
        videoId,
        watchPercentage: percentage,
        lastPosition: position,
        timestamp: Date.now(),
      };
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(backup));
    } catch (e) {
      // localStorage might be full or disabled
    }
  }, [videoId]);

  // Sync any pending progress from localStorage on mount
  useEffect(() => {
    const syncPendingProgress = async () => {
      try {
        const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
        if (!stored) return;

        const backup = JSON.parse(stored);
        // Only sync if it's recent (within last hour) and for a video
        if (backup.timestamp && Date.now() - backup.timestamp < 3600000) {
          await progressService.updateProgress({
            videoId: backup.videoId,
            watchPercentage: backup.watchPercentage,
            lastPosition: backup.lastPosition,
          });
        }
        localStorage.removeItem(PROGRESS_STORAGE_KEY);
      } catch (e) {
        // Ignore errors, just clear the storage
        localStorage.removeItem(PROGRESS_STORAGE_KEY);
      }
    };

    syncPendingProgress();
  }, []);

  // Save progress function - defined outside useEffect so it can be called from multiple places
  const saveProgress = useCallback(async (force: boolean = false) => {
    const video = videoRef.current;
    if (!video || !video.duration || video.duration === 0) return;

    const percentage = Math.round((video.currentTime / video.duration) * 100);
    const position = Math.round(video.currentTime);

    // Only save if progress changed (or forced)
    const progressChanged = Math.abs(percentage - lastSavedProgressRef.current) >= 1;
    const positionChanged = Math.abs(position - lastSavedPositionRef.current) >= 5; // 5 seconds

    if (force || progressChanged || positionChanged) {
      // Always save to localStorage first (synchronous backup)
      saveProgressToStorage(percentage, position);

      try {
        await progressService.updateProgress({
          videoId,
          watchPercentage: percentage,
          lastPosition: position,
        });
        lastSavedProgressRef.current = percentage;
        lastSavedPositionRef.current = position;
        // Clear backup after successful server save
        localStorage.removeItem(PROGRESS_STORAGE_KEY);
        onProgress?.(percentage, position);

        if (percentage >= 90) {
          onComplete?.();
        }
      } catch (error) {
        console.error('Failed to save progress:', error);
        // Backup remains in localStorage for next sync
      }
    }
  }, [videoId, onProgress, onComplete, saveProgressToStorage]);

  // Progress tracking - save periodically while playing
  useEffect(() => {
    progressIntervalRef.current = setInterval(() => saveProgress(false), PROGRESS_UPDATE_INTERVAL);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [saveProgress]);

  // Save progress when video pauses or when leaving the page
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePause = () => {
      // Save progress immediately when paused
      saveProgress(true);
    };

    // Save when page visibility changes (user switches tabs or navigates)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveProgress(true);
      }
    };

    // Save before page unload (closing tab, refreshing, navigating away)
    const handlePageHide = () => {
      saveProgress(true);
    };

    video.addEventListener('pause', handlePause);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      video.removeEventListener('pause', handlePause);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      // Save progress when component unmounts
      saveProgress(true);
    };
  }, [saveProgress]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    const container = videoRef.current?.parentElement;
    container?.addEventListener('mousemove', handleMouseMove);

    return () => {
      container?.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    video.currentTime = percentage * video.duration;

    // Save progress after seeking
    setTimeout(() => saveProgress(true), 500);
  }, [saveProgress]);

  const handleQualityChange = useCallback((index: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
      setCurrentQuality(index);
    }
    setShowSettings(false);
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSettings(false);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden group aspect-video">
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        poster={getFullUrl(thumbnailUrl) || undefined}
        playsInline
        onClick={togglePlay}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Play button overlay */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity group-hover:opacity-100"
        >
          <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center">
            <PlayIcon className="w-10 h-10 text-gray-900 ml-1" />
          </div>
        </button>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div
          className="relative h-1 bg-white/30 rounded-full mb-3 cursor-pointer group/progress"
          onClick={handleSeek}
        >
          <div
            className="absolute h-full bg-white/50 rounded-full"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div
            className="absolute h-full bg-primary rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPercent}% - 6px)` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
              {isPlaying ? (
                <PauseIcon className="w-6 h-6" />
              ) : (
                <PlayIcon className="w-6 h-6" />
              )}
            </button>

            {/* Skip buttons */}
            <button
              onClick={() => {
                const video = videoRef.current;
                if (video) video.currentTime -= 10;
              }}
              className="text-white hover:text-primary transition-colors"
            >
              <SkipBackIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const video = videoRef.current;
                if (video) video.currentTime += 10;
              }}
              className="text-white hover:text-primary transition-colors"
            >
              <SkipForwardIcon className="w-5 h-5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                {isMuted || volume === 0 ? (
                  <VolumeOffIcon className="w-5 h-5" />
                ) : (
                  <VolumeIcon className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const video = videoRef.current;
                  if (video) {
                    video.volume = parseFloat(e.target.value);
                    video.muted = false;
                  }
                }}
                className="w-20 accent-primary"
              />
            </div>

            {/* Time */}
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:text-primary transition-colors"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>

              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 rounded-lg p-3 min-w-48">
                  {/* Quality */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-2">Quality</p>
                    <div className="space-y-1">
                      {qualityLevels.map((level) => (
                        <button
                          key={level.index}
                          onClick={() => handleQualityChange(level.index)}
                          className={`block w-full text-left px-2 py-1 rounded text-sm ${
                            currentQuality === level.index
                              ? 'bg-primary text-white'
                              : 'text-white hover:bg-white/10'
                          }`}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Speed */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Speed</p>
                    <div className="flex flex-wrap gap-1">
                      {PLAYBACK_SPEEDS.map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`px-2 py-1 rounded text-sm ${
                            playbackSpeed === speed
                              ? 'bg-primary text-white'
                              : 'text-white hover:bg-white/10'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-primary transition-colors"
            >
              {isFullscreen ? (
                <MinimizeIcon className="w-5 h-5" />
              ) : (
                <MaximizeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Title overlay */}
      {title && showControls && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4">
          <h3 className="text-white font-medium truncate">{title}</h3>
        </div>
      )}
    </div>
  );
}

// Icon components
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

function SkipBackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
    </svg>
  );
}

function SkipForwardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
    </svg>
  );
}

function VolumeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
}

function VolumeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function MaximizeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  );
}

function MinimizeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
    </svg>
  );
}

export default VideoPlayer;
