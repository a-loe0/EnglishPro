import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { TranscodeJobData, ThumbnailJobData, JobStatus } from '../types/video';
import { getFFmpegService } from './ffmpeg.service';
import { getStorageService } from './storage.service';
import { PrismaClient } from '@prisma/client';

export interface QueueConfig {
  redisUrl: string;
  concurrency: number;
}

export class QueueService {
  private transcodeQueue: Queue<TranscodeJobData>;
  private thumbnailQueue: Queue<ThumbnailJobData>;
  private transcodeWorker: Worker<TranscodeJobData> | null = null;
  private thumbnailWorker: Worker<ThumbnailJobData> | null = null;
  private transcodeEvents: QueueEvents | null = null;
  private connection: IORedis;
  private prisma: PrismaClient;
  private config: QueueConfig;

  constructor(config?: Partial<QueueConfig>) {
    const redisUrl = config?.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';

    this.config = {
      redisUrl,
      concurrency: config?.concurrency || 2,
    };

    this.connection = new IORedis(this.config.redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.prisma = new PrismaClient();

    this.transcodeQueue = new Queue<TranscodeJobData>('transcode', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 24 * 60 * 60, // 24 hours
          count: 100,
        },
        removeOnFail: {
          age: 7 * 24 * 60 * 60, // 7 days
        },
      },
    });

    this.thumbnailQueue = new Queue<ThumbnailJobData>('thumbnail', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 60 * 60,
          count: 100,
        },
        removeOnFail: {
          age: 7 * 24 * 60 * 60,
        },
      },
    });
  }

  /**
   * Initialize queues and workers
   */
  async init(): Promise<void> {
    // Initialize storage
    const storage = getStorageService();
    await storage.init();

    // Create transcoding worker
    this.transcodeWorker = new Worker<TranscodeJobData>(
      'transcode',
      async (job) => {
        const { videoId, inputPath, outputDir, resolutions } = job.data;
        const ffmpeg = getFFmpegService();

        try {
          // Update video status to processing
          await this.prisma.video.update({
            where: { id: videoId },
            data: { status: 'PROCESSING' },
          });

          // Transcode video
          const manifest = await ffmpeg.transcode({
            inputPath,
            outputDir,
            resolutions,
            onProgress: async (progress, currentResolution) => {
              await job.updateProgress({ progress, currentResolution });
            },
          });

          // Update video with HLS URL
          await this.prisma.video.update({
            where: { id: videoId },
            data: {
              hlsUrl: manifest.masterPlaylist,
              status: 'READY',
            },
          });

          return manifest;
        } catch (error) {
          // Update video status to failed
          await this.prisma.video.update({
            where: { id: videoId },
            data: { status: 'FAILED' },
          });

          throw error;
        }
      },
      {
        connection: this.connection,
        concurrency: this.config.concurrency,
      }
    );

    // Create thumbnail worker
    this.thumbnailWorker = new Worker<ThumbnailJobData>(
      'thumbnail',
      async (job) => {
        const { videoId, inputPath, outputPath, timestamp } = job.data;
        const ffmpeg = getFFmpegService();

        try {
          // Generate thumbnail
          await ffmpeg.generateThumbnail(inputPath, outputPath, timestamp);

          // Update video with thumbnail URL
          await this.prisma.video.update({
            where: { id: videoId },
            data: { thumbnailUrl: outputPath },
          });

          return outputPath;
        } catch (error) {
          console.error(`Thumbnail generation failed for video ${videoId}:`, error);
          throw error;
        }
      },
      {
        connection: this.connection,
        concurrency: this.config.concurrency,
      }
    );

    // Set up event listeners
    this.transcodeWorker.on('completed', (job) => {
      console.log(`Transcode job ${job.id} completed for video ${job.data.videoId}`);
    });

    this.transcodeWorker.on('failed', (job, error) => {
      console.error(`Transcode job ${job?.id} failed:`, error.message);
    });

    this.thumbnailWorker.on('completed', (job) => {
      console.log(`Thumbnail job ${job.id} completed for video ${job.data.videoId}`);
    });

    this.thumbnailWorker.on('failed', (job, error) => {
      console.error(`Thumbnail job ${job?.id} failed:`, error.message);
    });

    // Create queue events for progress tracking
    this.transcodeEvents = new QueueEvents('transcode', {
      connection: this.connection,
    });

    console.log('Queue service initialized');
  }

  /**
   * Add video for transcoding
   */
  async addTranscodeJob(data: TranscodeJobData): Promise<string> {
    const job = await this.transcodeQueue.add('transcode-video', data, {
      jobId: `transcode-${data.videoId}`,
    });

    return job.id!;
  }

  /**
   * Add thumbnail generation job
   */
  async addThumbnailJob(data: ThumbnailJobData): Promise<string> {
    const job = await this.thumbnailQueue.add('generate-thumbnail', data, {
      jobId: `thumbnail-${data.videoId}`,
    });

    return job.id!;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    const job = await this.transcodeQueue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress as { progress?: number } | number;

    return {
      id: job.id!,
      status: this.mapState(state),
      progress: typeof progress === 'number' ? progress : (progress?.progress || 0),
      error: job.failedReason,
    };
  }

  /**
   * Get video transcode status
   */
  async getVideoJobStatus(videoId: string): Promise<JobStatus | null> {
    return this.getJobStatus(`transcode-${videoId}`);
  }

  /**
   * Map BullMQ state to our JobStatus
   */
  private mapState(state: string): JobStatus['status'] {
    switch (state) {
      case 'waiting':
      case 'delayed':
      case 'prioritized':
        return 'waiting';
      case 'active':
        return 'active';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      default:
        return 'waiting';
    }
  }

  /**
   * Clean completed/failed jobs
   */
  async cleanJobs(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    await Promise.all([
      this.transcodeQueue.clean(maxAge, 100, 'completed'),
      this.transcodeQueue.clean(maxAge, 100, 'failed'),
      this.thumbnailQueue.clean(maxAge, 100, 'completed'),
      this.thumbnailQueue.clean(maxAge, 100, 'failed'),
    ]);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down queue service...');

    // Close workers
    if (this.transcodeWorker) {
      await this.transcodeWorker.close();
    }
    if (this.thumbnailWorker) {
      await this.thumbnailWorker.close();
    }

    // Close queue events
    if (this.transcodeEvents) {
      await this.transcodeEvents.close();
    }

    // Close queues
    await this.transcodeQueue.close();
    await this.thumbnailQueue.close();

    // Close Redis connection
    await this.connection.quit();

    // Close Prisma
    await this.prisma.$disconnect();

    console.log('Queue service shut down complete');
  }

  /**
   * Get queue stats
   */
  async getStats(): Promise<{
    transcode: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
    thumbnail: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
  }> {
    const [transcodeWaiting, transcodeActive, transcodeCompleted, transcodeFailed] = await Promise.all([
      this.transcodeQueue.getWaitingCount(),
      this.transcodeQueue.getActiveCount(),
      this.transcodeQueue.getCompletedCount(),
      this.transcodeQueue.getFailedCount(),
    ]);

    const [thumbnailWaiting, thumbnailActive, thumbnailCompleted, thumbnailFailed] = await Promise.all([
      this.thumbnailQueue.getWaitingCount(),
      this.thumbnailQueue.getActiveCount(),
      this.thumbnailQueue.getCompletedCount(),
      this.thumbnailQueue.getFailedCount(),
    ]);

    return {
      transcode: {
        waiting: transcodeWaiting,
        active: transcodeActive,
        completed: transcodeCompleted,
        failed: transcodeFailed,
      },
      thumbnail: {
        waiting: thumbnailWaiting,
        active: thumbnailActive,
        completed: thumbnailCompleted,
        failed: thumbnailFailed,
      },
    };
  }
}

// Singleton instance
let queueInstance: QueueService | null = null;

export function getQueueService(): QueueService {
  if (!queueInstance) {
    queueInstance = new QueueService();
  }
  return queueInstance;
}

export async function initQueueService(): Promise<QueueService> {
  const service = getQueueService();
  await service.init();
  return service;
}

export default QueueService;
