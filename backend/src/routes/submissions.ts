import { Router, Request, Response, NextFunction } from 'express';
import { submissionController } from '../controllers/submissionController';
import { authenticate, isStudent, isTeacher } from '../middleware/auth';
import { audioUpload, AUDIO_MAX_SIZE, handleMulterError } from '../middleware/upload';
import { pronunciationLimiter } from '../middleware/rateLimit';

const router = Router();

const handleUploadError = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err) {
    const { status, message } = handleMulterError(err, AUDIO_MAX_SIZE);
    res.status(status).json({ error: message });
    return;
  }
  next();
};

// Recordings are of children's voices: every route needs a signed-in user,
// and the controller limits each one to the student and the lesson's teacher.
router.use(authenticate);

/**
 * POST /api/submissions
 * A student sends a recording of one vocabulary word (multipart: audio, videoId, word)
 */
router.post('/', isStudent, pronunciationLimiter, audioUpload.single('audio'), handleUploadError, (req: Request, res: Response, next: NextFunction) =>
  submissionController.create(req, res, next)
);

/**
 * GET /api/submissions/mine
 * The student's own recordings and any feedback on them
 */
router.get('/mine', isStudent, (req, res, next) => submissionController.mine(req, res, next));

/**
 * GET /api/submissions?status=pending|reviewed
 * Recordings sent for the teacher's lessons
 */
router.get('/', isTeacher, (req, res, next) => submissionController.list(req, res, next));

/**
 * PUT /api/submissions/:id/feedback
 * The teacher replies (multipart: text and/or audio)
 */
router.put('/:id/feedback', isTeacher, audioUpload.single('audio'), handleUploadError, (req: Request, res: Response, next: NextFunction) =>
  submissionController.feedback(req, res, next)
);

/**
 * GET /api/submissions/:id/audio and /:id/feedback-audio
 * Play the student's recording or the teacher's recorded reply
 */
router.get('/:id/audio', (req, res, next) => submissionController.audio(req, res, next, 'student'));
router.get('/:id/feedback-audio', (req, res, next) => submissionController.audio(req, res, next, 'feedback'));

/**
 * DELETE /api/submissions/:id
 * Remove a recording (its student, or the lesson's teacher)
 */
router.delete('/:id', (req, res, next) => submissionController.remove(req, res, next));

export default router;
