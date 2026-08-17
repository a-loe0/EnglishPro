import { Router } from 'express';
import {
  register,
  login,
  logout,
  refresh,
  me,
  updateProfile,
  changePassword,
  uploadAvatar,
  serveAvatar,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { avatarUpload } from '../middleware/upload';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// Public routes.
// authLimiter guards the credential-accepting endpoints against brute force.
// /refresh is excluded: it already requires a valid refresh token, and clients
// call it routinely on token expiry. /avatar is a public image read.
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.get('/avatar/:filename', serveAvatar);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.patch('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);
router.post('/avatar', authenticate, avatarUpload.single('avatar'), uploadAvatar);

export default router;
