# EnglishPro - Implementation Plan v2 (Mac Local Development)

## Document Information

| Field | Value |
|-------|-------|
| Version | 2.0 |
| Created | 2026-01-01 |
| Status | Active |
| Target Environment | macOS (Apple Silicon / Intel) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EnglishPro Architecture                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────────┐ │
│  │   Browser    │────▶│   Frontend   │────▶│         Backend API          │ │
│  │              │     │  React/Vite  │     │      Express/Node.js         │ │
│  │  localhost   │     │ localhost    │     │      localhost:8000          │ │
│  │    :5173     │     │   :5173      │     │                              │ │
│  └──────────────┘     └──────────────┘     └──────────────────────────────┘ │
│                                                      │                       │
│                              ┌───────────────────────┼───────────────────┐  │
│                              │                       │                   │  │
│                              ▼                       ▼                   ▼  │
│                    ┌──────────────┐      ┌──────────────┐    ┌──────────┐  │
│                    │  PostgreSQL  │      │    Redis     │    │  FFmpeg  │  │
│                    │   :5432      │      │    :6379     │    │ (local)  │  │
│                    └──────────────┘      └──────────────┘    └──────────┘  │
│                              │                                      │       │
│                              ▼                                      ▼       │
│                    ┌──────────────────────────────────────────────────────┐ │
│                    │            Local File Storage                        │ │
│                    │  ~/englishpro-storage/{videos,thumbnails,submissions}│ │
│                    └──────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Stack

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| React | 18.x | UI framework | MIT |
| TypeScript | 5.x | Type safety | Apache 2.0 |
| Vite | 5.x | Build tool | MIT |
| TailwindCSS | 3.x | Styling | MIT |
| React Router | 6.x | Navigation | MIT |
| Zustand | 4.x | State management | MIT |
| TanStack Query | 5.x | Server state | MIT |
| Video.js | 8.x | Video playback | Apache 2.0 |
| hls.js | 1.x | HLS streaming | Apache 2.0 |
| RecordRTC | 5.x | Video recording | MIT |
| React Hook Form | 7.x | Form handling | MIT |
| Zod | 3.x | Validation | MIT |
| Recharts | 2.x | Charts | MIT |

### Backend Stack

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| Node.js | 18+ | Runtime | MIT |
| Express.js | 4.x | Web framework | MIT |
| TypeScript | 5.x | Type safety | Apache 2.0 |
| Prisma | 5.x | ORM | Apache 2.0 |
| PostgreSQL | 16 | Database | PostgreSQL |
| Redis | 7.x | Caching/Jobs | BSD |
| Multer | 1.x | File uploads | MIT |
| BullMQ | 5.x | Job queue | MIT |
| bcryptjs | 2.x | Password hashing | MIT |
| jsonwebtoken | 9.x | JWT auth | MIT |
| helmet | 7.x | Security headers | MIT |
| express-rate-limit | 7.x | Rate limiting | MIT |
| Zod | 3.x | Validation | MIT |

### Development Tools

| Tool | Purpose | License |
|------|---------|---------|
| FFmpeg | Video transcoding | LGPL/GPL |
| Homebrew | Package manager | BSD |
| ESLint | Linting | MIT |
| Prettier | Formatting | MIT |
| Vitest | Testing | MIT |
| Playwright | E2E testing | Apache 2.0 |

---

## Prerequisites & Environment Requirements

### Hardware Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Disk Space | 50 GB | 100+ GB |
| RAM | 8 GB | 16 GB |
| CPU | Apple M1 / Intel Core i5 | Apple M2+ / Intel Core i7+ |

### Software Requirements

| Software | Version | Installation |
|----------|---------|--------------|
| macOS | 12.0+ | - |
| Homebrew | Latest | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` |
| Node.js | 18.0.0+ | `brew install node` or use existing |
| PostgreSQL | 16 | `brew install postgresql@16` |
| Redis | 7.x | `brew install redis` |
| FFmpeg | Latest | `brew install ffmpeg` |
| Git | Latest | Pre-installed on macOS |

---

## Phase Dependency Graph

```
Phase 1 (Setup) ──────────────────────────────────────────────┐
     │                                                         │
     ▼                                                         │
Phase 2 (Auth) ───────────────────────────────────────┐       │
     │                                                │       │
     ├────────────────────┬───────────────────────────┤       │
     ▼                    ▼                           ▼       │
Phase 3 (UI)       Phase 4 (Video)              (depends on) │
     │                    │                                   │
     └────────────────────┴────────────────────┬──────────────┘
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        ▼                                              ▼
                 Phase 5 (Teacher)                            Phase 6 (Student)
                        │                                              │
                        └──────────────────────┬───────────────────────┘
                                               │
                                               ▼
                                       Phase 7 (Progress)
                                               │
                                               ▼
                                       Phase 8 (Polish)
                                               │
                                               ▼
                                       Phase 9 (Testing)
```

---

## Phase 1: Project Scaffolding & Environment Setup

**Priority:** Critical
**Dependencies:** None
**Status:** ✅ COMPLETED
**Complexity:** M

### 1.0 Current State Summary

Phase 1 has been completed. The following are in place:

- [x] `scripts/02-init-project.sh` - Project initialization script
- [x] Frontend initialized with Vite + React + TypeScript
- [x] Backend initialized with Express + TypeScript
- [x] Prisma schema defined with all models
- [x] Basic folder structure created
- [x] Root `package.json` with workspace scripts

### 1.1 Remaining Setup Scripts

| Script | Status | Notes |
|--------|--------|-------|
| `scripts/01-setup-mac.sh` | [ ] To create | Homebrew, services, storage dirs |
| `scripts/03-setup-database.sh` | [ ] To create | PostgreSQL, migrations |
| `scripts/04-setup-env.sh` | [ ] To create | Secret generation, .env files |
| `scripts/05-seed-data.sh` | [ ] To create | Demo users, sample courses |
| `scripts/06-start-dev.sh` | [ ] To create | Service checks, npm run dev |
| `setup.sh` | [ ] To create | Master script |

### 1.2 Script: `01-setup-mac.sh` Implementation

**File:** `scripts/01-setup-mac.sh`
**Complexity:** M

```bash
#!/bin/bash
set -e

# Functions to implement:
# - check_homebrew(): Install Homebrew if missing
# - check_node(): Verify Node.js >= 18.0.0
# - install_postgres(): brew install postgresql@16
# - install_redis(): brew install redis
# - install_ffmpeg(): brew install ffmpeg
# - create_storage_dirs(): mkdir -p ~/englishpro-storage/{videos,thumbnails,submissions,temp}
# - verify_installations(): Print versions
```

**Tasks:**
- [ ] Implement Homebrew check and installation (Complexity: S)
- [ ] Implement Node.js version detection (Complexity: S)
- [ ] Implement PostgreSQL 16 installation and service start (Complexity: S)
- [ ] Implement Redis installation and service start (Complexity: S)
- [ ] Implement FFmpeg installation (Complexity: S)
- [ ] Create storage directories (Complexity: S)
- [ ] Add colored output helpers (Complexity: S)
- [ ] Add Apple Silicon vs Intel detection (Complexity: S)

**Verification:**
```bash
# Run script
./scripts/01-setup-mac.sh

