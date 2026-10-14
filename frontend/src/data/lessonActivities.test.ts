import { describe, it, expect } from 'vitest';
import { lessonActivities } from './practice';

const lesson = (practice: Parameters<typeof lessonActivities>[0]['practice']) => ({
  id: 'v1',
  title: 'Animals',
  practice,
});

describe('lessonActivities', () => {
  it('returns nothing when the lesson has no practice', () => {
    expect(lessonActivities(lesson(null))).toEqual([]);
    expect(lessonActivities(lesson(undefined))).toEqual([]);
  });

  it('builds one activity per non-empty section, tagged with the lesson', () => {
    const out = lessonActivities(
      lesson({
        quiz: [{ prompt: 'Q', options: ['a', 'b'], answer: 1 }],
        match: [
          { word: 'cat', zh: '貓' },
          { word: 'dog', zh: '狗' },
        ],
        scramble: [],
        vocab: [],
      }),
    );
    expect(out.map((a) => a.kind)).toEqual(['quiz', 'match']);
    expect(out.every((a) => a.lessonId === 'v1')).toBe(true);
    expect(out[0].title.en).toBe('Animals: Quiz');
  });

  it('skips a match game with fewer than two pairs', () => {
    const out = lessonActivities(lesson({ vocab: [], quiz: [], match: [{ word: 'cat', zh: '貓' }], scramble: [] }));
    expect(out).toEqual([]);
  });

  it('builds a vocabulary review first, keeping each word\'s recording', () => {
    const out = lessonActivities(
      lesson({
        vocab: [{ word: 'cat', zh: '貓', audio: 'a.mp3' }],
        quiz: [{ prompt: 'Q', options: ['a', 'b'], answer: 1 }],
        match: [],
        scramble: [],
      }),
    );
    expect(out.map((a) => a.kind)).toEqual(['vocab', 'quiz']);
    expect(out[0]).toMatchObject({ category: 'vocab', lessonId: 'v1', words: [{ word: 'cat', audio: 'a.mp3' }] });
  });

  it('reads practice saved before vocabulary existed', () => {
    const old = { quiz: [{ prompt: 'Q', options: ['a', 'b'], answer: 1 }], match: [], scramble: [] };
    const out = lessonActivities(lesson(old as unknown as Parameters<typeof lesson>[0]));
    expect(out.map((a) => a.kind)).toEqual(['quiz']);
  });
});
