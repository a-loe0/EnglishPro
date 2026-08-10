import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import {
  Resolution,
  VideoMetadata,
  HLSManifest,
  RESOLUTION_PRESETS,
} from '../types/video';

export interface FFmpegConfig {
  ffmpegPath: string;
  ffprobePath: string;
}

export interface TranscodeOptions {
  inputPath: string;
  outputDir: string;
  resolutions?: Resolution[];
  hlsSegmentDuration?: number;
  onProgress?: (progress: number, currentResolution: string) => void;
}

export class FFmpegService extends EventEmitter {
  private config: FFmpegConfig;

  constructor(config?: Partial<FFmpegConfig>) {
    super();

    const defaultFfmpegPath = process.env.FFMPEG_PATH || '/opt/homebrew/bin/ffmpeg';
    const ffmpegDir = defaultFfmpegPath.replace('/ffmpeg', '');

    this.config = {
      ffmpegPath: config?.ffmpegPath || defaultFfmpegPath,
      ffprobePath: config?.ffprobePath || `${ffmpegDir}/ffprobe`,
    };
  }

  /**
   * Extract video metadata using ffprobe
   */
  async getMetadata(inputPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        inputPath,
      ];

      const proc = spawn(this.config.ffprobePath, args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe failed: ${stderr}`));
          return;
        }

        try {
          const data = JSON.parse(stdout);
          const videoStream = data.streams.find((s: { codec_type: string }) => s.codec_type === 'video');
          const audioStream = data.streams.find((s: { codec_type: string }) => s.codec_type === 'audio');

          if (!videoStream) {
            reject(new Error('No video stream found'));
            return;
          }

          // Parse frame rate (e.g., "30/1" or "29.97")
          let fps = 30;
          if (videoStream.r_frame_rate) {
            const [num, den] = videoStream.r_frame_rate.split('/');
            fps = den ? parseInt(num) / parseInt(den) : parseFloat(num);
          }

          resolve({
            duration: parseFloat(data.format.duration) || 0,
            width: videoStream.width,
            height: videoStream.height,
            fps: Math.round(fps * 100) / 100,
            codec: videoStream.codec_name,
            bitrate: parseInt(data.format.bit_rate) || 0,
            audioCodec: audioStream?.codec_name || 'none',
            audioSampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate) : 0,
          });
        } catch (error) {
          reject(new Error(`Failed to parse ffprobe output: ${error}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Get optimal resolutions based on source video
   */
  getOptimalResolutions(sourceWidth: number, sourceHeight: number): Resolution[] {
    return RESOLUTION_PRESETS.filter((res) => {
      // Only include resolutions smaller than or equal to source
      return res.height <= sourceHeight;
    });
  }

  /**
   * Transcode video to multiple resolutions with HLS
   */
  async transcode(options: TranscodeOptions): Promise<HLSManifest> {
    const {
      inputPath,
      outputDir,
      hlsSegmentDuration = 6,
      onProgress,
    } = options;

    // Get source metadata
    const metadata = await this.getMetadata(inputPath);

    // Determine resolutions to transcode to
    const resolutions = options.resolutions || this.getOptimalResolutions(metadata.width, metadata.height);

    if (resolutions.length === 0) {
      // If source is very small, use 360p
      resolutions.push(RESOLUTION_PRESETS[RESOLUTION_PRESETS.length - 1]);
    }

    // Create output directory
    await mkdir(outputDir, { recursive: true });

    // Transcode each resolution
    const variants: HLSManifest['variants'] = [];
    let completedResolutions = 0;

    for (const resolution of resolutions) {
      const resolutionDir = join(outputDir, resolution.name);
      await mkdir(resolutionDir, { recursive: true });

      const playlistPath = join(resolutionDir, 'playlist.m3u8');

      await this.transcodeToHLS(
        inputPath,
        resolutionDir,
        resolution,
        hlsSegmentDuration,
        metadata.duration,
        (progress) => {
          // Calculate overall progress
          const resolutionProgress = (completedResolutions + progress / 100) / resolutions.length;
          onProgress?.(Math.round(resolutionProgress * 100), resolution.name);
        }
      );

      // Calculate bandwidth (bitrate in bits/s)
      const bitrateNum = parseInt(resolution.bitrate.replace('k', '')) * 1000;

      variants.push({
        resolution: resolution.name,
        bandwidth: bitrateNum,
        playlist: `${resolution.name}/playlist.m3u8`,
      });

      completedResolutions++;
    }

    // Generate master playlist
    const masterPlaylistPath = join(outputDir, 'master.m3u8');
    const masterPlaylistContent = this.generateMasterPlaylist(variants);
    await writeFile(masterPlaylistPath, masterPlaylistContent);

    return {
      masterPlaylist: masterPlaylistPath,
      variants,
    };
  }

  /**
   * Transcode to a single HLS resolution
   */
  private transcodeToHLS(
    inputPath: string,
    outputDir: string,
    resolution: Resolution,
    segmentDuration: number,
    totalDuration: number,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const playlistPath = join(outputDir, 'playlist.m3u8');
      const segmentPattern = join(outputDir, 'segment%03d.ts');

      const args = [
        '-i', inputPath,
        '-vf', `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2`,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-b:v', resolution.bitrate,
        '-maxrate', resolution.bitrate,
        '-bufsize', `${parseInt(resolution.bitrate) * 2}k`,
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '44100',
        '-hls_time', segmentDuration.toString(),
        '-hls_playlist_type', 'vod',
        '-hls_segment_filename', segmentPattern,
        '-f', 'hls',
        '-progress', 'pipe:1',
        '-y',
        playlistPath,
      ];

      const proc = spawn(this.config.ffmpegPath, args);
      let progressOutput = '';

      proc.stdout.on('data', (data) => {
        progressOutput += data.toString();

        // Parse progress from ffmpeg output
        const timeMatch = progressOutput.match(/out_time_ms=(\d+)/);
        if (timeMatch && totalDuration > 0) {
          const currentMs = parseInt(timeMatch[1]) / 1000000; // Convert microseconds to seconds
          const progress = Math.min(100, Math.round((currentMs / totalDuration) * 100));
          onProgress?.(progress);
        }
      });

      proc.stderr.on('data', (data) => {
        // FFmpeg writes progress to stderr, but we use -progress pipe:1
        this.emit('ffmpeg:stderr', data.toString());
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg transcoding failed with code ${code}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Generate HLS master playlist
   */
  private generateMasterPlaylist(variants: HLSManifest['variants']): string {
    let content = '#EXTM3U\n';
    content += '#EXT-X-VERSION:3\n';

    for (const variant of variants) {
      // Extract resolution dimensions
      const preset = RESOLUTION_PRESETS.find((p) => p.name === variant.resolution);
      const width = preset?.width || 1280;
      const height = preset?.height || 720;

      content += `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${width}x${height}\n`;
      content += `${variant.playlist}\n`;
    }

    return content;
  }

  /**
   * Generate thumbnail at specified timestamp
   */
  async generateThumbnail(
    inputPath: string,
    outputPath: string,
    timestamp?: number
  ): Promise<string> {
    // Get video duration if timestamp not provided
    let ts = timestamp;
    if (ts === undefined) {
      const metadata = await this.getMetadata(inputPath);
      ts = Math.floor(metadata.duration * 0.1); // 10% of duration
      ts = Math.max(1, Math.min(ts, metadata.duration - 1)); // Clamp to valid range
    }

    return new Promise((resolve, reject) => {
      const args = [
        '-ss', ts.toString(),
        '-i', inputPath,
        '-vframes', '1',
        '-vf', 'scale=640:-1',
        '-q:v', '2',
        '-y',
        outputPath,
      ];

      const proc = spawn(this.config.ffmpegPath, args);
      let stderr = '';

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`Thumbnail generation failed: ${stderr}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Generate video preview (animated GIF or short clip)
   */
  async generatePreview(
    inputPath: string,
    outputPath: string,
    duration: number = 5
  ): Promise<string> {
    const metadata = await this.getMetadata(inputPath);
    const startTime = Math.floor(metadata.duration * 0.2); // Start at 20%

    return new Promise((resolve, reject) => {
      const args = [
        '-ss', startTime.toString(),
        '-i', inputPath,
        '-t', duration.toString(),
        '-vf', 'fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
        '-loop', '0',
        '-y',
        outputPath,
      ];

      const proc = spawn(this.config.ffmpegPath, args);
      let stderr = '';

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`Preview generation failed: ${stderr}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Check if FFmpeg is available
   */
  async checkAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn(this.config.ffmpegPath, ['-version']);

      proc.on('close', (code) => {
        resolve(code === 0);
      });

      proc.on('error', () => {
        resolve(false);
      });
    });
  }
}

// Singleton instance
let ffmpegInstance: FFmpegService | null = null;

export function getFFmpegService(): FFmpegService {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpegService();
  }
  return ffmpegInstance;
}

export default FFmpegService;
