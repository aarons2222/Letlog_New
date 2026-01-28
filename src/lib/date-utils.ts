/**
 * Shared date utility helpers for LetLog.
 * Centralises date calculations that were previously duplicated across 12+ files.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DEFAULT_LOCALE = "en-GB";

/** Number of full days from now until the given date (positive = future). */
export function daysUntil(date: Date | string): number {
  const target = typeof date === "string" ? new Date(date) : date;
  return Math.ceil((target.getTime() - Date.now()) / MS_PER_DAY);
}

/** Number of full days since the given date (positive = past). */
export function daysAgo(date: Date | string): number {
  const target = typeof date === "string" ? new Date(date) : date;
  return Math.floor((Date.now() - target.getTime()) / MS_PER_DAY);
}

/** Convert a number of days to milliseconds. */
export function daysToMs(days: number): number {
  return days * MS_PER_DAY;
}

/**
 * Format a date string using en-GB locale.
 * Defaults to short date format (e.g. "13 Jul 2025").
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(DEFAULT_LOCALE, options);
}

/** Format a date with weekday, day, and month (e.g. "Sun, 13 Jul"). */
export function formatShortDate(date: Date | string): string {
  return formatDate(date, { weekday: "short", day: "numeric", month: "short" });
}

/** Human-readable relative time (e.g. "5m ago", "3h ago", "2d ago"). */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}
