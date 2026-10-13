import { z } from 'zod';

// Practice a teacher attaches to one lesson (video). Stored as JSON on
// videos.practice and rendered by the student Practice page. Keep the limits
// in step with tutor-worker/src/practice.ts, which drafts the same shape.

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional();

export const quizItemSchema = z
  .object({
    prompt: text(200),
    promptZh: optionalText(200),
    options: z.array(text(80)).min(2).max(4),
    answer: z.number().int().min(0),
    explanation: optionalText(300),
    explanationZh: optionalText(300),
  })
  .refine((q) => q.answer < q.options.length, { message: 'answer must point at an option' });

export const matchItemSchema = z.object({
  word: text(40),
  zh: text(40),
});

export const scrambleItemSchema = z.object({
  text: text(120).refine((s) => s.split(/\s+/).length >= 2 && s.split(/\s+/).length <= 12, {
    message: 'sentence needs 2 to 12 words',
  }),
  zh: optionalText(120),
});

export const lessonPracticeSchema = z.object({
  quiz: z.array(quizItemSchema).max(10).default([]),
  match: z.array(matchItemSchema).max(8).default([]),
  scramble: z.array(scrambleItemSchema).max(8).default([]),
});

export type LessonPractice = z.infer<typeof lessonPracticeSchema>;

// A match game needs at least two pairs to be a game.
export function isEmptyPractice(p: LessonPractice): boolean {
  return p.quiz.length === 0 && p.match.length < 2 && p.scramble.length === 0;
}
