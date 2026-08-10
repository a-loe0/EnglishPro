export interface TeacherDashboardStats {
  totalCourses: number;
  totalVideos: number;
  totalStudents: number;
  totalViews: number;
  totalWatchTime: number; // minutes
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

export interface TeacherDashboardResponse {
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
  totalWatchTime: number; // minutes
  completedVideos: number;
  totalVideos: number;
  streak: number; // days
}

export interface StudentDashboardResponse {
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
