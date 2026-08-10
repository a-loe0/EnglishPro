import api from './api';

export interface Progress {
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

export interface ProgressSummary {
  totalVideos: number;
  completedVideos: number;
  inProgressVideos: number;
  totalWatchTimeSeconds: number;
  averageProgress: number;
}

export interface CourseProgress {
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

export interface UpdateProgressData {
  videoId: string;
  watchPercentage: number;
  lastPosition: number; // Current position in seconds
}

export const progressService = {
  async getAll(params?: { courseId?: string; completed?: boolean }): Promise<Progress[]> {
    const response = await api.get('/progress', { params });
    return response.data;
  },

  async getSummary(): Promise<ProgressSummary> {
    const response = await api.get('/progress/summary');
    return response.data;
  },

  async getContinueWatching(limit?: number): Promise<Progress[]> {
    const response = await api.get('/progress/continue', { params: { limit } });
    return response.data;
  },

  async getCoursesProgress(): Promise<CourseProgress[]> {
    const response = await api.get('/progress/courses');
    return response.data;
  },

  async getCourseProgress(courseId: string): Promise<CourseProgress> {
    const response = await api.get(`/progress/courses/${courseId}`);
    return response.data;
  },

  async getVideoProgress(videoId: string): Promise<Progress | { watchPercentage: number; lastPosition: number; completed: boolean }> {
    const response = await api.get(`/progress/videos/${videoId}`);
    return response.data;
  },

  async updateProgress(data: UpdateProgressData): Promise<Progress> {
    const response = await api.post('/progress', data);
    return response.data;
  },

  async markCompleted(videoId: string): Promise<Progress> {
    const response = await api.post(`/progress/videos/${videoId}/complete`);
    return response.data;
  },

  async markUncompleted(videoId: string): Promise<Progress> {
    const response = await api.post(`/progress/videos/${videoId}/uncomplete`);
    return response.data;
  },

  async resetProgress(videoId: string): Promise<void> {
    await api.delete(`/progress/videos/${videoId}`);
  },
};

export default progressService;
