export interface ProgressResponse {
  id: string;
  studentId: string;
  videoId: string;
  watchPercentage: number;
  lastPosition: number; // Position in seconds where student left off
  completed: boolean;
  lastWatchedAt: string;
  video?: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    duration: number | null;
    courseId: string | null;
  };
}

export interface UpdateProgressRequest {
  videoId: string;
  watchPercentage: number;
  lastPosition?: number; // Current position in seconds (optional for markCompleted)
}

export interface ListProgressQuery {
  courseId?: string;
  completed?: boolean;
}

export interface VideoProgressSummary {
  totalVideos: number;
  completedVideos: number;
  inProgressVideos: number;
  totalWatchTimeSeconds: number;
  averageProgress: number;
}

export interface CourseProgressResponse {
  courseId: string;
  courseTitle: string;
  totalVideos: number;
  completedVideos: number;
  progressPercentage: number;
  videos: {
    videoId: string;
    title: string;
    thumbnailUrl: string | null;
    duration: number | null;
    watchPercentage: number;
    lastPosition: number;
    completed: boolean;
    lastWatchedAt: string | null;
  }[];
}
