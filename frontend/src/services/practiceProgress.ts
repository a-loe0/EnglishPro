// Practice results live in this browser only (no backend yet), keyed by user
// so siblings sharing a computer keep their own stars.

export interface PracticeResult {
  best: number;
  total: number;
  plays: number;
}

type Store = Record<string, PracticeResult>;

const keyFor = (userId: string | undefined) => `englishgopro_practice_${userId ?? 'guest'}`;

export function loadPracticeProgress(userId: string | undefined): Store {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

export function recordPracticeResult(
  userId: string | undefined,
  activityId: string,
  score: number,
  total: number,
): Store {
  const store = loadPracticeProgress(userId);
  const prev = store[activityId];
  const isBetter = !prev || score / total > prev.best / prev.total;
  store[activityId] = {
    best: isBetter ? score : prev.best,
    total: isBetter ? total : prev.total,
    plays: (prev?.plays ?? 0) + 1,
  };
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(store));
  } catch {
    // Storage full or blocked: results just won't persist.
  }
  return store;
}

export function starsFor(score: number, total: number): 0 | 1 | 2 | 3 {
  if (total <= 0 || score <= 0) return 0;
  const ratio = score / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}
