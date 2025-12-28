# EnglishPro - Local Mac Implementation Plan

## Architecture Overview (100% Open Source, Local)

| Component | Technology |
|-----------|------------|
| Video Storage | Local filesystem / MinIO (S3-compatible) |
| Video Streaming | Nginx with HLS |
| Video Transcoding | FFmpeg |
| Database | PostgreSQL (Homebrew) |
| Caching | Redis (Homebrew) |
| Backend | Node.js + Express |
| Frontend | React + Vite |
| Reverse Proxy | Nginx |
| Containerization | Docker Desktop (optional) |

**Access URL:** `http://localhost:3000` (frontend), `http://localhost:8000` (API)

---

## Phase 1: Mac Environment Setup (Fully Automated)

**Priority: Critical**
**Dependencies: None**
**Automation: All setup is automated via shell scripts**

### 1.0 One-Command Setup

```bash
# Clone repository and run complete setup
git clone <repo-url> && cd EnglishPro
chmod +x setup.sh scripts/*.sh
./setup.sh
```

This single command runs all scripts below in sequence.

---

### 1.1 Scripts Folder Structure

```
EnglishPro/
├── scripts/
│   ├── 01-setup-mac.sh         # Install Homebrew, Node, PostgreSQL, Redis, FFmpeg
│   ├── 02-init-project.sh      # Create frontend/backend structure, install packages
│   ├── 03-setup-database.sh    # Create DB, Prisma schema, run migrations
│   ├── 04-setup-env.sh         # Generate .env files with auto-generated secrets
│   ├── 05-seed-data.sh         # Create demo users and sample courses
│   └── 06-start-dev.sh         # Check services and start dev servers
└── setup.sh                    # Master script - runs all scripts in order
```

---

### 1.2 Script: `01-setup-mac.sh` - Install Mac Dependencies

**Run:** `./scripts/01-setup-mac.sh`
**Re-runnable:** Yes (idempotent - skips already installed)

| Task | What it does |
|------|--------------|
| Check/Install Homebrew | Installs Homebrew if not present, adds to PATH for Apple Silicon |
| Check Node.js | Verifies Node.js is installed (v18+), skips install if present |
| Install PostgreSQL 16 | `brew install postgresql@16` + starts service |
| Install Redis | `brew install redis` + starts service |
| Install FFmpeg | `brew install ffmpeg` |
| Create storage directories | Creates `~/englishpro-storage/{videos,thumbnails,submissions,temp}` |
| Verify installations | Prints versions of all installed tools |

**Node.js requirement:**
- Minimum version: 18.0.0
- Script detects existing installation and skips if version is compatible
- Only installs via Homebrew if Node.js is missing or version is too old

**Script behavior:**
- Detects Apple Silicon vs Intel Mac for correct paths
- Uses `brew services start` to run PostgreSQL and Redis as background services
- Checks if tools already installed before reinstalling
- Prints colored status messages (✓ success, ! warning, ✗ error)

---

### 1.3 Script: `02-init-project.sh` - Initialize Project Structure

**Run:** `./scripts/02-init-project.sh`
**Re-runnable:** Yes (skips if directories exist)

| Task | What it does |
|------|--------------|
| Create root `package.json` | Monorepo with workspace scripts (`npm run dev`, `npm run db:migrate`, etc.) |
| Initialize frontend | `npm create vite@latest` with React + TypeScript template |
| Install frontend deps | React Router, Zustand, React Query, TailwindCSS, Video.js, RecordRTC |
| Initialize backend | Create Express + TypeScript structure |
| Install backend deps | Express, Prisma, JWT, bcrypt, Multer, Bull, Helmet, etc. |
| Create `tsconfig.json` | TypeScript configuration for backend |
| Initialize Prisma | `npx prisma init` |
| Install root deps | Concurrently for running both servers |

**Directory structure created:**
```
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   └── types/
└── package.json

backend/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── utils/
├── prisma/
└── package.json
```

---

### 1.4 Script: `03-setup-database.sh` - Database Setup

**Run:** `./scripts/03-setup-database.sh`
**Re-runnable:** Yes (migrations are additive)

| Task | What it does |
|------|--------------|
| Check PostgreSQL running | Starts service if not running |
| Create database | `createdb englishpro_dev` (skips if exists) |
| Write Prisma schema | Creates `prisma/schema.prisma` with all models |
| Run migrations | `npx prisma migrate dev --name init` |
| Generate Prisma client | `npx prisma generate` |

