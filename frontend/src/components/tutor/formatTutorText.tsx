import type { ReactNode } from 'react';

// Renders the small Markdown subset the tutor model writes (**bold**,
// *italic*, "-"/"*" bullets, "1." lists) as React elements. Text is never
// injected as HTML, so model output cannot add markup to the page.

function formatInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\*([^*\s][^*]*?)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${match.index}`;
    nodes.push(
      match[1] !== undefined ? <strong key={key}>{match[1]}</strong> : <em key={key}>{match[2]}</em>,
    );
    last = pattern.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function formatTutorText(text: string): ReactNode[] {
  return text.split('\n').map((line, i) => {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      return (
        <div key={i} className="flex gap-1.5 pl-1">
          <span aria-hidden="true">•</span>
          <span>{formatInline(bullet[1], `l${i}`)}</span>
        </div>
      );
    }
    const numbered = /^\s*(\d+)\.\s+(.*)$/.exec(line);
    if (numbered) {
      return (
        <div key={i} className="flex gap-1.5 pl-1">
          <span>{numbered[1]}.</span>
          <span>{formatInline(numbered[2], `l${i}`)}</span>
        </div>
      );
    }
    if (!line.trim()) return <div key={i} className="h-2" />;
    return <div key={i}>{formatInline(line, `l${i}`)}</div>;
  });
}
