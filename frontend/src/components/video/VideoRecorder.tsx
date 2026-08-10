import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../common';

interface VideoRecorderProps {
  maxDuration?: number; // seconds, default 5 minutes
  onRecordingComplete: (blob: Blob) => void;
  onError?: (error: string) => void;
}

type RecordingState = 'idle' | 'requesting' | 'ready' | 'recording' | 'paused' | 'stopped';

const DEFAULT_MAX_DURATION = 5 * 60; // 5 minutes

export function VideoRecorder({
  maxDuration = DEFAULT_MAX_DURATION,
  onRecordingComplete,
  onError,
}: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [devices, setDevices] = useState<{
    videoDevices: MediaDeviceInfo[];
    audioDevices: MediaDeviceInfo[];
  }>({ videoDevices: [], audioDevices: [] });
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [selectedAudio, setSelectedAudio] = useState<string>('');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Load available devices
  useEffect(() => {
    async function loadDevices() {
      try {
        // Request permission first to get device labels
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter((d) => d.kind === 'videoinput');
        const audioDevices = deviceList.filter((d) => d.kind === 'audioinput');

        setDevices({ videoDevices, audioDevices });

        if (videoDevices.length > 0) setSelectedVideo(videoDevices[0].deviceId);
        if (audioDevices.length > 0) setSelectedAudio(audioDevices[0].deviceId);
      } catch (error) {
        onError?.('Failed to access camera/microphone. Please grant permissions.');
      }
    }

    loadDevices();
  }, [onError]);

  // Start preview
  const startPreview = useCallback(async () => {
    try {
      setState('requesting');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedVideo
          ? { deviceId: { exact: selectedVideo } }
          : true,
        audio: selectedAudio
          ? { deviceId: { exact: selectedAudio } }
          : true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      streamRef.current = stream;
      setState('ready');
    } catch (error) {
      onError?.('Failed to start camera preview');
      setState('idle');
    }
  }, [selectedVideo, selectedAudio, onError]);

  // Stop preview
  const stopPreview = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType,
      videoBitsPerSecond: 2500000, // 2.5 Mbps
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setState('stopped');
    };

    mediaRecorder.start(1000); // Collect data every second
    mediaRecorderRef.current = mediaRecorder;
    setState('recording');
    setDuration(0);

    // Start duration timer
    timerRef.current = setInterval(() => {
      setDuration((d) => {
        const newDuration = d + 1;
        if (newDuration >= maxDuration) {
          stopRecording();
        }
        return newDuration;
      });
    }, 1000);
  }, [maxDuration]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState('recording');

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          const newDuration = d + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    }
  }, [maxDuration]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    stopPreview();
  }, [stopPreview]);

  // Reset recording
  const resetRecording = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setRecordedBlob(null);
    setPreviewUrl(null);
    setDuration(0);
    setState('idle');
    chunksRef.current = [];
  }, [previewUrl]);

  // Submit recording
  const submitRecording = useCallback(() => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob);
    }
  }, [recordedBlob, onRecordingComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPreview();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [stopPreview, previewUrl]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (duration / maxDuration) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Video preview/playback */}
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
        {state === 'stopped' && previewUrl ? (
          <video
            src={previewUrl}
            className="w-full h-full object-contain"
            controls
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            muted
          />
        )}

        {/* Recording indicator */}
        {(state === 'recording' || state === 'paused') && (
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${state === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} />
            <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
              {formatDuration(duration)} / {formatDuration(maxDuration)}
            </span>
          </div>
        )}

        {/* Progress bar during recording */}
        {(state === 'recording' || state === 'paused') && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-red-500 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Idle state overlay */}
        {state === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <CameraIcon className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-400 text-center">
              Select your camera and microphone, then click "Start Preview"
            </p>
          </div>
        )}
      </div>

      {/* Device selection */}
      {(state === 'idle' || state === 'ready') && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Camera
            </label>
            <select
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              disabled={state !== 'idle'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-100"
            >
              {devices.videoDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Microphone
            </label>
            <select
              value={selectedAudio}
              onChange={(e) => setSelectedAudio(e.target.value)}
              disabled={state !== 'idle'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-100"
            >
              {devices.audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {state === 'idle' && (
          <Button variant="gradient" onClick={startPreview}>
            <CameraIcon className="w-5 h-5 mr-2" />
            Start Preview
          </Button>
        )}

        {state === 'requesting' && (
          <Button variant="secondary" disabled>
            <div className="w-5 h-5 mr-2 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
            Requesting Access...
          </Button>
        )}

        {state === 'ready' && (
          <>
            <Button variant="ghost" onClick={() => { stopPreview(); setState('idle'); }}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={startRecording}>
              <RecordIcon className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
          </>
        )}

        {state === 'recording' && (
          <>
            <Button variant="secondary" onClick={pauseRecording}>
              <PauseIcon className="w-5 h-5 mr-2" />
              Pause
            </Button>
            <Button variant="danger" onClick={stopRecording}>
              <StopIcon className="w-5 h-5 mr-2" />
              Stop
            </Button>
          </>
        )}

        {state === 'paused' && (
          <>
            <Button variant="secondary" onClick={resumeRecording}>
              <PlayIcon className="w-5 h-5 mr-2" />
              Resume
            </Button>
            <Button variant="danger" onClick={stopRecording}>
              <StopIcon className="w-5 h-5 mr-2" />
              Stop
            </Button>
          </>
        )}

        {state === 'stopped' && (
          <>
            <Button variant="ghost" onClick={resetRecording}>
              <RefreshIcon className="w-5 h-5 mr-2" />
              Re-record
            </Button>
            <Button variant="gradient" onClick={submitRecording}>
              <CheckIcon className="w-5 h-5 mr-2" />
              Use This Recording
            </Button>
          </>
        )}
      </div>

      {/* Recording info */}
      <p className="text-center text-sm text-gray-500 mt-4">
        Maximum recording time: {formatDuration(maxDuration)}
      </p>
    </div>
  );
}

// Icon components
function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function RecordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" />
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

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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

export default VideoRecorder;
