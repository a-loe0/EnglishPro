# Teacher Video Access for Students - Implementation Analysis

## Overview

When a teacher uploads a video, all students should be able to access and watch it. This document analyzes the current state, the data flow, and what needs to be implemented or verified.

---

## Current State Analysis

### Database Schema (Already Implemented)

```
Video Model:
- id: UUID
- teacherId: FK to User (teacher who uploaded)
- courseId: Optional FK to Course
- title, description
- videoUrl, hlsUrl, thumbnailUrl
- duration, status (PROCESSING/READY/FAILED)
- timestamps
```

**Key Observation:** Videos are NOT restricted by student enrollment - any authenticated user can access videos via the API.

### Backend Implementation Status

| Component | File | Status |
|-----------|------|--------|
| Video Routes | `backend/src/routes/videos.ts` | Implemented |
| Video Controller | `backend/src/controllers/videoController.ts` | Implemented |
| Video Service | `backend/src/services/video.service.ts` | Implemented |
| Storage Service | `backend/src/services/storage.service.ts` | Implemented |
| FFmpeg Service | `backend/src/services/ffmpeg.service.ts` | Implemented |
| Queue Service | `backend/src/services/queue.service.ts` | Implemented |

### Frontend Implementation Status

| Component | File | Status |
|-----------|------|--------|
| Video Service | `frontend/src/services/videos.ts` | Implemented |
| VideoWatch Page | `frontend/src/pages/student/VideoWatch.tsx` | Implemented |
| Student Courses | `frontend/src/pages/student/Courses.tsx` | Implemented |
| Student Lessons | `frontend/src/pages/student/Lessons.tsx` | Implemented |

---

## Data Flow: Teacher Uploads Video

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         TEACHER UPLOAD FLOW                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. Teacher selects video file                                           │
│       │                                                                   │
│       ▼                                                                   │
│  2. POST /api/videos/upload (multipart/form-data)                        │
│       │  - Middleware: authenticate, requireTeacher, videoUpload         │
│       │  - Saves to temp storage                                          │
│       │  - Returns: { tempId, filename, size, mimeType }                 │
│       ▼                                                                   │
│  3. POST /api/videos (create record)                                     │
│       │  - Body: { tempId, title, description?, courseId? }              │
│       │  - Creates Video record with status=PROCESSING                   │
│       │  - Moves file to permanent storage                               │
│       │  - Queues transcode job (BullMQ)                                 │
│       │  - Queues thumbnail job                                          │
│       ▼                                                                   │
│  4. Background Workers Process                                           │
│       │  - FFmpeg transcodes to HLS (360p, 480p, 720p, 1080p)            │
│       │  - Generates thumbnail                                            │
│       │  - Updates Video: status=READY, hlsUrl, thumbnailUrl             │
│       ▼                                                                   │
│  5. Video ready for streaming                                            │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Student Accesses Video

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         STUDENT ACCESS FLOW                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. Student browses courses/videos                                       │
│       │  GET /api/courses  OR  GET /api/videos                           │
│       │  - Auth: Any authenticated user                                  │
│       │  - Returns paginated list with status=READY filter available     │
│       ▼                                                                   │
│  2. Student selects a video                                              │
│       │  GET /api/videos/:id                                             │
│       │  - Returns video metadata including hlsUrl                       │
│       ▼                                                                   │
│  3. VideoPlayer loads HLS stream                                         │
│       │  GET /api/videos/:id/stream/master.m3u8                          │
│       │  - Returns HLS master playlist                                   │
│       ▼                                                                   │
│  4. Player requests resolution playlist                                  │
│       │  GET /api/videos/:id/stream/:resolution/playlist.m3u8            │
│       ▼                                                                   │
│  5. Player streams segments                                              │
│       │  GET /api/videos/:id/stream/:resolution/:segment.ts              │
│       ▼                                                                   │
│  6. Progress tracking                                                    │
│       │  POST /api/progress (updates watchPercentage)                    │
│       │  POST /api/progress/:videoId/complete (marks as complete)        │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints Analysis

### Video Listing (Student Access)

```typescript
GET /api/videos
Query: { page, limit, courseId, status, search, sortBy, sortOrder }
Auth: Required (any role)
```

**Current behavior:** Returns ALL videos, not filtered by ownership. Students can see all teacher videos.

### Video Details

```typescript
GET /api/videos/:id
Auth: Required (any role)
```

**Current behavior:** Returns video details for any authenticated user.

### Video Streaming

```typescript
GET /api/videos/:id/stream/master.m3u8      // HLS master playlist
GET /api/videos/:id/stream/:res/playlist.m3u8  // Resolution playlist
GET /api/videos/:id/stream/:res/:segment.ts    // Video segments
Auth: Required (any role)
```

**Current behavior:** Any authenticated user can stream any video.

