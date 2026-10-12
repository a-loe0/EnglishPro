export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Shuffle, but never hand back the original order (a "scramble" that is
// already solved is not a puzzle).
export function shuffleDifferent<T>(items: readonly T[]): T[] {
  if (items.length < 2) return [...items];
  let out = shuffle(items);
  for (let i = 0; i < 5 && out.every((v, idx) => v === items[idx]); i++) {
    out = shuffle(items);
  }
  return out;
}
