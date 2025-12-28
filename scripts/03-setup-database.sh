#!/bin/bash
set -e

echo "=========================================="
echo "EnglishPro - Database Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Add PostgreSQL to PATH
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Check if PostgreSQL is running
echo ""
echo "Checking PostgreSQL..."
if ! pg_isready -q 2>/dev/null; then
    print_warning "PostgreSQL is not running. Starting..."
    brew services start postgresql@16
    sleep 3
fi

if pg_isready -q 2>/dev/null; then
    print_status "PostgreSQL is running"
else
    print_error "PostgreSQL failed to start. Please check your installation."
    exit 1
fi

# Create database if it doesn't exist
echo ""
echo "Checking database..."
DB_NAME="englishpro_dev"
if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    print_status "Database '$DB_NAME' already exists"
else
    print_warning "Creating database '$DB_NAME'..."
    createdb "$DB_NAME"
    print_status "Database '$DB_NAME' created"
fi

# Create Prisma schema
echo ""
echo "Setting up Prisma schema..."

PRISMA_SCHEMA="$PROJECT_ROOT/backend/prisma/schema.prisma"
mkdir -p "$(dirname "$PRISMA_SCHEMA")"

cat > "$PRISMA_SCHEMA" << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  TEACHER
  STUDENT
}

enum SubmissionStatus {
  PENDING
  REVIEWED
}

enum VideoStatus {
  PROCESSING
  READY
  FAILED
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String
  role         Role
  avatarUrl    String?  @map("avatar_url")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  courses     Course[]     @relation("TeacherCourses")
  videos      Video[]      @relation("TeacherVideos")
  submissions Submission[] @relation("StudentSubmissions")
  progress    Progress[]   @relation("StudentProgress")

  @@map("users")
}

model Course {
  id          String   @id @default(uuid())
  teacherId   String   @map("teacher_id")
  title       String
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  teacher User    @relation("TeacherCourses", fields: [teacherId], references: [id], onDelete: Cascade)
  videos  Video[]

  @@map("courses")
}

model Video {
  id           String      @id @default(uuid())
  teacherId    String      @map("teacher_id")
  courseId     String?     @map("course_id")
  title        String
  description  String?
  videoUrl     String      @map("video_url")
  hlsUrl       String?     @map("hls_url")
  thumbnailUrl String?     @map("thumbnail_url")
  duration     Int?        // Duration in seconds
  status       VideoStatus @default(PROCESSING)
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")

  // Relations
  teacher     User         @relation("TeacherVideos", fields: [teacherId], references: [id], onDelete: Cascade)
  course      Course?      @relation(fields: [courseId], references: [id], onDelete: SetNull)
  submissions Submission[]
  progress    Progress[]

  @@map("videos")
}

model Submission {
  id            String           @id @default(uuid())
  studentId     String           @map("student_id")
  videoId       String           @map("video_id")
  submissionUrl String           @map("submission_url")
  status        SubmissionStatus @default(PENDING)
  grade         Int?
  feedback      String?
  submittedAt   DateTime         @default(now()) @map("submitted_at")
  reviewedAt    DateTime?        @map("reviewed_at")

  // Relations
  student User  @relation("StudentSubmissions", fields: [studentId], references: [id], onDelete: Cascade)
  video   Video @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@map("submissions")
}

model Progress {
  id              String   @id @default(uuid())
  studentId       String   @map("student_id")
  videoId         String   @map("video_id")
  watchPercentage Float    @default(0) @map("watch_percentage")
  completed       Boolean  @default(false)
  lastWatchedAt   DateTime @default(now()) @map("last_watched_at")

  // Relations
  student User  @relation("StudentProgress", fields: [studentId], references: [id], onDelete: Cascade)
  video   Video @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@unique([studentId, videoId])
  @@map("progress")
}
EOF

print_status "Prisma schema created"

# Get current username for PostgreSQL connection
CURRENT_USER=$(whoami)

# Ensure backend .env has DATABASE_URL
echo ""
echo "Checking backend .env..."
BACKEND_ENV="$PROJECT_ROOT/backend/.env"
if [ ! -f "$BACKEND_ENV" ]; then
    echo "DATABASE_URL=\"postgresql://${CURRENT_USER}@localhost:5432/$DB_NAME\"" > "$BACKEND_ENV"
    print_status "Created backend .env with DATABASE_URL"
elif ! grep -q "DATABASE_URL" "$BACKEND_ENV"; then
    echo "DATABASE_URL=\"postgresql://${CURRENT_USER}@localhost:5432/$DB_NAME\"" >> "$BACKEND_ENV"
    print_status "Added DATABASE_URL to backend .env"
else
    print_status "DATABASE_URL already configured"
fi

# Run migrations
echo ""
echo "Running database migrations..."
cd "$PROJECT_ROOT/backend"

npx prisma migrate dev --name init --skip-generate 2>/dev/null || npx prisma migrate dev --name init

print_status "Database migrations complete"

# Generate Prisma client
echo ""
echo "Generating Prisma client..."
npx prisma generate

print_status "Prisma client generated"

echo ""
echo "=========================================="
print_status "Database setup complete!"
echo "=========================================="
echo ""
echo "Database: $DB_NAME"
echo "Tables created: users, courses, videos, submissions, progress"
echo ""
echo "You can view your database with:"
echo "  npm run db:studio"
echo ""
echo "Next: Run ./scripts/04-setup-env.sh"
