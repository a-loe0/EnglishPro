import { Request, Response, NextFunction } from 'express';
import { getProgressService } from '../services/progress.service';
import { UpdateProgressRequest } from '../types/progress';

export class ProgressController {
  /**
   * GET /api/progress - Get all progress for current student
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;

      const query = {
        courseId: req.query.courseId as string | undefined,
        completed: req.query.completed === 'true' ? true : req.query.completed === 'false' ? false : undefined,
      };

      const progressService = getProgressService();
      const progress = await progressService.getStudentProgress(user.userId, query);

      res.json(progress);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/progress/summary - Get progress summary
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;

      const progressService = getProgressService();
      const summary = await progressService.getProgressSummary(user.userId);

      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/progress/continue - Get continue watching list
   */
  async getContinueWatching(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

      const progressService = getProgressService();
      const progress = await progressService.getContinueWatching(user.userId, limit);

      res.json(progress);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/progress/courses - Get all courses progress
   */
  async getCoursesProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;

      const progressService = getProgressService();
      const coursesProgress = await progressService.getAllCoursesProgress(user.userId);

      res.json(coursesProgress);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/progress/courses/:courseId - Get specific course progress
   */
  async getCourseProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;
      const { courseId } = req.params;

      const progressService = getProgressService();
      const courseProgress = await progressService.getCourseProgress(user.userId, courseId);

      if (!courseProgress) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      res.json(courseProgress);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/progress/videos/:videoId - Get progress for specific video
   */
  async getVideoProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;
      const { videoId } = req.params;

      const progressService = getProgressService();
      const progress = await progressService.getVideoProgress(user.userId, videoId);

      // Return empty progress if none exists
      if (!progress) {
        res.json({
          videoId,
          watchPercentage: 0,
          lastPosition: 0,
          completed: false,
          lastWatchedAt: null,
        });
        return;
      }

      res.json(progress);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/progress - Update progress
   */
  async updateProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;
      const { videoId, watchPercentage, lastPosition } = req.body as UpdateProgressRequest;

      // Validate required fields
      if (!videoId) {
        res.status(400).json({ error: 'videoId is required' });
        return;
      }

      if (watchPercentage === undefined || typeof watchPercentage !== 'number') {
        res.status(400).json({ error: 'watchPercentage must be a number' });
        return;
      }

      if (watchPercentage < 0 || watchPercentage > 100) {
        res.status(400).json({ error: 'watchPercentage must be between 0 and 100' });
        return;
      }

      // lastPosition defaults to 0 if not provided
      const position = typeof lastPosition === 'number' ? lastPosition : 0;

      const progressService = getProgressService();
      const progress = await progressService.updateProgress(user.userId, {
        videoId,
        watchPercentage,
        lastPosition: position,
      });

      res.json(progress);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/progress/videos/:videoId/complete - Mark video as completed
   */
  async markCompleted(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;
      const { videoId } = req.params;

      const progressService = getProgressService();
      const progress = await progressService.markCompleted(user.userId, videoId);

      res.json(progress);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/progress/videos/:videoId/uncomplete - Mark video as uncompleted
   */
  async markUncompleted(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;
      const { videoId } = req.params;

      const progressService = getProgressService();
      const progress = await progressService.markUncompleted(user.userId, videoId);

      res.json(progress);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/progress/videos/:videoId - Reset progress
   */
  async resetProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;
      const { videoId } = req.params;

      const progressService = getProgressService();
      await progressService.resetProgress(user.userId, videoId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const progressController = new ProgressController();
export default progressController;
