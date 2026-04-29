import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { transfusionsAPI } from "@/lib/storage";
import { fmt, todayISO, parseISO } from "@/lib/dateUtils";
import { Plus, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function Transfusions() {
  const navigate = useNavigate();
  const [items, setItems] = useState(() => transfusionsAPI.list());
  const [open, setOpen] = useState(false);

  // Form state
  const [date, setDate] = useState(todayISO());
  const [units, setUnits] = useState("");
  const [preDate, setPreDate] = useState("");
  const [preValue, setPreValue] = useState("");
  const [dayValue, setDayValue] = useState("");
  const [notes, setNotes] = useState("");

  const refresh = () => setItems(transfusionsAPI.list());

  const transfusionDates = useMemo(
    () => items.map((t) => parseISO(t.date)),
    [items]
  );

  const handleSave = () => {
    if (!date) {
      toast.error("Pick a transfusion date");
      return;
    }
    transfusionsAPI.upsert({
      date,
      units: units ? Number(units) : null,
      preHb: preValue ? { date: preDate || null, value: Number(preValue) } : null,
      dayHb: dayValue ? { date, value: Number(dayValue) } : null,
      notes,
    });
    setOpen(false);
    setDate(todayISO());
    setUnits("");
    setPreDate("");
    setPreValue("");
    setDayValue("");
    setNotes("");
    refresh();
    toast.success("Transfusion logged");
  };

  // Build chart data
  const chartData = useMemo(() => {
    const sorted = [...items].sort((a, b) => (a.date < b.date ? -1 : 1));
    return sorted.map((t) => ({
      date: fmt(t.date, "MMM d"),
      pre: t.preHb?.value ?? null,
      day: t.dayHb?.value ?? null,
    }));
  }, [items]);

  return (
    <MobileLayout
      subtitle="Log"
      title="Transfusions"
      rightAction={
        <Button
          size="icon"
          onClick={() => setOpen(true)}
          data-testid="add-transfusion-btn"
          className="tap-44 w-10 h-10 rounded-full bg-[#5B7C99] hover:bg-[#4A6A87] text-white"
          aria-label="Add transfusion"
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
        </Button>
      }
    >
      {/* Calendar */}
      <section className="soft-card p-3 mb-5" data-testid="transfusion-calendar">
        <div className="flex justify-center">
          <DayPicker
            mode="single"
            modifiers={{ transfusion: transfusionDates }}
            modifiersClassNames={{ transfusion: "transfusion-day" }}
            onDayClick={(day) => {
              const ds = fmt(day, "yyyy-MM-dd");
              const match = items.find((t) => t.date === ds);
              if (match) {
                navigate(`/transfusions/${match.id}`);
              }
            }}
            showOutsideDays={false}
            weekStartsOn={1}
          />
        </div>
        <div className="flex items-center gap-2 px-2 pt-2 border-t border-border">
          <span className="inline-block w-3 h-3 rounded-full bg-[#5B7C99]" />
          <span className="text-xs text-muted-foreground">Transfusion day</span>
        </div>
      </section>

      {/* Hb chart */}
      <section className="soft-card p-4 mb-5" data-testid="hb-chart-section">
        <h2 className="text-sm font-medium mb-1">Hemoglobin trend</h2>
        <p className="text-[11px] text-muted-foreground mb-3">Pre-transfusion vs transfusion-day Hb (g/dL)</p>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No data yet. Add a transfusion to see the trend.
          </p>
        ) : (
          <div className="h-48" data-testid="hb-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={["auto", "auto"]} width={40} />
                <Tooltip
                  contentStyle={{
                    background: "#FBFAF8",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
                <Line
                  type="monotone"
                  dataKey="pre"
                  name="Pre-Hb"
                  stroke="#8FA4BC"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="day"
                  name="Day-Hb"
                  stroke="#5B7C99"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* History list */}
      <section data-testid="transfusion-history">
        <h2 className="text-sm font-medium mb-2 px-1">History</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1">No transfusions logged yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/transfusions/${t.id}`}
                  className="soft-card p-4 flex items-center justify-between hover:border-foreground/30 transition-colors"
                  data-testid={`transfusion-item-${t.id}`}
                >
                  <div>
                    <div className="text-sm font-medium">{fmt(t.date, "EEE, MMM d, yyyy")}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t.units ? `${t.units} unit${t.units > 1 ? "s" : ""}` : "Units not noted"}
                      {t.preHb?.value != null && ` · pre ${t.preHb.value}`}
                      {t.dayHb?.value != null && ` · day ${t.dayHb.value}`}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Add dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl bg-[#FBFAF8]" data-testid="transfusion-dialog">
          <DialogHeader>
            <DialogTitle>Log transfusion</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="t-date" className="text-xs">Transfusion date</Label>
              <Input
                id="t-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-testid="dialog-transfusion-date"
                className="tap-44"
              />
            </div>
            <div>
              <Label htmlFor="t-units" className="text-xs">Units transfused</Label>
              <Input
                id="t-units"
                type="number"
                inputMode="decimal"
                step="0.5"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="e.g. 2"
                data-testid="dialog-transfusion-units"
                className="tap-44"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="t-pre-date" className="text-xs">Pre-Hb date</Label>
                <Input
                  id="t-pre-date"
                  type="date"
                  value={preDate}
                  onChange={(e) => setPreDate(e.target.value)}
                  data-testid="dialog-pre-hb-date"
                  className="tap-44"
                />
              </div>
              <div>
                <Label htmlFor="t-pre-value" className="text-xs">Pre-Hb (g/dL)</Label>
                <Input
                  id="t-pre-value"
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={preValue}
                  onChange={(e) => setPreValue(e.target.value)}
                  placeholder="e.g. 7.2"
                  data-testid="dialog-pre-hb-value"
                  className="tap-44"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="t-day-value" className="text-xs">Hb on transfusion day (g/dL)</Label>
              <Input
                id="t-day-value"
                type="number"
                step="0.1"
                inputMode="decimal"
                value={dayValue}
                onChange={(e) => setDayValue(e.target.value)}
                placeholder="e.g. 7.0"
                data-testid="dialog-day-hb-value"
                className="tap-44"
              />
            </div>
            <div>
              <Label htmlFor="t-notes" className="text-xs">Notes</Label>
              <Textarea
                id="t-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reactions, premedication, anything to remember"
                data-testid="dialog-transfusion-notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="tap-44"
              data-testid="dialog-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              data-testid="dialog-save-btn"
              className="tap-44 bg-[#5B7C99] hover:bg-[#4A6A87] text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
