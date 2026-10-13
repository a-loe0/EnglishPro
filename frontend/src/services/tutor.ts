import { authService } from './auth';
import type { LessonPractice } from './videos';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
// The tutor is a Cloudflare Worker on /api/tutor in production. For local
// development point VITE_TUTOR_URL at `wrangler dev` (see tutor-worker/README.md).
const TUTOR_URL = import.meta.env.VITE_TUTOR_URL || `${API_URL}/tutor`;

export interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TutorLesson {
  title: string;
  description?: string | null;
  courseTitle?: string | null;
}

export interface TutorRequest {
  messages: TutorMessage[];
  lesson?: TutorLesson | null;
  language: 'en' | 'zh';
}

export type TutorErrorCode =
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'AI_UNAVAILABLE'
  | 'BAD_REQUEST'
  | 'NETWORK'
  | 'UNKNOWN';

export class TutorError extends Error {
  code: TutorErrorCode;

  constructor(code: TutorErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function post(body: string, signal?: AbortSignal): Promise<Response> {
  return fetch(TUTOR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authService.getToken() ?? ''}`,
    },
    body,
    signal,
  });
}

async function toTutorError(response: Response): Promise<TutorError> {
  let code: TutorErrorCode = 'UNKNOWN';
  let message = `Tutor request failed (${response.status})`;
  try {
    const data = (await response.json()) as { code?: string; error?: string };
    if (data.error) message = data.error;
    if (data.code === 'UNAUTHORIZED' || data.code === 'RATE_LIMITED' || data.code === 'AI_UNAVAILABLE' || data.code === 'BAD_REQUEST') {
      code = data.code;
    }
  } catch {
    // Non-JSON error body; keep the generic message.
  }
  return new TutorError(code, message);
}

/**
 * Sends the conversation to the tutor and calls `onDelta` with each piece of
 * the reply as it streams in. Retries once after refreshing an expired token.
 */
export async function streamTutorReply(
  request: TutorRequest,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const body = JSON.stringify({
    messages: request.messages,
    language: request.language,
    lesson: request.lesson
      ? {
          title: request.lesson.title,
          description: request.lesson.description ?? undefined,
          courseTitle: request.lesson.courseTitle ?? undefined,
        }
      : undefined,
  });

  let response: Response;
  try {
    response = await post(body, signal);
    if (response.status === 401) {
      try {
        await authService.refreshToken();
      } catch {
        throw new TutorError('UNAUTHORIZED', 'Please log in again to use the tutor');
      }
      response = await post(body, signal);
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    if (err instanceof TutorError) throw err;
    throw new TutorError('NETWORK', 'Could not reach the tutor');
  }

  if (!response.ok || !response.body) {
    throw await toTutorError(response);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';
    for (const event of events) {
      const data = event.replace(/^data: /, '').trim();
      if (!data || data === '[DONE]') continue;
      try {
        const { delta } = JSON.parse(data) as { delta?: string };
        if (delta) onDelta(delta);
      } catch {
        // Ignore a malformed event rather than dropping the whole reply.
      }
    }
  }
}

/**
 * Asks the AI for a starting set of practice activities for a lesson. Teacher
 * only; the teacher edits the draft before saving it.
 */
export async function draftLessonPractice(title: string, description: string | null): Promise<LessonPractice> {
  const send = () =>
    fetch(`${TUTOR_URL}/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authService.getToken() ?? ''}`,
      },
      body: JSON.stringify({ title, description: description ?? '' }),
    });

  let response: Response;
  try {
    response = await send();
    if (response.status === 401) {
      try {
        await authService.refreshToken();
      } catch {
        throw new TutorError('UNAUTHORIZED', 'Please log in again');
      }
      response = await send();
    }
  } catch (err) {
    if (err instanceof TutorError) throw err;
    throw new TutorError('NETWORK', 'Could not reach the tutor');
  }

  if (!response.ok) throw await toTutorError(response);
  const data = (await response.json()) as { practice: LessonPractice };
  return data.practice;
}
