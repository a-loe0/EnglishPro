import { PrismaClient } from '@prisma/client';
import {
  TeacherDashboardStats,
  TeacherDashboardResponse,
  StudentDashboardStats,
  StudentDashboardResponse,
  ActivityItem,
} from '../types/dashboard';

export class DashboardService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get teacher dashboard data
   */
  async getTeacherDashboard(teacherId: string): Promise<TeacherDashboardResponse> {
    // Get stats in parallel
    const [
      totalCourses,
      totalVideos,
      totalViews,
      recentProgress,
      topVideos,
    ] = await Promise.all([
      // Total courses
      this.prisma.course.count({ where: { teacherId } }),

      // Total videos
      this.prisma.video.count({ where: { teacherId } }),

      // Total views (sum of all video views)
      this.prisma.video.aggregate({
        where: { teacherId },
        _sum: { views: true },
      }),

      // Recent activity (recent progress updates)
      this.prisma.progress.findMany({
        where: {
          video: { teacherId },
        },
        take: 10,
        orderBy: { lastWatchedAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          video: {
            select: {
              title: true,
            },
          },
        },
      }),

      // Top videos by views
      this.prisma.video.findMany({
        where: { teacherId, status: 'READY' },
        take: 5,
        orderBy: { views: 'desc' },
      }),
    ]);

    // Get unique student count (students who have watched any of teacher's videos)
    const uniqueStudents = await this.prisma.progress.groupBy({
      by: ['studentId'],
      where: {
        video: { teacherId },
      },
    });

    // Get total watch time
    const watchTimeStats = await this.prisma.progress.aggregate({
      where: {
        video: { teacherId },
      },
      _sum: { watchPercentage: true },
    });

    // Build activity items from recent progress
    const recentActivity: ActivityItem[] = recentProgress.map((prog) => ({
      id: prog.id,
      type: prog.completed ? 'video_completed' as const : 'video_watch' as const,
      message: prog.completed
        ? `completed "${prog.video.title}"`
        : `watched ${Math.round(prog.watchPercentage)}% of "${prog.video.title}"`,
      timestamp: prog.lastWatchedAt.toISOString(),
      studentName: prog.student.name,
      studentAvatarUrl: prog.student.avatarUrl,
      metadata: {
        videoTitle: prog.video.title,
      },
    }));

    const stats: TeacherDashboardStats = {
      totalCourses,
      totalVideos,
      totalStudents: uniqueStudents.length,
      totalViews: totalViews._sum.views || 0,
      totalWatchTime: Math.round((watchTimeStats._sum.watchPercentage || 0) / 60),
    };

    return {
      stats,
      recentActivity,
      topVideos: topVideos.map((v) => ({
        id: v.id,
        title: v.title,
        views: v.views,
        thumbnailUrl: v.thumbnailUrl ? `/api/videos/${v.id}/thumbnail` : null,
      })),
    };
  }

  /**
   * Get student dashboard data
   */
  async getStudentDashboard(studentId: string): Promise<StudentDashboardResponse> {
    // Get stats in parallel
    const [
      progressRecords,
      totalVideosCount,
    ] = await Promise.all([
      // All progress records (only for published videos)
      this.prisma.progress.findMany({
        where: {
          studentId,
          video: {
            isPublished: true,
          },
        },
        include: {
          video: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              duration: true,
              courseId: true,
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { lastWatchedAt: 'desc' },
      }),

      // Total available videos
      this.prisma.video.count({
        where: { status: 'READY', isPublished: true },
      }),
    ]);

    // Calculate stats
    const completedVideos = progressRecords.filter((p) => p.completed).length;
    const totalWatchTime = progressRecords.reduce((acc, p) => {
      const videoDuration = p.video.duration || 0;
      return acc + (videoDuration * p.watchPercentage) / 100;
    }, 0);

    // Calculate streak (simplified - days with activity in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activityDays = await this.prisma.progress.groupBy({
      by: ['lastWatchedAt'],
      where: {
        studentId,
        lastWatchedAt: { gte: thirtyDaysAgo },
      },
    });

    // Continue watching (in-progress videos)
    const continueWatching = progressRecords
      .filter((p) => !p.completed && p.watchPercentage > 0)
      .slice(0, 5)
      .map((p) => ({
        videoId: p.video.id,
        title: p.video.title,
        thumbnailUrl: p.video.thumbnailUrl ? `/api/videos/${p.video.id}/thumbnail` : null,
        progress: Math.round(p.watchPercentage),
        lastWatchedAt: p.lastWatchedAt.toISOString(),
      }));

    // Course progress
    const courseMap = new Map<string, { title: string; completed: number; total: number }>();

    for (const progress of progressRecords) {
      if (progress.video.course) {
        const courseId = progress.video.course.id;
        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, {
            title: progress.video.course.title,
            completed: 0,
            total: 0,
          });
        }
        const course = courseMap.get(courseId)!;
        course.total++;
        if (progress.completed) {
          course.completed++;
        }
      }
    }

    const courseProgress = Array.from(courseMap.entries()).map(([courseId, data]) => ({
      courseId,
      title: data.title,
      completedVideos: data.completed,
      totalVideos: data.total,
      percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }));

    const stats: StudentDashboardStats = {
      totalWatchTime: Math.round(totalWatchTime / 60),
      completedVideos,
      totalVideos: totalVideosCount,
      streak: activityDays.length,
    };

    return {
      stats,
      continueWatching,
      courseProgress,
    };
  }
}

// Singleton instance
let dashboardServiceInstance: DashboardService | null = null;

export function getDashboardService(): DashboardService {
  if (!dashboardServiceInstance) {
    dashboardServiceInstance = new DashboardService();
  }
  return dashboardServiceInstance;
}

export default DashboardService;
