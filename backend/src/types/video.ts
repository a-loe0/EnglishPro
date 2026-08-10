export interface VideoUploadRequest {
  title: string;
  description?: string;
  courseId?: string;
}

export interface VideoResponse {
  id: string;
  teacherId: string;
  courseId: string | null;
  title: string;
  description: string | null;
  videoUrl: string;
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  views: number;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  teacher?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  course?: {
    id: string;
    title: string;
  };
}

export interface TranscodeJobData {
  videoId: string;
  inputPath: string;
  outputDir: string;
  resolutions: Resolution[];
}

export interface ThumbnailJobData {
  videoId: string;
  inputPath: string;
  outputPath: string;
  timestamp?: number;
}

export interface Resolution {
  name: string;
  width: number;
  height: number;
  bitrate: string;
}

export interface TranscodeProgress {
  videoId: string;
  progress: number;
  currentResolution: string;
  status: 'processing' | 'completed' | 'failed';
}

export interface HLSManifest {
  masterPlaylist: string;
  variants: {
    resolution: string;
    bandwidth: number;
    playlist: string;
  }[];
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
  audioCodec: string;
  audioSampleRate: number;
}

export interface ListVideosQuery {
  page?: number;
  limit?: number;
  courseId?: string;
  teacherId?: string;
  status?: 'PROCESSING' | 'READY' | 'FAILED';
  isPublished?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'title' | 'duration';
  sortOrder?: 'asc' | 'desc';
  // Internal: used by controller to filter based on user role
  _userRole?: 'TEACHER' | 'STUDENT';
  _userId?: string;
}

export interface PaginatedVideosResponse {
  data: VideoResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UploadResponse {
  tempId: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface CreateVideoRequest {
  tempId: string;
  title: string;
  description?: string;
  courseId?: string;
}

export interface JobStatus {
  id: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

// Resolution presets
export const RESOLUTION_PRESETS: Resolution[] = [
  { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' },
  { name: '720p', width: 1280, height: 720, bitrate: '2500k' },
  { name: '480p', width: 854, height: 480, bitrate: '1000k' },
  { name: '360p', width: 640, height: 360, bitrate: '600k' },
];