### Thumbnail

```typescript
GET /api/videos/:id/thumbnail
Auth: None (public for img tags)
```

---

## What's Already Working

1. **Teacher Upload Flow**
   - File upload with progress tracking
   - Video transcoding to HLS (multiple resolutions)
   - Thumbnail generation
   - Queue-based background processing

2. **Student Video Access**
   - Browse all videos via API
   - Watch videos with HLS player
   - Progress tracking per student
   - Mark videos as complete

3. **Video Player**
   - HLS adaptive streaming
   - Resume from last position
   - Progress callbacks

---

## What May Need Attention

### 1. Video Visibility Filtering (Optional Enhancement)

Currently all videos are visible to all students. If you want more control:

**Option A: Course-based access (recommended)**
```typescript
// Only show videos from published courses
GET /api/videos?courseId=<id>&status=READY

// Add to video.service.ts list():
where: {
  status: 'READY',
  OR: [
    { courseId: null }, // Standalone videos
    { course: { isPublished: true } } // From published courses
  ]
}
```

**Option B: Video publish status**
```prisma
// Add to Video model
isPublished Boolean @default(false)
```

### 2. Ensure Courses Show Videos

**File to verify:** `frontend/src/pages/student/Courses.tsx`

Students should see:
- List of all published courses
- Number of videos per course
- Course progress percentage

### 3. Video Listing on Student Dashboard

**File to verify:** `frontend/src/pages/StudentDashboard.tsx`

Should display:
- Continue watching (in-progress videos)
- Recently added videos
- Recommended videos

### 4. Course Detail with Videos

**Expected flow:**
```
Student Dashboard → Courses → Course Detail → Video List → VideoWatch
```

---

## File Storage Structure

```
~/englishpro-storage/
├── videos/
│   └── <video-id>/
│       ├── original.mp4
│       ├── master.m3u8
│       ├── 1080p/
│       │   ├── playlist.m3u8
│       │   └── segment_0000.ts, segment_0001.ts, ...
│       ├── 720p/
│       │   └── ...
│       ├── 480p/
│       │   └── ...
│       └── 360p/
│           └── ...
├── thumbnails/
│   └── <video-id>.jpg
├── submissions/
│   └── <submission-id>.webm
└── temp/
    └── <temp-files>
```

---

## Implementation Checklist

### Already Implemented
- [x] Video upload endpoint (teacher only)
- [x] Video transcoding (FFmpeg + BullMQ)
- [x] HLS streaming endpoints
- [x] Thumbnail generation
- [x] Video listing API (paginated)
- [x] Video details API
- [x] Frontend VideoPlayer component
- [x] Student VideoWatch page
- [x] Progress tracking (backend + frontend)
- [x] Video service (frontend)

### To Verify/Test
- [ ] End-to-end upload → transcode → watch flow
- [ ] Student can see teacher's uploaded videos
- [ ] HLS playback works in browser
- [ ] Progress saves correctly
- [ ] Multiple students can watch same video

### Optional Enhancements
- [ ] Video publish/unpublish toggle for teachers
- [ ] Course enrollment requirement
- [ ] View count tracking
- [ ] Related videos suggestions

---

## Testing Steps

```bash
# 1. Start backend
cd backend && npm run dev

# 2. Start frontend (separate terminal)
cd frontend && npm run dev

# 3. Register a teacher account
# 4. Login as teacher
# 5. Upload a video via teacher dashboard
# 6. Wait for transcoding (check status)
# 7. Logout

# 8. Register a student account
# 9. Login as student
# 10. Browse videos/courses
# 11. Click on the uploaded video
# 12. Verify video plays
# 13. Check progress saves
```

---

## Summary

The core infrastructure for **teacher uploads → student access** is already implemented:

| Layer | Status |
|-------|--------|
| Database schema | Complete |
| Backend routes | Complete |
| Video processing | Complete |
| HLS streaming | Complete |
| Frontend services | Complete |
| Student pages | Complete |

**The system should work as-is.** The main work is:
1. Testing the full flow
2. Ensuring the UI properly lists videos for students
3. Optional: Adding visibility controls (publish/unpublish)

---

## Key Files Reference

| Purpose | Backend | Frontend |
|---------|---------|----------|
| Routes | `src/routes/videos.ts` | - |
| Controller | `src/controllers/videoController.ts` | - |
| Service | `src/services/video.service.ts` | `src/services/videos.ts` |
| Storage | `src/services/storage.service.ts` | - |
| Transcoding | `src/services/ffmpeg.service.ts` | - |
| Queue | `src/services/queue.service.ts` | - |
| Watch page | - | `src/pages/student/VideoWatch.tsx` |
| Player | - | `src/components/video/VideoPlayer.tsx` |
| Progress | `src/services/progress.service.ts` | `src/services/progress.ts` |