**Prisma schema includes:**
- `User` model (id, email, passwordHash, name, role, avatarUrl, timestamps)
- `Course` model (id, teacherId, title, description, timestamps)
- `Video` model (id, teacherId, courseId, title, videoUrl, hlsUrl, thumbnailUrl, duration, status)
- `Submission` model (id, studentId, videoId, submissionUrl, status, grade, feedback)
- `Progress` model (id, studentId, videoId, watchPercentage, completed, lastWatchedAt)
- Enums: `Role` (TEACHER, STUDENT), `SubmissionStatus` (PENDING, REVIEWED)
- All relationships and foreign keys defined

---

### 1.5 Script: `04-setup-env.sh` - Environment Configuration

**Run:** `./scripts/04-setup-env.sh`
**Re-runnable:** Yes (overwrites existing .env)

| Task | What it does |
|------|--------------|
| Generate JWT secrets | Uses `openssl rand -base64 32` for secure random secrets |
| Detect FFmpeg path | `/opt/homebrew/bin/ffmpeg` (Apple Silicon) or `/usr/local/bin/ffmpeg` (Intel) |
| Create `backend/.env` | Database URL, Redis URL, JWT secrets, storage paths, server config |
| Create `frontend/.env` | API URL, app name |
| Create `.env.example` files | Templates for version control (no secrets) |
| Update `.gitignore` | Ensures `.env` files are not committed |

**Generated `backend/.env` contains:**
```
DATABASE_URL="postgresql://localhost:5432/englishpro_dev"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="<auto-generated>"
JWT_REFRESH_SECRET="<auto-generated>"
STORAGE_PATH="/Users/<username>/englishpro-storage"
PORT=8000
FFMPEG_PATH="/opt/homebrew/bin/ffmpeg"
```

---

### 1.6 Script: `05-seed-data.sh` - Create Sample Data

**Run:** `./scripts/05-seed-data.sh`
**Re-runnable:** Yes (uses upsert)

| Task | What it does |
|------|--------------|
| Create seed file | Writes `prisma/seed.ts` |
| Add seed script to package.json | Adds `prisma.seed` configuration |
| Run seed | `npx prisma db seed` |

**Sample data created:**
- 1 Teacher account
- 2 Student accounts
- 3 Sample courses (Beginner English, Business English, Conversation Practice)

**Credentials:** Saved to `.credentials` file (excluded from git)

---

### 1.7 Script: `06-start-dev.sh` - Start Development Servers

**Run:** `./scripts/06-start-dev.sh`
**Re-runnable:** Yes

| Task | What it does |
|------|--------------|
| Check PostgreSQL | Starts if not running |
| Check Redis | Starts if not running |
| Start servers | Runs `npm run dev` (frontend + backend concurrently) |

**Access URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api

---

### 1.8 Script: `setup.sh` - Master Setup Script

**Run:** `./setup.sh`
**Re-runnable:** Yes

Runs all scripts in sequence:
```
Step 1/5: ./scripts/01-setup-mac.sh
Step 2/5: ./scripts/02-init-project.sh
Step 3/5: ./scripts/04-setup-env.sh
Step 4/5: ./scripts/03-setup-database.sh
Step 5/5: ./scripts/05-seed-data.sh
```

Prints final summary with:
- Access URLs
- Sample login credentials
- Next steps

---

### 1.9 Script Implementation Checklist

| Script | Status | Notes |
|--------|--------|-------|
| `scripts/01-setup-mac.sh` | [ ] To create | Homebrew, services, storage dirs |
| `scripts/02-init-project.sh` | [ ] To create | Vite, Express, npm packages |
| `scripts/03-setup-database.sh` | [ ] To create | PostgreSQL, Prisma schema, migrations |
| `scripts/04-setup-env.sh` | [ ] To create | Secret generation, .env files |
| `scripts/05-seed-data.sh` | [ ] To create | Demo users, sample courses |
| `scripts/06-start-dev.sh` | [ ] To create | Service checks, npm run dev |
| `setup.sh` | [ ] To create | Master script |

**Script requirements:**
- All scripts use `#!/bin/bash` and `set -e` (exit on error)
- Colored output for status messages
- Idempotent (safe to re-run)
- Work on both Apple Silicon and Intel Macs
- No user interaction required (fully automated)

---

## Phase 2: Authentication & User Management

**Priority: Critical**
**Dependencies: Phase 1**

### 2.1 Backend Authentication
- [ ] Implement User model with Prisma
- [ ] Create password hashing utilities (bcrypt)
- [ ] Implement JWT token generation and validation
- [ ] Create refresh token mechanism
- [ ] Build authentication middleware
- [ ] Implement role-based access control (RBAC)

