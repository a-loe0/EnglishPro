import { PrismaClient } from '@prisma/client';
import type {
  TeacherAnalytics,
  StudentAnalytics,
  VideoAnalytics,
  CourseAnalytics,
  TrendDataPoint,
  TopVideo,
  StudentProgressItem,
  WeeklyProgressPoint,
  CourseProgressItem,
  VideoPerformanceItem,
} from '../types/analytics';

const prisma = new PrismaClient();

class AnalyticsService {
  async getTeacherAnalytics(teacherId: string): Promise<TeacherAnalytics> {
    // Get teacher's videos
    const videos = await prisma.video.findMany({
      where: { teacherId },
      select: { id: true, title: true, courseId: true, views: true },
    });

    const videoIds = videos.map((v) => v.id);

    // Get overview stats
    const [totalCourses, allProgress] = await Promise.all([
      prisma.course.count({ where: { teacherId } }),
      prisma.progress.findMany({
        where: { videoId: { in: videoIds } },
        include: { student: { select: { id: true, name: true, avatarUrl: true } } },
      }),
    ]);

    // Calculate unique students
    const uniqueStudentIds = new Set(allProgress.map((p) => p.studentId));
    const totalStudents = uniqueStudentIds.size;

    // Calculate total watch time (estimated from progress percentage and video duration)
    const videosWithDuration = await prisma.video.findMany({
      where: { id: { in: videoIds } },
      select: { id: true, duration: true },
    });
    const durationMap = new Map(videosWithDuration.map((v) => [v.id, v.duration || 0]));

    let totalWatchTimeSeconds = 0;
    allProgress.forEach((p) => {
      const duration = durationMap.get(p.videoId) || 0;
      totalWatchTimeSeconds += (duration * p.watchPercentage) / 100;
    });

    // Get total views
    const totalViews = videos.reduce((sum, v) => sum + v.views, 0);

    // Get trends (last 30 days)
    const trends = await this.getTeacherTrends(videoIds, 30);

    // Get top videos
    const topVideos = await this.getTopVideos(videoIds, 5);

    // Get student progress
    const studentProgress = await this.getStudentProgressForTeacher(videoIds);

    return {
      overview: {
        totalStudents,
        totalVideos: videos.length,
        totalCourses,
        totalWatchTime: Math.round(totalWatchTimeSeconds / 60),
        totalViews,
      },
      trends,
      topVideos,
      studentProgress,
    };
  }

