import { Router, Request, Response, NextFunction } from 'express';
import { progressController } from '../controllers/progressController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Middleware to check if user is a student
const requireStudent = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as Request & { user: { userId: string; role: string } }).user;

  if (user.role !== 'STUDENT') {
    res.status(403).json({ error: 'Only students can access progress tracking' });
    return;
  }

  next();
};

// All routes require authentication and student role
router.use(authenticate);
router.use(requireStudent);

/**
 * GET /api/progress
 * Get all progress records for current student
 */
router.get('/', (req, res, next) => progressController.list(req, res, next));

/**
 * GET /api/progress/summary
 * Get progress summary statistics
 */
router.get('/summary', (req, res, next) => progressController.getSummary(req, res, next));

/**
 * GET /api/progress/continue
 * Get continue watching list
 */
router.get('/continue', (req, res, next) => progressController.getContinueWatching(req, res, next));

/**
 * GET /api/progress/courses
 * Get progress for all courses
 */
router.get('/courses', (req, res, next) => progressController.getCoursesProgress(req, res, next));

/**
 * GET /api/progress/courses/:courseId
 * Get progress for a specific course
 */
router.get('/courses/:courseId', (req, res, next) => progressController.getCourseProgress(req, res, next));

/**
 * GET /api/progress/videos/:videoId
 * Get progress for a specific video
 */
router.get('/videos/:videoId', (req, res, next) => progressController.getVideoProgress(req, res, next));

/**
 * POST /api/progress
 * Update progress (called by video player)
 */
router.post('/', (req, res, next) => progressController.updateProgress(req, res, next));

/**
 * POST /api/progress/videos/:videoId/complete
 * Mark video as completed
 */
router.post('/videos/:videoId/complete', (req, res, next) => progressController.markCompleted(req, res, next));

/**
 * POST /api/progress/videos/:videoId/uncomplete
 * Mark video as uncompleted (keeps watch percentage)
 */
router.post('/videos/:videoId/uncomplete', (req, res, next) => progressController.markUncompleted(req, res, next));

/**
 * DELETE /api/progress/videos/:videoId
 * Reset progress for a video
 */
router.delete('/videos/:videoId', (req, res, next) => progressController.resetProgress(req, res, next));

export default router;
