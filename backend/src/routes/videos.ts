import { Router, Request, Response, NextFunction } from 'express';
import { videoController } from '../controllers/videoController';
import { authenticate } from '../middleware/auth';
import { videoUpload, handleMulterError } from '../middleware/upload';

const router = Router();

/**
 * GET /api/videos/:id/thumbnail
 * Get video thumbnail image (public - no auth required for img tags)
 */
router.get('/:id/thumbnail', (req, res, next) => videoController.thumbnail(req, res, next));

// Middleware to check if user is a teacher
const requireTeacher = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as Request & { user: { userId: string; role: string } }).user;

  if (user.role !== 'TEACHER') {
    res.status(403).json({ error: 'Only teachers can perform this action' });
    return;
  }

  next();
};

// Multer error handling middleware
const handleUploadError = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err) {
    const { status, message } = handleMulterError(err);
    res.status(status).json({ error: message });
    return;
  }
  next();
};

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/videos
 * List videos with pagination and filters
 */
router.get('/', (req, res, next) => videoController.list(req, res, next));

/**
 * GET /api/videos/:id
 * Get video details by ID
 */
router.get('/:id', (req, res, next) => videoController.getById(req, res, next));

/**
 * POST /api/videos/upload
 * Upload video file (teacher only)
 * Returns tempId for use with POST /api/videos
 */
router.post(
  '/upload',
  requireTeacher,
  videoUpload.single('video'),
  handleUploadError,
  (req: Request, res: Response, next: NextFunction) => videoController.upload(req, res, next)
);

/**
 * POST /api/videos
 * Create video record after upload (teacher only)
 * Requires tempId from upload response
 */
router.post('/', requireTeacher, (req, res, next) => videoController.create(req, res, next));

/**
 * PATCH /api/videos/:id/publish
 * Publish or unpublish a video (owner only)
 * Body: { isPublished: boolean }
 * NOTE: Must be before /:id to avoid route conflict
 */
router.patch('/:id/publish', requireTeacher, (req, res, next) => videoController.publish(req, res, next));

/**
 * PATCH /api/videos/:id
 * Update video metadata (owner only)
 */
router.patch('/:id', requireTeacher, (req, res, next) => videoController.update(req, res, next));

/**
 * DELETE /api/videos/:id
 * Delete video (owner only)
 */
router.delete('/:id', requireTeacher, (req, res, next) => videoController.delete(req, res, next));

/**
 * GET /api/videos/:id/stream/master.m3u8
 * Get HLS master playlist
 */
router.get('/:id/stream/master.m3u8', (req, res, next) => videoController.streamMaster(req, res, next));

/**
 * GET /api/videos/:id/stream/:resolution/playlist.m3u8
 * Get HLS variant playlist for specific resolution
 */
router.get(
  '/:id/stream/:resolution/playlist.m3u8',
  (req, res, next) => videoController.streamPlaylist(req, res, next)
);

/**
 * GET /api/videos/:id/stream/:resolution/:segment
 * Get HLS segment file
 */
router.get(
  '/:id/stream/:resolution/:segment',
  (req, res, next) => videoController.streamSegment(req, res, next)
);

/**
 * GET /api/videos/:id/status
 * Get video transcoding status
 */
router.get('/:id/status', (req, res, next) => videoController.status(req, res, next));

export default router;
