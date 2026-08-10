import { Router, Request, Response, NextFunction } from 'express';
import { courseController } from '../controllers/courseController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Middleware to check if user is a teacher
const requireTeacher = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as Request & { user: { userId: string; role: string } }).user;

  if (user.role !== 'TEACHER') {
    res.status(403).json({ error: 'Only teachers can perform this action' });
    return;
  }

  next();
};

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/courses
 * List all courses (students see all, teachers see all)
 */
router.get('/', (req, res, next) => courseController.list(req, res, next));

/**
 * GET /api/courses/my
 * Get teacher's own courses
 */
router.get('/my', requireTeacher, (req, res, next) => courseController.getMyCourses(req, res, next));

/**
 * GET /api/courses/:id
 * Get course details by ID
 * Query params: includeVideos=true to include video list
 */
router.get('/:id', (req, res, next) => courseController.getById(req, res, next));

/**
 * POST /api/courses
 * Create a new course (teacher only)
 */
router.post('/', requireTeacher, (req, res, next) => courseController.create(req, res, next));

/**
 * PATCH /api/courses/:id
 * Update course (owner only)
 */
router.patch('/:id', requireTeacher, (req, res, next) => courseController.update(req, res, next));

/**
 * DELETE /api/courses/:id
 * Delete course (owner only)
 */
router.delete('/:id', requireTeacher, (req, res, next) => courseController.delete(req, res, next));

export default router;
