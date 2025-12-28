# EnglishPro - Implementation Plan

## AWS Architecture Overview

| Component | AWS Service |
|-----------|-------------|
| Video Storage | S3 |
| Video CDN | CloudFront |
| Video Transcoding | MediaConvert |
| Database | RDS (PostgreSQL) |
| Caching | ElastiCache (Redis) |
| Backend Hosting | ECS Fargate / EC2 |
| Frontend Hosting | S3 + CloudFront |
| Authentication | Cognito (optional) or JWT |
| File Upload | S3 Presigned URLs |
| SSL | Included with CloudFront (no custom domain needed) |

---

## Phase 1: Foundation & Infrastructure

**Priority: Critical**
**Dependencies: None**

### 1.1 Project Setup
- [ ] Initialize monorepo structure
- [ ] Set up frontend with Vite + React + TypeScript
- [ ] Set up backend with Express + TypeScript
- [ ] Configure ESLint, Prettier, and shared TypeScript configs
- [ ] Set up Git hooks (husky, lint-staged)

### 1.2 AWS Infrastructure Setup
- [ ] Create AWS account and configure IAM users/roles
- [ ] Set up S3 buckets (videos, thumbnails, student submissions)
- [ ] Configure CloudFront distributions
- [ ] Provision RDS PostgreSQL instance
- [ ] Set up ElastiCache Redis cluster
- [ ] Note CloudFront distribution URL for frontend access
- [ ] Note ALB/API Gateway URL for backend access

### 1.3 Database Setup
- [ ] Install and configure Prisma ORM
- [ ] Create database schema migrations:
  - Users table
  - Courses table
  - Videos table
  - Submissions table
  - Progress table
- [ ] Create seed data for development

### 1.4 Development Environment
- [ ] Create Docker Compose for local development
- [ ] Set up environment variable management
- [ ] Configure local PostgreSQL and Redis containers

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
  - Light Blue: `#F0F4FF`
  - Purple: `#6366F1`
  - Pink: `#EC4899`
  - Light Purple: `#EDE9FE`
  - Purple Blue: `#818CF8`
- [ ] Set up Inter font family
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

## Phase 4: Video Infrastructure

**Priority: High**
**Dependencies: Phase 1, Phase 2**

### 4.1 AWS Video Pipeline
- [ ] Configure S3 bucket policies and CORS
- [ ] Set up CloudFront signed URLs/cookies
- [ ] Configure MediaConvert job templates
- [ ] Create Lambda function for transcoding triggers
- [ ] Set up SNS notifications for job completion

### 4.2 Backend Video Services
- [ ] Create S3 presigned URL generation service
- [ ] Implement video upload controller
- [ ] Build video metadata management
- [ ] Create thumbnail generation service
- [ ] Implement video transcoding job submission
- [ ] Build video URL signing service

### 4.3 Video API Endpoints
- [ ] `GET /api/videos` - List videos (with pagination)
- [ ] `GET /api/videos/:id` - Get video details
- [ ] `POST /api/videos/upload-url` - Get presigned upload URL
- [ ] `POST /api/videos` - Create video record (teacher)
- [ ] `PATCH /api/videos/:id` - Update video (teacher)
- [ ] `DELETE /api/videos/:id` - Delete video (teacher)

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
- [ ] Video lesson player page (Video.js)
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
- [ ] Progress charts and visualizations
- [ ] Course completion indicators
- [ ] Teacher analytics dashboard

---

## Phase 8: Polish & Optimization

**Priority: Medium**
**Dependencies: Phase 5, Phase 6, Phase 7**

### 8.1 Performance Optimization
- [ ] Implement React Query for caching
- [ ] Add Redis caching for API responses
- [ ] Optimize database queries
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
- [ ] Rate limiting on all endpoints
- [ ] SQL injection prevention audit
- [ ] XSS prevention audit
- [ ] CORS configuration review
- [ ] Security headers (helmet.js)

---

## Phase 9: DevOps & Deployment

**Priority: Medium**
**Dependencies: Phase 8**

### 9.1 CI/CD Pipeline
- [ ] GitHub Actions workflow for testing
- [ ] Automated linting and type checking
- [ ] Build pipeline for frontend
- [ ] Build pipeline for backend
- [ ] Docker image building and pushing

### 9.2 Infrastructure as Code
- [ ] Terraform/CloudFormation for AWS resources
- [ ] Environment configuration (dev, staging, prod)
- [ ] Secrets management (AWS Secrets Manager)

### 9.3 Deployment
- [ ] Deploy frontend to S3 + CloudFront
- [ ] Deploy backend to ECS Fargate
- [ ] Configure auto-scaling
- [ ] Set up health checks
- [ ] Configure logging (CloudWatch)
- [ ] Set up monitoring and alerts

---

## Phase 10: Testing & Launch

**Priority: High**
**Dependencies: Phase 9**

### 10.1 Testing
- [ ] Unit tests for backend services
- [ ] Integration tests for API endpoints
- [ ] Frontend component tests
- [ ] E2E tests (Playwright/Cypress)
- [ ] Load testing for video streaming

### 10.2 Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] User guide for teachers
- [ ] User guide for students
- [ ] Deployment runbook

### 10.3 Launch Preparation
- [ ] Production environment setup
- [ ] Data migration plan
- [ ] Backup and recovery procedures
- [ ] Launch checklist
- [ ] Rollback plan

---

## Implementation Sequence Summary

```
Phase 1 (Foundation)
    ↓
Phase 2 (Auth) ──────────────────┐
    ↓                            ↓
Phase 3 (UI)              Phase 4 (Video Infra)
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
         Phase 9 (DevOps)
                 ↓
         Phase 10 (Launch)
```

---

## Estimated AWS Monthly Costs (Small Scale)

| Service | Estimated Cost |
|---------|----------------|
| S3 (100GB videos) | ~$3 |
| CloudFront (500GB transfer) | ~$45 |
| RDS db.t3.micro | ~$15 |
| ElastiCache t3.micro | ~$12 |
| ECS Fargate (1 vCPU, 2GB) | ~$30 |
| MediaConvert (10 hrs/month) | ~$5 |
| **Total** | **~$110/month** |

*No domain registration needed - use free AWS-provided URLs.*
*Costs scale with usage. Free tier eligible for first 12 months on some services.*

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Video upload failures | Implement chunked uploads, retry logic |
| High video storage costs | Set up S3 lifecycle policies, compress videos |
| Slow video loading | Multi-resolution transcoding, CDN caching |
| Database performance | Read replicas, query optimization, caching |
| Security breaches | Regular audits, penetration testing, WAF |
