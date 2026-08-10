import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens, verifyRefreshToken, generateResetToken, verifyResetToken } from '../utils/jwt';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../utils/validation';
import { createError } from '../middleware/errorHandler';
import { getStorageService } from '../services/storage.service';
import { extname } from 'path';
import { writeFile, unlink } from 'fs/promises';
import { sendPasswordResetEmail } from '../utils/email';

const prisma = new PrismaClient();

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw createError('Email already registered', 400);
    }

    // Hash password and create user
    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: 'Registration successful',
      user,
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Login user and return tokens
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw createError('Invalid email or password', 401);
    }

    // Verify password
    const isValid = await comparePassword(data.password, user.passwordHash);
    if (!isValid) {
      throw createError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
export async function logout(
  req: Request,
  res: Response
): Promise<void> {
  // In a stateless JWT setup, logout is handled client-side
  // For enhanced security, you could implement a token blacklist in Redis
  res.json({ message: 'Logout successful' });
}

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = refreshTokenSchema.parse(req.body);

    // Verify refresh token
    const payload = verifyRefreshToken(data.refreshToken);

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw createError('User not found', 401);
    }

    // Generate new tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      message: 'Token refreshed',
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/auth/profile
 * Update user profile
 */
export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw createError('Name is required', 400);
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name: name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/change-password
 * Change user password
 */
export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw createError('Current and new password are required', 400);
    }

    if (newPassword.length < 8) {
      throw createError('New password must be at least 8 characters', 400);
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw createError('Current password is incorrect', 400);
    }

    // Hash and update password
    const newPasswordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/avatar
 * Upload user avatar
 */
export async function uploadAvatar(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    if (!req.file) {
      throw createError('No file uploaded', 400);
    }

    const storage = getStorageService();
    const ext = extname(req.file.originalname).toLowerCase() || '.jpg';
    const avatarPath = storage.getAvatarPath(req.user.userId, ext);

    // Delete old avatar if exists (with different extension)
    const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    for (const oldExt of extensions) {
      if (oldExt !== ext) {
        const oldPath = storage.getAvatarPath(req.user.userId, oldExt);
        try {
          await unlink(oldPath);
        } catch {
          // Ignore if file doesn't exist
        }
      }
    }

    // Save new avatar
    await storage.ensureDir(storage.getStoragePath('avatars'));
    await writeFile(avatarPath, req.file.buffer);

    // Update user with avatar URL
    const avatarUrl = `/api/auth/avatar/${req.user.userId}${ext}`;
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/avatar/:filename
 * Serve user avatar
 */
export async function serveAvatar(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { filename } = req.params;
    const storage = getStorageService();
    const avatarPath = `${storage.getStoragePath('avatars')}/${filename}`;

    if (!storage.fileExists(avatarPath)) {
      throw createError('Avatar not found', 404);
    }

    res.sendFile(avatarPath);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      throw createError('Email is required', 400);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ message: 'If an account exists, a reset link has been sent.' });
      return;
    }

    // Generate reset token
    const resetToken = generateResetToken(user.id, user.email);

    // Send email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw createError('Token and password are required', 400);
    }

    if (password.length < 8) {
      throw createError('Password must be at least 8 characters', 400);
    }

    // Verify reset token
    const payload = verifyResetToken(token);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw createError('Invalid reset link', 400);
    }

    // Hash and update password
    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({ message: 'Password has been reset successfully' });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(createError('Invalid or expired reset link', 400));
    } else {
      next(error);
    }
  }
}
