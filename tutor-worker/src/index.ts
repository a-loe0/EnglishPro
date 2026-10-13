import { verifyAccessToken } from './jwt';
import { buildSystemPrompt } from './prompt';
import { parseTutorRequest, RequestError } from './request';
import { toTutorStream } from './stream';

export interface Env {
  AI: Ai;
  TUTOR_LIMITER: RateLimit;
  TUTOR_MODEL: string;
  /** Same value as the backend's JWT_SECRET. */
  JWT_SECRET: string;
}

const MAX_BODY_BYTES = 32 * 1024;
const MAX_REPLY_TOKENS = 700;

function jsonError(status: number, error: string, code: string): Response {
  return Response.json({ error, code }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function handleTutorRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== '/api/tutor') {
    return jsonError(404, 'Not found', 'NOT_FOUND');
  }
  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  }

  if (!env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return jsonError(500, 'Tutor is not configured', 'NOT_CONFIGURED');
  }

  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const user = token ? await verifyAccessToken(token, env.JWT_SECRET) : null;
  if (!user) {
    return jsonError(401, 'Please log in to use the tutor', 'UNAUTHORIZED');
  }

  const { success } = await env.TUTOR_LIMITER.limit({ key: user.userId });
  if (!success) {
    return jsonError(429, 'You are sending messages too quickly. Please wait a minute.', 'RATE_LIMITED');
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return jsonError(413, 'Message is too long', 'TOO_LARGE');
  }

  let tutorRequest;
  try {
    tutorRequest = parseTutorRequest(JSON.parse(rawBody));
  } catch (err) {
    const message = err instanceof RequestError ? err.message : 'Invalid JSON body';
    return jsonError(400, message, 'BAD_REQUEST');
  }

  let upstream: unknown;
  try {
    upstream = await env.AI.run(env.TUTOR_MODEL as keyof AiModels, {
      messages: [
        { role: 'system', content: buildSystemPrompt(tutorRequest) },
        ...tutorRequest.messages,
      ],
      stream: true,
      max_completion_tokens: MAX_REPLY_TOKENS,
      temperature: 0.6,
      // Short tutoring replies don't need hidden reasoning, which otherwise
      // delays the first visible word by ~20s.
      chat_template_kwargs: { enable_thinking: false },
    } as never);
  } catch (err) {
    // The free plan's daily allowance surfaces here as an error once used up.
    console.error('Workers AI request failed', err);
    return jsonError(503, 'The tutor is resting right now. Please try again later.', 'AI_UNAVAILABLE');
  }

  if (!(upstream instanceof ReadableStream)) {
    console.error('Workers AI returned a non-stream response');
    return jsonError(502, 'The tutor could not answer. Please try again.', 'AI_BAD_RESPONSE');
  }

  return new Response(toTutorStream(upstream), {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export default {
  fetch: handleTutorRequest,
} satisfies ExportedHandler<Env>;