# Verify installations
node --version    # Should be >= 18.0.0
psql --version    # Should show PostgreSQL 16.x
redis-cli ping    # Should return PONG
ffmpeg -version   # Should show FFmpeg version
ls ~/englishpro-storage  # Should show videos, thumbnails, submissions, temp
```

**Rollback:**
```bash
brew services stop postgresql@16
brew services stop redis
brew uninstall postgresql@16 redis ffmpeg
rm -rf ~/englishpro-storage
```

---

## Phase 2: Authentication & User Management

**Priority:** Critical
**Dependencies:** Phase 1
**Status:** ✅ MOSTLY COMPLETED
**Complexity:** L

### 2.0 Current State Summary

- [x] User model with Prisma (schema.prisma)
- [x] Password hashing utilities (bcrypt)
- [x] JWT token generation and validation
- [x] Authentication middleware
- [x] Auth routes (register, login, logout, refresh, me)
- [x] Frontend auth service layer
- [x] Login/Register pages
- [x] Auth state management (Zustand)
- [x] Protected route wrapper

### 2.1 TypeScript Interfaces (Already Implemented)

**File:** `backend/src/types/auth.ts`

```typescript
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'TEACHER' | 'STUDENT';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'TEACHER' | 'STUDENT';
    avatarUrl: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'TEACHER' | 'STUDENT';
}
```

### 2.2 Remaining Auth Tasks

- [ ] Add email validation format check (Complexity: S)
- [ ] Add password strength requirements (min 8 chars, etc.) (Complexity: S)
- [ ] Implement token blacklisting on logout (Redis) (Complexity: M)
- [ ] Add rate limiting to auth endpoints (Complexity: S)

**API Endpoints (Implemented):**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | User registration | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| POST | `/api/auth/refresh` | Refresh access token | No (refresh token) |
| GET | `/api/auth/me` | Get current user | Yes |

**Verification:**
```bash
# Test registration
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!","name":"Test User","role":"STUDENT"}'

# Test login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'
```

---

## Phase 3: Core UI Components & Layout

**Priority:** High
**Dependencies:** Phase 2
**Status:** 🔄 PARTIALLY COMPLETE
**Complexity:** L

### 3.1 TailwindCSS Theme Configuration

**File:** `frontend/tailwind.config.js`
**Complexity:** S

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-light': '#F0F4FF',
        'primary': '#6366F1',
        'primary-hover': '#4F46E5',
        'accent': '#EC4899',
        'accent-hover': '#DB2777',
        'card-purple': '#EDE9FE',
        'video-thumb': '#818CF8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
      },
      boxShadow: {
        'header': '0 2px 4px rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
```

**Tasks:**
- [x] Configure TailwindCSS color palette
- [ ] Add Inter font import (Google Fonts) (Complexity: S)
- [ ] Create CSS variables for gradients (Complexity: S)

### 3.2 Common Components to Create

**Directory:** `frontend/src/components/common/`

| Component | File | Complexity | Description |
|-----------|------|------------|-------------|
| Button | `Button.tsx` | S | Primary, secondary, gradient variants |
| Input | `Input.tsx` | S | Text, password, email with validation states |
| Card | `Card.tsx` | S | 12px rounded corners, shadows |
| Modal | `Modal.tsx` | M | Dialog with overlay, close button |
| Toast | `Toast.tsx` | M | Notification system |
| Spinner | `Spinner.tsx` | S | Loading indicator |
| Skeleton | `Skeleton.tsx` | S | Loading placeholder |
| Avatar | `Avatar.tsx` | S | User avatar with fallback |
| Badge | `Badge.tsx` | S | Status indicators |
| Dropdown | `Dropdown.tsx` | M | Menu dropdown |

#### Button Component Interface

**File:** `frontend/src/components/common/Button.tsx`

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gradient' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps): JSX.Element;
```

#### Input Component Interface

**File:** `frontend/src/components/common/Input.tsx`

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  ...props
}: InputProps): JSX.Element;
```

#### Modal Component Interface

**File:** `frontend/src/components/common/Modal.tsx`

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps): JSX.Element | null;
```

### 3.3 Layout Components

**Directory:** `frontend/src/components/layout/`

| Component | File | Complexity | Description |
|-----------|------|------------|-------------|
| Header | `Header.tsx` | M | Navigation bar with auth state |
| Footer | `Footer.tsx` | S | Site footer |
| MainLayout | `MainLayout.tsx` | S | Page wrapper with header/footer |
| DashboardLayout | `DashboardLayout.tsx` | M | Sidebar + content area |
| AuthLayout | `AuthLayout.tsx` | S | Centered card layout |

#### Header Component Interface

**File:** `frontend/src/components/layout/Header.tsx`

```typescript
interface NavItem {
  label: string;
  href: string;
  requiresAuth?: boolean;
  roles?: ('TEACHER' | 'STUDENT')[];
}

interface HeaderProps {
  transparent?: boolean;
}

export function Header({ transparent = false }: HeaderProps): JSX.Element;
```

#### DashboardLayout Component Interface

**File:** `frontend/src/components/layout/DashboardLayout.tsx`

```typescript
interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
  title?: string;
}

export function DashboardLayout({
  children,
  sidebarItems,
  title,
}: DashboardLayoutProps): JSX.Element;
```

### 3.4 Homepage Implementation

**File:** `frontend/src/pages/Home.tsx`
**Complexity:** M

**Tasks:**
- [ ] Hero section with gradient background (#6366F1 to #EC4899) (Complexity: S)
- [ ] Feature highlights with icons (Complexity: S)
- [ ] Call-to-action buttons (Complexity: S)
- [ ] Responsive design (desktop 1440px, tablet 768px, mobile 375px) (Complexity: M)

**Verification:**
```bash
# Start frontend
npm run dev:frontend

# Open browser to http://localhost:5173
# Verify:
# - Gradient hero section displays correctly
# - Navigation links work
# - Responsive on mobile viewport
```

**Test Criteria:**
- [ ] All pages render without console errors
- [ ] Components pass accessibility audit (axe-core)
- [ ] Responsive breakpoints work correctly
- [ ] Dark/light theme ready (CSS variables)

---

## Phase 4: Video Infrastructure (Local)

**Priority:** High
**Dependencies:** Phase 1, Phase 2
**Status:** ⏳ NOT STARTED
**Complexity:** XL

### 4.1 Backend File Structure

```
backend/src/
├── services/
│   ├── storage.service.ts       # File storage operations
│   ├── ffmpeg.service.ts        # FFmpeg transcoding
│   ├── video.service.ts         # Video CRUD operations
│   └── queue.service.ts         # BullMQ job queue
├── controllers/
│   └── videoController.ts       # Video API handlers
├── routes/
│   └── videos.ts                # Video routes
├── jobs/
│   ├── transcode.job.ts         # Video transcoding job
│   └── thumbnail.job.ts         # Thumbnail generation job
└── types/
    └── video.ts                 # Video-related types
```

### 4.2 TypeScript Interfaces

**File:** `backend/src/types/video.ts`

```typescript
export interface VideoUploadRequest {
  title: string;
  description?: string;
  courseId?: string;
}

export interface VideoResponse {
  id: string;
  teacherId: string;
  courseId: string | null;
  title: string;
  description: string | null;
  videoUrl: string;
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  teacher?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  course?: {
    id: string;
    title: string;
  };
}

export interface TranscodeJobData {
  videoId: string;
  inputPath: string;
  outputDir: string;
  resolutions: Resolution[];
}

export interface Resolution {
  name: string;
  width: number;
  height: number;
  bitrate: string;
}

