import { Request, Response, NextFunction } from 'express';
import { existsSync } from 'fs';
import { rename } from 'fs/promises';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { getStorageService } from '../services/storage.service';
import { getFFmpegService } from '../services/ffmpeg.service';
import { canRecordWord, LESSON_RECORDING_WORD } from '../types/practice';
import { GUEST_NAME } from './authController';
import { canPostMessage, hasUnreadReply } from '../utils/conversation';

const prisma = new PrismaClient();

// A word or short sentence, not a speech. A lesson recording can run longer.
const MAX_STUDENT_SECONDS = 30;
const MAX_LESSON_RECORDING_SECONDS = 60;
const MAX_FEEDBACK_SECONDS = 120;
const MAX_FEEDBACK_TEXT = 500;
const MAX_MESSAGE_SECONDS = 60;

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

type MessageRow = {
  id: string;
  fromTeacher: boolean;
  text: string | null;
  hasAudio: boolean;
  createdAt: Date;
};

type SubmissionRow = {
  id: string;
  videoId: string;
  word: string;
  feedbackText: string | null;
  hasFeedbackAudio: boolean;
  reviewedAt: Date | null;
  studentSeenAt?: Date | null;
  createdAt: Date;
  messages?: MessageRow[];
};

const toMessage = (m: MessageRow) => ({
  id: m.id,
  fromTeacher: m.fromTeacher,
  text: m.text,
  hasAudio: m.hasAudio,
  createdAt: m.createdAt,
});

const toResponse = (s: SubmissionRow) => ({
  id: s.id,
  videoId: s.videoId,
  word: s.word,
  feedbackText: s.feedbackText,
  hasFeedbackAudio: s.hasFeedbackAudio,
  reviewedAt: s.reviewedAt,
  createdAt: s.createdAt,
  messages: (s.messages ?? []).map(toMessage),
  unread: hasUnreadReply(s.reviewedAt, s.studentSeenAt ?? null),
});

// Follow-up messages oldest first, as a conversation reads.
const withMessages = { messages: { orderBy: { createdAt: 'asc' as const } } };

async function deleteMessageAudio(messages: { id: string; hasAudio: boolean }[]): Promise<void> {
  const storage = getStorageService();
  await Promise.all(messages.filter((m) => m.hasAudio).map((m) => storage.deleteFile(storage.getMessageAudioPath(m.id))));
}

