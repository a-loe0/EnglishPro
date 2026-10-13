import { lessonPracticeSchema, isEmptyPractice } from '../../../src/types/practice';

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

  it('treats a single match pair as empty', () => {
    const p = lessonPracticeSchema.parse({ match: [{ word: 'cat', zh: '貓' }] });
    expect(isEmptyPractice(p)).toBe(true);
  });
});
