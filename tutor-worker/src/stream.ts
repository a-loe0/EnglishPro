// Re-encodes the Workers AI event stream as `data: {"delta": "..."}` events
// ending with `data: [DONE]`. Workers AI models stream one of two shapes:
// legacy `{"response": "..."}` or OpenAI-style `{"choices":[{"delta":{...}}]}`.
// Reasoning text (`reasoning_content`) is dropped so students only see answers.

export function extractDelta(event: unknown): string {
  if (typeof event !== 'object' || event === null) return '';
  const e = event as Record<string, unknown>;
  if (typeof e.response === 'string') return e.response;
  if (Array.isArray(e.choices)) {
    const choice = e.choices[0] as { delta?: { content?: unknown } } | undefined;
    const content = choice?.delta?.content;
    if (typeof content === 'string') return content;
  }
  return '';
}

export function toTutorStream(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  const emitLine = (line: string, controller: TransformStreamDefaultController<Uint8Array>) => {
    if (!line.startsWith('data:')) return;
    const data = line.slice(5).trim();
    if (!data || data === '[DONE]') return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }
    const delta = extractDelta(parsed);
    if (delta) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
  };

  return upstream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) emitLine(line, controller);
      },
      flush(controller) {
        buffer += decoder.decode();
        if (buffer) emitLine(buffer, controller);
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      },
    }),
  );
}
