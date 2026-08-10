import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: 'TEACHER' | 'STUDENT';
  };
}

class AnalyticsController {
  /**
   * GET /api/analytics/teacher
   * Get teacher dashboard analytics
   */
  async getTeacherAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, role } = (req as AuthenticatedRequest).user;

      if (role !== 'TEACHER') {
        res.status(403).json({ error: 'Only teachers can access teacher analytics' });
        return;
      }

      const analytics = await analyticsService.getTeacherAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/student
   * Get student dashboard analytics
   */
  async getStudentAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, role } = (req as AuthenticatedRequest).user;

      if (role !== 'STUDENT') {
        res.status(403).json({ error: 'Only students can access student analytics' });
        return;
      }

      const analytics = await analyticsService.getStudentAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/video/:videoId
   * Get video engagement analytics
   */
  async getVideoAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, role } = (req as AuthenticatedRequest).user;
      const { videoId } = req.params;

      if (role !== 'TEACHER') {
        res.status(403).json({ error: 'Only teachers can access video analytics' });
        return;
      }

      // Verify teacher owns this video
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: { teacherId: true },
      });

      if (!video) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }

      if (video.teacherId !== userId) {
        res.status(403).json({ error: 'You do not have access to this video analytics' });
        return;
      }

      const analytics = await analyticsService.getVideoAnalytics(videoId);
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/course/:courseId
   * Get course analytics
   */
  async getCourseAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, role } = (req as AuthenticatedRequest).user;
      const { courseId } = req.params;

      if (role !== 'TEACHER') {
        res.status(403).json({ error: 'Only teachers can access course analytics' });
        return;
      }

      // Verify teacher owns this course
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { teacherId: true },
      });

      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      if (course.teacherId !== userId) {
        res.status(403).json({ error: 'You do not have access to this course analytics' });
        return;
      }

      const analytics = await analyticsService.getCourseAnalytics(courseId);
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
export default analyticsController;
