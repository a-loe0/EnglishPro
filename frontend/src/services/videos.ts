import api from './api';

export interface Video {
  id: string;
  teacherId: string;
  courseId: string | null;
  title: string;
  description: string | null;
  videoUrl: string;
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  views?: number;
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

export interface UploadResponse {
  tempId: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface CreateVideoData {
  tempId: string;
  title: string;
  description?: string;
  courseId?: string;
}

export interface ListVideosParams {
  page?: number;
  limit?: number;
  courseId?: string;
  teacherId?: string;
  status?: 'PROCESSING' | 'READY' | 'FAILED';
  isPublished?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'title' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedVideos {
  data: Video[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VideoStatus {
  videoId: string;
  videoStatus: 'PROCESSING' | 'READY' | 'FAILED';
  job: {
    id: string;
    status: 'waiting' | 'active' | 'completed' | 'failed';
    progress: number;
    error?: string;
  } | null;
}

export const videoService = {
  async list(params?: ListVideosParams): Promise<PaginatedVideos> {
    const response = await api.get('/videos', { params });
    return response.data;
  },

  async getById(id: string): Promise<Video> {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  },

  async upload(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('video', file);

    const response = await api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  async create(data: CreateVideoData): Promise<Video> {
    const response = await api.post('/videos', data);
    return response.data;
  },

  async update(id: string, data: Partial<Omit<CreateVideoData, 'tempId'>>): Promise<Video> {
    const response = await api.patch(`/videos/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/videos/${id}`);
  },

  async getStatus(id: string): Promise<VideoStatus> {
    const response = await api.get(`/videos/${id}/status`);
    return response.data;
  },

  async setPublished(id: string, isPublished: boolean): Promise<Video> {
    const response = await api.patch(`/videos/${id}/publish`, { isPublished });
    return response.data;
  },

  async publish(id: string): Promise<Video> {
    return this.setPublished(id, true);
  },

  async unpublish(id: string): Promise<Video> {
    return this.setPublished(id, false);
  },

  getStreamUrl(id: string): string {
    return `${api.defaults.baseURL}/videos/${id}/stream/master.m3u8`;
  },

  getThumbnailUrl(id: string): string {
    return `${api.defaults.baseURL}/videos/${id}/thumbnail`;
  },
};

export default videoService;
