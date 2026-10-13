// Drafts practice activities for one lesson. The teacher always reviews and
// edits the draft before saving, so this only has to be a sensible start.
// Output shape and limits mirror backend/src/types/practice.ts.

export interface PracticeDraft {
  quiz: { prompt: string; promptZh?: string; options: string[]; answer: number; explanation?: string; explanationZh?: string }[];
  match: { word: string; zh: string }[];
  scramble: { text: string; zh?: string }[];
}

export interface DraftRequest {
  title: string;
  description: string;
}

export class DraftRequestError extends Error {}

const clip = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function parseDraftRequest(body: unknown): DraftRequest {
  if (typeof body !== 'object' || body === null) throw new DraftRequestError('Invalid request');
  const { title, description } = body as Record<string, unknown>;
  const t = clip(title, 200);
  if (!t) throw new DraftRequestError('A lesson title is required');
  return { title: t, description: clip(description, 1500) };
}

export function buildDraftPrompt({ title, description }: DraftRequest): string {
  return [
    'You write English practice activities for a teacher of young learners (grades 3-6) whose first language is Traditional Chinese.',
    'Use only simple, concrete vocabulary that fits the lesson below. Do not invent facts about what was taught beyond the title and description.',
    '',
    `Lesson title: ${title}`,
    description ? `Lesson description: ${description}` : 'Lesson description: (none given)',
    '',
    'Reply with ONLY a JSON object, no markdown, in exactly this shape:',
    '{"quiz":[{"prompt":"...","options":["...","...","...","..."],"answer":0,"explanation":"...","explanationZh":"..."}],',
    ' "match":[{"word":"English word","zh":"繁體中文"}],',
    ' "scramble":[{"text":"A short English sentence","zh":"繁體中文翻譯"}]}',
    'Write 5 quiz questions (4 options each, "answer" is the 0-based index of the correct option), 6 match pairs, and 4 scramble sentences of 4 to 8 words.',
  ].join('\n');
}

function extractJson(raw: string): unknown {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Keep only well-formed items. A model slip drops one item, not the whole draft.
export function sanitizeDraft(raw: string): PracticeDraft | null {
  const data = extractJson(raw);
  if (typeof data !== 'object' || data === null) return null;
  const { quiz, match, scramble } = data as Record<string, unknown>;

  const out: PracticeDraft = { quiz: [], match: [], scramble: [] };

  for (const q of Array.isArray(quiz) ? quiz : []) {
    if (typeof q !== 'object' || q === null) continue;
    const item = q as Record<string, unknown>;
    const options = Array.isArray(item.options) ? item.options.map((o) => clip(o, 80)).filter(Boolean) : [];
    const prompt = clip(item.prompt, 200);
    const answer = item.answer;
    if (!prompt || options.length < 2 || options.length > 4) continue;
    if (typeof answer !== 'number' || !Number.isInteger(answer) || answer < 0 || answer >= options.length) continue;
    out.quiz.push({
      prompt,
      options,
      answer,
      explanation: clip(item.explanation, 300) || undefined,
      explanationZh: clip(item.explanationZh, 300) || undefined,
    });
  }

  for (const m of Array.isArray(match) ? match : []) {
    if (typeof m !== 'object' || m === null) continue;
    const item = m as Record<string, unknown>;
    const word = clip(item.word, 40);
    const zh = clip(item.zh, 40);
    if (word && zh) out.match.push({ word, zh });
  }

  for (const s of Array.isArray(scramble) ? scramble : []) {
    if (typeof s !== 'object' || s === null) continue;
    const item = s as Record<string, unknown>;
    const text = clip(item.text, 120);
    const words = text.split(/\s+/).filter(Boolean).length;
    if (words >= 2 && words <= 12) out.scramble.push({ text, zh: clip(item.zh, 120) || undefined });
  }

  out.quiz = out.quiz.slice(0, 10);
  out.match = out.match.slice(0, 8);
  out.scramble = out.scramble.slice(0, 8);

  const empty = out.quiz.length === 0 && out.match.length === 0 && out.scramble.length === 0;
  return empty ? null : out;
}

// Pull the text out of a non-streaming Workers AI response (chat-completions
// shape, with a plain `response` fallback some models use).
export function readCompletionText(result: unknown): string {
  if (typeof result !== 'object' || result === null) return '';
  const r = result as { choices?: { message?: { content?: unknown } }[]; response?: unknown };
  const content = r.choices?.[0]?.message?.content ?? r.response;
  return typeof content === 'string' ? content : '';
}
