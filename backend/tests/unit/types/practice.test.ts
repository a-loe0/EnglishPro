import { lessonPracticeSchema, isEmptyPractice, canRecordWord, LESSON_RECORDING_WORD } from '../../../src/types/practice';

describe('lessonPracticeSchema', () => {
  it('accepts a full practice set and defaults missing sections', () => {
    const parsed = lessonPracticeSchema.parse({
      quiz: [{ prompt: 'What is "cat"?', options: ['dog', 'cat'], answer: 1 }],
      scramble: [{ text: 'I like apples', zh: '我喜歡蘋果' }],
    });
    expect(parsed.match).toEqual([]);
    expect(parsed.quiz[0].answer).toBe(1);
  });

  it('rejects an answer index outside the options', () => {
    const result = lessonPracticeSchema.safeParse({
      quiz: [{ prompt: 'Q', options: ['a', 'b'], answer: 2 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects one-word scramble sentences and oversized sets', () => {
    expect(lessonPracticeSchema.safeParse({ scramble: [{ text: 'Hello' }] }).success).toBe(false);
    const eleven = Array.from({ length: 11 }, () => ({ prompt: 'Q', options: ['a', 'b'], answer: 0 }));
    expect(lessonPracticeSchema.safeParse({ quiz: eleven }).success).toBe(false);
  });

  it('accepts vocabulary words, with or without a recording', () => {
    const parsed = lessonPracticeSchema.parse({
      vocab: [
        { word: 'apple', zh: '蘋果', audio: '0b9f6e0e-6d3a-4c0e-9d53-1a2b3c4d5e6f.mp3' },
        { word: 'bus', zh: '公車', example: 'I take the bus.' },
      ],
    });
    expect(parsed.vocab).toHaveLength(2);
    expect(isEmptyPractice(parsed)).toBe(false);
  });

  it('rejects a recording name the server did not make', () => {
    const bad = (audio: string) =>
      lessonPracticeSchema.safeParse({ vocab: [{ word: 'apple', zh: '蘋果', audio }] }).success;
    expect(bad('../../etc/passwd')).toBe(false);
    expect(bad('apple.mp3')).toBe(false);
  });

  it('treats a single match pair as empty', () => {
    const p = lessonPracticeSchema.parse({ match: [{ word: 'cat', zh: '貓' }] });
    expect(isEmptyPractice(p)).toBe(true);
  });
});

describe('canRecordWord', () => {
  const practice = { vocab: [{ word: 'apple', zh: '蘋果' }] };

  it('takes a lesson recording on any lesson, even one with no practice', () => {
    expect(canRecordWord(null, LESSON_RECORDING_WORD)).toBe(true);
    expect(canRecordWord({}, LESSON_RECORDING_WORD)).toBe(true);
    expect(canRecordWord(practice, LESSON_RECORDING_WORD)).toBe(true);
  });

  it('takes a word only when the teacher added it to the lesson', () => {
    expect(canRecordWord(practice, 'apple')).toBe(true);
    expect(canRecordWord(practice, 'banana')).toBe(false);
    expect(canRecordWord(null, 'apple')).toBe(false);
  });
});