### 2.2 Auth API Endpoints
- [ ] `POST /api/auth/register` - User registration
- [ ] `POST /api/auth/login` - User login
- [ ] `POST /api/auth/logout` - User logout
- [ ] `POST /api/auth/refresh` - Refresh access token
- [ ] `GET /api/auth/me` - Get current user

### 2.3 Frontend Authentication
- [ ] Create auth service layer
- [ ] Build Login page
- [ ] Build Registration page
- [ ] Implement auth state management (Zustand)
- [ ] Create protected route wrapper
- [ ] Build auth context and hooks

---

## Phase 3: Core UI Components & Layout

**Priority: High**
**Dependencies: Phase 2**

### 3.1 Design System Setup
- [ ] Configure TailwindCSS with custom theme:
  ```js
  colors: {
    'bg-light': '#F0F4FF',
    'primary': '#6366F1',
    'accent': '#EC4899',
    'card-purple': '#EDE9FE',
    'video-thumb': '#818CF8',
  }
  ```
- [ ] Set up Inter font family (Google Fonts or local)
- [ ] Create base component styles

### 3.2 Common Components
- [ ] Header/Navigation bar (white, drop shadow)
- [ ] Footer
- [ ] Button components (primary, secondary, gradient)
- [ ] Input components (text, password, textarea)
- [ ] Card components (12px rounded corners)
- [ ] Modal/Dialog components
- [ ] Loading spinners and skeletons
- [ ] Toast notifications

### 3.3 Layout Components
- [ ] Main layout wrapper
- [ ] Dashboard layout (sidebar + content)
- [ ] Auth layout (centered cards)

### 3.4 Homepage
- [ ] Hero section with gradient background
- [ ] Feature highlights section
- [ ] Responsive design (1440px desktop)

---

## Phase 4: Local Video Infrastructure

**Priority: High**
**Dependencies: Phase 1, Phase 2**

### 4.1 Video Storage Service
- [ ] Create file storage service for local filesystem
- [ ] Implement file upload handling with Multer
- [ ] Configure upload size limits and file type validation
- [ ] Create unique filename generation (UUID)
- [ ] Build file deletion service

### 4.2 Video Transcoding with FFmpeg
- [ ] Create FFmpeg service wrapper
- [ ] Implement video transcoding to multiple resolutions:
  - 1080p (original if higher)
  - 720p
  - 480p
  - 360p
- [ ] Generate HLS segments for adaptive streaming
- [ ] Create thumbnail generation from video
- [ ] Implement background job queue (Bull + Redis)
- [ ] Handle transcoding progress and completion

### 4.3 Video Streaming
- [ ] Implement HLS playlist generation
- [ ] Create video streaming endpoint
- [ ] Configure byte-range requests for seeking
- [ ] Set up proper MIME types and headers

### 4.4 Video API Endpoints
- [ ] `GET /api/videos` - List videos (with pagination)
- [ ] `GET /api/videos/:id` - Get video details
- [ ] `POST /api/videos/upload` - Upload video file
- [ ] `POST /api/videos` - Create video record (teacher)
- [ ] `PATCH /api/videos/:id` - Update video (teacher)
- [ ] `DELETE /api/videos/:id` - Delete video (teacher)
- [ ] `GET /api/videos/:id/stream` - Stream video (HLS)
- [ ] `GET /api/videos/:id/thumbnail` - Get thumbnail

---

## Phase 5: Teacher Features

**Priority: High**
**Dependencies: Phase 3, Phase 4**

### 5.1 Teacher Dashboard
- [ ] Dashboard overview page
- [ ] Stats cards (total students, videos, submissions)
- [ ] Recent activity feed
- [ ] Quick action buttons

### 5.2 Course Management
- [ ] Course list view
- [ ] Create course form
- [ ] Edit course functionality
- [ ] Delete course (with confirmation)
- [ ] Course detail page

### 5.3 Video Upload & Management
- [ ] Video upload page with drag-and-drop
- [ ] Upload progress indicator
- [ ] Transcoding status display
- [ ] Video list/grid view
- [ ] Video edit form
- [ ] Video delete functionality
- [ ] Assign videos to courses

### 5.4 Student Submission Review
- [ ] Submissions list (pending/reviewed tabs)
- [ ] Submission detail view
- [ ] Video playback for submissions
- [ ] Grading form (score + feedback)
- [ ] Bulk actions (mark reviewed, etc.)

---

## Phase 6: Student Features

