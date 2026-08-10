import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize, isTeacher, isStudent } from '../../../src/middleware/auth';
import * as jwtUtils from '../../../src/utils/jwt';

// Mock jwt utils
jest.mock('../../../src/utils/jwt');

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should call next() with valid token', () => {
      const mockPayload = { userId: '123', email: 'test@example.com', role: 'STUDENT' };
      mockReq.headers = { authorization: 'Bearer valid-token' };
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(jwtUtils.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockReq.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no authorization header', () => {
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', () => {
      mockReq.headers = { authorization: 'Basic some-token' };

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      (jwtUtils.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', () => {
      mockReq.headers = { authorization: 'Bearer expired-token' };
      (jwtUtils.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('jwt expired');
      });

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });
  });

  describe('authorize', () => {
    it('should call next() when user has allowed role', () => {
      mockReq.user = { userId: '123', email: 'test@example.com', role: 'TEACHER' };
      const middleware = authorize('TEACHER', 'ADMIN');

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      const middleware = authorize('TEACHER');

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not have allowed role', () => {
      mockReq.user = { userId: '123', email: 'test@example.com', role: 'STUDENT' };
      const middleware = authorize('TEACHER');

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access denied. Insufficient permissions.' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should work with multiple allowed roles', () => {
      mockReq.user = { userId: '123', email: 'test@example.com', role: 'STUDENT' };
      const middleware = authorize('TEACHER', 'STUDENT');

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('isTeacher', () => {
    it('should allow TEACHER role', () => {
      mockReq.user = { userId: '123', email: 'teacher@example.com', role: 'TEACHER' };

      isTeacher(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny STUDENT role', () => {
      mockReq.user = { userId: '123', email: 'student@example.com', role: 'STUDENT' };

      isTeacher(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('isStudent', () => {
    it('should allow STUDENT role', () => {
      mockReq.user = { userId: '123', email: 'student@example.com', role: 'STUDENT' };

      isStudent(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny TEACHER role', () => {
      mockReq.user = { userId: '123', email: 'teacher@example.com', role: 'TEACHER' };

      isStudent(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });
});
