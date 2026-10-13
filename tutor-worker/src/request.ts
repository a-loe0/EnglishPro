// Parses and bounds the chat request. Everything here comes from the browser,
// so it is capped before it reaches the model (cost) and treated as data in
// the prompt (never as instructions).

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface LessonContext {
  title: string;
  description?: string;
  courseTitle?: string;
}

export interface TutorRequest {
  messages: ChatMessage[];
  lesson?: LessonContext;
  language: 'en' | 'zh';
}

export const LIMITS = {
  /** Most recent turns forwarded to the model; older ones are dropped. */
  maxHistory: 12,
  maxMessageChars: 1500,
  maxLessonTitleChars: 200,
  maxLessonDescriptionChars: 1500,
} as const;

export class RequestError extends Error {}

function clip(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

export function parseTutorRequest(body: unknown): TutorRequest {
  if (typeof body !== 'object' || body === null) {
    throw new RequestError('Body must be a JSON object');
  }
  const raw = body as Record<string, unknown>;

  if (!Array.isArray(raw.messages) || raw.messages.length === 0) {
    throw new RequestError('messages must be a non-empty array');
  }

  const messages: ChatMessage[] = [];
  for (const entry of raw.messages.slice(-LIMITS.maxHistory)) {
    if (typeof entry !== 'object' || entry === null) {
      throw new RequestError('Each message must be an object');
    }
    const { role, content } = entry as Record<string, unknown>;
    if (role !== 'user' && role !== 'assistant') {
      throw new RequestError('Message role must be "user" or "assistant"');
    }
    if (typeof content !== 'string' || !content.trim()) {
      throw new RequestError('Message content must be a non-empty string');
    }
    if (content.length > LIMITS.maxMessageChars) {
      throw new RequestError(`Messages are limited to ${LIMITS.maxMessageChars} characters`);
    }
    messages.push({ role, content });
  }

  if (messages[messages.length - 1].role !== 'user') {
    throw new RequestError('The last message must come from the user');
  }

  let lesson: LessonContext | undefined;
  if (typeof raw.lesson === 'object' && raw.lesson !== null) {
    const l = raw.lesson as Record<string, unknown>;
    const title = clip(l.title, LIMITS.maxLessonTitleChars);
    if (title) {
      lesson = {
        title,
        description: clip(l.description, LIMITS.maxLessonDescriptionChars),
        courseTitle: clip(l.courseTitle, LIMITS.maxLessonTitleChars),
      };
    }
  }

  const language = raw.language === 'zh' ? 'zh' : 'en';

  return { messages, lesson, language };
}
