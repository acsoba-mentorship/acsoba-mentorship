import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime())
}

/**
 * UTC date parts from a Unix timestamp.
 * month is 1–12 (human-readable). Use for display, forms, or selective field access.
 */
export interface DateParts {
  year: number;
  month: number; // 1–12
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

/** Convert Unix timestamp to UTC date parts. */
export function fromTimestamp(ts: number): DateParts {
  const d = new Date(ts);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
    seconds: d.getUTCSeconds(),
    milliseconds: d.getUTCMilliseconds(),
  };
}

/** Convert year and month (1–12) to start-of-month timestamp in UTC. */
export function toStartOfMonth(year: number, month: number): number {
  return Date.UTC(year, month - 1, 1);
}

export function formatDate(date: Date | number | string): string {
  const d = new Date(date)
  if (!isValidDate(d)) return "Invalid date"
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatDateTime(date: Date | number | string): string {
  const d = new Date(date)
  if (!isValidDate(d)) return "Invalid date"
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function sanitizeId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function getInitials(name: string): string {
  if (!name) return ""
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
