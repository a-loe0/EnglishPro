import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { formatTutorText } from './formatTutorText';

function renderText(text: string) {
  return render(<div>{formatTutorText(text)}</div>).container;
}

describe('formatTutorText', () => {
  it('renders bold and italic without the asterisks', () => {
    const el = renderText('Say **two hamburgers**, not *hamburger*.');
    expect(el.querySelector('strong')?.textContent).toBe('two hamburgers');
    expect(el.querySelector('em')?.textContent).toBe('hamburger');
    expect(el.textContent).toBe('Say two hamburgers, not hamburger.');
  });

  it('renders bullets and numbered lists', () => {
    const el = renderText('*   **Hamburger:** add "s"\n- Coffee\n2. Practice');
    expect(el.textContent).toContain('•Hamburger: add "s"');
    expect(el.textContent).toContain('•Coffee');
    expect(el.textContent).toContain('2.Practice');
  });

  it('keeps HTML from the model as plain text', () => {
    const el = renderText('<img src=x onerror=alert(1)> **<b>hi</b>**');
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('b')).toBeNull();
    expect(el.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('leaves unmatched asterisks alone', () => {
    expect(renderText('5 * 3 = 15').textContent).toBe('5 * 3 = 15');
  });
});
