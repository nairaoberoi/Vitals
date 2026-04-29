// Lightweight date helpers. Use date-fns where it helps.
import { format, parseISO, differenceInCalendarDays, startOfWeek, endOfWeek, eachDayOfInterval, subDays, startOfMonth, endOfMonth } from "date-fns";

export function todayISO() {
  const d = new Date();
  return format(d, "yyyy-MM-dd");
}

export function fmt(d, pattern = "MMM d, yyyy") {
  if (!d) return "";
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, pattern);
}

export function daysSince(dateStr) {
  if (!dateStr) return null;
  return differenceInCalendarDays(new Date(), parseISO(dateStr));
}

// Average gap (in days) between the most recent N transfusion dates.
// `dates` should be an array of YYYY-MM-DD strings sorted DESCENDING (newest first).
// Returns null if fewer than 2 dates are provided.
export function avgIntervalDays(dates, n = 3) {
  if (!Array.isArray(dates) || dates.length < 2) return null;
  const recent = dates.slice(0, n);
  const gaps = [];
  for (let i = 0; i < recent.length - 1; i++) {
    const newer = parseISO(recent[i]);
    const older = parseISO(recent[i + 1]);
    gaps.push(differenceInCalendarDays(newer, older));
  }
  if (gaps.length === 0) return null;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

export function lastNDays(n) {
  const end = new Date();
  const start = subDays(end, n - 1);
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

export function weekRange(d = new Date()) {
  return {
    start: startOfWeek(d, { weekStartsOn: 1 }),
    end: endOfWeek(d, { weekStartsOn: 1 }),
  };
}

export function monthRange(d = new Date()) {
  return { start: startOfMonth(d), end: endOfMonth(d) };
}

export function eachDay(start, end) {
  return eachDayOfInterval({ start, end });
}

export { format, parseISO };
