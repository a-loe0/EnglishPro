-- Bring the database in line with schema.prisma.
--
-- The initial migration (20251228214918_init) was generated from an earlier
-- version of the schema. Later model edits — is_published flags, the video view
-- counter, resume position, every @@index, and the removal of the Submission
-- model — were never captured as migrations, so a freshly migrated database was
-- missing them. Video creation failed outright with P2022 (column `views` does
-- not exist).
--
-- Generated with `prisma migrate diff --from-url <db> --to-schema-datamodel`.

-- DropForeignKey
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_student_id_fkey";

-- DropForeignKey
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_video_id_fkey";

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "progress" ADD COLUMN     "last_position" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- DropTable
-- The Submission model is not present in schema.prisma. The table is empty and
-- no code references it (there is no Prisma model to query it through).
DROP TABLE "submissions";

-- DropEnum
DROP TYPE "SubmissionStatus";

-- CreateIndex
CREATE INDEX "courses_teacher_id_idx" ON "courses"("teacher_id");

-- CreateIndex
CREATE INDEX "courses_is_published_idx" ON "courses"("is_published");

-- CreateIndex
CREATE INDEX "courses_created_at_idx" ON "courses"("created_at" DESC);

-- CreateIndex
CREATE INDEX "progress_student_id_idx" ON "progress"("student_id");

-- CreateIndex
CREATE INDEX "progress_video_id_idx" ON "progress"("video_id");

-- CreateIndex
CREATE INDEX "progress_completed_idx" ON "progress"("completed");

-- CreateIndex
CREATE INDEX "progress_last_watched_at_idx" ON "progress"("last_watched_at" DESC);

-- CreateIndex
CREATE INDEX "videos_teacher_id_idx" ON "videos"("teacher_id");

-- CreateIndex
CREATE INDEX "videos_course_id_idx" ON "videos"("course_id");

-- CreateIndex
CREATE INDEX "videos_status_idx" ON "videos"("status");

-- CreateIndex
CREATE INDEX "videos_is_published_idx" ON "videos"("is_published");

-- CreateIndex
CREATE INDEX "videos_created_at_idx" ON "videos"("created_at" DESC);
