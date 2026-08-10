import { PrismaClient, Progress } from '@prisma/client';
import {
  ProgressResponse,
  UpdateProgressRequest,
  ListProgressQuery,
  VideoProgressSummary,
  CourseProgressResponse,
} from '../types/progress';
import { getVideoService } from './video.service';

const COMPLETION_THRESHOLD = 90; // 90% watched = completed

export class ProgressService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get progress for a specific video
   */
  async getVideoProgress(studentId: string, videoId: string): Promise<ProgressResponse | null> {
    const progress = await this.prisma.progress.findUnique({
      where: {
        studentId_videoId: {
          studentId,
          videoId,
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
            isPublished: true,
          },
        },
      },
    });

    if (!progress) return null;

    // Don't return progress for unpublished videos
    if (!(progress.video as { isPublished: boolean }).isPublished) {
      return null;
    }

    return this.formatProgressResponse(progress);
  }

  /**
   * Get all progress for a student
   */
  async getStudentProgress(
    studentId: string,
    query: ListProgressQuery = {}
  ): Promise<ProgressResponse[]> {
    const { courseId, completed } = query;

    const where: Record<string, unknown> = {
      studentId,
      // Only show progress for published videos
      video: {
        isPublished: true,
      },
    };

    if (completed !== undefined) {
      where.completed = completed;
    }

    if (courseId) {
      where.video = { ...(where.video as object), courseId };
    }

    const progressRecords = await this.prisma.progress.findMany({
      where,
      orderBy: { lastWatchedAt: 'desc' },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            duration: true,
            courseId: true,
          },
        },
      },
    });

    return progressRecords.map((p) => this.formatProgressResponse(p));
  }

  /**
   * Update or create progress record
   */
  async updateProgress(
    studentId: string,
    data: UpdateProgressRequest
  ): Promise<ProgressResponse> {
    const { videoId, watchPercentage, lastPosition } = data;

    // Ensure watch percentage is within bounds
    const normalizedPercentage = Math.min(100, Math.max(0, watchPercentage));
    const isCompleted = normalizedPercentage >= COMPLETION_THRESHOLD;
    const normalizedPosition = lastPosition !== undefined ? Math.max(0, Math.round(lastPosition)) : undefined;

    // Check if this is a new view (no existing progress record)
    const existingProgress = await this.prisma.progress.findUnique({
      where: {
        studentId_videoId: {
          studentId,
          videoId,
        },
      },
    });

    const isNewView = !existingProgress;

    const progress = await this.prisma.progress.upsert({
      where: {
        studentId_videoId: {
          studentId,
          videoId,
        },
      },
      update: {
        watchPercentage: normalizedPercentage,
        ...(normalizedPosition !== undefined && { lastPosition: normalizedPosition }),
        completed: isCompleted,
        lastWatchedAt: new Date(),
      },
      create: {
        studentId,
        videoId,
        watchPercentage: normalizedPercentage,
        lastPosition: normalizedPosition ?? 0,
        completed: isCompleted,
        lastWatchedAt: new Date(),
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            duration: true,
            courseId: true,
          },
        },
      },
    });

    // Increment view count if this is a new view
    if (isNewView) {
      const videoService = getVideoService();
      await videoService.incrementViews(videoId);
    }

    return this.formatProgressResponse(progress);
  }

  /**
   * Get progress summary for a student
   */
  async getProgressSummary(studentId: string): Promise<VideoProgressSummary> {
    const progressRecords = await this.prisma.progress.findMany({
      where: { studentId },
      include: {
        video: {
          select: {
            duration: true,
          },
        },
      },
    });

    const totalVideos = progressRecords.length;
    const completedVideos = progressRecords.filter((p) => p.completed).length;
    const inProgressVideos = progressRecords.filter(
      (p) => !p.completed && p.watchPercentage > 0
    ).length;

    // Calculate total watch time
    const totalWatchTimeSeconds = progressRecords.reduce((acc, p) => {
      const duration = p.video.duration || 0;
      return acc + Math.round((duration * p.watchPercentage) / 100);
    }, 0);

    // Calculate average progress
    const averageProgress =
      totalVideos > 0
        ? Math.round(
            progressRecords.reduce((acc, p) => acc + p.watchPercentage, 0) / totalVideos
          )
        : 0;

    return {
      totalVideos,
      completedVideos,
      inProgressVideos,
      totalWatchTimeSeconds,
      averageProgress,
    };
  }

  /**
   * Get course progress for a student
   */
  async getCourseProgress(
    studentId: string,
    courseId: string
  ): Promise<CourseProgressResponse | null> {
    // Get course with published, ready videos only
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        videos: {
          where: { status: 'READY', isPublished: true },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            duration: true,
          },
        },
      },
    });

    if (!course) return null;

    // Get progress for all videos in the course
    const progressRecords = await this.prisma.progress.findMany({
      where: {
        studentId,
        videoId: { in: course.videos.map((v) => v.id) },
      },
    });

    // Create a map for quick lookup
    const progressMap = new Map(progressRecords.map((p) => [p.videoId, p]));

    // Build video progress list
    const videos = course.videos.map((video) => {
      const progress = progressMap.get(video.id);
      return {
        videoId: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl ? `/api/videos/${video.id}/thumbnail` : null,
        duration: video.duration,
        watchPercentage: progress?.watchPercentage || 0,
        lastPosition: progress?.lastPosition || 0,
        completed: progress?.completed || false,
        lastWatchedAt: progress?.lastWatchedAt?.toISOString() || null,
      };
    });

    const completedVideos = videos.filter((v) => v.completed).length;
    const totalVideos = videos.length;
    const progressPercentage =
      totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

    return {
      courseId: course.id,
      courseTitle: course.title,
      totalVideos,
      completedVideos,
      progressPercentage,
      videos,
    };
  }

  /**
   * Get all courses progress for a student
   * Shows ALL published courses with published videos, not just ones the student has started
   */
  async getAllCoursesProgress(studentId: string): Promise<CourseProgressResponse[]> {
    // Get ALL published courses that have ready AND published videos
    const allCourses = await this.prisma.course.findMany({
      where: {
        isPublished: true,
        videos: {
          some: {
            status: 'READY',
            isPublished: true,
          },
        },
      },
      include: {
        videos: {
          where: { status: 'READY', isPublished: true },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            duration: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get all progress records for this student
    const progressRecords = await this.prisma.progress.findMany({
      where: { studentId },
    });

    // Create a map for quick lookup
    const progressMap = new Map(progressRecords.map((p) => [p.videoId, p]));

    // Build course progress for all courses
    const coursesProgress: CourseProgressResponse[] = allCourses.map((course) => {
      const videos = course.videos.map((video) => {
        const progress = progressMap.get(video.id);
        return {
          videoId: video.id,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl ? `/api/videos/${video.id}/thumbnail` : null,
          duration: video.duration,
          watchPercentage: progress?.watchPercentage || 0,
          lastPosition: progress?.lastPosition || 0,
          completed: progress?.completed || false,
          lastWatchedAt: progress?.lastWatchedAt?.toISOString() || null,
        };
      });

      const completedVideos = videos.filter((v) => v.completed).length;
      const totalVideos = videos.length;
      const progressPercentage =
        totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

      return {
        courseId: course.id,
        courseTitle: course.title,
        totalVideos,
        completedVideos,
        progressPercentage,
        videos,
      };
    });

    return coursesProgress;
  }

  /**
   * Get continue watching list
   */
  async getContinueWatching(studentId: string, limit: number = 5): Promise<ProgressResponse[]> {
    const progressRecords = await this.prisma.progress.findMany({
      where: {
        studentId,
        completed: false,
        watchPercentage: { gt: 0 },
        // Only show published videos
        video: {
          isPublished: true,
        },
      },
      take: limit,
      orderBy: { lastWatchedAt: 'desc' },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            duration: true,
            courseId: true,
          },
        },
      },
    });

    return progressRecords.map((p) => this.formatProgressResponse(p));
  }

  /**
   * Mark video as completed
   */
  async markCompleted(studentId: string, videoId: string): Promise<ProgressResponse> {
    return this.updateProgress(studentId, {
      videoId,
      watchPercentage: 100,
    });
  }

  /**
   * Mark video as uncompleted (keeps watch percentage)
   */
  async markUncompleted(studentId: string, videoId: string): Promise<ProgressResponse> {
    const progress = await this.prisma.progress.update({
      where: {
        studentId_videoId: {
          studentId,
          videoId,
        },
      },
      data: {
        completed: false,
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            duration: true,
            courseId: true,
          },
        },
      },
    });

    return this.formatProgressResponse(progress);
  }

  /**
   * Reset progress for a video
   */
  async resetProgress(studentId: string, videoId: string): Promise<void> {
    await this.prisma.progress.delete({
      where: {
        studentId_videoId: {
          studentId,
          videoId,
        },
      },
    });
  }

  /**
   * Format progress for response
   */
  private formatProgressResponse(
    progress: Progress & {
      video: {
        id: string;
        title: string;
        thumbnailUrl: string | null;
        duration: number | null;
        courseId: string | null;
      };
    }
  ): ProgressResponse {
    return {
      id: progress.id,
      studentId: progress.studentId,
      videoId: progress.videoId,
      watchPercentage: progress.watchPercentage,
      lastPosition: progress.lastPosition,
      completed: progress.completed,
      lastWatchedAt: progress.lastWatchedAt.toISOString(),
      video: {
        ...progress.video,
        thumbnailUrl: progress.video.thumbnailUrl ? `/api/videos/${progress.video.id}/thumbnail` : null,
      },
    };
  }
}

// Singleton instance
let progressServiceInstance: ProgressService | null = null;

export function getProgressService(): ProgressService {
  if (!progressServiceInstance) {
    progressServiceInstance = new ProgressService();
  }
  return progressServiceInstance;
}

export default ProgressService;
