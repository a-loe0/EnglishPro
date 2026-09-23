import { describe, expect, it, vi } from 'vitest';
import { handleTutorRequest, type Env } from '../src/index';
import { readDeltas, signToken, sseStream, studentClaims } from './helpers';

const SECRET = 'test-secret';

function makeEnv(overrides: Partial<Env> = {}) {
  const run = vi.fn(async () =>
    sseStream(['data: {"choices":[{"delta":{"content":"Hello!"}}]}\n\n', 'data: [DONE]\n\n']),
  );
  const limit = vi.fn(async () => ({ success: true }));
  const env = {
    AI: { run } as unknown as Ai,
    TUTOR_LIMITER: { limit } as unknown as RateLimit,
    TUTOR_MODEL: '@cf/zai-org/glm-4.7-flash',
    JWT_SECRET: SECRET,
    ...overrides,
  } satisfies Env;
  return { env, run, limit };
}

async function tutorRequest(body: unknown, token?: string, path = '/api/tutor'): Promise<Request> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request(`https://englishgopro.com${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

const validBody = {
  messages: [{ role: 'user', content: 'What does "break the ice" mean?' }],
  lesson: { title: 'Small talk', courseTitle: 'Everyday English' },
  language: 'en',
};

describe('handleTutorRequest', () => {
  it('streams a reply for a logged-in student and sends the lesson to the model', async () => {
    const { env, run, limit } = makeEnv();
    const token = await signToken(studentClaims(), SECRET);

    const response = await handleTutorRequest(await tutorRequest(validBody, token), env);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/event-stream');
    expect(await readDeltas(response.body!)).toEqual({ text: 'Hello!', done: true });
    expect(limit).toHaveBeenCalledWith({ key: 'student-1' });

    const [model, input] = run.mock.calls[0] as unknown as [string, { messages: { role: string; content: string }[] }];
    expect(model).toBe('@cf/zai-org/glm-4.7-flash');
    expect(input.messages[0].role).toBe('system');
    expect(input.messages[0].content).toContain('Lesson title: Small talk');
    expect(input.messages.at(-1)).toEqual(validBody.messages[0]);
  });

  it('rejects requests without a valid token before calling the model', async () => {
    const { env, run } = makeEnv();
    const noToken = await handleTutorRequest(await tutorRequest(validBody), env);
    const badToken = await handleTutorRequest(
      await tutorRequest(validBody, await signToken(studentClaims(), 'wrong')),
      env,
    );
    expect(noToken.status).toBe(401);
    expect(badToken.status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });

  it('returns 429 when the student is over the rate limit', async () => {
    const { env, run } = makeEnv({
      TUTOR_LIMITER: { limit: vi.fn(async () => ({ success: false })) } as unknown as RateLimit,
    });
    const token = await signToken(studentClaims(), SECRET);
    const response = await handleTutorRequest(await tutorRequest(validBody, token), env);
    expect(response.status).toBe(429);
    expect(run).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid bodies', async () => {
    const { env } = makeEnv();
    const token = await signToken(studentClaims(), SECRET);
    const response = await handleTutorRequest(await tutorRequest({ messages: [] }, token), env);
    expect(response.status).toBe(400);
  });

  it('returns a friendly 503 when Workers AI fails, e.g. the daily allowance is used up', async () => {
    const { env } = makeEnv({
      AI: { run: vi.fn(async () => { throw new Error('4006: daily free allocation exceeded'); }) } as unknown as Ai,
    });
    const token = await signToken(studentClaims(), SECRET);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await handleTutorRequest(await tutorRequest(validBody, token), env);
    spy.mockRestore();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'AI_UNAVAILABLE' });
  });

  it('only serves POST /api/tutor', async () => {
    const { env } = makeEnv();
    const get = await handleTutorRequest(new Request('https://englishgopro.com/api/tutor'), env);
    const other = await handleTutorRequest(await tutorRequest(validBody, undefined, '/api/tutorial'), env);
    expect(get.status).toBe(405);
    expect(other.status).toBe(404);
  });

  it('fails closed when JWT_SECRET is missing', async () => {
    const { env, run } = makeEnv({ JWT_SECRET: '' });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await handleTutorRequest(await tutorRequest(validBody, 'x.y.z'), env);
    spy.mockRestore();
    expect(response.status).toBe(500);
    expect(run).not.toHaveBeenCalled();
  });
});
