import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/dashboard/teacher
 * Get teacher dashboard data
 */
router.get('/teacher', (req, res, next) => dashboardController.getTeacherDashboard(req, res, next));

/**
 * GET /api/dashboard/student
 * Get student dashboard data
 */
router.get('/student', (req, res, next) => dashboardController.getStudentDashboard(req, res, next));

export default router;
