-- CreateTable
CREATE TABLE "pronunciation_submissions" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "feedback_text" TEXT,
    "has_feedback_audio" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pronunciation_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pronunciation_submissions_video_id_idx" ON "pronunciation_submissions"("video_id");

-- CreateIndex
CREATE INDEX "pronunciation_submissions_reviewed_at_idx" ON "pronunciation_submissions"("reviewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "pronunciation_submissions_student_id_video_id_word_key" ON "pronunciation_submissions"("student_id", "video_id", "word");

-- AddForeignKey
ALTER TABLE "pronunciation_submissions" ADD CONSTRAINT "pronunciation_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pronunciation_submissions" ADD CONSTRAINT "pronunciation_submissions_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
