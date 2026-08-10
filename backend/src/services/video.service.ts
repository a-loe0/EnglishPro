import { PrismaClient, Video, VideoStatus } from '@prisma/client';
import { getStorageService } from './storage.service';
import { getQueueService } from './queue.service';
import { getFFmpegService } from './ffmpeg.service';
import {
  VideoResponse,
  ListVideosQuery,
  PaginatedVideosResponse,
  CreateVideoRequest,
  RESOLUTION_PRESETS,
} from '../types/video';

export class VideoService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get video by ID
   * @param id Video ID
   * @param userRole Role of the requesting user
   * @param userId ID of the requesting user
   */
  async getById(id: string, userRole?: string, userId?: string): Promise<VideoResponse | null> {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!video) return null;

    // Students can only see published videos
    if (userRole === 'STUDENT' && !video.isPublished) {
      return null;
    }

    // Teachers can see their own videos or published videos
    if (userRole === 'TEACHER' && !video.isPublished && video.teacherId !== userId) {
      return null;
    }

    return this.formatVideoResponse(video);
  }

  /**
   * List videos with pagination and filters
   */
  async list(query: ListVideosQuery): Promise<PaginatedVideosResponse> {
    const {
      page = 1,
      limit = 20,
      courseId,
      teacherId,
      status,
      isPublished,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      _userRole,
      _userId,
    } = query;

    // Ensure limit is within bounds
    const take = Math.min(Math.max(1, limit), 100);
    const skip = (page - 1) * take;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (courseId) {
      where.courseId = courseId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (status) {
      where.status = status;
    }

    // Filter by isPublished
    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    } else if (_userRole === 'STUDENT') {
      // Students can only see published videos
      where.isPublished = true;
    } else if (_userRole === 'TEACHER' && _userId && !teacherId) {
      // Teachers see: their own videos (any status) + other published videos
      where.OR = [
        { teacherId: _userId },
        { isPublished: true },
      ];
    }

    if (search) {
      // If we already have an OR clause, we need to use AND
      const searchCondition = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      };

      if (where.OR) {
        where.AND = [{ OR: where.OR }, searchCondition];
        delete where.OR;
      } else {
        where.OR = searchCondition.OR;
      }
    }

    // Get total count
    const total = await this.prisma.video.count({ where });

    // Get videos
    const videos = await this.prisma.video.findMany({
      where,
      take,
      skip,
      orderBy: { [sortBy]: sortOrder },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return {
      data: videos.map(this.formatVideoResponse),
      pagination: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Create video from uploaded file
   */
  async create(
    teacherId: string,
    tempPath: string,
    data: CreateVideoRequest
  ): Promise<Video> {
    const storage = getStorageService();
    const queue = getQueueService();
    const ffmpeg = getFFmpegService();

    // Get video metadata
    const metadata = await ffmpeg.getMetadata(tempPath);

    // Generate video ID and create directory
    const videoId = crypto.randomUUID();
    const videoDir = await storage.createVideoDir(videoId);

    // Move original file to video directory
    const originalPath = await storage.moveToStorage(
      tempPath,
      'videos',
      `${videoId}/original.mp4`
    );

    // Create video record
    const video = await this.prisma.video.create({
      data: {
        id: videoId,
        teacherId,
        courseId: data.courseId || null,
        title: data.title,
        description: data.description || null,
        videoUrl: originalPath,
        duration: Math.round(metadata.duration),
        status: 'PROCESSING',
      },
    });

    // Get optimal resolutions
    const resolutions = ffmpeg.getOptimalResolutions(metadata.width, metadata.height);

    // Queue transcoding job
    await queue.addTranscodeJob({
      videoId,
      inputPath: originalPath,
      outputDir: videoDir,
      resolutions: resolutions.length > 0 ? resolutions : [RESOLUTION_PRESETS[RESOLUTION_PRESETS.length - 1]],
    });

    // Queue thumbnail job
    await queue.addThumbnailJob({
      videoId,
      inputPath: originalPath,
      outputPath: storage.getThumbnailPath(videoId),
    });

    return video;
  }

  /**
   * Update video metadata
   */
  async update(
    id: string,
    data: { title?: string; description?: string; courseId?: string | null }
  ): Promise<Video> {
    return this.prisma.video.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete video and associated files
   */
  async delete(id: string): Promise<void> {
    const storage = getStorageService();

    // Get video to find file paths
    const video = await this.prisma.video.findUnique({ where: { id } });

    if (!video) {
      throw new Error('Video not found');
    }

    // Delete database record first
    await this.prisma.video.delete({ where: { id } });

    // Delete video files
    await storage.deleteDir(storage.getHlsDir(id));

    // Delete thumbnail
    await storage.deleteFile(storage.getThumbnailPath(id));
  }

  /**
   * Check if user is owner of video
   */
  async isOwner(videoId: string, userId: string): Promise<boolean> {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { teacherId: true },
    });

    return video?.teacherId === userId;
  }

  /**
   * Get videos by course
   * @param courseId Course ID
   * @param userRole Role of the requesting user
   * @param userId ID of the requesting user
   */
  async getByCourse(courseId: string, userRole?: string, userId?: string): Promise<Video[]> {
    const where: Record<string, unknown> = { courseId };

    // Students can only see published videos
    if (userRole === 'STUDENT') {
      where.isPublished = true;
    } else if (userRole === 'TEACHER' && userId) {
      // Teachers see their own videos + published videos
      where.OR = [
        { teacherId: userId },
        { isPublished: true },
      ];
    }

    return this.prisma.video.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Get videos by teacher
   */
  async getByTeacher(teacherId: string): Promise<Video[]> {
    return this.prisma.video.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  /**
   * Publish or unpublish a video
   */
  async setPublished(id: string, isPublished: boolean): Promise<Video> {
    return this.prisma.video.update({
      where: { id },
      data: { isPublished },
    });
  }

  /**
   * Increment view count
   */
  async incrementViews(id: string): Promise<void> {
    await this.prisma.video.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }

  /**
   * Format video for response
   */
  private formatVideoResponse(video: Video & {
    teacher?: { id: string; name: string; avatarUrl: string | null };
    course?: { id: string; title: string } | null;
  }): VideoResponse {
    // Convert file paths to API URLs
    const hlsUrl = video.status === 'READY' ? `/api/videos/${video.id}/stream/master.m3u8` : null;
    const thumbnailUrl = video.thumbnailUrl ? `/api/videos/${video.id}/thumbnail` : null;

    return {
      id: video.id,
      teacherId: video.teacherId,
      courseId: video.courseId,
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl,
      hlsUrl,
      thumbnailUrl,
      duration: video.duration,
      views: video.views,
      status: video.status,
      isPublished: video.isPublished,
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
      teacher: video.teacher,
      course: video.course || undefined,
    };
  }
}

// Singleton instance
let videoServiceInstance: VideoService | null = null;

export function getVideoService(): VideoService {
  if (!videoServiceInstance) {
    videoServiceInstance = new VideoService();
  }
  return videoServiceInstance;
}

export default VideoService;
