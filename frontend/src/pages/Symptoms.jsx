import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { fatigueAPI, headacheAPI } from "@/lib/storage";
import { todayISO, fmt, lastNDays, monthRange, eachDay } from "@/lib/dateUtils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const fatigueLabels = ["", "Very low", "Low", "Moderate", "High", "Severe"];

function FatigueTab() {
  const [refresh, setRefresh] = useState(0);
  const today = todayISO();
  const todayEntry = fatigueAPI.byDate(today);

  const setLevel = (lvl) => {
    fatigueAPI.setForDate(today, lvl, todayEntry?.notes || "");
    setRefresh((k) => k + 1);
  };

  // Weekly chart
  const last7 = useMemo(() => {
    const days = lastNDays(7);
    return days.map((d) => {
      const e = fatigueAPI.list().find((f) => f.date === d);
      return { date: format(new Date(d), "EEE"), level: e?.level ?? 0 };
    });
  }, [refresh]);

  // Monthly heatmap
  const monthDays = useMemo(() => {
    const { start, end } = monthRange();
    const days = eachDay(start, end);
    const list = fatigueAPI.list();
    return days.map((d) => {
      const ds = format(d, "yyyy-MM-dd");
      const e = list.find((f) => f.date === ds);
      return { date: d, level: e?.level ?? 0, hasEntry: !!e };
    });
  }, [refresh]);

  const all = useMemo(() => fatigueAPI.list(), [refresh]);
  const removeEntry = (id) => {
    fatigueAPI.remove(id);
    setRefresh((k) => k + 1);
  };

  return (
    <div className="space-y-5" data-testid="fatigue-tab-content">
      <section className="soft-card p-5">
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
          Today's fatigue
        </div>
        <div className="grid grid-cols-5 gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = todayEntry?.level === n;
            return (
              <button
                key={n}
                onClick={() => setLevel(n)}
                data-testid={`fatigue-level-${n}`}
                className={`tap-44 rounded-xl border transition-all ${
                  active
                    ? "bg-[#5B7C99] text-white border-[#5B7C99]"
                    : "bg-[#FBFAF8] border-border text-foreground/70"
                }`}
              >
                <div className="text-base font-medium tabular">{n}</div>
              </button>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
          <span>Very low</span>
          <span>Severe</span>
        </div>
        {todayEntry && (
          <div className="text-xs text-muted-foreground mt-3" data-testid="fatigue-today-label">
            {fatigueLabels[todayEntry.level]}
          </div>
        )}
      </section>

      <section className="soft-card p-4">
        <h3 className="text-sm font-medium mb-2">Past 7 days</h3>
        <div className="h-40" data-testid="fatigue-weekly-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tickLine={false} axisLine={false} width={28} />
              <Tooltip
                contentStyle={{
                  background: "#FBFAF8",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="level" fill="#5B7C99" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="soft-card p-4">
        <h3 className="text-sm font-medium mb-3">{format(new Date(), "MMMM yyyy")} heatmap</h3>
        <div className="grid grid-cols-7 gap-1.5" data-testid="fatigue-heatmap">
          {monthDays.map((d, i) => (
            <div
              key={i}
              className={`heat-${d.level} aspect-square rounded-md flex items-center justify-center text-[10px] text-foreground/50`}
              title={`${format(d.date, "MMM d")}: ${d.level || "—"}`}
            >
              {format(d.date, "d")}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={`heat-${n} w-3 h-3 rounded-sm`} />
          ))}
          <span>More</span>
        </div>
      </section>

      {all.length > 0 && (
        <section data-testid="fatigue-history">
          <h3 className="text-sm font-medium mb-2 px-1">History</h3>
          <ul className="space-y-2">
            {all.slice(0, 30).map((f) => (
              <li key={f.id} className="soft-card p-3 flex items-center justify-between" data-testid={`fatigue-item-${f.id}`}>
                <div>
                  <div className="text-sm">{fmt(f.date, "EEE, MMM d")}</div>
                  <div className="text-[11px] text-muted-foreground">{fatigueLabels[f.level]} ({f.level}/5)</div>
                </div>
                <button onClick={() => removeEntry(f.id)} aria-label="Delete" className="tap-44 w-9 h-9 grid place-items-center text-muted-foreground hover:text-foreground">
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function HeadacheTab() {
  const [refresh, setRefresh] = useState(0);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [occurred, setOccurred] = useState(true);
  const [severity, setSeverity] = useState("mild");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const items = useMemo(() => headacheAPI.list(), [refresh]);
  const todayISOStr = todayISO();
  const todayEntry = useMemo(
    () => headacheAPI.byDate(todayISOStr),
    [refresh, todayISOStr]
  );

  // Pre-fill the form whenever the chosen date changes (incl. when opening the dialog)
  // — if an entry exists for that date, load its values; otherwise reset to defaults.
  const loadForDate = (d) => {
    const existing = headacheAPI.byDate(d);
    if (existing) {
      setOccurred(existing.occurred);
      setSeverity(existing.severity || "mild");
      setDuration(existing.durationHours != null ? String(existing.durationHours) : "");
      setNotes(existing.notes || "");
    } else {
      setOccurred(true);
      setSeverity("mild");
      setDuration("");
      setNotes("");
    }
  };

  const openDialog = () => {
    const d = todayISOStr;
    setDate(d);
    loadForDate(d);
    setOpen(true);
  };

  const onChangeDate = (newDate) => {
    setDate(newDate);
    loadForDate(newDate);
  };

  // Frequency by week (last 8 weeks) — only counts days where a headache occurred
  const weekly = useMemo(() => {
    const buckets = {};
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const key = format(d, "MMM d");
      buckets[key] = 0;
    }
    const keys = Object.keys(buckets);
    items.forEach((h) => {
      if (!h.occurred) return;
      const hd = new Date(h.date);
      const diffDays = Math.floor((now - hd) / 86400000);
      if (diffDays > 56 || diffDays < 0) return;
      const idx = 7 - Math.floor(diffDays / 7);
      if (idx >= 0 && idx < 8) buckets[keys[idx]] += 1;
    });
    return keys.map((k) => ({ week: k, count: buckets[k] }));
  }, [items]);

  const save = () => {
    headacheAPI.setForDate(date, {
      occurred,
      severity,
      durationHours: duration,
      notes,
    });
    setOpen(false);
    setRefresh((k) => k + 1);
    toast.success(occurred ? "Saved" : "Saved — no headache");
  };

  const remove = (id) => {
    headacheAPI.remove(id);
    setRefresh((k) => k + 1);
  };

  const severityColor = {
    mild: "bg-[#E0E5EC] text-[#3A4D5E]",
    moderate: "bg-[#C5CFDB] text-[#3A4D5E]",
    severe: "bg-[#8FA4BC] text-white",
  };

  return (
    <div className="space-y-5" data-testid="headache-tab-content">
      <Button
        onClick={openDialog}
        className="w-full tap-44 bg-[#5B7C99] hover:bg-[#4A6A87] text-white"
        data-testid="add-headache-btn"
      >
        <Plus className="w-4 h-4 mr-2" strokeWidth={2} />
        {todayEntry ? "Update today's entry" : "Log a headache"}
      </Button>
      {todayEntry && (
        <p className="text-[11px] text-muted-foreground -mt-3 px-1" data-testid="headache-today-status">
          Today: {todayEntry.occurred ? `${todayEntry.severity}${todayEntry.durationHours != null ? ` · ${todayEntry.durationHours}h` : ""}` : "no headache"}
        </p>
      )}

      <section className="soft-card p-4">
        <h3 className="text-sm font-medium mb-1">Frequency by week</h3>
        <p className="text-[11px] text-muted-foreground mb-3">Past 8 weeks</p>
        <div className="h-40" data-testid="headache-weekly-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tickLine={false} axisLine={false} interval={1} />
              <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#FBFAF8",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="#8FA4BC" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section data-testid="headache-history">
        <h3 className="text-sm font-medium mb-2 px-1">History</h3>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1">No headaches logged.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((h) => (
              <li key={h.id} className="soft-card p-4 flex items-start justify-between gap-3" data-testid={`headache-item-${h.id}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {h.occurred ? (
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${severityColor[h.severity] || severityColor.mild}`}>
                        {h.severity}
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E8E6E2] text-muted-foreground">
                        no headache
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{fmt(h.date, "EEE, MMM d")}</span>
                    {h.date === todayISOStr && (
                      <span className="text-[10px] uppercase tracking-wider text-[#5B7C99]">today</span>
                    )}
                  </div>
                  {h.occurred && h.durationHours != null && (
                    <div className="text-[11px] text-muted-foreground">
                      Duration: {h.durationHours}h
                    </div>
                  )}
                  {h.notes && <div className="text-[11px] text-muted-foreground mt-1">{h.notes}</div>}
                </div>
                <button onClick={() => remove(h.id)} aria-label="Delete" className="tap-44 w-9 h-9 grid place-items-center text-muted-foreground hover:text-foreground" data-testid={`headache-delete-${h.id}`}>
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl bg-[#FBFAF8]" data-testid="headache-dialog">
          <DialogHeader>
            <DialogTitle>{date === todayISOStr && todayEntry ? "Today's headache" : "Log headache"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => onChangeDate(e.target.value)}
                className="tap-44"
                data-testid="headache-date-input"
              />
            </div>
            <div>
              <Label className="text-xs">Did you have a headache?</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { value: true, label: "Yes" },
                  { value: false, label: "No" },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setOccurred(opt.value)}
                    className={`tap-44 rounded-xl border text-sm transition-colors ${
                      occurred === opt.value
                        ? "bg-[#5B7C99] text-white border-[#5B7C99]"
                        : "bg-white border-border text-foreground/70"
                    }`}
                    data-testid={`headache-occurred-${opt.value ? "yes" : "no"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {occurred && (
              <>
                <div>
                  <Label className="text-xs">Severity</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {["mild", "moderate", "severe"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSeverity(s)}
                        className={`tap-44 rounded-xl border text-sm capitalize transition-colors ${
                          severity === s
                            ? "bg-[#5B7C99] text-white border-[#5B7C99]"
                            : "bg-white border-border text-foreground/70"
                        }`}
                        data-testid={`severity-${s}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Duration (hours)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="tap-44"
                    data-testid="headache-duration-input"
                  />
                </div>
              </>
            )}
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="headache-notes-input" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="tap-44">Cancel</Button>
            <Button onClick={save} className="tap-44 bg-[#5B7C99] hover:bg-[#4A6A87] text-white" data-testid="headache-save-btn">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Symptoms() {
  const [params] = useSearchParams();
  const initialTab = params.get("tab") === "headache" ? "headache" : "fatigue";
  return (
    <MobileLayout subtitle="Track" title="Symptoms">
      <Tabs defaultValue={initialTab} className="w-full" data-testid="symptoms-tabs">
        <TabsList className="grid grid-cols-2 w-full bg-[#E8E6E2] p-1 rounded-full mb-5 h-auto">
          <TabsTrigger
            value="fatigue"
            className="rounded-full text-sm py-2 data-[state=active]:bg-[#FBFAF8] data-[state=active]:text-foreground"
            data-testid="tab-fatigue"
          >
            Fatigue
          </TabsTrigger>
          <TabsTrigger
            value="headache"
            className="rounded-full text-sm py-2 data-[state=active]:bg-[#FBFAF8] data-[state=active]:text-foreground"
            data-testid="tab-headache"
          >
            Headache
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fatigue">
          <FatigueTab />
        </TabsContent>
        <TabsContent value="headache">
          <HeadacheTab />
        </TabsContent>
      </Tabs>
    </MobileLayout>
  );
}