export class SubmissionController {
  /**
   * POST /api/submissions - A student sends a recording of one word, or of
   * the whole lesson (empty word)
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

      // Only lessons students can see; a word must be one the teacher added.
      const video = await prisma.video.findFirst({
        where: { id: videoId, isPublished: true, status: 'READY' },
        select: { practice: true },
      });
      if (!video || !canRecordWord(video.practice, word)) {
        res.status(404).json({ error: 'That word is not in this lesson' });
        return;
      }
      const maxSeconds = word === LESSON_RECORDING_WORD ? MAX_LESSON_RECORDING_SECONDS : MAX_STUDENT_SECONDS;

      const key = { studentId_videoId_word: { studentId: userId, videoId, word } };
      const existing = await prisma.pronunciationSubmission.findUnique({ where: key, select: { id: true } });
      const id = existing?.id ?? randomUUID();

      const storage = getStorageService();
      await storage.ensureDir(storage.getStoragePath('submissions'));
      if (!(await saveRecording(req.file, storage.getSubmissionAudioPath(id), maxSeconds))) {
        res.status(415).json({ error: NOT_AUDIO });
        return;
      }

      // Sending again starts over: the old replies were about the old recording.
      const oldMessages = existing
        ? await prisma.pronunciationMessage.findMany({ where: { submissionId: id }, select: { id: true, hasAudio: true } })
        : [];
      const submission = await prisma.pronunciationSubmission.upsert({
        where: key,
        create: { id, studentId: userId, videoId, word },
        update: {
          feedbackText: null,
          hasFeedbackAudio: false,
          reviewedAt: null,
          studentSeenAt: null,
          createdAt: new Date(),
          messages: { deleteMany: {} },
        },
      });
      await storage.deleteFile(storage.getSubmissionAudioPath(id, 'feedback'));
      await deleteMessageAudio(oldMessages);

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
        include: withMessages,
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
            ...withMessages,
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
        include: withMessages,
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

      const messages = await prisma.pronunciationMessage.findMany({
        where: { submissionId: submission.id },
        select: { id: true, hasAudio: true },
      });
      await prisma.pronunciationSubmission.delete({ where: { id: submission.id } });
      await getStorageService().deleteSubmissionAudio(submission.id);
      await deleteMessageAudio(messages);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/submissions/:id/messages - The student or the teacher answers
   * (multipart: text and/or audio), after the teacher's first reply
   */
  async postMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, role } = req.user!;
      const fromTeacher = role === 'TEACHER';
      const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';

      if (text.length > MAX_FEEDBACK_TEXT) {
        res.status(400).json({ error: `Messages must be ${MAX_FEEDBACK_TEXT} characters or fewer` });
        return;
      }
      if (!text && !req.file) {
        res.status(400).json({ error: 'Write or record something first' });
        return;
      }

      const submission = await prisma.pronunciationSubmission.findFirst({
        where: { id: req.params.id, ...(fromTeacher ? { video: { teacherId: userId } } : { studentId: userId }) },
        include: { _count: { select: { messages: true } } },
      });
      if (!submission) {
        res.status(404).json({ error: 'Recording not found' });
        return;
      }
      if (!canPostMessage(submission, submission._count.messages)) {
        res.status(409).json({ error: 'You cannot reply to this recording right now' });
        return;
      }

      const messageId = randomUUID();
      if (req.file) {
        const storage = getStorageService();
        await storage.ensureDir(storage.getStoragePath('submissions'));
        if (!(await saveRecording(req.file, storage.getMessageAudioPath(messageId), MAX_MESSAGE_SECONDS))) {
          res.status(415).json({ error: NOT_AUDIO });
          return;
        }
      }

      // Whoever spoke last is waiting on the other: a student's answer puts the
      // recording back in the teacher's "To review" list.
      const [, updated] = await prisma.$transaction([
        prisma.pronunciationMessage.create({
          data: { id: messageId, submissionId: submission.id, fromTeacher, text: text || null, hasAudio: !!req.file },
        }),
        prisma.pronunciationSubmission.update({
          where: { id: submission.id },
          data: fromTeacher ? { reviewedAt: new Date() } : { reviewedAt: null, studentSeenAt: new Date() },
          include: withMessages,
        }),
      ]);
      res.status(201).json(toResponse(updated));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/submissions/:id/messages/:messageId/audio - Play a recorded message
   */
  async messageAudio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const submission = await this.findVisible(req);
      const message =
        submission &&
        (await prisma.pronunciationMessage.findFirst({
          where: { id: req.params.messageId, submissionId: submission.id, hasAudio: true },
          select: { id: true },
        }));
      const path = message && getStorageService().getMessageAudioPath(message.id);
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
   * POST /api/submissions/:id/seen - The student has read the teacher's replies
   */
  async markSeen(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { count } = await prisma.pronunciationSubmission.updateMany({
        where: { id: req.params.id, studentId: req.user!.userId },
        data: { studentSeenAt: new Date() },
      });
      res.status(count ? 204 : 404).end();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/submissions/badge - The number for the Pronunciation menu item:
   * recordings waiting on the teacher, or replies the student has not opened
   */
  async badge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, role } = req.user!;
      if (role === 'TEACHER') {
        const count = await prisma.pronunciationSubmission.count({
          where: { video: { teacherId: userId }, reviewedAt: null },
        });
        res.json({ count });
        return;
      }
      const mine = await prisma.pronunciationSubmission.findMany({
        where: { studentId: userId, reviewedAt: { not: null } },
        select: { reviewedAt: true, studentSeenAt: true },
      });
      res.json({ count: mine.filter((s) => hasUnreadReply(s.reviewedAt, s.studentSeenAt)).length });
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
