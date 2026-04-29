import React, { useMemo, useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { dietAPI } from "@/lib/storage";
import { todayISO, fmt } from "@/lib/dateUtils";
import { Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { addDays, subDays, format, startOfWeek } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

const meals = ["Breakfast", "Lunch", "Dinner", "Snack"];

const HOME_COLOR = "#8ca3b8";
const OUT_COLOR = "#dee5eb";

export default function Diet() {
  const [refresh, setRefresh] = useState(0);
  const [viewDate, setViewDate] = useState(new Date());
  const viewDateStr = format(viewDate, "yyyy-MM-dd");

  const [open, setOpen] = useState(false);
  const [meal, setMeal] = useState("Breakfast");
  const [location, setLocation] = useState("Home");
  const [time, setTime] = useState("");
  const [text, setText] = useState("");
  const [notes, setNotes] = useState("");

  const entries = useMemo(() => dietAPI.byDate(viewDateStr), [refresh, viewDateStr]);

  // Current week (Mon-Sun) stats — always reflects this week regardless of viewDate
  const weekDays = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, []);
  const weekData = useMemo(() => {
    const all = dietAPI.list();
    return weekDays.map((d) => {
      const ds = format(d, "yyyy-MM-dd");
      const dayEntries = all.filter((e) => e.date === ds);
      const home = dayEntries.filter((e) => (e.location || "Home") === "Home").length;
      const out = dayEntries.filter((e) => (e.location || "Home") === "Out").length;
      return { day: format(d, "EEEEE"), date: ds, Home: home, Out: out };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, weekDays]);
  const weekHomeCount = weekData.reduce((s, d) => s + d.Home, 0);
  const weekOutCount = weekData.reduce((s, d) => s + d.Out, 0);

  const save = () => {
    if (!text.trim()) {
      toast.error("Add what you ate");
      return;
    }
    dietAPI.add({
      date: viewDateStr,
      time: time || format(new Date(), "HH:mm"),
      meal,
      location,
      text: text.trim(),
      notes,
    });
    setOpen(false);
    setMeal("Breakfast");
    setLocation("Home");
    setTime("");
    setText("");
    setNotes("");
    setRefresh((k) => k + 1);
    toast.success("Logged");
  };

  const remove = (id) => {
    dietAPI.remove(id);
    setRefresh((k) => k + 1);
  };

  return (
    <MobileLayout
      subtitle="Log"
      title="Diet"
      rightAction={
        <Button
          size="icon"
          onClick={() => setOpen(true)}
          data-testid="add-diet-btn"
          className="tap-44 w-10 h-10 rounded-full bg-[#5B7C99] hover:bg-[#4A6A87] text-white"
          aria-label="Add meal"
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
        </Button>
      }
    >
      {/* Weekly summary line */}
      <p
        className="text-xs text-muted-foreground mb-3 px-1 tabular"
        data-testid="diet-weekly-summary"
      >
        This week: {weekHomeCount} meal{weekHomeCount === 1 ? "" : "s"} home, {weekOutCount} out.
      </p>

      {/* Day selector */}
      <div className="soft-card flex items-center justify-between p-2 mb-4" data-testid="diet-day-selector">
        <button
          onClick={() => setViewDate(subDays(viewDate, 1))}
          className="tap-44 w-10 h-10 grid place-items-center rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Previous day"
          data-testid="diet-prev-day"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <div className="text-center">
          <div className="text-sm font-medium">{format(viewDate, "EEEE")}</div>
          <div className="text-[11px] text-muted-foreground">{format(viewDate, "MMM d, yyyy")}</div>
        </div>
        <button
          onClick={() => setViewDate(addDays(viewDate, 1))}
          className="tap-44 w-10 h-10 grid place-items-center rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Next day"
          data-testid="diet-next-day"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      {viewDateStr !== todayISO() && (
        <button
          onClick={() => setViewDate(new Date())}
          className="text-xs text-[#5B7C99] mb-3 px-1"
          data-testid="diet-today-btn"
        >
          Jump to today
        </button>
      )}

      {/* Entries */}
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1" data-testid="diet-empty">
          Nothing logged for this day.
        </p>
      ) : (
        <ul className="space-y-2" data-testid="diet-entries">
          {entries.map((e) => (
            <li key={e.id} className="soft-card p-4 flex items-start justify-between gap-3" data-testid={`diet-item-${e.id}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E0E5EC] text-[#3A4D5E]">
                    {e.meal} · {e.location || "Home"}
                  </span>
                  {e.time && <span className="text-[11px] text-muted-foreground tabular">{e.time}</span>}
                </div>
                <div className="text-sm">{e.text}</div>
                {e.notes && <div className="text-[11px] text-muted-foreground mt-1">{e.notes}</div>}
              </div>
              <button
                onClick={() => remove(e.id)}
                aria-label="Delete"
                className="tap-44 w-9 h-9 grid place-items-center text-muted-foreground hover:text-foreground"
                data-testid={`diet-delete-${e.id}`}
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Weekly stacked bar chart — current week, no labels on bars */}
      <section className="soft-card p-4 mt-5" data-testid="diet-weekly-chart-section">
        <h2 className="text-sm font-medium mb-3">This week</h2>
        <div className="h-40" data-testid="diet-weekly-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis hide allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(91,124,153,0.06)" }}
                contentStyle={{
                  background: "#FBFAF8",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="Home" stackId="meals" fill={HOME_COLOR} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Out" stackId="meals" fill={OUT_COLOR} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 px-1" data-testid="diet-chart-legend">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: HOME_COLOR }}
            />
            Home
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full border border-border"
              style={{ background: OUT_COLOR }}
            />
            Out
          </span>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl bg-[#FBFAF8]" data-testid="diet-dialog">
          <DialogHeader>
            <DialogTitle>Add meal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Meal</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {meals.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMeal(m)}
                    className={`tap-44 rounded-xl border text-sm transition-colors ${
                      meal === m
                        ? "bg-[#5B7C99] text-white border-[#5B7C99]"
                        : "bg-white border-border text-foreground/70"
                    }`}
                    data-testid={`meal-${m.toLowerCase()}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Location</Label>
              <div className="grid grid-cols-2 gap-2 mt-1" data-testid="diet-location-toggle">
                {["Home", "Out"].map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setLocation(loc)}
                    className={`tap-44 rounded-xl border text-sm transition-colors ${
                      location === loc
                        ? "bg-[#5B7C99] text-white border-[#5B7C99]"
                        : "bg-white border-border text-foreground/70"
                    }`}
                    data-testid={`location-${loc.toLowerCase()}`}
                    aria-pressed={location === loc}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="d-time" className="text-xs">Time</Label>
              <Input
                id="d-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="tap-44"
                data-testid="diet-time-input"
              />
            </div>
            <div>
              <Label htmlFor="d-text" className="text-xs">What you ate</Label>
              <Textarea
                id="d-text"
                rows={2}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Spinach paratha with curd"
                data-testid="diet-text-input"
              />
            </div>
            <div>
              <Label htmlFor="d-notes" className="text-xs">Notes</Label>
              <Input
                id="d-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. iron-rich, avoided tea"
                className="tap-44"
                data-testid="diet-notes-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="tap-44">Cancel</Button>
            <Button onClick={save} className="tap-44 bg-[#5B7C99] hover:bg-[#4A6A87] text-white" data-testid="diet-save-btn">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
