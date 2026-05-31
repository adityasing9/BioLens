import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern: string = 'MMM dd, yyyy'): string {
  return format(new Date(date), pattern);
}

export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'NORMAL':
      return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'LOW':
      return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'HIGH':
      return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    case 'CRITICAL':
      return 'text-red-400 bg-red-400/10 border-red-400/20';
    default:
      return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
  }
}

export function getGradeColor(grade: string): string {
  switch (grade?.toUpperCase()) {
    case 'EXCELLENT':
      return 'text-cyan-400';
    case 'GOOD':
      return 'text-green-400';
    case 'MODERATE':
      return 'text-amber-400';
    case 'POOR':
      return 'text-red-400';
    default:
      return 'text-zinc-400';
  }
}

export function getGradeFromScore(score: number): string {
  if (score >= 85) return 'EXCELLENT';
  if (score >= 70) return 'GOOD';
  if (score >= 50) return 'MODERATE';
  return 'POOR';
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function getProcessingStatusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
      return 'text-green-400 bg-green-400/10';
    case 'PROCESSING':
      return 'text-cyan-400 bg-cyan-400/10';
    case 'PENDING':
      return 'text-amber-400 bg-amber-400/10';
    case 'FAILED':
      return 'text-red-400 bg-red-400/10';
    default:
      return 'text-zinc-400 bg-zinc-400/10';
  }
}
