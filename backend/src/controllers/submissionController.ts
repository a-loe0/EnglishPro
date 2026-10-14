import { Request, Response, NextFunction } from 'express';
import { existsSync } from 'fs';
import { rename } from 'fs/promises';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { getStorageService } from '../services/storage.service';
import { getFFmpegService } from '../services/ffmpeg.service';
import { lessonPracticeSchema } from '../types/practice';
import { GUEST_NAME } from './authController';

const prisma = new PrismaClient();

// A word or short sentence, not a speech.
const MAX_STUDENT_SECONDS = 30;
const MAX_FEEDBACK_SECONDS = 120;
const MAX_FEEDBACK_TEXT = 500;

/**
 * Convert an uploaded recording to MP3 at `destPath`. Returns false when the
 * upload is not audio. The old file, if any, stays until the new one is ready.
 */
async function saveRecording(file: Express.Multer.File, destPath: string, maxSeconds: number): Promise<boolean> {
  const storage = getStorageService();
  const tempPath = await storage.saveToTemp(file.buffer, file.originalname);
  const convertedPath = `${tempPath}.converted`;
  try {
    await getFFmpegService().toMp3(tempPath, convertedPath, maxSeconds);
    await rename(convertedPath, destPath);
    return true;
  } catch (error) {
    console.error('Recording conversion failed:', error);
    await storage.deleteFile(convertedPath);
    return false;
  } finally {
    await storage.deleteFile(tempPath);
  }
}

const NOT_AUDIO = 'Could not read that recording. Please try again.';

type SubmissionRow = {
  id: string;
  videoId: string;
  word: string;
  feedbackText: string | null;
  hasFeedbackAudio: boolean;
  reviewedAt: Date | null;
  createdAt: Date;
};

const toResponse = (s: SubmissionRow) => ({
  id: s.id,
  videoId: s.videoId,
  word: s.word,
  feedbackText: s.feedbackText,
  hasFeedbackAudio: s.hasFeedbackAudio,
  reviewedAt: s.reviewedAt,
  createdAt: s.createdAt,
});

