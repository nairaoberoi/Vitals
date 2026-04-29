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
