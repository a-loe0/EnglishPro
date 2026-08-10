type ClassValue = string | number | boolean | undefined | null | ClassValue[];
type ClassObject = { [key: string]: boolean | undefined | null };

/**
 * Utility function to conditionally join class names together.
 * Similar to clsx/classnames libraries but simpler.
 */
export function cn(...inputs: (ClassValue | ClassObject)[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) classes.push(nested);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(' ');
}

export default cn;
