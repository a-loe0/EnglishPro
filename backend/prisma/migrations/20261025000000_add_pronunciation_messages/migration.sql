-- AlterTable
ALTER TABLE "pronunciation_submissions" ADD COLUMN     "student_seen_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "pronunciation_messages" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "from_teacher" BOOLEAN NOT NULL,
    "text" TEXT,
    "has_audio" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pronunciation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pronunciation_messages_submission_id_created_at_idx" ON "pronunciation_messages"("submission_id", "created_at");

-- AddForeignKey
ALTER TABLE "pronunciation_messages" ADD CONSTRAINT "pronunciation_messages_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "pronunciation_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

