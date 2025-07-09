import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }

  const units = ['', 'k', 'M', 'B'];
  let unitIndex = 0;
  let value = num;

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }

  // Format to 3 significant figures
  let formatted: string;
  if (value >= 100) {
    formatted = Math.round(value).toString();
  } else if (value >= 10) {
    formatted = (Math.round(value * 10) / 10).toString();
  } else {
    formatted = (Math.round(value * 100) / 100).toString();
  }

  return formatted + units[unitIndex];
}
