import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { getStorageService } from '../services/storage.service';

const MAX_VIDEO_SIZE = parseInt(process.env.MAX_VIDEO_SIZE_MB || '500') * 1024 * 1024;
const MAX_SUBMISSION_SIZE = parseInt(process.env.MAX_SUBMISSION_SIZE_MB || '100') * 1024 * 1024;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.wav', '.aac', '.ogg', '.oga', '.opus', '.flac', '.webm', '.mp4'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * File filter for video uploads
 */
const videoFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, WebM, and MOV allowed.'));
  }
};

/**
 * Multer configuration for video uploads
 * Uses memory storage for better control over file handling
 */
export const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_VIDEO_SIZE,
    files: 1,
  },
  fileFilter: videoFilter,
});

/**
 * Multer configuration for submission uploads
 */
export const submissionUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_SUBMISSION_SIZE,
    files: 1,
  },
  fileFilter: videoFilter,
});

/**
 * File filter for image uploads (avatars)
 */
const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP allowed.'));
  }
};

/**
 * Multer configuration for avatar uploads
 */
export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AVATAR_SIZE,
    files: 1,
  },
  fileFilter: imageFilter,
});

/**
 * File filter for audio uploads. Phone voice memos and browser recordings
 * arrive as audio/* or as an audio-only mp4/webm labelled video/*; ffmpeg
 * decides later whether the file really holds audio.
 */
const audioFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  // Some phones and browsers send recordings with a generic type, so the
  // extension counts too.
  const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
  if (
    file.mimetype.startsWith('audio/') ||
    ['video/mp4', 'video/webm'].includes(file.mimetype) ||
    ALLOWED_AUDIO_EXTENSIONS.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files allowed.'));
  }
};

/**
 * Multer configuration for vocabulary recordings
 */
export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AUDIO_SIZE,
    files: 1,
  },
  fileFilter: audioFilter,
});

/**
 * Error handler for multer errors
 */
export function handleMulterError(
  error: Error,
  maxSize: number = MAX_VIDEO_SIZE
): { status: number; message: string } {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return {
          status: 413,
          message: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
        };
      case 'LIMIT_FILE_COUNT':
        return { status: 400, message: 'Only one file allowed per upload' };
      case 'LIMIT_UNEXPECTED_FILE':
        return { status: 400, message: 'Unexpected field name for file upload' };
      default:
        return { status: 400, message: error.message };
    }
  }

  // Custom filter errors
  if (error.message.includes('Invalid file type')) {
    return { status: 415, message: error.message };
  }

  return { status: 500, message: 'File upload failed' };
}

export const AUDIO_MAX_SIZE = MAX_AUDIO_SIZE;

export default { videoUpload, submissionUpload, avatarUpload, audioUpload, handleMulterError };
