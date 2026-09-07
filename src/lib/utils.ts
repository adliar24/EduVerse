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

// Generate a deterministic RFC 4122-compliant UUID (8-4-4-4-12) from a string input.
// Same input always produces the exact same valid UUID across all devices.
export function deterministicId(input: string): string {
  let h1 = 5381;
  let h2 = 0x12345678;
  let h3 = 0x87654321;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = ((h1 << 5) + h1 + c) | 0;
    h2 = ((h2 << 7) ^ h2 + c) | 0;
    h3 = ((h3 << 3) ^ (h3 >>> 2) + c) | 0;
  }
  const hex = (n: number, len = 8) => Math.abs(n).toString(16).padStart(len, '0');
  const part1 = hex(h1, 8);
  const part2 = hex(h2, 8).substring(0, 4);
  const part3 = '4' + hex(h1 ^ h2, 8).substring(1, 4);
  const variant = (8 + (Math.abs(h3) % 4)).toString(16);
  const part4 = variant + hex((h1 >>> 16) ^ (h2 >>> 16), 8).substring(1, 4);
  const part5 = (hex(h1 + h2, 8) + hex(h3, 8)).substring(0, 12);
  return [part1, part2, part3, part4, part5].join('-');
}

export function isValidUUID(str: any): boolean {
  if (typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}