export interface TranscodeProgress {
  videoId: string;
  progress: number;
  currentResolution: string;
  status: 'processing' | 'completed' | 'failed';
}

export interface HLSManifest {
  masterPlaylist: string;
  variants: {
    resolution: string;
    bandwidth: number;
    playlist: string;
  }[];
}
```

### 4.3 Storage Service Implementation

**File:** `backend/src/services/storage.service.ts`
**Complexity:** M

```typescript
import { mkdir, unlink, stat, readdir } from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface StorageConfig {
  basePath: string;
  videosPath: string;
  thumbnailsPath: string;
  submissionsPath: string;
  tempPath: string;
}

export class StorageService {
  private config: StorageConfig;

  constructor(config: StorageConfig);

  // Initialize storage directories
  async init(): Promise<void>;

  // Save uploaded file to temp, return temp path
  async saveToTemp(buffer: Buffer, filename: string): Promise<string>;

  // Move file from temp to permanent storage
  async moveToStorage(
    tempPath: string,
    type: 'videos' | 'thumbnails' | 'submissions',
    filename?: string
  ): Promise<string>;

  // Get file path by ID and type
  getFilePath(id: string, type: 'videos' | 'thumbnails' | 'submissions'): string;

  // Delete file
  async deleteFile(path: string): Promise<void>;

  // Get file stats
  async getFileStats(path: string): Promise<{ size: number; modified: Date }>;

  // Create directory if not exists
  async ensureDir(path: string): Promise<void>;

  // Clean temp files older than maxAge (ms)
  async cleanTemp(maxAge: number): Promise<number>;
}
```

**Tasks:**
- [ ] Implement StorageService class (Complexity: M)
- [ ] Add file type validation (video formats only) (Complexity: S)
- [ ] Add file size limits (configurable, default 500MB) (Complexity: S)
- [ ] Implement temp cleanup cron job (Complexity: S)

### 4.4 FFmpeg Service Implementation

**File:** `backend/src/services/ffmpeg.service.ts`
**Complexity:** L

```typescript
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export interface FFmpegConfig {
  ffmpegPath: string;
  ffprobePath: string;
}

export interface VideoMetadata {
  duration: number;      // seconds
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
  audioCodec: string;
  audioSampleRate: number;
}

export interface TranscodeOptions {
  inputPath: string;
  outputDir: string;
  resolutions: Resolution[];
  hlsSegmentDuration?: number;  // default: 6
  onProgress?: (progress: number) => void;
}

export class FFmpegService extends EventEmitter {
  private config: FFmpegConfig;

  constructor(config: FFmpegConfig);

  // Extract video metadata using ffprobe
  async getMetadata(inputPath: string): Promise<VideoMetadata>;

  // Transcode video to multiple resolutions with HLS
  async transcode(options: TranscodeOptions): Promise<HLSManifest>;

  // Generate thumbnail at specified timestamp
  async generateThumbnail(
    inputPath: string,
    outputPath: string,
    timestamp?: number  // default: 10% of duration
  ): Promise<string>;

  // Generate video preview (animated GIF or short clip)
  async generatePreview(
    inputPath: string,
    outputPath: string,
    duration?: number  // default: 5 seconds
  ): Promise<string>;

