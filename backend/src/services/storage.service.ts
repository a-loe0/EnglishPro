import { mkdir, unlink, stat, readdir, rename, rm } from 'fs/promises';
import { createWriteStream, existsSync } from 'fs';
import { join, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export interface StorageConfig {
  basePath: string;
  videosPath: string;
  thumbnailsPath: string;
  submissionsPath: string;
  avatarsPath: string;
  tempPath: string;
}

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

export class StorageService {
  private config: StorageConfig;

  constructor(config?: Partial<StorageConfig>) {
    const basePath = config?.basePath || process.env.STORAGE_PATH || `${process.env.HOME}/englishpro-storage`;

    this.config = {
      basePath,
      videosPath: config?.videosPath || process.env.VIDEOS_PATH || join(basePath, 'videos'),
      thumbnailsPath: config?.thumbnailsPath || process.env.THUMBNAILS_PATH || join(basePath, 'thumbnails'),
      submissionsPath: config?.submissionsPath || process.env.SUBMISSIONS_PATH || join(basePath, 'submissions'),
      avatarsPath: config?.avatarsPath || process.env.AVATARS_PATH || join(basePath, 'avatars'),
      tempPath: config?.tempPath || process.env.TEMP_PATH || join(basePath, 'temp'),
    };
  }

  /**
   * Initialize storage directories
   */
  async init(): Promise<void> {
    await Promise.all([
      this.ensureDir(this.config.videosPath),
      this.ensureDir(join(this.config.videosPath, 'hls')),
      this.ensureDir(this.config.thumbnailsPath),
      this.ensureDir(this.config.submissionsPath),
      this.ensureDir(this.config.avatarsPath),
      this.ensureDir(this.config.tempPath),
    ]);
  }

  /**
   * Validate file type for video uploads
   */
  validateVideoFile(mimeType: string, filename: string, size: number): { valid: boolean; error?: string } {
    // Check file size
    if (size > MAX_VIDEO_SIZE) {
      return { valid: false, error: `File size exceeds ${MAX_VIDEO_SIZE / (1024 * 1024)}MB limit` };
    }

    // Check MIME type
    if (!ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      return { valid: false, error: 'Invalid file type. Only MP4, WebM, and MOV allowed.' };
    }

    // Check extension
    const ext = extname(filename).toLowerCase();
    if (!ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
      return { valid: false, error: 'Invalid file extension. Only .mp4, .webm, and .mov allowed.' };
    }

    return { valid: true };
  }

  /**
   * Save uploaded file to temp directory
   */
  async saveToTemp(buffer: Buffer, filename: string): Promise<string> {
    await this.ensureDir(this.config.tempPath);

    const tempId = uuidv4();
    const ext = extname(filename);
    const tempFilename = `${tempId}${ext}`;
    const tempPath = join(this.config.tempPath, tempFilename);

    await this.writeBuffer(tempPath, buffer);

    return tempPath;
  }

  /**
   * Save stream to temp directory
   */
  async saveStreamToTemp(stream: Readable, filename: string): Promise<string> {
    await this.ensureDir(this.config.tempPath);

    const tempId = uuidv4();
    const ext = extname(filename);
    const tempFilename = `${tempId}${ext}`;
    const tempPath = join(this.config.tempPath, tempFilename);

    const writeStream = createWriteStream(tempPath);
    await pipeline(stream, writeStream);

    return tempPath;
  }

  /**
   * Move file from temp to permanent storage
   */
  async moveToStorage(
    tempPath: string,
    type: 'videos' | 'thumbnails' | 'submissions',
    filename?: string
  ): Promise<string> {
    const storagePath = this.getStoragePath(type);
    await this.ensureDir(storagePath);

    const ext = extname(tempPath);
    const newFilename = filename || `${uuidv4()}${ext}`;
    const destPath = join(storagePath, newFilename);

    await rename(tempPath, destPath);

    return destPath;
  }

  /**
   * Create a video directory for HLS output
   */
  async createVideoDir(videoId: string): Promise<string> {
    const videoDir = join(this.config.videosPath, videoId);
    await this.ensureDir(videoDir);
    return videoDir;
  }

  /**
   * Get storage path by type
   */
  getStoragePath(type: 'videos' | 'thumbnails' | 'submissions' | 'avatars'): string {
    switch (type) {
      case 'videos':
        return this.config.videosPath;
      case 'thumbnails':
        return this.config.thumbnailsPath;
      case 'submissions':
        return this.config.submissionsPath;
      case 'avatars':
        return this.config.avatarsPath;
    }
  }

  /**
   * Get avatar path for a user
   */
  getAvatarPath(userId: string, ext: string = '.jpg'): string {
    return join(this.config.avatarsPath, `${userId}${ext}`);
  }

  /**
   * Get file path by ID and type
   */
  getFilePath(id: string, type: 'videos' | 'thumbnails' | 'submissions', filename?: string): string {
    const basePath = this.getStoragePath(type);
    if (filename) {
      return join(basePath, id, filename);
    }
    return join(basePath, id);
  }

  /**
   * Get HLS output directory for a video
   */
  getHlsDir(videoId: string): string {
    return join(this.config.videosPath, videoId);
  }

  /**
   * Get thumbnail path for a video
   */
  getThumbnailPath(videoId: string): string {
    return join(this.config.thumbnailsPath, `${videoId}.jpg`);
  }

  /**
   * Delete file
   */
  async deleteFile(path: string): Promise<void> {
    try {
      await unlink(path);
    } catch (error: unknown) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Delete directory recursively
   */
  async deleteDir(path: string): Promise<void> {
    try {
      await rm(path, { recursive: true, force: true });
    } catch (error: unknown) {
      // Ignore if directory doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(path: string): Promise<{ size: number; modified: Date } | null> {
    try {
      const stats = await stat(path);
      return {
        size: stats.size,
        modified: stats.mtime,
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if file exists
   */
  fileExists(path: string): boolean {
    return existsSync(path);
  }

  /**
   * Create directory if not exists
   */
  async ensureDir(path: string): Promise<void> {
    await mkdir(path, { recursive: true });
  }

  /**
   * Clean temp files older than maxAge (ms)
   */
  async cleanTemp(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    try {
      const files = await readdir(this.config.tempPath);

      for (const file of files) {
        const filePath = join(this.config.tempPath, file);
        const stats = await this.getFileStats(filePath);

        if (stats && now - stats.modified.getTime() > maxAge) {
          await this.deleteFile(filePath);
          cleaned++;
        }
      }
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Error cleaning temp files:', error);
      }
    }

    return cleaned;
  }

  /**
   * Get config
   */
  getConfig(): StorageConfig {
    return { ...this.config };
  }

  /**
   * Write buffer to file
   */
  private async writeBuffer(path: string, buffer: Buffer): Promise<void> {
    const writeStream = createWriteStream(path);

    return new Promise((resolve, reject) => {
      writeStream.write(buffer, (error) => {
        if (error) {
          reject(error);
        } else {
          writeStream.end();
          resolve();
        }
      });

      writeStream.on('error', reject);
    });
  }
}

// Singleton instance
let storageInstance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!storageInstance) {
    storageInstance = new StorageService();
  }
  return storageInstance;
}

export default StorageService;
