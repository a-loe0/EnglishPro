import { useState, useRef, useCallback } from 'react';
import { Spinner } from '../common';
import { videoService } from '../../services/videos';

interface VideoUploaderProps {
  onUploadComplete: (tempId: string, file: File) => void;
  onError?: (error: string) => void;
}

const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_SIZE = 500 * 1024 * 1024; // 500MB

export function VideoUploader({ onUploadComplete, onError }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only MP4, WebM, and MOV allowed.';
    }
    if (file.size > MAX_SIZE) {
      return `File size exceeds ${MAX_SIZE / (1024 * 1024)}MB limit.`;
    }
    return null;
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      onError?.(validationError);
      return;
    }

    setFile(file);
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await videoService.upload(file, (progress) => {
        setUploadProgress(progress);
      });

      onUploadComplete(response.tempId, file);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      onError?.(message);
    } finally {
      setUploading(false);
    }
  }, [validateFile, onUploadComplete, onError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  }, [handleFile]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onClick={!uploading ? handleClick : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-gray-300 hover:border-primary hover:bg-gray-50'
          }
          ${uploading ? 'pointer-events-none' : 'cursor-pointer'}
        `}
      >
        {uploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto">
              <Spinner size="lg" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Uploading {file?.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatFileSize(file?.size || 0)}
              </p>
            </div>
            <div className="w-full max-w-xs mx-auto">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{uploadProgress}% complete</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <UploadIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragging ? 'Drop your video here' : 'Drag and drop your video'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or <span className="text-primary font-medium">browse files</span>
              </p>
            </div>
            <p className="text-xs text-gray-400">
              MP4, WebM, or MOV • Max {MAX_SIZE / (1024 * 1024)}MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

export default VideoUploader;
