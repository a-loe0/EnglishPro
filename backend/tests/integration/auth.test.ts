import request from 'supertest';
import { createApp } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import * as passwordUtils from '../../src/utils/password';
import * as jwtUtils from '../../src/utils/jwt';

// Mock dependencies
jest.mock('../../src/utils/password');
jest.mock('../../src/utils/jwt');

const app = createApp();
const prisma = new PrismaClient();

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashed-password');
    (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);
    (jwtUtils.generateTokens as jest.Mock).mockReturnValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
    (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'STUDENT',
    });
    (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'STUDENT',
    });
  });

  describe('POST /api/auth/register', () => {
    const validRegistration = {
      email: 'newuser@example.com',
      password: 'Password123',
      name: 'New User',
      role: 'STUDENT',
    };

    it('should register a new user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174099',
        email: validRegistration.email,
        name: validRegistration.name,
        role: validRegistration.role,
        createdAt: new Date(),
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistration)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Registration successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(validRegistration.email);
    });

    it('should return 400 if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '123',
        email: validRegistration.email,
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistration)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email already registered');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegistration, email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegistration, password: 'weak' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validRegistration, role: 'ADMIN' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    const validLogin = {
      email: 'test@example.com',
      password: 'Password123',
    };

    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      name: 'Test User',
      role: 'STUDENT',
      passwordHash: 'hashed-password',
      avatarUrl: null,
    };

    it('should login successfully with valid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLogin)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(validLogin.email);
    });

    it('should return 401 for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLogin)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });

    it('should return 401 for incorrect password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLogin)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Password123' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: 'STUDENT',
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Token refreshed');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 500 for invalid refresh token', async () => {
      // JWT errors are treated as server errors (not exposed to client for security)
      (jwtUtils.verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('should return 401 if user no longer exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      name: 'Test User',
      role: 'STUDENT',
      avatarUrl: null,
      createdAt: new Date(),
    };

    it('should return current user with valid token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(mockUser.email);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should return 401 with invalid token', async () => {
      (jwtUtils.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });

    it('should return 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
