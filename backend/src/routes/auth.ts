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

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/avatar/:filename', serveAvatar);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.patch('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);
router.post('/avatar', authenticate, avatarUpload.single('avatar'), uploadAvatar);

export default router;
