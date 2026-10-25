import api from './api';

export interface TeacherDashboardStats {
  totalCourses: number;
  totalVideos: number;
  totalStudents: number;
  totalViews: number;
  totalWatchTime: number;
  pendingRecordings: number;
}

export interface ActivityItem {
  id: string;
  type: 'video_watch' | 'video_completed';
  message: string;
  timestamp: string;
  studentName: string;
  studentAvatarUrl: string | null;
  metadata?: {
    videoTitle?: string;
    courseName?: string;
  };
}

export interface TeacherDashboard {
  stats: TeacherDashboardStats;
  recentActivity: ActivityItem[];
  topVideos: {
    id: string;
    title: string;
    views: number;
    thumbnailUrl: string | null;
  }[];
}

export interface StudentDashboardStats {
  totalWatchTime: number;
  completedVideos: number;
  totalVideos: number;
  streak: number;
}

export interface StudentDashboard {
  stats: StudentDashboardStats;
  continueWatching: {
    videoId: string;
    title: string;
    thumbnailUrl: string | null;
    progress: number;
    lastWatchedAt: string;
  }[];
  courseProgress: {
    courseId: string;
    title: string;
    completedVideos: number;
    totalVideos: number;
    percentage: number;
  }[];
}

// Students who watched the teacher's lessons or sent her recordings. Visitors
// who never gave a name are only counted.
export interface TeacherStudent {
  id: string;
  name: string;
  lessonsWatched: number;
  lessonsCompleted: number;
  recordings: number;
  lastActive: string;
}

export interface TeacherStudents {
  students: TeacherStudent[];
  guestCount: number;
}

export const dashboardService = {
  async getTeacherDashboard(): Promise<TeacherDashboard> {
    const response = await api.get('/dashboard/teacher');
    return response.data;
  },

  async getTeacherStudents(): Promise<TeacherStudents> {
    const response = await api.get('/dashboard/teacher/students');
    return response.data;
  },

  async getStudentDashboard(): Promise<StudentDashboard> {
    const response = await api.get('/dashboard/student');
    return response.data;
  },
};

export default dashboardService;