  // Get optimal resolutions based on source video
  getOptimalResolutions(sourceWidth: number, sourceHeight: number): Resolution[];
}
```

**Resolution Presets:**

```typescript
const RESOLUTION_PRESETS: Resolution[] = [
  { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' },
  { name: '720p', width: 1280, height: 720, bitrate: '2500k' },
  { name: '480p', width: 854, height: 480, bitrate: '1000k' },
  { name: '360p', width: 640, height: 360, bitrate: '600k' },
];
```

**Tasks:**
- [ ] Implement FFmpegService class (Complexity: L)
- [ ] Add ffprobe metadata extraction (Complexity: M)
- [ ] Implement multi-resolution transcoding (Complexity: L)
- [ ] Generate HLS playlists (master + variants) (Complexity: M)
- [ ] Implement thumbnail generation (Complexity: S)
- [ ] Add progress tracking via stdout parsing (Complexity: M)

### 4.5 Job Queue Service (BullMQ)

**File:** `backend/src/services/queue.service.ts`
**Complexity:** M

```typescript
import { Queue, Worker, Job } from 'bullmq';

export interface QueueConfig {
  redisUrl: string;
  concurrency: number;
}

export class QueueService {
  private transcodeQueue: Queue<TranscodeJobData>;
  private thumbnailQueue: Queue<ThumbnailJobData>;
  private workers: Worker[];

  constructor(config: QueueConfig);

  // Initialize queues and workers
  async init(): Promise<void>;

  // Add video for transcoding
  async addTranscodeJob(data: TranscodeJobData): Promise<string>;

  // Add thumbnail generation job
  async addThumbnailJob(data: ThumbnailJobData): Promise<string>;

  // Get job status
  async getJobStatus(jobId: string): Promise<JobStatus>;

  // Clean completed/failed jobs
  async cleanJobs(maxAge: number): Promise<void>;

  // Graceful shutdown
  async shutdown(): Promise<void>;
}
```

**Tasks:**
- [ ] Set up BullMQ with Redis connection (Complexity: M)
- [ ] Implement transcode worker (Complexity: M)
- [ ] Implement thumbnail worker (Complexity: S)
- [ ] Add job retry logic (3 attempts, exponential backoff) (Complexity: S)
- [ ] Add job progress events (Complexity: S)

### 4.6 Video Controller

**File:** `backend/src/controllers/videoController.ts`
**Complexity:** L

```typescript
import { Request, Response, NextFunction } from 'express';

export class VideoController {
  // GET /api/videos - List videos with pagination
  async list(req: Request, res: Response, next: NextFunction): Promise<void>;

  // GET /api/videos/:id - Get video details
  async getById(req: Request, res: Response, next: NextFunction): Promise<void>;

  // POST /api/videos/upload - Upload video file (multipart/form-data)
  async upload(req: Request, res: Response, next: NextFunction): Promise<void>;

  // POST /api/videos - Create video record after upload
  async create(req: Request, res: Response, next: NextFunction): Promise<void>;

  // PATCH /api/videos/:id - Update video metadata
  async update(req: Request, res: Response, next: NextFunction): Promise<void>;

  // DELETE /api/videos/:id - Delete video
  async delete(req: Request, res: Response, next: NextFunction): Promise<void>;

  // GET /api/videos/:id/stream/:resolution - Stream HLS playlist
  async stream(req: Request, res: Response, next: NextFunction): Promise<void>;

  // GET /api/videos/:id/thumbnail - Get thumbnail
  async thumbnail(req: Request, res: Response, next: NextFunction): Promise<void>;

  // GET /api/videos/:id/status - Get transcoding status
  async status(req: Request, res: Response, next: NextFunction): Promise<void>;
}
```

### 4.7 Video API Endpoints

| Method | Endpoint | Description | Auth | Role | Complexity |
|--------|----------|-------------|------|------|------------|
| GET | `/api/videos` | List videos (paginated) | Yes | Any | S |
| GET | `/api/videos/:id` | Get video details | Yes | Any | S |
| POST | `/api/videos/upload` | Upload video file | Yes | Teacher | M |
| POST | `/api/videos` | Create video record | Yes | Teacher | S |
| PATCH | `/api/videos/:id` | Update video | Yes | Teacher (owner) | S |
| DELETE | `/api/videos/:id` | Delete video | Yes | Teacher (owner) | M |
| GET | `/api/videos/:id/stream/master.m3u8` | HLS master playlist | Yes | Any | M |
| GET | `/api/videos/:id/stream/:resolution/playlist.m3u8` | HLS variant playlist | Yes | Any | S |
| GET | `/api/videos/:id/stream/:resolution/:segment.ts` | HLS segment | Yes | Any | S |
| GET | `/api/videos/:id/thumbnail` | Get thumbnail | Yes | Any | S |
| GET | `/api/videos/:id/status` | Get transcode status | Yes | Teacher (owner) | S |

### 4.8 Request/Response Schemas

**POST /api/videos/upload**
```typescript
// Request: multipart/form-data
// Field: video (file, required)
// Max size: 500MB
// Allowed types: video/mp4, video/webm, video/quicktime

// Response
interface UploadResponse {
  tempId: string;          // Temporary ID for creating video record
  filename: string;        // Original filename
  size: number;            // File size in bytes
  mimeType: string;        // MIME type
}
```

**POST /api/videos**
```typescript
// Request
interface CreateVideoRequest {
  tempId: string;          // From upload response
  title: string;           // Required, max 200 chars
  description?: string;    // Optional, max 5000 chars
  courseId?: string;       // Optional, must be valid course
}

// Response: VideoResponse
```

**GET /api/videos**
```typescript
// Query params
interface ListVideosQuery {
  page?: number;           // Default: 1
  limit?: number;          // Default: 20, max: 100
  courseId?: string;       // Filter by course
  teacherId?: string;      // Filter by teacher
  status?: 'PROCESSING' | 'READY' | 'FAILED';
  search?: string;         // Search in title/description
  sortBy?: 'createdAt' | 'title' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

// Response
interface PaginatedVideosResponse {
  data: VideoResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 4.9 Multer Configuration

**File:** `backend/src/middleware/upload.ts`
**Complexity:** S

```typescript
import multer from 'multer';
import { Request } from 'express';

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_VIDEO_SIZE,
  },
  fileFilter: (req: Request, file, cb) => {
    if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, WebM, and MOV allowed.'));
    }
  },
});
```

### 4.10 Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Video upload (100MB) | < 30s | Local network, SSD |
| Thumbnail generation | < 5s | Single frame extraction |
| Transcode start | < 2s | Job queued, processing begins |
| 720p transcode (1 min video) | < 60s | Hardware encoding if available |
| HLS segment delivery | < 100ms | Local file system |
| Video list API | < 200ms | With pagination |

### 4.11 Error Handling

| Error | HTTP Status | Response |
|-------|-------------|----------|
| File too large | 413 | `{ error: 'File size exceeds 500MB limit' }` |
| Invalid file type | 415 | `{ error: 'Only MP4, WebM, MOV allowed' }` |
| Video not found | 404 | `{ error: 'Video not found' }` |
| Transcode failed | 500 | `{ error: 'Video processing failed', details: '...' }` |
| Unauthorized | 401 | `{ error: 'Authentication required' }` |
| Forbidden | 403 | `{ error: 'You do not have permission to access this video' }` |

### 4.12 Verification Steps

```bash
# 1. Upload a test video
curl -X POST http://localhost:8000/api/videos/upload \
  -H "Authorization: Bearer <token>" \
  -F "video=@test-video.mp4"

# 2. Create video record
curl -X POST http://localhost:8000/api/videos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tempId":"<tempId>","title":"Test Video"}'

# 3. Check transcode status
curl http://localhost:8000/api/videos/<id>/status \
  -H "Authorization: Bearer <token>"

# 4. Stream video (once ready)
curl http://localhost:8000/api/videos/<id>/stream/master.m3u8 \
  -H "Authorization: Bearer <token>"

# 5. Verify files created
ls ~/englishpro-storage/videos/<id>/
# Should show: original.mp4, 720p/, 480p/, 360p/, master.m3u8
```

### 4.13 Rollback

```bash
# Remove video files
rm -rf ~/englishpro-storage/videos/*
rm -rf ~/englishpro-storage/thumbnails/*
rm -rf ~/englishpro-storage/temp/*

# Clear Redis queue
redis-cli FLUSHDB

# Reset video records in database
npx prisma db execute --stdin <<< "DELETE FROM videos;"
```

---

## Phase 5: Teacher Features

**Priority:** High
**Dependencies:** Phase 3, Phase 4
**Status:** ⏳ NOT STARTED
**Complexity:** XL

### 5.1 Frontend File Structure

```
frontend/src/
├── pages/
│   ├── teacher/
│   │   ├── TeacherDashboard.tsx    # Dashboard overview
│   │   ├── Courses.tsx             # Course list
│   │   ├── CourseDetail.tsx        # Single course view
│   │   ├── CourseForm.tsx          # Create/edit course
│   │   ├── Videos.tsx              # Video list
│   │   ├── VideoUpload.tsx         # Upload new video
│   │   ├── VideoDetail.tsx         # Video details/edit
│   │   ├── Submissions.tsx         # Submission list
│   │   └── SubmissionReview.tsx    # Grade submission
├── components/
│   ├── teacher/
│   │   ├── StatCard.tsx            # Dashboard stat cards
│   │   ├── ActivityFeed.tsx        # Recent activity
│   │   ├── QuickActions.tsx        # Quick action buttons
│   │   ├── CourseCard.tsx          # Course list item
│   │   ├── VideoCard.tsx           # Video list item
│   │   ├── VideoUploader.tsx       # Drag-and-drop uploader
│   │   ├── TranscodeProgress.tsx   # Transcoding status
│   │   ├── SubmissionCard.tsx      # Submission list item
│   │   └── GradingForm.tsx         # Grade + feedback form
└── hooks/
    ├── useCourses.ts               # Course CRUD hooks
    ├── useVideos.ts                # Video CRUD hooks
    └── useSubmissions.ts           # Submission hooks
```

### 5.2 Course Management Backend

**File:** `backend/src/controllers/courseController.ts`
**Complexity:** M

```typescript
export class CourseController {
  // GET /api/courses - List courses (teacher sees own, students see all)
  async list(req: Request, res: Response, next: NextFunction): Promise<void>;

  // GET /api/courses/:id - Get course with videos
  async getById(req: Request, res: Response, next: NextFunction): Promise<void>;

  // POST /api/courses - Create course (teacher only)
  async create(req: Request, res: Response, next: NextFunction): Promise<void>;

  // PATCH /api/courses/:id - Update course (owner only)
  async update(req: Request, res: Response, next: NextFunction): Promise<void>;

  // DELETE /api/courses/:id - Delete course (owner only)
  async delete(req: Request, res: Response, next: NextFunction): Promise<void>;
}
```

**Course API Endpoints:**

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/courses` | List courses | Yes | Any |
| GET | `/api/courses/:id` | Get course details | Yes | Any |
| POST | `/api/courses` | Create course | Yes | Teacher |
| PATCH | `/api/courses/:id` | Update course | Yes | Teacher (owner) |
| DELETE | `/api/courses/:id` | Delete course | Yes | Teacher (owner) |

### 5.3 Submission Management Backend

**File:** `backend/src/controllers/submissionController.ts`
**Complexity:** M

```typescript
export class SubmissionController {
  // GET /api/submissions - List submissions
  // Teachers: see submissions for their videos
  // Students: see own submissions
  async list(req: Request, res: Response, next: NextFunction): Promise<void>;

  // GET /api/submissions/:id - Get submission details
  async getById(req: Request, res: Response, next: NextFunction): Promise<void>;

  // POST /api/submissions - Submit speaking video (student)
  async create(req: Request, res: Response, next: NextFunction): Promise<void>;

  // PATCH /api/submissions/:id - Grade submission (teacher)
  async grade(req: Request, res: Response, next: NextFunction): Promise<void>;

  // DELETE /api/submissions/:id - Delete submission (student, own only)
  async delete(req: Request, res: Response, next: NextFunction): Promise<void>;
}
```

**Submission API Endpoints:**

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/submissions` | List submissions | Yes | Any |
| GET | `/api/submissions/:id` | Get submission | Yes | Any |
| POST | `/api/submissions/upload` | Upload submission video | Yes | Student |
| POST | `/api/submissions` | Create submission | Yes | Student |
| PATCH | `/api/submissions/:id` | Grade submission | Yes | Teacher |
| DELETE | `/api/submissions/:id` | Delete submission | Yes | Student (owner) |

### 5.4 Grading Schema

```typescript
interface GradeSubmissionRequest {
  grade: number;          // 0-100
  feedback: string;       // Required, max 5000 chars
}

interface SubmissionResponse {
  id: string;
  studentId: string;
  videoId: string;
  submissionUrl: string;
  status: 'PENDING' | 'REVIEWED';
  grade: number | null;
  feedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  student: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  video: {
    id: string;
    title: string;
  };
}
```

### 5.5 Teacher Dashboard Components

**File:** `frontend/src/pages/teacher/TeacherDashboard.tsx`
**Complexity:** M

```typescript
interface DashboardStats {
  totalCourses: number;
  totalVideos: number;
  totalStudents: number;
  pendingSubmissions: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'submission' | 'enrollment' | 'video_watch';
  message: string;
  timestamp: string;
  studentName: string;
  studentAvatarUrl: string | null;
}
```

**Tasks:**
- [ ] Dashboard overview page with stats cards (Complexity: M)
- [ ] Stats cards (total students, videos, pending submissions) (Complexity: S)
- [ ] Recent activity feed (Complexity: M)
- [ ] Quick action buttons (upload video, create course) (Complexity: S)

### 5.6 Video Upload Component

**File:** `frontend/src/components/teacher/VideoUploader.tsx`
**Complexity:** L

```typescript
interface VideoUploaderProps {
  onUploadComplete: (tempId: string, filename: string) => void;
  onError: (error: string) => void;
  maxSize?: number;  // bytes, default 500MB
  accept?: string[];  // MIME types
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;  // 0-100
  filename: string | null;
  error: string | null;
}
```

**Features:**
- [ ] Drag-and-drop zone (Complexity: M)
- [ ] File type validation (Complexity: S)
- [ ] Upload progress bar (Complexity: S)
- [ ] Transcoding status display (Complexity: M)
- [ ] Cancel upload functionality (Complexity: S)
- [ ] Retry on failure (Complexity: S)

### 5.7 Submission Review Page

**File:** `frontend/src/pages/teacher/SubmissionReview.tsx`
**Complexity:** M

**Features:**
- [ ] Video playback of student submission (Complexity: M)
- [ ] Side-by-side view with original lesson video (Complexity: M)
- [ ] Grading form (0-100 scale) (Complexity: S)
- [ ] Feedback text area with rich formatting (Complexity: M)
- [ ] Save draft / Submit grade buttons (Complexity: S)
- [ ] Navigation to next pending submission (Complexity: S)

### 5.8 Verification Steps

```bash
# 1. Login as teacher
# 2. Create a course
curl -X POST http://localhost:8000/api/courses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Course","description":"Test description"}'

# 3. Upload a video to the course
# 4. Verify video appears in course detail
# 5. Check student submission list (should be empty initially)
# 6. Login as student, submit a speaking video
# 7. Login as teacher, grade the submission
# 8. Verify grade appears for student
```

### 5.9 Test Criteria

- [ ] Teacher can create, edit, delete courses
- [ ] Teacher can upload videos with progress indicator
- [ ] Videos are properly transcoded and playable
- [ ] Teacher can view all submissions for their videos
- [ ] Teacher can grade submissions with feedback
- [ ] Dashboard stats are accurate
- [ ] Activity feed updates in real-time

---

## Phase 6: Student Features

**Priority:** High
**Dependencies:** Phase 3, Phase 4
**Status:** ⏳ NOT STARTED
**Complexity:** XL

### 6.1 Frontend File Structure

```
frontend/src/
├── pages/
│   ├── student/
│   │   ├── StudentDashboard.tsx    # Dashboard overview
│   │   ├── Courses.tsx             # Browse courses
│   │   ├── CourseDetail.tsx        # Course with video list
│   │   ├── VideoLesson.tsx         # Video player page
│   │   ├── MySubmissions.tsx       # Submission history
│   │   ├── SubmissionDetail.tsx    # View feedback
│   │   └── RecordSubmission.tsx    # Record speaking video
├── components/
│   ├── student/
│   │   ├── ProgressCard.tsx        # Progress summary
│   │   ├── ContinueWatching.tsx    # Resume videos
│   │   ├── CourseProgress.tsx      # Course completion
│   │   └── GradeFeedback.tsx       # View teacher feedback
│   ├── video/
│   │   ├── VideoPlayer.tsx         # Video.js HLS player
│   │   ├── VideoRecorder.tsx       # RecordRTC component
│   │   └── VideoPreview.tsx        # Preview recorded video
└── hooks/
    ├── useProgress.ts              # Progress tracking hooks
    └── useVideoPlayer.ts           # Video player hooks
```

### 6.2 Video Player Component

**File:** `frontend/src/components/video/VideoPlayer.tsx`
**Complexity:** L

```typescript
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;               // HLS master playlist URL
  poster?: string;           // Thumbnail URL
  videoId: string;           // For progress tracking
  onProgress?: (percentage: number) => void;
  onComplete?: () => void;
  autoplay?: boolean;
  startPosition?: number;    // Resume position in seconds
}

export function VideoPlayer({
  src,
  poster,
  videoId,
  onProgress,
  onComplete,
  autoplay = false,
  startPosition = 0,
}: VideoPlayerProps): JSX.Element;
```

**Features:**
- [ ] HLS adaptive streaming (Complexity: M)
- [ ] Quality selector (auto, 1080p, 720p, 480p, 360p) (Complexity: M)
- [ ] Progress bar with preview thumbnails (Complexity: L)
- [ ] Playback speed control (0.5x - 2x) (Complexity: S)
- [ ] Fullscreen support (Complexity: S)
- [ ] Picture-in-picture support (Complexity: S)
- [ ] Keyboard shortcuts (space, arrows, f) (Complexity: S)
- [ ] Auto-resume from last position (Complexity: M)
- [ ] Progress tracking (send updates every 10s) (Complexity: M)

### 6.3 Video Recorder Component

**File:** `frontend/src/components/video/VideoRecorder.tsx`
**Complexity:** L

```typescript
import RecordRTC from 'recordrtc';

interface VideoRecorderProps {
  maxDuration?: number;      // seconds, default 300 (5 min)
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onError: (error: string) => void;
}

interface RecorderState {
  status: 'idle' | 'requesting' | 'ready' | 'recording' | 'paused' | 'stopped';
  duration: number;          // seconds
  error: string | null;
}

export function VideoRecorder({
  maxDuration = 300,
  onRecordingComplete,
  onError,
}: VideoRecorderProps): JSX.Element;
```

**Features:**
- [ ] Camera/microphone permission request (Complexity: S)
- [ ] Live preview during recording (Complexity: M)
- [ ] Recording timer with max duration (Complexity: S)
- [ ] Pause/resume recording (Complexity: M)
- [ ] Stop and preview recorded video (Complexity: M)
- [ ] Re-record option (Complexity: S)
- [ ] Camera/microphone device selector (Complexity: M)
- [ ] Recording quality settings (Complexity: S)

### 6.4 Progress Tracking Backend

**File:** `backend/src/controllers/progressController.ts`
**Complexity:** M

```typescript
export class ProgressController {
  // GET /api/progress - Get student's progress
  async getProgress(req: Request, res: Response, next: NextFunction): Promise<void>;

  // POST /api/progress - Update watch progress
  async updateProgress(req: Request, res: Response, next: NextFunction): Promise<void>;

  // GET /api/progress/stats - Get progress statistics
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void>;

  // POST /api/progress/:videoId/complete - Mark video as complete
  async markComplete(req: Request, res: Response, next: NextFunction): Promise<void>;
}
```

**Progress API Endpoints:**

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/progress` | Get student progress | Yes | Student |
| POST | `/api/progress` | Update watch progress | Yes | Student |
| GET | `/api/progress/stats` | Get progress stats | Yes | Student |
| POST | `/api/progress/:videoId/complete` | Mark complete | Yes | Student |

### 6.5 Progress Schemas

```typescript
interface UpdateProgressRequest {
  videoId: string;
  watchPercentage: number;   // 0-100
  currentPosition: number;   // seconds
}

interface ProgressResponse {
  id: string;
  videoId: string;
  watchPercentage: number;
  completed: boolean;
  lastWatchedAt: string;
  video: {
    id: string;
    title: string;
    duration: number;
    thumbnailUrl: string | null;
  };
}

interface ProgressStats {
  totalVideos: number;
  completedVideos: number;
  totalWatchTime: number;     // seconds
  averageProgress: number;    // percentage
  courseProgress: {
    courseId: string;
    courseName: string;
    totalVideos: number;
    completedVideos: number;
    percentage: number;
  }[];
}
```

### 6.6 Student Dashboard

**File:** `frontend/src/pages/student/StudentDashboard.tsx`
**Complexity:** M

**Features:**
- [ ] Progress summary cards (videos watched, time spent, etc.) (Complexity: S)
- [ ] Continue watching section (resume in-progress videos) (Complexity: M)
- [ ] Recent grades/feedback notifications (Complexity: M)
- [ ] Course progress bars (Complexity: S)
- [ ] Recommended next videos (Complexity: M)

### 6.7 Record Submission Flow

**File:** `frontend/src/pages/student/RecordSubmission.tsx`
**Complexity:** L

**Flow:**
1. Display original lesson video for reference
2. Show recording interface
3. Student records speaking practice
4. Preview and confirm recording
5. Upload submission
6. Show success message with estimated review time

**Tasks:**
- [ ] Side-by-side layout (lesson video + recorder) (Complexity: M)
- [ ] Recording controls (start, pause, stop) (Complexity: M)
- [ ] Preview recorded video (Complexity: M)
- [ ] Re-record option (Complexity: S)
- [ ] Upload with progress indicator (Complexity: M)
- [ ] Success confirmation (Complexity: S)

### 6.8 Verification Steps

```bash
# 1. Login as student
# 2. Browse available courses
# 3. Open a course and start watching a video
# 4. Verify progress is saved when pausing/seeking
# 5. Close and reopen video - verify resume from last position
# 6. Record and submit a speaking exercise
# 7. View submission history
# 8. Check feedback after teacher grades (may require teacher action first)
```

### 6.9 Test Criteria

- [ ] Student can browse all courses and videos
- [ ] Video player supports HLS with quality switching
- [ ] Progress is tracked and saved correctly
- [ ] Student can record speaking videos up to 5 minutes
- [ ] Recorded video can be previewed before submission
- [ ] Submissions are uploaded successfully
- [ ] Student can view grades and feedback
- [ ] Dashboard shows accurate progress statistics

---

## Phase 7: Progress Tracking & Analytics

**Priority:** Medium
**Dependencies:** Phase 5, Phase 6
**Status:** ⏳ NOT STARTED
**Complexity:** L

### 7.1 Analytics Backend

**File:** `backend/src/services/analytics.service.ts`
**Complexity:** M

```typescript
export class AnalyticsService {
  // Get teacher dashboard analytics
  async getTeacherAnalytics(teacherId: string): Promise<TeacherAnalytics>;

  // Get student dashboard analytics
  async getStudentAnalytics(studentId: string): Promise<StudentAnalytics>;

  // Get video engagement metrics
  async getVideoAnalytics(videoId: string): Promise<VideoAnalytics>;

  // Get course completion rates
  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics>;
}
```

### 7.2 Analytics Types

```typescript
interface TeacherAnalytics {
  overview: {
    totalStudents: number;
    totalVideos: number;
    totalCourses: number;
    totalWatchTime: number;        // minutes
    averageGrade: number;
    pendingSubmissions: number;
  };
  trends: {
    date: string;
    views: number;
    submissions: number;
    enrollments: number;
  }[];
  topVideos: {
    videoId: string;
    title: string;
    views: number;
    completionRate: number;
  }[];
  studentProgress: {
    studentId: string;
    name: string;
    avatarUrl: string | null;
    completedVideos: number;
    totalVideos: number;
    averageGrade: number;
  }[];
}

interface StudentAnalytics {
  overview: {
    totalWatchTime: number;        // minutes
    completedVideos: number;
    totalVideos: number;
    averageGrade: number;
    streak: number;                // days
  };
  weeklyProgress: {
    date: string;
    watchTime: number;             // minutes
    videosCompleted: number;
  }[];
  courseProgress: {
    courseId: string;
    title: string;
    completedVideos: number;
    totalVideos: number;
    percentage: number;
  }[];
  recentGrades: {
    submissionId: string;
    videoTitle: string;
    grade: number;
    reviewedAt: string;
  }[];
}

interface VideoAnalytics {
  videoId: string;
  title: string;
  views: number;
  uniqueViewers: number;
  averageWatchTime: number;        // seconds
  completionRate: number;          // percentage
  dropoffPoints: {
    timestamp: number;             // seconds
    dropoffRate: number;           // percentage
  }[];
  submissions: number;
  averageGrade: number;
}
```

### 7.3 Analytics API Endpoints

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/analytics/teacher` | Teacher analytics | Yes | Teacher |
| GET | `/api/analytics/student` | Student analytics | Yes | Student |
| GET | `/api/analytics/video/:id` | Video analytics | Yes | Teacher |
| GET | `/api/analytics/course/:id` | Course analytics | Yes | Teacher |

### 7.4 Frontend Analytics Components

**Directory:** `frontend/src/components/analytics/`

| Component | File | Complexity | Description |
|-----------|------|------------|-------------|
| ProgressChart | `ProgressChart.tsx` | M | Line/area chart for progress over time |
| CompletionDonut | `CompletionDonut.tsx` | S | Donut chart for completion rate |
| LeaderboardTable | `LeaderboardTable.tsx` | M | Top students table |
| TrendCard | `TrendCard.tsx` | S | Metric with trend indicator |
| HeatmapCalendar | `HeatmapCalendar.tsx` | M | Activity heatmap calendar |

### 7.5 Charts Library Integration (Recharts)

**File:** `frontend/src/components/analytics/ProgressChart.tsx`
**Complexity:** M

```typescript
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ProgressChartProps {
  data: { date: string; value: number }[];
  title: string;
  color?: string;
  height?: number;
}

export function ProgressChart({
  data,
  title,
  color = '#6366F1',
  height = 300,
}: ProgressChartProps): JSX.Element;
```

### 7.6 Test Criteria

- [ ] Teacher analytics dashboard shows accurate metrics
- [ ] Student progress charts render correctly
- [ ] Data refreshes when new activity occurs
- [ ] Charts are responsive and performant
- [ ] Export to CSV/PDF works (if implemented)

---

## Phase 8: Polish & Optimization

**Priority:** Medium
**Dependencies:** Phase 5, Phase 6, Phase 7
**Status:** ⏳ NOT STARTED
**Complexity:** L

### 8.1 Performance Optimization

**Tasks:**

| Task | File(s) | Complexity | Description |
|------|---------|------------|-------------|
| React Query caching | `frontend/src/services/*.ts` | M | Configure stale time, cache time |
| Redis API caching | `backend/src/middleware/cache.ts` | M | Cache video lists, analytics |
| Database indexes | `backend/prisma/schema.prisma` | S | Add indexes for common queries |
| Pagination everywhere | Multiple | M | Ensure all list endpoints paginated |
| Lazy loading | `frontend/src/App.tsx` | S | Code split routes |
| Image optimization | `frontend/src/components/` | S | Lazy load images, use srcset |
| Bundle analysis | `frontend/vite.config.ts` | S | Analyze and reduce bundle |

### 8.2 Redis Caching Middleware

**File:** `backend/src/middleware/cache.ts`
**Complexity:** M

```typescript
import { Redis } from 'ioredis';

interface CacheOptions {
  ttl: number;              // seconds
  keyPrefix?: string;
  keyGenerator?: (req: Request) => string;
}

export function cacheMiddleware(options: CacheOptions): RequestHandler;

export function invalidateCache(pattern: string): Promise<void>;
```

**Caching Strategy:**

| Endpoint | TTL | Invalidation |
|----------|-----|--------------|
| GET /api/videos | 60s | On video create/update/delete |
| GET /api/courses | 300s | On course create/update/delete |
| GET /api/analytics/* | 300s | On progress update |

### 8.3 Database Indexes

**File:** `backend/prisma/schema.prisma`

```prisma
model Video {
  // ... existing fields ...

  @@index([teacherId])
  @@index([courseId])
  @@index([status])
  @@index([createdAt(sort: Desc)])
}

model Progress {
  // ... existing fields ...

  @@index([studentId])
  @@index([videoId])
  @@index([lastWatchedAt(sort: Desc)])
}

model Submission {
  // ... existing fields ...

  @@index([studentId])
  @@index([videoId])
  @@index([status])
  @@index([submittedAt(sort: Desc)])
}
```

### 8.4 UX Improvements

**Tasks:**

| Task | Complexity | Description |
|------|------------|-------------|
| Loading states | S | Skeletons for all data-loading components |
| Error boundaries | M | Graceful error handling with retry |
| Empty states | S | Friendly messages when no data |
| Form validation | M | Real-time validation with clear errors |
| Keyboard navigation | M | Tab order, enter to submit, escape to close |
| Mobile responsive | L | Test and fix all breakpoints |
| Accessibility audit | M | ARIA labels, focus management |

### 8.5 Security Hardening

**Tasks:**

| Task | File | Complexity | Description |
|------|------|------------|-------------|
| Rate limiting | `backend/src/middleware/rateLimit.ts` | S | 100 req/min general, 10/min auth |
| Input validation | `backend/src/middleware/validate.ts` | M | Zod schemas for all inputs |
| SQL injection audit | All controllers | S | Verify parameterized queries |
| XSS prevention | Frontend | S | Escape user content, CSP |
| CORS config | `backend/src/index.ts` | S | Whitelist allowed origins |
| Security headers | `backend/src/index.ts` | S | helmet.js configuration |
| File upload security | `backend/src/middleware/upload.ts` | M | Validate file headers, not just extension |

### 8.6 Rate Limiting Configuration

**File:** `backend/src/middleware/rateLimit.ts`

```typescript
import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 100,                  // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 10,                   // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts' },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 20,                   // 20 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload limit reached, please try again later' },
});
```

### 8.7 Verification

```bash
# Performance testing
npm run lighthouse -- --url=http://localhost:5173

# Security headers check
curl -I http://localhost:8000/api/health

# Rate limit testing
for i in {1..15}; do curl -s http://localhost:8000/api/auth/login; done
# Should see 429 after 10 requests

# Bundle size analysis
npm run build:frontend -- --report
```

### 8.8 Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| Lighthouse Performance | > 90 | Chrome DevTools |
| First Contentful Paint | < 1.5s | Chrome DevTools |
| Time to Interactive | < 3s | Chrome DevTools |
| API Response Time (p95) | < 200ms | Backend logging |
| Bundle Size (gzipped) | < 200KB | Vite build |

---

## Phase 9: Testing & Documentation

**Priority:** High
**Dependencies:** Phase 8
**Status:** ⏳ NOT STARTED
**Complexity:** L

### 9.1 Testing Structure

```
tests/
├── backend/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── storage.service.test.ts
│   │   │   ├── ffmpeg.service.test.ts
│   │   │   └── analytics.service.test.ts
│   │   └── utils/
│   │       ├── jwt.test.ts
│   │       └── validation.test.ts
│   └── integration/
│       ├── auth.test.ts
│       ├── videos.test.ts
│       ├── courses.test.ts
│       ├── submissions.test.ts
│       └── progress.test.ts
├── frontend/
│   ├── components/
│   │   ├── Button.test.tsx
│   │   ├── VideoPlayer.test.tsx
│   │   └── VideoRecorder.test.tsx
│   └── pages/
│       ├── Login.test.tsx
│       └── Dashboard.test.tsx
└── e2e/
    ├── auth.spec.ts
    ├── teacher-flow.spec.ts
    ├── student-flow.spec.ts
    └── video-upload.spec.ts
```

### 9.2 Backend Unit Tests (Jest)

**File:** `backend/src/services/__tests__/storage.service.test.ts`
**Complexity:** M

```typescript
describe('StorageService', () => {
  describe('saveToTemp', () => {
    it('should save buffer to temp directory with unique filename');
    it('should create temp directory if not exists');
    it('should throw on disk full');
  });

  describe('moveToStorage', () => {
    it('should move file from temp to permanent storage');
    it('should generate UUID filename if not provided');
    it('should clean up temp file after move');
  });

  describe('deleteFile', () => {
    it('should delete file from storage');
    it('should not throw if file does not exist');
  });

  describe('cleanTemp', () => {
    it('should remove files older than maxAge');
    it('should not remove files newer than maxAge');
  });
});
```

### 9.3 Backend Integration Tests (Supertest)

**File:** `backend/tests/integration/auth.test.ts`
**Complexity:** M

```typescript
describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user');
    it('should return 400 for invalid email');
    it('should return 400 for weak password');
    it('should return 409 for duplicate email');
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials');
    it('should return 401 for invalid password');
    it('should return 401 for non-existent email');
    it('should return tokens on success');
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token');
    it('should return 401 for expired refresh token');
    it('should return 401 for invalid refresh token');
  });
});
```

### 9.4 Frontend Component Tests (Vitest + Testing Library)

**File:** `frontend/src/components/common/__tests__/Button.test.tsx`
**Complexity:** S

```typescript
describe('Button', () => {
  it('renders with correct text');
  it('applies primary variant styles by default');
  it('applies secondary variant styles');
  it('applies gradient variant styles');
  it('shows loading spinner when isLoading');
  it('is disabled when isLoading');
  it('calls onClick when clicked');
  it('renders left icon');
  it('renders right icon');
});
```

### 9.5 E2E Tests (Playwright)

**File:** `tests/e2e/teacher-flow.spec.ts`
**Complexity:** L

```typescript
describe('Teacher Flow', () => {
  test('teacher can login and access dashboard');
  test('teacher can create a new course');
  test('teacher can upload a video');
  test('teacher can see video transcoding progress');
  test('teacher can edit video metadata');
  test('teacher can view student submissions');
  test('teacher can grade a submission');
  test('teacher can delete a video');
  test('teacher can delete a course');
});
```

### 9.6 Test Scripts

**File:** `package.json`

```json
{
  "scripts": {
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "jest --config backend/jest.config.js",
    "test:backend:watch": "jest --config backend/jest.config.js --watch",
    "test:backend:coverage": "jest --config backend/jest.config.js --coverage",
    "test:frontend": "vitest run",
    "test:frontend:watch": "vitest",
    "test:frontend:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 9.7 Test Coverage Targets

| Category | Target | Current |
|----------|--------|---------|
| Backend Unit | > 80% | - |
| Backend Integration | > 70% | - |
| Frontend Components | > 75% | - |
| E2E Critical Paths | 100% | - |

### 9.8 Documentation Tasks

| Document | Location | Complexity | Description |
|----------|----------|------------|-------------|
| API Reference | `docs/api/openapi.yaml` | M | OpenAPI 3.0 spec |
| Setup Guide | `README.md` | S | Quick start instructions |
| Environment Variables | `docs/ENV.md` | S | All env vars documented |
| Architecture | `docs/ARCHITECTURE.md` | M | System design overview |
| Contributing | `CONTRIBUTING.md` | S | Development guidelines |

### 9.9 Verification

```bash
# Run all tests
npm test

# Run with coverage
npm run test:backend:coverage
npm run test:frontend:coverage

# Run E2E tests
npm run test:e2e

# Generate API docs
npm run docs:generate

# Verify coverage thresholds
npm run test:coverage-check
```

---

## Quick Start Commands

### Option A: One-Command Setup (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd EnglishPro

# Make scripts executable and run full setup
chmod +x setup.sh scripts/*.sh
./setup.sh

# Start development servers
npm run dev
```

### Option B: Manual Setup

```bash
# 1. Install dependencies (skip if already installed)
brew install postgresql@16 redis ffmpeg
# Only if Node.js not installed: brew install node

# 2. Start services
brew services start postgresql@16
brew services start redis

# 3. Create database
createdb englishpro_dev

# 4. Create storage directories
mkdir -p ~/englishpro-storage/{videos,thumbnails,submissions,temp}

# 5. Install project dependencies
npm install

# 6. Setup environment
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# 7. Run migrations
npm run db:migrate

# 8. Start development
npm run dev
```

### Option C: Individual Scripts

```bash
./scripts/01-setup-mac.sh         # Install Homebrew dependencies
./scripts/02-init-project.sh      # Initialize project structure
./scripts/04-setup-env.sh         # Generate .env files
./scripts/03-setup-database.sh    # Setup database
./scripts/05-seed-data.sh         # Create sample data
./scripts/06-start-dev.sh         # Start dev servers
```

---

## Environment Variables Reference

### Backend (`backend/.env`)

```bash
# Database
DATABASE_URL="postgresql://localhost:5432/englishpro_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="<generated-32-char-secret>"
JWT_REFRESH_SECRET="<generated-32-char-secret>"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Storage
STORAGE_PATH="/Users/<username>/englishpro-storage"
VIDEOS_PATH="${STORAGE_PATH}/videos"
THUMBNAILS_PATH="${STORAGE_PATH}/thumbnails"
SUBMISSIONS_PATH="${STORAGE_PATH}/submissions"
TEMP_PATH="${STORAGE_PATH}/temp"

# Server
PORT=8000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"

# FFmpeg
FFMPEG_PATH="/opt/homebrew/bin/ffmpeg"    # Apple Silicon
# FFMPEG_PATH="/usr/local/bin/ffmpeg"     # Intel Mac

# Upload Limits
MAX_VIDEO_SIZE_MB=500
MAX_SUBMISSION_SIZE_MB=200

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (`frontend/.env`)

```bash
VITE_API_URL="http://localhost:8000/api"
VITE_APP_NAME="EnglishPro"
```

---

## npm Scripts Reference

### Root Package

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend and backend concurrently |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:backend` | Start backend only |
| `npm run build` | Build both frontend and backend |
| `npm run build:frontend` | Build frontend for production |
| `npm run build:backend` | Build backend for production |
| `npm run lint` | Run ESLint on entire project |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run all tests |
| `npm run test:backend` | Run backend tests only |
| `npm run test:frontend` | Run frontend tests only |
| `npm run test:e2e` | Run end-to-end tests |

### Database Scripts

| Script | Description |
|--------|-------------|
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:migrate:create` | Create new migration |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:reset` | Reset database (drop + recreate + migrate + seed) |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:generate` | Regenerate Prisma client |

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| PostgreSQL won't start | `brew services restart postgresql@16` |
| Redis connection refused | `brew services start redis` |
| FFmpeg not found | Verify path: `which ffmpeg` |
| Port 8000 in use | `lsof -i :8000` then `kill -9 <PID>` |
| Node modules issues | `rm -rf node_modules && npm install` |
| Prisma client outdated | `npm run db:generate` |
| Database connection error | Check `DATABASE_URL` in `.env` |
| CORS errors | Check `FRONTEND_URL` in backend `.env` |

### Log Locations

| Log | Location |
|-----|----------|
| Backend server | Console (stdout) |
| PostgreSQL | `/opt/homebrew/var/log/postgresql@16.log` |
| Redis | `/opt/homebrew/var/log/redis.log` |
| Vite | Console (stdout) |

---

## Cost

**$0** - Everything runs locally on your Mac using open source software.

---

## Summary: Task Complexity

| Phase | Total Tasks | S | M | L | XL |
|-------|-------------|---|---|---|-----|
| Phase 1 | 8 | 6 | 2 | 0 | 0 |
| Phase 2 | 4 | 3 | 1 | 0 | 0 |
| Phase 3 | 15 | 8 | 5 | 2 | 0 |
| Phase 4 | 25 | 10 | 10 | 4 | 1 |
| Phase 5 | 18 | 6 | 8 | 3 | 1 |
| Phase 6 | 20 | 6 | 10 | 3 | 1 |
| Phase 7 | 10 | 3 | 5 | 2 | 0 |
| Phase 8 | 15 | 8 | 5 | 2 | 0 |
| Phase 9 | 12 | 4 | 6 | 2 | 0 |
| **Total** | **127** | **54** | **52** | **18** | **3** |

**Complexity Legend:**
- **S (Small):** < 2 hours
- **M (Medium):** 2-4 hours
- **L (Large):** 4-8 hours
- **XL (Extra Large):** > 8 hours

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-01-01 | Complete rewrite with TypeScript interfaces, detailed specs |
| 1.0 | - | Initial implementation plan |
