import api from './api';

export interface TeacherAnalytics {
  overview: {
    totalStudents: number;
    totalVideos: number;
    totalCourses: number;
    totalWatchTime: number;
    totalViews: number;
  };
  trends: TrendDataPoint[];
  topVideos: TopVideo[];
  studentProgress: StudentProgressItem[];
}

export interface TrendDataPoint {
  date: string;
  views: number;
}

export interface TopVideo {
  videoId: string;
  title: string;
  views: number;
  completionRate: number;
}

export interface StudentProgressItem {
  studentId: string;
  name: string;
  avatarUrl: string | null;
  completedVideos: number;
  totalVideos: number;
}

export interface StudentAnalytics {
  overview: {
    totalWatchTime: number;
    completedVideos: number;
    totalVideos: number;
    streak: number;
  };
  weeklyProgress: WeeklyProgressPoint[];
  courseProgress: CourseProgressItem[];
}

export interface WeeklyProgressPoint {
  date: string;
  watchTime: number;
  videosCompleted: number;
}

export interface CourseProgressItem {
  courseId: string;
  title: string;
  completedVideos: number;
  totalVideos: number;
  percentage: number;
}

export interface VideoAnalytics {
  videoId: string;
  title: string;
  views: number;
  uniqueViewers: number;
  averageWatchTime: number;
  completionRate: number;
  dropoffPoints: { timestamp: number; dropoffRate: number }[];
}

export interface CourseAnalytics {
  courseId: string;
  title: string;
  totalVideos: number;
  totalStudents: number;
  averageCompletionRate: number;
  videoPerformance: {
    videoId: string;
    title: string;
    order: number;
    views: number;
    completionRate: number;
  }[];
}

export const analyticsService = {
  async getTeacherAnalytics(): Promise<TeacherAnalytics> {
    const response = await api.get('/analytics/teacher');
    return response.data;
  },

  async getStudentAnalytics(): Promise<StudentAnalytics> {
    const response = await api.get('/analytics/student');
    return response.data;
  },

  async getVideoAnalytics(videoId: string): Promise<VideoAnalytics> {
    const response = await api.get(`/analytics/video/${videoId}`);
    return response.data;
  },

  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    const response = await api.get(`/analytics/course/${courseId}`);
    return response.data;
  },
};

export default analyticsService;
