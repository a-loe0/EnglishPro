// Mock Prisma Client for unit tests
jest.mock('@prisma/client', () => {
  const mockPrismaClient: Record<string, any> = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    video: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    submission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    progress: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  mockPrismaClient.$transaction = jest.fn((callback: (client: typeof mockPrismaClient) => any) => callback(mockPrismaClient));

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'postgresql://localhost:5432/englishgopro_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.STORAGE_PATH = '/tmp/englishgopro-test-storage';

// Global test utilities
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  name: 'Test User',
  role: 'STUDENT' as const,
  passwordHash: '$2a$10$abcdefghijklmnopqrstuv',
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockTeacher = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  email: 'teacher@example.com',
  name: 'Test Teacher',
  role: 'TEACHER' as const,
  passwordHash: '$2a$10$abcdefghijklmnopqrstuv',
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockCourse = {
  id: '123e4567-e89b-12d3-a456-426614174010',
  teacherId: mockTeacher.id,
  title: 'Test Course',
  description: 'A test course description',
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockVideo = {
  id: '123e4567-e89b-12d3-a456-426614174020',
  teacherId: mockTeacher.id,
  courseId: mockCourse.id,
  title: 'Test Video',
  description: 'A test video description',
  videoUrl: '/videos/test.mp4',
  hlsUrl: '/videos/test/master.m3u8',
  thumbnailUrl: '/thumbnails/test.jpg',
  duration: 300,
  status: 'READY' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockSubmission = {
  id: '123e4567-e89b-12d3-a456-426614174030',
  studentId: mockUser.id,
  videoId: mockVideo.id,
  submissionUrl: '/submissions/test.mp4',
  status: 'PENDING' as const,
  grade: null,
  feedback: null,
  submittedAt: new Date(),
  reviewedAt: null,
};

export const mockProgress = {
  id: '123e4567-e89b-12d3-a456-426614174040',
  studentId: mockUser.id,
  videoId: mockVideo.id,
  watchPercentage: 50,
  completed: false,
  lastWatchedAt: new Date(),
};

// Clean up after all tests
afterAll(async () => {
  jest.clearAllMocks();
});
