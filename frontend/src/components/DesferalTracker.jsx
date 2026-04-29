import React, { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Input } from "@/components/ui/input";
import { desferalAPI } from "@/lib/storage";
import { todayISO, fmt, parseISO } from "@/lib/dateUtils";
import { format, startOfWeek, addDays, isSameMonth } from "date-fns";

export default function DesferalTracker() {
  const [refresh, setRefresh] = useState(0);
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(todayISO());

  // Force re-read on every refresh tick
  const allEntries = useMemo(() => desferalAPI.list(), [refresh]);
  const doneDates = useMemo(() => allEntries.map((e) => e.date), [allEntries]);
  const doneSet = useMemo(() => new Set(doneDates), [doneDates]);

  // Current week (Mon-Sun)
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const weekDoneCount = weekDays.filter((d) => doneSet.has(format(d, "yyyy-MM-dd"))).length;

  const toggle = (date) => {
    desferalAPI.toggle(date);
    setRefresh((k) => k + 1);
  };

  const setDose = (date, dose) => {
    desferalAPI.setDose(date, dose);
    setRefresh((k) => k + 1);
  };

  // Selected day editor — only meaningful when the selected date is "done"
  const selectedEntry = useMemo(
    () => allEntries.find((e) => e.date === selected),
    [allEntries, selected]
  );

  // react-day-picker modifier dates
  const desferalCalendarDates = useMemo(
    () => doneDates.map((d) => parseISO(d)),
    [doneDates]
  );

  return (
    <section className="soft-card p-4 mb-5" data-testid="desferal-section">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-sm font-medium">Desferal</h2>
        <span className="text-[11px] text-muted-foreground">Nightly subcutaneous pump</span>
      </div>

      {/* Live count */}
      <p
        className="text-xs text-muted-foreground mb-3 tabular"
        data-testid="desferal-week-count"
      >
        {weekDoneCount} / 7 nights this week
      </p>

      {/* Weekly strip — column widths match the monthly calendar's --rdp-cell-size */}
      <div
        className="flex justify-center mb-4"
        data-testid="desferal-week-strip"
      >
        {weekDays.map((d, i) => {
          const ds = format(d, "yyyy-MM-dd");
          const done = doneSet.has(ds);
          return (
            <button
              key={ds}
              onClick={() => toggle(ds)}
              data-testid={`desferal-day-${ds}`}
              className="flex flex-col items-center justify-center group"
              style={{ width: "var(--rdp-cell-size, 40px)", minHeight: 56 }}
              aria-label={`${format(d, "EEE MMM d")} — ${done ? "done" : "missed"}`}
              aria-pressed={done}
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-normal">
                {format(d, "cccccc")}
              </span>
              <span
                className={`w-7 h-7 rounded-full border transition-colors ${
                  done
                    ? "bg-[#5B7C99] border-[#5B7C99]"
                    : "bg-transparent border-foreground/25 group-hover:border-foreground/40"
                }`}
                data-state={done ? "done" : "missed"}
              />
              <span className="text-[10px] text-muted-foreground mt-1 tabular">
                {format(d, "d")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Monthly calendar — uses DayPicker's default caption to match the transfusion calendar */}
      <div className="border-t border-border pt-3 flex justify-center" data-testid="desferal-calendar-wrap">
        <DayPicker
          mode="single"
          month={month}
          onMonthChange={setMonth}
          selected={undefined}
          modifiers={{ desferal: desferalCalendarDates }}
          modifiersClassNames={{ desferal: "desferal-day" }}
          onDayClick={(day) => {
            const ds = format(day, "yyyy-MM-dd");
            setSelected(ds);
            toggle(ds);
            if (!isSameMonth(day, month)) setMonth(day);
          }}
          showOutsideDays={false}
          weekStartsOn={1}
          data-testid="desferal-calendar"
        />
      </div>

      {/* Selected-day dose editor (only when that date is currently 'done') */}
      <div
        className="mt-3 pt-3 border-t border-border"
        data-testid="desferal-selected-day"
      >
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1">
          Selected
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">{fmt(selected, "EEE, MMM d, yyyy")}</span>
          {selectedEntry ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                step="50"
                min="0"
                placeholder="dose"
                value={selectedEntry.dose ?? ""}
                onChange={(e) => setDose(selected, e.target.value)}
                className="tap-44 w-24 text-right"
                data-testid="desferal-dose-input"
                aria-label="Dose in milligrams"
              />
              <span className="text-xs text-muted-foreground">mg</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Not marked</span>
          )}
        </div>
      </div>
    </section>
  );
}