**Priority: High**
**Dependencies: Phase 3, Phase 4**

### 6.1 Student Dashboard
- [ ] Dashboard overview page
- [ ] Progress summary cards
- [ ] Continue watching section
- [ ] Recent grades/feedback

### 6.2 Video Lessons
- [ ] Course catalog/browse page
- [ ] Course detail page
- [ ] Video lesson player page (Video.js with HLS)
- [ ] Video progress tracking
- [ ] Mark as complete functionality

### 6.3 Speaking Submissions
- [ ] Video recording interface (RecordRTC)
- [ ] Recording preview and re-record
- [ ] Upload submission flow
- [ ] Submission history list
- [ ] View feedback and grades

---

## Phase 7: Progress Tracking & Analytics

**Priority: Medium**
**Dependencies: Phase 5, Phase 6**

### 7.1 Progress Backend
- [ ] Progress tracking service
- [ ] Watch time calculation
- [ ] Completion status management
- [ ] Analytics aggregation queries

### 7.2 Progress API Endpoints
- [ ] `GET /api/progress` - Get student progress
- [ ] `POST /api/progress` - Update watch progress
- [ ] `GET /api/progress/stats` - Get progress statistics
- [ ] `GET /api/analytics/teacher` - Teacher analytics

### 7.3 Progress UI
- [ ] Student progress report page
- [ ] Progress charts and visualizations (Chart.js / Recharts)
- [ ] Course completion indicators
- [ ] Teacher analytics dashboard

---

## Phase 8: Polish & Optimization

**Priority: Medium**
**Dependencies: Phase 5, Phase 6, Phase 7**

### 8.1 Performance Optimization
- [ ] Implement React Query for caching
- [ ] Add Redis caching for API responses
- [ ] Optimize database queries with indexes
- [ ] Implement pagination everywhere
- [ ] Lazy loading for images/videos
- [ ] Code splitting and bundle optimization

### 8.2 UX Improvements
- [ ] Add loading states everywhere
- [ ] Implement error boundaries
- [ ] Add empty states
- [ ] Improve form validation feedback
- [ ] Add keyboard navigation
- [ ] Mobile responsive design

### 8.3 Security Hardening
- [ ] Input validation and sanitization
- [ ] Rate limiting on all endpoints (express-rate-limit)
- [ ] SQL injection prevention audit
- [ ] XSS prevention audit
- [ ] CORS configuration
- [ ] Security headers (helmet.js)

---

## Phase 9: Local Development Tools

**Priority: Medium**
**Dependencies: Phase 8**

### 9.1 Docker Setup (Optional)
- [ ] Create Dockerfile for frontend
- [ ] Create Dockerfile for backend
- [ ] Create docker-compose.yml for full stack
  ```yaml
  services:
    frontend:
      build: ./frontend
      ports: ["3000:3000"]
    backend:
      build: ./backend
      ports: ["8000:8000"]
    postgres:
      image: postgres:16
    redis:
      image: redis:7
  ```
- [ ] Add volume mounts for video storage

### 9.2 Development Scripts

#### Shell Scripts (in `scripts/` folder)
| Script | Description |
|--------|-------------|
| `./scripts/01-setup-mac.sh` | Install all Mac dependencies via Homebrew |
| `./scripts/02-init-project.sh` | Initialize frontend and backend projects |
| `./scripts/03-setup-database.sh` | Create database and run migrations |
| `./scripts/04-setup-env.sh` | Generate environment configuration |
| `./scripts/05-seed-data.sh` | Populate sample data |
| `./scripts/06-start-dev.sh` | Start development servers |
| `./setup.sh` | Run all setup scripts in sequence |

#### npm Scripts (in `package.json`)
- [ ] `npm run dev` - Start all services (frontend + backend)
- [ ] `npm run dev:frontend` - Start frontend only
- [ ] `npm run dev:backend` - Start backend only
- [ ] `npm run db:migrate` - Run Prisma migrations
- [ ] `npm run db:seed` - Seed database
- [ ] `npm run db:reset` - Reset database
- [ ] `npm run db:studio` - Open Prisma Studio
- [ ] `npm run build` - Build for production
- [ ] `npm run lint` - Run linters
- [ ] `npm run test` - Run tests

### 9.3 Nginx Configuration (Production-like)
- [ ] Configure reverse proxy for API
- [ ] Set up static file serving for videos
- [ ] Configure HLS streaming
- [ ] Add gzip compression

---

## Phase 10: Testing & Documentation

**Priority: High**
**Dependencies: Phase 9**

