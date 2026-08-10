import { Request, Response, NextFunction } from 'express';
import { validate, schemas } from '../../../src/middleware/validate';

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('Register Schema', () => {
    const validateRegister = validate({ body: schemas.register });

    it('should pass with valid registration data', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        role: 'STUDENT',
      };

      await validateRegister(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should fail with invalid email', async () => {
      mockReq.body = {
        email: 'invalid-email',
        password: 'Password123',
        name: 'Test User',
        role: 'STUDENT',
      };

      await validateRegister(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
          ]),
        })
      );
    });

    it('should fail with weak password (no uppercase)', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'STUDENT',
      };

      await validateRegister(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should fail with password too short', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'Pass1',
        name: 'Test User',
        role: 'STUDENT',
      };

      await validateRegister(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should fail with invalid role', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        role: 'ADMIN',
      };

      await validateRegister(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should fail with name too short', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'A',
        role: 'STUDENT',
      };

      await validateRegister(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Login Schema', () => {
    const validateLogin = validate({ body: schemas.login });

    it('should pass with valid login data', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'anypassword',
      };

      await validateLogin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail with missing password', async () => {
      mockReq.body = {
        email: 'test@example.com',
      };

      await validateLogin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Create Video Schema', () => {
    const validateCreateVideo = validate({ body: schemas.createVideo });

    it('should pass with valid video data', async () => {
      mockReq.body = {
        tempId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Video',
        description: 'A description',
      };

      await validateCreateVideo(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail with invalid tempId', async () => {
      mockReq.body = {
        tempId: 'not-a-uuid',
        title: 'Test Video',
      };

      await validateCreateVideo(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should fail with title too long', async () => {
      mockReq.body = {
        tempId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'A'.repeat(201),
      };

      await validateCreateVideo(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Grade Submission Schema', () => {
    const validateGradeSubmission = validate({ body: schemas.gradeSubmission });

    it('should pass with valid grade data', async () => {
      mockReq.body = {
        grade: 85,
        feedback: 'Great work!',
      };

      await validateGradeSubmission(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail with grade over 100', async () => {
      mockReq.body = {
        grade: 101,
        feedback: 'Great work!',
      };

      await validateGradeSubmission(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should fail with negative grade', async () => {
      mockReq.body = {
        grade: -1,
        feedback: 'Great work!',
      };

      await validateGradeSubmission(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should fail with missing feedback', async () => {
      mockReq.body = {
        grade: 85,
      };

      await validateGradeSubmission(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Update Progress Schema', () => {
    const validateUpdateProgress = validate({ body: schemas.updateProgress });

    it('should pass with valid progress data', async () => {
      mockReq.body = {
        videoId: '123e4567-e89b-12d3-a456-426614174000',
        watchPercentage: 75.5,
      };

      await validateUpdateProgress(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail with watchPercentage over 100', async () => {
      mockReq.body = {
        videoId: '123e4567-e89b-12d3-a456-426614174000',
        watchPercentage: 101,
      };

      await validateUpdateProgress(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Pagination Schema', () => {
    const validatePagination = validate({ query: schemas.pagination });

    it('should pass with valid pagination', async () => {
      mockReq.query = {
        page: '2',
        limit: '10',
      };

      await validatePagination(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.query.page).toBe(2);
      expect(mockReq.query.limit).toBe(10);
    });

    it('should use defaults when not provided', async () => {
      mockReq.query = {};

      await validatePagination(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.query.page).toBe(1);
      expect(mockReq.query.limit).toBe(20);
    });

    it('should fail with limit over 100', async () => {
      mockReq.query = {
        page: '1',
        limit: '101',
      };

      await validatePagination(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});
