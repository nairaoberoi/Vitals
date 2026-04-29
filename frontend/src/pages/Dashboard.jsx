import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { transfusionsAPI, ferritinAPI, fatigueAPI, dietAPI } from "@/lib/storage";
import { todayISO, daysSince, fmt, avgIntervalDays } from "@/lib/dateUtils";
import { ArrowUpRight, Utensils, Activity, Sparkle, ChevronRight } from "lucide-react";

const fatigueLabels = ["", "Fresh", "", "", "", "Wiped"];

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const today = todayISO();

  const transfusions = useMemo(() => transfusionsAPI.list(), [refreshKey]);
  const ferritin = useMemo(() => ferritinAPI.list(), [refreshKey]);
  const fatigueToday = useMemo(() => fatigueAPI.byDate(today), [refreshKey, today]);

  const lastTransfusion = transfusions[0];
  const lastFerritin = ferritin[0];
  const sinceLast = lastTransfusion ? daysSince(lastTransfusion.date) : null;

  // Quiet next-transfusion estimate based on average of last 3 intervals.
  // Only shown if at least 2 transfusions are logged.
  const avgInterval = useMemo(
    () => avgIntervalDays(transfusions.map((t) => t.date), 3),
    [transfusions]
  );
  let estimateLine = null;
  if (avgInterval != null && sinceLast != null) {
    const remaining = avgInterval - sinceLast;
    if (remaining > 0) {
      estimateLine = `Next transfusion likely in ~${remaining} day${remaining === 1 ? "" : "s"} based on your recent interval.`;
    } else {
      estimateLine = "Around your typical interval now, based on your recent pattern.";
    }
  }

  // Quick add fatigue
  const setFatigue = (level) => {
    fatigueAPI.setForDate(today, level, fatigueToday?.notes || "");
    setRefreshKey((k) => k + 1);
  };

  // Quick add diet (just a placeholder; full entry on Diet page)
  const todaysDietCount = useMemo(() => dietAPI.byDate(today).length, [refreshKey, today]);

  const noEntryToday = !fatigueToday && todaysDietCount === 0;

  return (
    <MobileLayout subtitle={fmt(new Date(), "EEEE, MMM d")} title="Today">
      {/* Hero summary */}
      <section className="soft-card p-5 mb-4" data-testid="dashboard-summary-card">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Last transfusion
          </span>
          {lastTransfusion && (
            <Link
              to={`/transfusions/${lastTransfusion.id}`}
              className="text-xs text-[#5B7C99] flex items-center gap-0.5"
              data-testid="dashboard-last-transfusion-link"
            >
              View <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="font-display text-5xl tabular text-foreground" data-testid="days-since-transfusion">
            {sinceLast == null ? "—" : sinceLast}
          </span>
          <span className="text-sm text-muted-foreground">
            {sinceLast == null ? "no transfusion logged" : sinceLast === 1 ? "day ago" : "days ago"}
          </span>
        </div>

        {estimateLine && (
          <p
            className="text-xs text-muted-foreground -mt-2 mb-4 leading-relaxed"
            data-testid="next-transfusion-estimate"
          >
            {estimateLine}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1">
              Ferritin
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-medium tabular text-foreground" data-testid="dashboard-ferritin-value">
                {lastFerritin?.value ?? "—"}
              </span>
              {lastFerritin && <span className="text-xs text-muted-foreground">ng/mL</span>}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {lastFerritin ? fmt(lastFerritin.date, "MMM d") : "no reading"}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1">
              Fatigue today
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-medium tabular text-foreground" data-testid="dashboard-fatigue-today">
                {fatigueToday?.level ?? "—"}
              </span>
              {fatigueToday && <span className="text-xs text-muted-foreground">/ 5</span>}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {fatigueToday ? (fatigueLabels[fatigueToday.level] || `Level ${fatigueToday.level}`) : "not logged"}
            </div>
          </div>
        </div>
      </section>

      {noEntryToday && (
        <p className="text-sm text-muted-foreground mb-4 px-1" data-testid="no-entry-prompt">
          Nothing logged today. When you have a moment, note how you're feeling.
        </p>
      )}

      {/* Quick fatigue */}
      <section className="mb-5" data-testid="quick-fatigue-section">
        <h2 className="text-sm font-medium text-foreground/80 mb-2 px-1">Fatigue right now</h2>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = fatigueToday?.level === n;
            return (
              <button
                key={n}
                onClick={() => setFatigue(n)}
                data-testid={`quick-fatigue-${n}`}
                className={`tap-44 rounded-xl border transition-all ${
                  active
                    ? "bg-[#5B7C99] text-white border-[#5B7C99]"
                    : "bg-[#FBFAF8] border-border text-foreground/70 hover:border-foreground/30"
                }`}
              >
                <div className="text-base font-medium tabular">{n}</div>
              </button>
            );
          })}
        </div>
        <div className="flex justify-between px-1 mt-1.5 text-[10px] text-muted-foreground">
          <span>Very low</span>
          <span>Severe</span>
        </div>
      </section>

      {/* Quick actions row */}
      <section className="mb-6" data-testid="quick-actions-section">
        <h2 className="text-sm font-medium text-foreground/80 mb-2 px-1">Log</h2>
        <div className="grid grid-cols-3 gap-2">
          <Link
            to="/symptoms?tab=headache"
            data-testid="quick-headache-btn"
            className="tap-44 soft-card p-3 flex flex-col items-start gap-1 text-left hover:border-foreground/30 transition-colors"
          >
            <Sparkle className="w-4 h-4 text-[#5B7C99]" strokeWidth={1.5} />
            <span className="text-xs font-medium">Headache</span>
            <span className="text-[10px] text-muted-foreground">Open log</span>
          </Link>
          <Link
            to="/diet"
            data-testid="quick-diet-btn"
            className="tap-44 soft-card p-3 flex flex-col items-start gap-1 text-left hover:border-foreground/30 transition-colors"
          >
            <Utensils className="w-4 h-4 text-[#5B7C99]" strokeWidth={1.5} />
            <span className="text-xs font-medium">Meal</span>
            <span className="text-[10px] text-muted-foreground">Add entry</span>
          </Link>
          <Link
            to="/symptoms"
            data-testid="quick-symptoms-btn"
            className="tap-44 soft-card p-3 flex flex-col items-start gap-1 text-left hover:border-foreground/30 transition-colors"
          >
            <Activity className="w-4 h-4 text-[#5B7C99]" strokeWidth={1.5} />
            <span className="text-xs font-medium">Symptoms</span>
            <span className="text-[10px] text-muted-foreground">More detail</span>
          </Link>
        </div>
      </section>

      {/* Recent strip */}
      <section className="mb-2" data-testid="recent-section">
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-sm font-medium text-foreground/80">Recent</h2>
        </div>
        <div className="space-y-2">
          <Link
            to="/transfusions"
            className="soft-card p-4 flex items-center justify-between hover:border-foreground/30 transition-colors"
            data-testid="recent-transfusions-link"
          >
            <div>
              <div className="text-xs text-muted-foreground">Transfusion calendar</div>
              <div className="text-sm font-medium mt-0.5">
                {transfusions.length} entr{transfusions.length === 1 ? "y" : "ies"}
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          </Link>
          <Link
            to="/ferritin"
            className="soft-card p-4 flex items-center justify-between hover:border-foreground/30 transition-colors"
            data-testid="recent-ferritin-link"
          >
            <div>
              <div className="text-xs text-muted-foreground">Ferritin readings</div>
              <div className="text-sm font-medium mt-0.5">
                {ferritin.length} entr{ferritin.length === 1 ? "y" : "ies"}
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </MobileLayout>
  );
}
