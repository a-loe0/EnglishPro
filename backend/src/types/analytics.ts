export interface TeacherAnalytics {
  overview: {
    totalStudents: number;
    totalVideos: number;
    totalCourses: number;
    totalWatchTime: number; // minutes
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
    totalWatchTime: number; // minutes
    completedVideos: number;
    totalVideos: number;
    streak: number; // days
  };
  weeklyProgress: WeeklyProgressPoint[];
  courseProgress: CourseProgressItem[];
}

export interface WeeklyProgressPoint {
  date: string;
  watchTime: number; // minutes
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
  averageWatchTime: number; // seconds
  completionRate: number; // percentage
  dropoffPoints: DropoffPoint[];
}

export interface DropoffPoint {
  timestamp: number; // seconds
  dropoffRate: number; // percentage
}

export interface CourseAnalytics {
  courseId: string;
  title: string;
  totalVideos: number;
  totalStudents: number;
  averageCompletionRate: number;
  videoPerformance: VideoPerformanceItem[];
}

export interface VideoPerformanceItem {
  videoId: string;
  title: string;
  order: number;
  views: number;
  completionRate: number;
}