export class SubmissionController {
  /**
   * POST /api/submissions - A student sends a recording of one word
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { videoId, word } = req.body as { videoId?: string; word?: string };

      if (!req.file) {
        res.status(400).json({ error: 'No audio file provided' });
        return;
      }
      if (typeof videoId !== 'string' || typeof word !== 'string') {
        res.status(400).json({ error: 'videoId and word are required' });
        return;
      }

      // The teacher needs to know whose recording this is.
      const student = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      if (!student || student.name === GUEST_NAME) {
        res.status(400).json({ error: 'Please tell us your name first', code: 'NAME_REQUIRED' });
        return;
      }

      // Only words the teacher put in a lesson students can see.
      const video = await prisma.video.findFirst({
        where: { id: videoId, isPublished: true, status: 'READY' },
        select: { practice: true },
      });
      const practice = lessonPracticeSchema.safeParse(video?.practice ?? {});
      if (!video || !practice.success || !practice.data.vocab.some((v) => v.word === word)) {
        res.status(404).json({ error: 'That word is not in this lesson' });
        return;
      }

      const key = { studentId_videoId_word: { studentId: userId, videoId, word } };
      const existing = await prisma.pronunciationSubmission.findUnique({ where: key, select: { id: true } });
      const id = existing?.id ?? randomUUID();

      const storage = getStorageService();
      await storage.ensureDir(storage.getStoragePath('submissions'));
      if (!(await saveRecording(req.file, storage.getSubmissionAudioPath(id), MAX_STUDENT_SECONDS))) {
        res.status(415).json({ error: NOT_AUDIO });
        return;
      }

      // Sending again starts over: the old feedback was about the old recording.
      const submission = await prisma.pronunciationSubmission.upsert({
        where: key,
        create: { id, studentId: userId, videoId, word },
        update: { feedbackText: null, hasFeedbackAudio: false, reviewedAt: null, createdAt: new Date() },
      });
      await storage.deleteFile(storage.getSubmissionAudioPath(id, 'feedback'));

      res.status(201).json(toResponse(submission));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/submissions/mine - The student's own recordings
   */
  async mine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const submissions = await prisma.pronunciationSubmission.findMany({
        where: { studentId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ data: submissions.map(toResponse) });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/submissions - Recordings sent for the teacher's lessons
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviewed = req.query.status === 'reviewed';
      const mine = { video: { teacherId: req.user!.userId } };

      const [submissions, pendingCount] = await Promise.all([
        prisma.pronunciationSubmission.findMany({
          where: { ...mine, reviewedAt: reviewed ? { not: null } : null },
          // Oldest waiting first; most recently answered first.
          orderBy: reviewed ? { reviewedAt: 'desc' } : { createdAt: 'asc' },
          take: 100,
          include: {
            student: { select: { id: true, name: true } },
            video: { select: { id: true, title: true } },
          },
        }),
        prisma.pronunciationSubmission.count({ where: { ...mine, reviewedAt: null } }),
      ]);

      res.json({
        data: submissions.map((s) => ({ ...toResponse(s), student: s.student, video: s.video })),
        pendingCount,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/submissions/:id/feedback - The teacher replies
   */
  async feedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';

      if (text.length > MAX_FEEDBACK_TEXT) {
        res.status(400).json({ error: `Feedback must be ${MAX_FEEDBACK_TEXT} characters or fewer` });
        return;
      }

      const submission = await prisma.pronunciationSubmission.findFirst({
        where: { id, video: { teacherId: req.user!.userId } },
      });
      if (!submission) {
        res.status(404).json({ error: 'Recording not found' });
        return;
      }
      if (!text && !req.file && !submission.hasFeedbackAudio) {
        res.status(400).json({ error: 'Write or record some feedback first' });
        return;
      }

      const storage = getStorageService();
      if (
        req.file &&
        !(await saveRecording(req.file, storage.getSubmissionAudioPath(id, 'feedback'), MAX_FEEDBACK_SECONDS))
      ) {
        res.status(415).json({ error: NOT_AUDIO });
        return;
      }

      const updated = await prisma.pronunciationSubmission.update({
        where: { id },
        data: {
          feedbackText: text || null,
          hasFeedbackAudio: submission.hasFeedbackAudio || !!req.file,
          reviewedAt: new Date(),
        },
      });
      res.json(toResponse(updated));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/submissions/:id/audio | /feedback-audio - Play a recording
   */
  async audio(req: Request, res: Response, next: NextFunction, kind: 'student' | 'feedback'): Promise<void> {
    try {
      const submission = await this.findVisible(req);
      const path = submission && getStorageService().getSubmissionAudioPath(submission.id, kind);
      if (!path || !existsSync(path)) {
        res.status(404).json({ error: 'Recording not found' });
        return;
      }

      res.setHeader('Cache-Control', 'private, no-store');
      res.sendFile(path, (error) => {
        if (error && !res.headersSent) next(error);
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/submissions/:id - Remove a recording
   */
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const submission = await this.findVisible(req);
      if (!submission) {
        res.status(404).json({ error: 'Recording not found' });
        return;
      }

      await prisma.pronunciationSubmission.delete({ where: { id: submission.id } });
      await getStorageService().deleteSubmissionAudio(submission.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // The submission named in the URL, if this user is its student or the
  // lesson's teacher. Anyone else gets the same "not found" as a bad id.
  private findVisible(req: Request) {
    const { userId } = req.user!;
    return prisma.pronunciationSubmission.findFirst({
      where: { id: req.params.id, OR: [{ studentId: userId }, { video: { teacherId: userId } }] },
      select: { id: true },
    });
  }
}

export const submissionController = new SubmissionController();
