import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
