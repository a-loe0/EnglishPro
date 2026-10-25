// Rules for the back-and-forth about one pronunciation recording.

// Enough for a real conversation, not a chat app.
export const MAX_MESSAGES = 20;

interface Thread {
  feedbackText: string | null;
  hasFeedbackAudio: boolean;
}

// Follow-ups start once the teacher has given her first reply; until then she
// uses the feedback form and the student has nothing to answer.
export function canPostMessage(thread: Thread, messageCount: number): boolean {
  const teacherReplied = !!thread.feedbackText || thread.hasFeedbackAudio;
  return teacherReplied && messageCount < MAX_MESSAGES;
}

// The teacher said something the student has not opened yet.
export function hasUnreadReply(reviewedAt: Date | null, studentSeenAt: Date | null): boolean {
  return !!reviewedAt && (!studentSeenAt || studentSeenAt < reviewedAt);
}
