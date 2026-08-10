import { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import type { ParsedQs } from 'qs';
import type { ParamsDictionary } from 'express-serve-static-core';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

// Validation middleware factory
export function validate(schemas: ValidationSchemas): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query) as ParsedQs;
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params) as ParamsDictionary;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        res.status(400).json({
          error: 'Validation failed',
          details: formattedErrors,
        });
        return;
      }
      next(error);
    }
  };
}

// Common validation schemas
export const schemas = {
  // Auth schemas
  register: z.object({
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    role: z.enum(['TEACHER', 'STUDENT']),
  }),

  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),

  // Video schemas
  createVideo: z.object({
    tempId: z.string().uuid('Invalid temp ID'),
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().max(5000, 'Description too long').optional(),
    courseId: z.string().uuid('Invalid course ID').optional(),
  }),

  updateVideo: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    courseId: z.string().uuid().nullable().optional(),
  }),

  videoIdParam: z.object({
    id: z.string().uuid('Invalid video ID'),
  }),

  listVideos: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    courseId: z.string().uuid().optional(),
    teacherId: z.string().uuid().optional(),
    status: z.enum(['PROCESSING', 'READY', 'FAILED']).optional(),
    search: z.string().max(100).optional(),
    sortBy: z.enum(['createdAt', 'title', 'duration']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Course schemas
  createCourse: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().max(5000, 'Description too long').optional(),
    isPublished: z.boolean().default(false),
  }),

  updateCourse: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    isPublished: z.boolean().optional(),
  }),

  courseIdParam: z.object({
    id: z.string().uuid('Invalid course ID'),
  }),

  // Submission schemas
  createSubmission: z.object({
    tempId: z.string().uuid('Invalid temp ID'),
    videoId: z.string().uuid('Invalid video ID'),
  }),

  gradeSubmission: z.object({
    grade: z.number().int().min(0, 'Grade must be at least 0').max(100, 'Grade cannot exceed 100'),
    feedback: z.string().min(1, 'Feedback is required').max(5000, 'Feedback too long'),
  }),

  submissionIdParam: z.object({
    id: z.string().uuid('Invalid submission ID'),
  }),

  // Progress schemas
  updateProgress: z.object({
    videoId: z.string().uuid('Invalid video ID'),
    watchPercentage: z.number().min(0).max(100),
  }),

  // Pagination schemas
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),

  // UUID param
  uuidParam: z.object({
    id: z.string().uuid('Invalid ID'),
  }),
};

// Export individual validators for convenience
export const validateRegister = validate({ body: schemas.register });
export const validateLogin = validate({ body: schemas.login });
export const validateRefreshToken = validate({ body: schemas.refreshToken });
export const validateCreateVideo = validate({ body: schemas.createVideo });
export const validateUpdateVideo = validate({ body: schemas.updateVideo, params: schemas.videoIdParam });
export const validateListVideos = validate({ query: schemas.listVideos });
export const validateCreateCourse = validate({ body: schemas.createCourse });
export const validateUpdateCourse = validate({ body: schemas.updateCourse, params: schemas.courseIdParam });
export const validateCreateSubmission = validate({ body: schemas.createSubmission });
export const validateGradeSubmission = validate({ body: schemas.gradeSubmission, params: schemas.submissionIdParam });
export const validateUpdateProgress = validate({ body: schemas.updateProgress });

export default {
  validate,
  schemas,
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateCreateVideo,
  validateUpdateVideo,
  validateListVideos,
  validateCreateCourse,
  validateUpdateCourse,
  validateCreateSubmission,
  validateGradeSubmission,
  validateUpdateProgress,
};
