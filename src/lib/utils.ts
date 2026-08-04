import { twMerge } from 'tailwind-merge';

type ClassValue = string | number | null | boolean | undefined | ClassValue[] | Record<string, unknown>;

// Inline clsx implementation (avoid pulling the tiny clsx package into the
// entry graph, which previously caused Rollup to hoist clsx into the heavy
// recharts 'charts' chunk and forced a static import edge from the entry).
function clsx(...inputs: ClassValue[]): string {
  let out = '';
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === 'string' || typeof input === 'number') {
      out += (out ? ' ' : '') + input;
    } else if (Array.isArray(input)) {
      const nested = clsx(...input);
      if (nested) out += (out ? ' ' : '') + nested;
    } else if (typeof input === 'object') {
      for (const key in input) {
        if (input[key]) out += (out ? ' ' : '') + key;
      }
    }
  }
  return out;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

export function generateExamCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}j ${m}m`;
  return `${m} menit`;
}

// Generate a deterministic UUID v5-like ID from a string input.
// Same input always produces the same ID across all devices.
export function deterministicId(input: string): string {
  // djb2 hash
  let h1 = 5381;
  let h2 = 0x12345678;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = ((h1 << 5) + h1 + c) | 0;
    h2 = ((h2 << 7) ^ h2 + c) | 0;
  }
  const hex = (n: number) => Math.abs(n).toString(16).padStart(8, '0');
  return [
    hex(h1),
    hex(h2).substring(0, 4),
    '4' + hex(h1 ^ h2).substring(1, 4),
    hex((h1 >>> 16) ^ (h2 >>> 16)).substring(0, 4),
    hex(h1 + h2)
  ].join('-');
}
