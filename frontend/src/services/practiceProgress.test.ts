import { describe, it, expect, beforeEach } from 'vitest';
import { loadPracticeProgress, recordPracticeResult, starsFor } from './practiceProgress';

describe('practiceProgress', () => {
  beforeEach(() => localStorage.clear());

  it('awards stars by ratio', () => {
    expect(starsFor(0, 5)).toBe(0);
    expect(starsFor(2, 5)).toBe(1);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(0, 0)).toBe(0);
  });

  it('keeps the best result and counts plays', () => {
    recordPracticeResult('u1', 'quiz', 4, 5);
    const store = recordPracticeResult('u1', 'quiz', 2, 5);
    expect(store.quiz).toEqual({ best: 4, total: 5, plays: 2 });
  });

  it('keeps users separate', () => {
    recordPracticeResult('u1', 'quiz', 5, 5);
    expect(loadPracticeProgress('u2')).toEqual({});
  });

  it('survives corrupt storage', () => {
    localStorage.setItem('englishgopro_practice_u1', '{nope');
    expect(loadPracticeProgress('u1')).toEqual({});
  });
});
