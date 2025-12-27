# EnglishPro - High Level Design Document

## Overview

EnglishPro is a web-based English learning platform designed for students worldwide. The platform enables teachers to upload instructional videos, track student progress, and evaluate student speaking submissions.

## Core Features

### For Teachers
- Upload and manage instructional video lessons
- Organize videos into courses and modules
- Track individual student progress and analytics
- Review and evaluate student video submissions
- Provide feedback and grades on speaking exercises

### For Students
- Browse and watch teacher-uploaded video lessons
- Track personal learning progress
- Record and upload speaking practice videos
- Receive feedback from teachers
- View grades and improvement areas

## Project Structure

```
EnglishPro/
├── frontend/                    # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Shared UI components
│   │   │   ├── auth/            # Login, registration
│   │   │   ├── video/           # Video player, recorder
│   │   │   ├── dashboard/       # Teacher/student dashboards
│   │   │   └── progress/        # Progress tracking components
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── TeacherDashboard.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── VideoLesson.tsx
│   │   │   ├── UploadVideo.tsx
│   │   │   └── ProgressReport.tsx
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API service layer
│   │   ├── store/               # State management
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Utility functions
│   └── package.json
│
├── backend/                     # Node.js backend API
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── videoController.ts
│   │   │   ├── userController.ts
│   │   │   └── progressController.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Video.ts
│   │   │   ├── Course.ts
│   │   │   ├── Progress.ts
│   │   │   └── Submission.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── videos.ts
│   │   │   ├── users.ts
│   │   │   └── progress.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── upload.ts
│   │   │   └── errorHandler.ts
│   │   ├── services/
│   │   │   ├── videoService.ts
│   │   │   ├── storageService.ts
│   │   │   └── progressService.ts
│   │   └── utils/
│   └── package.json
│
├── database/                    # Database migrations and seeds
│   ├── migrations/
│   └── seeds/
│
├── docker/                      # Docker configuration
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml
│
├── docs/                        # Documentation
│   └── api/                     # API documentation
│
└── README.md
```

## Recommended Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **TailwindCSS** | Styling |
| **React Router** | Navigation |
| **Zustand** | State management |
| **React Query** | Server state & caching |
| **Video.js** | Video playback |
| **RecordRTC** | Browser video recording |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime |
| **Express.js** | Web framework |
| **TypeScript** | Type safety |
| **Prisma** | ORM |
| **PostgreSQL** | Primary database |
| **Redis** | Caching & sessions |
| **Multer** | File upload handling |
| **JWT** | Authentication |

### Cloud Services
| Service | Purpose |
|---------|---------|
| **AWS S3 / Cloudflare R2** | Video storage |
| **AWS CloudFront / Cloudflare** | CDN for video delivery |
| **FFmpeg** | Video transcoding |

### DevOps
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **GitHub Actions** | CI/CD |
| **Nginx** | Reverse proxy |

## Database Schema (Key Entities)

```
Users
├── id (UUID)
├── email
├── password_hash
├── name
├── role (teacher | student)
├── avatar_url
└── created_at

Videos
├── id (UUID)
├── teacher_id (FK → Users)
├── title
├── description
├── video_url
├── thumbnail_url
├── duration
├── course_id (FK → Courses)
└── created_at

Courses
├── id (UUID)
├── teacher_id (FK → Users)
├── title
├── description
└── created_at

Submissions (Student video uploads)
├── id (UUID)
├── student_id (FK → Users)
├── video_id (FK → Videos)
├── submission_url
├── status (pending | reviewed)
├── grade
├── feedback
└── submitted_at

Progress
├── id (UUID)
├── student_id (FK → Users)
├── video_id (FK → Videos)
├── watch_percentage
├── completed
└── last_watched_at
```

## API Endpoints (Overview)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Videos
- `GET /api/videos` - List videos
- `GET /api/videos/:id` - Get video details
- `POST /api/videos` - Upload video (teacher)
- `DELETE /api/videos/:id` - Delete video (teacher)

### Submissions
- `POST /api/submissions` - Student uploads speaking video
- `GET /api/submissions` - List submissions (teacher)
- `PATCH /api/submissions/:id` - Grade submission (teacher)

### Progress
- `GET /api/progress` - Get student progress
- `POST /api/progress` - Update watch progress

## Security Considerations

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure video URLs with signed tokens
- HTTPS everywhere

## Scalability Considerations

- Video transcoding queue for multiple resolutions
- CDN for global video delivery
- Database read replicas for analytics queries
- Horizontal scaling with containerization
- Caching layer for frequently accessed data
