import { Request, Response, NextFunction } from 'express';
import { getCourseService } from '../services/course.service';
import { ListCoursesQuery, CreateCourseRequest, UpdateCourseRequest } from '../types/course';

export class CourseController {
  /**
   * GET /api/courses - List courses
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;

      const query: ListCoursesQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        teacherId: req.query.teacherId as string | undefined,
        search: req.query.search as string | undefined,
        sortBy: (req.query.sortBy as 'createdAt' | 'title') || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        // Pass user info for filtering
        _userRole: user.role as 'TEACHER' | 'STUDENT',
        _userId: user.userId,
      };

      const courseService = getCourseService();
      const result = await courseService.list(query);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/courses/:id - Get course details
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as Request & { user: { userId: string; role: string } }).user;
      const includeVideos = req.query.includeVideos === 'true';

      const courseService = getCourseService();

      const course = includeVideos
        ? await courseService.getWithVideos(id, user.role, user.userId)
        : await courseService.getById(id);

      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      res.json(course);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/courses - Create course
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;
      const { title, description } = req.body as CreateCourseRequest;

      // Validate required fields
      if (!title || title.trim().length === 0) {
        res.status(400).json({ error: 'Title is required' });
        return;
      }

      if (title.length > 200) {
        res.status(400).json({ error: 'Title must be 200 characters or less' });
        return;
      }

      if (description && description.length > 5000) {
        res.status(400).json({ error: 'Description must be 5000 characters or less' });
        return;
      }

      const courseService = getCourseService();
      const course = await courseService.create(user.userId, { title, description });

      res.status(201).json(course);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/courses/:id - Update course
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as Request & { user: { userId: string; role: string } }).user;
      const { title, description } = req.body as UpdateCourseRequest;

      const courseService = getCourseService();

      // Check ownership
      const isOwner = await courseService.isOwner(id, user.userId);
      if (!isOwner) {
        res.status(403).json({ error: 'You do not have permission to update this course' });
        return;
      }

      // Validate fields
      if (title !== undefined) {
        if (title.trim().length === 0) {
          res.status(400).json({ error: 'Title cannot be empty' });
          return;
        }
        if (title.length > 200) {
          res.status(400).json({ error: 'Title must be 200 characters or less' });
          return;
        }
      }

      if (description !== undefined && description.length > 5000) {
        res.status(400).json({ error: 'Description must be 5000 characters or less' });
        return;
      }

      const course = await courseService.update(id, { title, description });
      res.json(course);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/courses/:id - Delete course
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as Request & { user: { userId: string; role: string } }).user;

      const courseService = getCourseService();

      // Check ownership
      const isOwner = await courseService.isOwner(id, user.userId);
      if (!isOwner) {
        res.status(403).json({ error: 'You do not have permission to delete this course' });
        return;
      }

      await courseService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/courses/my - Get teacher's own courses
   */
  async getMyCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;

      const courseService = getCourseService();
      const courses = await courseService.getByTeacher(user.userId);

      res.json(courses);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const courseController = new CourseController();
export default courseController;
