import api from './api';

export interface Course {
  id: string;
  teacherId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  teacher?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  videoCount?: number;
}

export interface CourseWithVideos extends Course {
  videos: {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    duration: number | null;
    status: 'PROCESSING' | 'READY' | 'FAILED';
    createdAt: string;
  }[];
}

export interface CreateCourseData {
  title: string;
  description?: string;
}

export interface ListCoursesParams {
  page?: number;
  limit?: number;
  teacherId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedCourses {
  data: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const courseService = {
  async list(params?: ListCoursesParams): Promise<PaginatedCourses> {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  async getMyCourses(): Promise<Course[]> {
    const response = await api.get('/courses/my');
    return response.data;
  },

  async getById(id: string, includeVideos = false): Promise<Course | CourseWithVideos> {
    const response = await api.get(`/courses/${id}`, {
      params: { includeVideos },
    });
    return response.data;
  },

  async create(data: CreateCourseData): Promise<Course> {
    const response = await api.post('/courses', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateCourseData>): Promise<Course> {
    const response = await api.patch(`/courses/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/courses/${id}`);
  },
};

export default courseService;