### 10.1 Testing
- [ ] Unit tests for backend services (Jest)
- [ ] Integration tests for API endpoints (Supertest)
- [ ] Frontend component tests (Vitest + Testing Library)
- [ ] E2E tests (Playwright)
- [ ] Video upload/playback tests

### 10.2 Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] README with setup instructions
- [ ] Environment variables documentation
- [ ] Architecture diagrams

---

## Implementation Sequence Summary

```
Phase 1 (Mac Setup)
    ↓
Phase 2 (Auth) ──────────────────┐
    ↓                            ↓
Phase 3 (UI)              Phase 4 (Video Local)
    ↓                            ↓
    └────────────┬───────────────┘
                 ↓
         Phase 5 (Teacher)
                 ↓
         Phase 6 (Student)
                 ↓
         Phase 7 (Progress)
                 ↓
         Phase 8 (Polish)
                 ↓
         Phase 9 (Dev Tools)
                 ↓
         Phase 10 (Testing)
```

---

## Open Source Tech Stack Summary

### Frontend
| Package | Purpose | License |
|---------|---------|---------|
| React 18 | UI framework | MIT |
| TypeScript | Type safety | Apache 2.0 |
| Vite | Build tool | MIT |
| TailwindCSS | Styling | MIT |
| React Router | Navigation | MIT |
| Zustand | State management | MIT |
| React Query | Server state | MIT |
| Video.js | Video playback | Apache 2.0 |
| hls.js | HLS streaming | Apache 2.0 |
| RecordRTC | Video recording | MIT |

### Backend
| Package | Purpose | License |
|---------|---------|---------|
| Node.js 18+ | Runtime | MIT |
| Express.js | Web framework | MIT |
| TypeScript | Type safety | Apache 2.0 |
| Prisma | ORM | Apache 2.0 |
| PostgreSQL | Database | PostgreSQL License |
| Redis | Caching | BSD |
| Multer | File uploads | MIT |
| Bull | Job queue | MIT |
| bcrypt | Password hashing | MIT |
| jsonwebtoken | JWT auth | MIT |
| helmet | Security headers | MIT |

### Tools
| Tool | Purpose | License |
|------|---------|---------|
| FFmpeg | Video transcoding | LGPL/GPL |
| Nginx | Reverse proxy | BSD |
| Docker | Containerization | Apache 2.0 |

---

## Storage Requirements

| Content Type | Estimated Size |
|--------------|----------------|
| 1 hour video (source) | ~2-5 GB |
| 1 hour video (transcoded, all resolutions) | ~3-8 GB |
| Thumbnail | ~50-200 KB |
| Student submission (2 min) | ~50-200 MB |

**Recommendation:** Ensure at least 100GB free disk space for development with sample videos.

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

# Start development
npm run dev
```

### Option B: Manual Step-by-Step

```bash
# 1. Install dependencies (skip node if already installed v18+)
brew install postgresql@16 redis ffmpeg
# Only if Node.js not installed: brew install node

# 2. Start services
brew services start postgresql@16
brew services start redis

# 3. Create database
createdb englishpro_dev

# 4. Create storage directories
mkdir -p ~/englishpro-storage/{videos,thumbnails,submissions,temp}

# 5. Clone and setup project
cd EnglishPro
npm install
cp .env.example .env

# 6. Run migrations
npm run db:migrate

# 7. Start development
npm run dev
```

### Option C: Run Individual Scripts

```bash
./scripts/01-setup-mac.sh         # Install Homebrew dependencies
./scripts/02-init-project.sh      # Initialize project structure
./scripts/03-setup-database.sh    # Setup database
./scripts/04-setup-env.sh         # Generate .env files
./scripts/05-seed-data.sh         # Create sample data
./scripts/06-start-dev.sh         # Start dev servers
```

---

## Environment Variables (.env)

```bash
# Database
DATABASE_URL="postgresql://localhost:5432/englishpro_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Storage
STORAGE_PATH="/Users/YOUR_USERNAME/englishpro-storage"
VIDEOS_PATH="${STORAGE_PATH}/videos"
THUMBNAILS_PATH="${STORAGE_PATH}/thumbnails"
SUBMISSIONS_PATH="${STORAGE_PATH}/submissions"
TEMP_PATH="${STORAGE_PATH}/temp"

# Server
PORT=8000
FRONTEND_URL="http://localhost:3000"

# FFmpeg
FFMPEG_PATH="/opt/homebrew/bin/ffmpeg"
```

---

## Cost

**$0** - Everything runs locally on your Mac using open source software.
