import { describe, expect, it, vi } from 'vitest';
import { handleTutorRequest, type Env } from '../src/index';
import { sanitizeDraft } from '../src/practice';
import { signToken, studentClaims } from './helpers';

const SECRET = 'test-secret';

const goodJson = JSON.stringify({
  quiz: [
    { prompt: 'What is a "cat"?', options: ['an animal', 'a fruit'], answer: 0, explanation: 'A cat is an animal.' },
    { prompt: 'Bad answer index', options: ['a', 'b'], answer: 5 },
  ],
  match: [{ word: 'cat', zh: '貓' }, { word: 'dog' }],
  scramble: [{ text: 'The cat sleeps', zh: '貓在睡覺' }, { text: 'Hello' }],
});

function makeEnv(aiText = goodJson) {
  const run = vi.fn(async () => ({ choices: [{ message: { content: aiText } }] }));
  const env = {
    AI: { run } as unknown as Ai,
    TUTOR_LIMITER: { limit: vi.fn(async () => ({ success: true })) } as unknown as RateLimit,
    TUTOR_MODEL: 'm',
    JWT_SECRET: SECRET,
  } satisfies Env;
  return { env, run };
}

async function draft(env: Env, role: string | null, body: unknown = { title: 'Animals' }) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (role) headers.Authorization = `Bearer ${await signToken(studentClaims({ role }), SECRET)}`;
  return handleTutorRequest(
    new Request('https://englishgopro.com/api/tutor/draft', { method: 'POST', headers, body: JSON.stringify(body) }),
    env,
  );
}

describe('sanitizeDraft', () => {
  it('keeps valid items, drops malformed ones, and strips code fences', () => {
    const out = sanitizeDraft('```json\n' + goodJson + '\n```');
    expect(out?.quiz).toHaveLength(1);
    expect(out?.match).toEqual([{ word: 'cat', zh: '貓' }]);
    expect(out?.scramble).toEqual([{ text: 'The cat sleeps', zh: '貓在睡覺' }]);
  });

  it('returns null for garbage or an all-invalid draft', () => {
    expect(sanitizeDraft('sorry, no')).toBeNull();
    expect(sanitizeDraft('{"quiz":[],"match":[],"scramble":[]}')).toBeNull();
  });
});

describe('POST /api/tutor/draft', () => {
  it('drafts activities for a teacher', async () => {
    const { env, run } = makeEnv();
    const res = await draft(env, 'TEACHER');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { practice: { quiz: unknown[] } };
    expect(body.practice.quiz).toHaveLength(1);
    expect(JSON.stringify(run.mock.calls[0])).toContain('Animals');
  });

  it('refuses students and anonymous callers without calling the model', async () => {
    const { env, run } = makeEnv();
    expect((await draft(env, 'STUDENT')).status).toBe(403);
    expect((await draft(env, null)).status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });

  it('requires a title and reports an unusable model reply', async () => {
    expect((await draft(makeEnv().env, 'TEACHER', { title: '  ' })).status).toBe(400);
    expect((await draft(makeEnv('not json').env, 'TEACHER')).status).toBe(502);
  });
});

describe('draft prompt', () => {
  it('requires one correct answer and lists existing items to avoid', async () => {
    const { env, run } = makeEnv();
    await draft(env, 'TEACHER', { title: 'Age', existing: ['How old are you?'] });
    const sent = JSON.stringify(run.mock.calls[0]);
    expect(sent).toContain('Exactly ONE option is correct');
    expect(sent).toContain('How old are you?');
  });
});
