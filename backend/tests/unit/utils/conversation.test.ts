import { canPostMessage, hasUnreadReply, MAX_MESSAGES } from '../../../src/utils/conversation';

describe('canPostMessage', () => {
  it('waits for the teacher’s first reply', () => {
    expect(canPostMessage({ feedbackText: null, hasFeedbackAudio: false }, 0)).toBe(false);
  });

  it('opens once the teacher replied with text or audio', () => {
    expect(canPostMessage({ feedbackText: 'Nice!', hasFeedbackAudio: false }, 0)).toBe(true);
    expect(canPostMessage({ feedbackText: null, hasFeedbackAudio: true }, 3)).toBe(true);
  });

  it('stops at the message limit', () => {
    expect(canPostMessage({ feedbackText: 'Nice!', hasFeedbackAudio: false }, MAX_MESSAGES)).toBe(false);
  });
});

describe('hasUnreadReply', () => {
  const earlier = new Date('2026-10-01');
  const later = new Date('2026-10-02');

  it('is unread when the teacher replied after the student last looked', () => {
    expect(hasUnreadReply(later, null)).toBe(true);
    expect(hasUnreadReply(later, earlier)).toBe(true);
  });

  it('is read once seen, and nothing is unread while waiting on the teacher', () => {
    expect(hasUnreadReply(earlier, later)).toBe(false);
    expect(hasUnreadReply(null, null)).toBe(false);
  });
});
