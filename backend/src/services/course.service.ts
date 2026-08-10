import { PrismaClient, Course } from '@prisma/client';
import {
  CourseResponse,
  CreateCourseRequest,
  UpdateCourseRequest,
  ListCoursesQuery,
  PaginatedCoursesResponse,
} from '../types/course';

export class CourseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get course by ID
   */
  async getById(id: string): Promise<CourseResponse | null> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            videos: true,
          },
        },
      },
    });

    if (!course) return null;

    return this.formatCourseResponse(course);
  }

  /**
   * List courses with pagination and filters
   */
  async list(query: ListCoursesQuery): Promise<PaginatedCoursesResponse> {
    const {
      page = 1,
      limit = 20,
      teacherId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      _userRole,
      _userId,
    } = query;

    const take = Math.min(Math.max(1, limit), 100);
    const skip = (page - 1) * take;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (teacherId) {
      where.teacherId = teacherId;
    }

    // Students can only see published courses
    if (_userRole === 'STUDENT') {
      where.isPublished = true;
    } else if (_userRole === 'TEACHER' && _userId && !teacherId) {
      // Teachers see their own courses + published courses from others
      where.OR = [
        { teacherId: _userId },
        { isPublished: true },
      ];
    }

    if (search) {
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
    const total = await this.prisma.course.count({ where });

    // Get courses
    const courses = await this.prisma.course.findMany({
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
        _count: {
          select: {
            videos: true,
          },
        },
      },
    });

    return {
      data: courses.map((course) => this.formatCourseResponse(course)),
      pagination: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Create course
   */
  async create(teacherId: string, data: CreateCourseRequest): Promise<CourseResponse> {
    const course = await this.prisma.course.create({
      data: {
        teacherId,
        title: data.title,
        description: data.description || null,
        isPublished: true, // Courses are published by default so students can see them
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            videos: true,
          },
        },
      },
    });

    return this.formatCourseResponse(course);
  }

  /**
   * Update course
   */
  async update(id: string, data: UpdateCourseRequest): Promise<CourseResponse> {
    const course = await this.prisma.course.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            videos: true,
          },
        },
      },
    });

    return this.formatCourseResponse(course);
  }

  /**
   * Delete course
   */
  async delete(id: string): Promise<void> {
    await this.prisma.course.delete({ where: { id } });
  }

  /**
   * Check if user is owner of course
   */
  async isOwner(courseId: string, userId: string): Promise<boolean> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });

    return course?.teacherId === userId;
  }

  /**
   * Get courses by teacher
   */
  async getByTeacher(teacherId: string): Promise<CourseResponse[]> {
    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            videos: true,
          },
        },
      },
    });

    return courses.map((course) => this.formatCourseResponse(course));
  }

  /**
   * Get course with videos
   * @param id Course ID
   * @param userRole Role of the requesting user
   * @param userId ID of the requesting user
   */
  async getWithVideos(id: string, userRole?: string, userId?: string): Promise<CourseResponse & { videos: unknown[] } | null> {
    // Build video filter based on user role
    const videoWhere: Record<string, unknown> = {};

    if (userRole === 'STUDENT') {
      // Students only see published videos
      videoWhere.isPublished = true;
    } else if (userRole === 'TEACHER' && userId) {
      // Teachers see their own videos + published videos
      videoWhere.OR = [
        { teacherId: userId },
        { isPublished: true },
      ];
    }

    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        videos: {
          where: videoWhere,
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            duration: true,
            status: true,
            isPublished: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            videos: true,
          },
        },
      },
    });

    if (!course) return null;

    return {
      ...this.formatCourseResponse(course),
      videos: course.videos.map((video) => ({
        ...video,
        thumbnailUrl: video.thumbnailUrl ? `/api/videos/${video.id}/thumbnail` : null,
      })),
    };
  }

  /**
   * Format course for response
   */
  private formatCourseResponse(
    course: Course & {
      teacher?: { id: string; name: string; avatarUrl: string | null };
      _count?: { videos: number };
    }
  ): CourseResponse {
    return {
      id: course.id,
      teacherId: course.teacherId,
      title: course.title,
      description: course.description,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      teacher: course.teacher,
      videoCount: course._count?.videos,
    };
  }
}

// Singleton instance
let courseServiceInstance: CourseService | null = null;

export function getCourseService(): CourseService {
  if (!courseServiceInstance) {
    courseServiceInstance = new CourseService();
  }
  return courseServiceInstance;
}

export default CourseService;
