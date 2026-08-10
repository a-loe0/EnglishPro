export interface CourseResponse {
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
  studentCount?: number;
}

export interface CreateCourseRequest {
  title: string;
  description?: string;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
}

export interface ListCoursesQuery {
  page?: number;
  limit?: number;
  teacherId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  // Internal: used by controller to filter based on user role
  _userRole?: 'TEACHER' | 'STUDENT';
  _userId?: string;
}

export interface PaginatedCoursesResponse {
  data: CourseResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
