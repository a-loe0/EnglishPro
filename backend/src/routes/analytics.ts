import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/analytics/teacher
 * Get teacher dashboard analytics
 */
router.get('/teacher', (req, res, next) => analyticsController.getTeacherAnalytics(req, res, next));

/**
 * GET /api/analytics/student
 * Get student dashboard analytics
 */
router.get('/student', (req, res, next) => analyticsController.getStudentAnalytics(req, res, next));

/**
 * GET /api/analytics/video/:videoId
 * Get video engagement analytics
 */
router.get('/video/:videoId', (req, res, next) => analyticsController.getVideoAnalytics(req, res, next));

/**
 * GET /api/analytics/course/:courseId
 * Get course analytics
 */
router.get('/course/:courseId', (req, res, next) => analyticsController.getCourseAnalytics(req, res, next));

export default router;
