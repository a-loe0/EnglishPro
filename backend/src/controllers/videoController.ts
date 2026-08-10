import { Request, Response, NextFunction } from 'express';
import { createReadStream, existsSync } from 'fs';
import { stat } from 'fs/promises';
import { join, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getVideoService } from '../services/video.service';
import { getStorageService } from '../services/storage.service';
import { getQueueService } from '../services/queue.service';
import { ListVideosQuery, CreateVideoRequest } from '../types/video';
import { handleMulterError } from '../middleware/upload';

// Store temp file metadata (in production, use Redis)
const tempFiles = new Map<string, { path: string; filename: string; size: number; mimeType: string; expiresAt: number }>();

// Clean up expired temp files periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of tempFiles) {
    if (data.expiresAt < now) {
      tempFiles.delete(id);
    }
  }
}, 60000); // Every minute

export class VideoController {
  /**
   * GET /api/videos - List videos with pagination
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;

      const query: ListVideosQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        courseId: req.query.courseId as string | undefined,
        teacherId: req.query.teacherId as string | undefined,
        status: req.query.status as 'PROCESSING' | 'READY' | 'FAILED' | undefined,
        isPublished: req.query.isPublished !== undefined
          ? req.query.isPublished === 'true'
          : undefined,
        search: req.query.search as string | undefined,
        sortBy: (req.query.sortBy as 'createdAt' | 'title' | 'duration') || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        // Pass user info for filtering
        _userRole: user.role as 'TEACHER' | 'STUDENT',
        _userId: user.userId,
      };

      const videoService = getVideoService();
      const result = await videoService.list(query);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/videos/:id - Get video details
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as Request & { user: { userId: string; role: string } }).user;

      const videoService = getVideoService();
      const video = await videoService.getById(id, user.role, user.userId);

      if (!video) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }

      // Prevent caching to ensure fresh data (especially for hlsUrl)
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json(video);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/videos/upload - Upload video file
   */
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No video file provided' });
        return;
      }

      const storage = getStorageService();
      const file = req.file;

      // Validate file
      const validation = storage.validateVideoFile(file.mimetype, file.originalname, file.size);
      if (!validation.valid) {
        res.status(415).json({ error: validation.error });
        return;
      }

      // Save to temp
      const tempPath = await storage.saveToTemp(file.buffer, file.originalname);

      // Generate temp ID and store metadata
      const tempId = uuidv4();
      tempFiles.set(tempId, {
        path: tempPath,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
      });

      res.json({
        tempId,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      });
    } catch (error) {
      if (error instanceof Error && (error.name === 'MulterError' || error.message.includes('file'))) {
        const { status, message } = handleMulterError(error);
        res.status(status).json({ error: message });
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/videos - Create video record after upload
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as Request & { user: { userId: string; role: string } }).user;
      const { tempId, title, description, courseId } = req.body as CreateVideoRequest;

      // Validate required fields
      if (!tempId || !title) {
        res.status(400).json({ error: 'tempId and title are required' });
        return;
      }

      // Validate title length
      if (title.length > 200) {
        res.status(400).json({ error: 'Title must be 200 characters or less' });
        return;
      }

      // Validate description length
      if (description && description.length > 5000) {
        res.status(400).json({ error: 'Description must be 5000 characters or less' });
        return;
      }

      // Get temp file info
      const tempData = tempFiles.get(tempId);
      if (!tempData) {
        res.status(400).json({ error: 'Invalid or expired tempId. Please upload the file again.' });
        return;
      }

      // Remove from temp storage
      tempFiles.delete(tempId);

      // Create video
      const videoService = getVideoService();
      const video = await videoService.create(user.userId, tempData.path, {
        tempId,
        title,
        description,
        courseId,
      });

      res.status(201).json(video);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/videos/:id - Update video metadata
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as Request & { user: { userId: string; role: string } }).user;
      const { title, description, courseId } = req.body;

      const videoService = getVideoService();

      // Check ownership
      const isOwner = await videoService.isOwner(id, user.userId);
      if (!isOwner) {
        res.status(403).json({ error: 'You do not have permission to update this video' });
        return;
      }

      // Build update data
      const updateData: { title?: string; description?: string; courseId?: string | null } = {};

      if (title !== undefined) {
        if (title.length > 200) {
          res.status(400).json({ error: 'Title must be 200 characters or less' });
          return;
        }
        updateData.title = title;
      }

      if (description !== undefined) {
        if (description.length > 5000) {
          res.status(400).json({ error: 'Description must be 5000 characters or less' });
          return;
        }
        updateData.description = description;
      }

      if (courseId !== undefined) {
        updateData.courseId = courseId || null;
      }

      const video = await videoService.update(id, updateData);
      res.json(video);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/videos/:id - Delete video
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as Request & { user: { userId: string; role: string } }).user;

      const videoService = getVideoService();

      // Check ownership
      const isOwner = await videoService.isOwner(id, user.userId);
      if (!isOwner) {
        res.status(403).json({ error: 'You do not have permission to delete this video' });
        return;
      }

      await videoService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/videos/:id/stream/master.m3u8 - HLS master playlist
   */
  async streamMaster(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as Request & { user: { userId: string; role: string } }).user;

      const videoService = getVideoService();
      const video = await videoService.getById(id, user.role, user.userId);

      if (!video) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }

      if (video.status !== 'READY') {
        res.status(400).json({ error: 'Video is not ready for streaming' });
        return;
      }

      const storage = getStorageService();
      const masterPath = join(storage.getHlsDir(id), 'master.m3u8');

      if (!existsSync(masterPath)) {
        res.status(404).json({ error: 'HLS playlist not found' });
        return;
      }

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'max-age=3600');
      createReadStream(masterPath).pipe(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/videos/:id/stream/:resolution/playlist.m3u8 - HLS variant playlist
   */
  async streamPlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, resolution } = req.params;

      const storage = getStorageService();
      const playlistPath = join(storage.getHlsDir(id), resolution, 'playlist.m3u8');

      if (!existsSync(playlistPath)) {
        res.status(404).json({ error: 'Playlist not found' });
        return;
      }

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'max-age=3600');
      createReadStream(playlistPath).pipe(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/videos/:id/stream/:resolution/:segment - HLS segment
   */
  async streamSegment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, resolution, segment } = req.params;

      const storage = getStorageService();
      const segmentPath = join(storage.getHlsDir(id), resolution, segment);

      if (!existsSync(segmentPath)) {
        res.status(404).json({ error: 'Segment not found' });
        return;
      }

      const stats = await stat(segmentPath);

      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'max-age=31536000'); // 1 year (immutable content)
      createReadStream(segmentPath).pipe(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/videos/:id/thumbnail - Get thumbnail
   */
  async thumbnail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const storage = getStorageService();
      const thumbnailPath = storage.getThumbnailPath(id);

      if (!existsSync(thumbnailPath)) {
        res.status(404).json({ error: 'Thumbnail not found' });
        return;
      }

      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'max-age=86400'); // 24 hours
      createReadStream(thumbnailPath).pipe(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/videos/:id/status - Get transcoding status
   */
  async status(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as Request & { user: { userId: string; role: string } }).user;

      const videoService = getVideoService();
      const video = await videoService.getById(id, user.role, user.userId);

      if (!video) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }

      // Get job status from queue
      const queue = getQueueService();
      const jobStatus = await queue.getVideoJobStatus(id);

      res.json({
        videoId: id,
        videoStatus: video.status,
        job: jobStatus,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/videos/:id/publish - Publish or unpublish a video
   */
  async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as Request & { user: { userId: string; role: string } }).user;
      const { isPublished } = req.body;

      if (typeof isPublished !== 'boolean') {
        res.status(400).json({ error: 'isPublished must be a boolean' });
        return;
      }

      const videoService = getVideoService();

      // Check ownership
      const isOwner = await videoService.isOwner(id, user.userId);
      if (!isOwner) {
        res.status(403).json({ error: 'You do not have permission to publish this video' });
        return;
      }

      // Get video to check status
      const video = await videoService.getById(id);
      if (!video) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }

      // Only allow publishing READY videos
      if (isPublished && video.status !== 'READY') {
        res.status(400).json({ error: 'Only videos with READY status can be published' });
        return;
      }

      const updatedVideo = await videoService.setPublished(id, isPublished);
      res.json(updatedVideo);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const videoController = new VideoController();
export default videoController;