  async getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
    // Get all progress records
    const progress = await prisma.progress.findMany({
      where: { studentId },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            duration: true,
            courseId: true,
            course: { select: { id: true, title: true } },
          },
        },
      },
    });

    // Calculate total videos available (all published videos)
    const totalAvailableVideos = await prisma.video.count({
      where: { status: 'READY', isPublished: true },
    });

    // Calculate stats
    const completedVideos = progress.filter((p) => p.completed).length;

    let totalWatchTimeSeconds = 0;
    progress.forEach((p) => {
      const duration = p.video.duration || 0;
      totalWatchTimeSeconds += (duration * p.watchPercentage) / 100;
    });

    // Calculate streak (consecutive days with activity)
    const streak = await this.calculateStreak(studentId);

    // Get weekly progress
    const weeklyProgress = await this.getWeeklyProgress(studentId, 7);

    // Calculate course progress
    const courseProgress = await this.getCourseProgress(studentId);

    return {
      overview: {
        totalWatchTime: Math.round(totalWatchTimeSeconds / 60),
        completedVideos,
        totalVideos: totalAvailableVideos,
        streak,
      },
      weeklyProgress,
      courseProgress,
    };
  }

  async getVideoAnalytics(videoId: string): Promise<VideoAnalytics> {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, title: true, duration: true, views: true },
    });

    if (!video) {
      throw new Error('Video not found');
    }

    const allProgress = await prisma.progress.findMany({ where: { videoId } });

    const uniqueViewers = new Set(allProgress.map((p) => p.studentId)).size;
    const completedCount = allProgress.filter((p) => p.completed).length;
    const completionRate = allProgress.length > 0 ? (completedCount / allProgress.length) * 100 : 0;

    // Calculate average watch time
    let totalWatchTime = 0;
    allProgress.forEach((p) => {
      totalWatchTime += ((video.duration || 0) * p.watchPercentage) / 100;
    });
    const averageWatchTime = allProgress.length > 0 ? totalWatchTime / allProgress.length : 0;

    // Generate simulated dropoff points based on watch percentages
    const dropoffPoints = this.calculateDropoffPoints(allProgress.map((p) => p.watchPercentage));

    return {
      videoId: video.id,
      title: video.title,
      views: video.views,
      uniqueViewers,
      averageWatchTime: Math.round(averageWatchTime),
      completionRate: Math.round(completionRate * 10) / 10,
      dropoffPoints,
    };
  }

  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        videos: {
          where: { status: 'READY' },
          orderBy: { createdAt: 'asc' },
          select: { id: true, title: true, duration: true, views: true },
        },
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const videoIds = course.videos.map((v) => v.id);

    // Get all progress for course videos
    const allProgress = await prisma.progress.findMany({
      where: { videoId: { in: videoIds } },
    });

    // Calculate unique students
    const uniqueStudentIds = new Set(allProgress.map((p) => p.studentId));
    const totalStudents = uniqueStudentIds.size;

    // Calculate average completion rate
    const completedCount = allProgress.filter((p) => p.completed).length;
    const averageCompletionRate =
      allProgress.length > 0 ? (completedCount / allProgress.length) * 100 : 0;

    // Calculate per-video performance
    const videoPerformance: VideoPerformanceItem[] = course.videos.map((video, index) => {
      const videoProgress = allProgress.filter((p) => p.videoId === video.id);

      const completed = videoProgress.filter((p) => p.completed).length;
      const completionRate = videoProgress.length > 0 ? (completed / videoProgress.length) * 100 : 0;

      return {
        videoId: video.id,
        title: video.title,
        order: index + 1,
        views: video.views,
        completionRate: Math.round(completionRate * 10) / 10,
      };
    });

    return {
      courseId: course.id,
      title: course.title,
      totalVideos: course.videos.length,
      totalStudents,
      averageCompletionRate: Math.round(averageCompletionRate * 10) / 10,
      videoPerformance,
    };
  }

  // Helper methods

  private async getTeacherTrends(videoIds: string[], days: number): Promise<TrendDataPoint[]> {
    const trends: TrendDataPoint[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const views = await prisma.progress.count({
        where: {
          videoId: { in: videoIds },
          lastWatchedAt: { gte: date, lt: nextDate },
        },
      });

      trends.push({
        date: date.toISOString().split('T')[0],
        views,
      });
    }

    return trends;
  }

  private async getTopVideos(videoIds: string[], limit: number): Promise<TopVideo[]> {
    const videos = await prisma.video.findMany({
      where: { id: { in: videoIds } },
      select: { id: true, title: true, views: true },
    });

    const videoStats = await Promise.all(
      videos.map(async (video) => {
        const progress = await prisma.progress.findMany({
          where: { videoId: video.id },
        });

        const completed = progress.filter((p) => p.completed).length;
        const completionRate = progress.length > 0 ? (completed / progress.length) * 100 : 0;

        return {
          videoId: video.id,
          title: video.title,
          views: video.views,
          completionRate: Math.round(completionRate * 10) / 10,
        };
      })
    );

    return videoStats.sort((a, b) => b.views - a.views).slice(0, limit);
  }

  private async getStudentProgressForTeacher(videoIds: string[]): Promise<StudentProgressItem[]> {
    const progress = await prisma.progress.findMany({
      where: { videoId: { in: videoIds } },
      include: {
        student: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Group by student
    const studentMap = new Map<string, {
      student: { id: string; name: string; avatarUrl: string | null };
      completed: number;
    }>();

    progress.forEach((p) => {
      const existing = studentMap.get(p.studentId);
      if (existing) {
        if (p.completed) existing.completed++;
      } else {
        studentMap.set(p.studentId, {
          student: p.student,
          completed: p.completed ? 1 : 0,
        });
      }
    });

    const result: StudentProgressItem[] = [];
    studentMap.forEach((data, studentId) => {
      result.push({
        studentId,
        name: data.student.name,
        avatarUrl: data.student.avatarUrl,
        completedVideos: data.completed,
        totalVideos: videoIds.length,
      });
    });

    return result.sort((a, b) => b.completedVideos - a.completedVideos).slice(0, 10);
  }

  private async calculateStreak(studentId: string): Promise<number> {
    const progress = await prisma.progress.findMany({
      where: { studentId },
      orderBy: { lastWatchedAt: 'desc' },
      select: { lastWatchedAt: true },
    });

    if (progress.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const watchDates = new Set(
      progress.map((p) => {
        const date = new Date(p.lastWatchedAt);
        date.setHours(0, 0, 0, 0);
        return date.toISOString().split('T')[0];
      })
    );

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      if (watchDates.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  }

  private async getWeeklyProgress(studentId: string, weeks: number): Promise<WeeklyProgressPoint[]> {
    const result: WeeklyProgressPoint[] = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const progress = await prisma.progress.findMany({
        where: {
          studentId,
          lastWatchedAt: { gte: weekStart, lt: weekEnd },
        },
        include: { video: { select: { duration: true } } },
      });

      let watchTime = 0;
      let videosCompleted = 0;

      progress.forEach((p) => {
        watchTime += ((p.video.duration || 0) * p.watchPercentage) / 100;
        if (p.completed) videosCompleted++;
      });

      result.push({
        date: weekStart.toISOString().split('T')[0],
        watchTime: Math.round(watchTime / 60),
        videosCompleted,
      });
    }

    return result;
  }

  private async getCourseProgress(studentId: string): Promise<CourseProgressItem[]> {
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      include: {
        videos: {
          where: { status: 'READY' },
          select: { id: true },
        },
      },
    });

    const progress = await prisma.progress.findMany({
      where: { studentId },
      select: { videoId: true, completed: true },
    });

    const progressMap = new Map(progress.map((p) => [p.videoId, p.completed]));

    return courses
      .filter((c) => c.videos.length > 0)
      .map((course) => {
        const totalVideos = course.videos.length;
        const completedVideos = course.videos.filter(
          (v) => progressMap.get(v.id) === true
        ).length;
        const percentage = (completedVideos / totalVideos) * 100;

        return {
          courseId: course.id,
          title: course.title,
          completedVideos,
          totalVideos,
          percentage: Math.round(percentage * 10) / 10,
        };
      })
      .filter((c) => c.completedVideos > 0 || c.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage);
  }

  private calculateDropoffPoints(watchPercentages: number[]): { timestamp: number; dropoffRate: number }[] {
    if (watchPercentages.length === 0) return [];

    const points = [25, 50, 75, 100];
    return points.map((point) => {
      const viewersAtPoint = watchPercentages.filter((p) => p >= point).length;
      const dropoffRate = ((watchPercentages.length - viewersAtPoint) / watchPercentages.length) * 100;

      return {
        timestamp: point,
        dropoffRate: Math.round(dropoffRate * 10) / 10,
      };
    });
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
