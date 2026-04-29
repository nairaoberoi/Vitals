import React, { useMemo, useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import DesferalTracker from "@/components/DesferalTracker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ferritinAPI } from "@/lib/storage";
import { fmt, todayISO } from "@/lib/dateUtils";
import { Plus, ArrowDownRight, ArrowUpRight, Minus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Ferritin() {
  const [items, setItems] = useState(() => ferritinAPI.list());
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  const refresh = () => setItems(ferritinAPI.list());

  const last = items[0];
  const prev = items[1];
  const delta = last && prev ? last.value - prev.value : null;

  const chartData = useMemo(
    () => [...items].sort((a, b) => (a.date < b.date ? -1 : 1)).map((f) => ({
      date: fmt(f.date, "MMM d"),
      value: f.value,
    })),
    [items]
  );

  const save = () => {
    if (!value || isNaN(Number(value))) {
      toast.error("Enter a valid ferritin value");
      return;
    }
    ferritinAPI.add({ date, value: Number(value), notes });
    setOpen(false);
    setValue("");
    setNotes("");
    setDate(todayISO());
    refresh();
    toast.success("Ferritin reading added");
  };

  const remove = (id) => {
    ferritinAPI.remove(id);
    refresh();
  };

  return (
    <MobileLayout
      subtitle="Log"
      title="Ferritin"
      rightAction={
        <Button
          size="icon"
          onClick={() => setOpen(true)}
          data-testid="add-ferritin-btn"
          className="tap-44 w-10 h-10 rounded-full bg-[#5B7C99] hover:bg-[#4A6A87] text-white"
          aria-label="Add ferritin"
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
        </Button>
      }
    >
      {/* Latest */}
      <section className="soft-card p-5 mb-4" data-testid="ferritin-latest-card">
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1">
          Latest reading
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-5xl tabular text-foreground" data-testid="ferritin-latest-value">
            {last?.value ?? "—"}
          </span>
          {last && <span className="text-sm text-muted-foreground">ng/mL</span>}
        </div>
        <div className="flex items-center gap-2 mt-2">
          {last && (
            <span className="text-xs text-muted-foreground">{fmt(last.date, "MMM d, yyyy")}</span>
          )}
          {delta != null && (
            <span
              className="text-xs flex items-center gap-0.5 text-muted-foreground"
              data-testid="ferritin-delta"
            >
              {delta > 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : delta < 0 ? (
                <ArrowDownRight className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              {delta > 0 ? "+" : ""}
              {delta.toFixed(0)} from previous
            </span>
          )}
        </div>
      </section>

      {/* Desferal compliance — placed above the trend chart inside the Ferritin tab */}
      <DesferalTracker />

      {/* Chart */}
      <section className="soft-card p-4 mb-5" data-testid="ferritin-chart-section">
        <h2 className="text-sm font-medium mb-3">Trend</h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No readings yet.
          </p>
        ) : (
          <div className="h-48" data-testid="ferritin-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={48} />
                <Tooltip
                  contentStyle={{
                    background: "#FBFAF8",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#5B7C99"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#5B7C99" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* List */}
      <section data-testid="ferritin-history">
        <h2 className="text-sm font-medium mb-2 px-1">History</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1">No entries yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((f) => (
              <li
                key={f.id}
                className="soft-card p-4 flex items-start justify-between gap-3"
                data-testid={`ferritin-item-${f.id}`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium tabular">
                    {f.value} <span className="text-muted-foreground text-xs">ng/mL</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {fmt(f.date, "EEE, MMM d, yyyy")}
                  </div>
                  {f.notes && <div className="text-[11px] text-muted-foreground mt-1">{f.notes}</div>}
                </div>
                <button
                  onClick={() => remove(f.id)}
                  className="tap-44 w-9 h-9 grid place-items-center rounded-full text-muted-foreground hover:text-foreground"
                  aria-label="Delete"
                  data-testid={`ferritin-delete-${f.id}`}
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl bg-[#FBFAF8]" data-testid="ferritin-dialog">
          <DialogHeader>
            <DialogTitle>Add ferritin reading</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="f-date" className="text-xs">Test date</Label>
              <Input
                id="f-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="tap-44"
                data-testid="ferritin-date-input"
              />
            </div>
            <div>
              <Label htmlFor="f-value" className="text-xs">Ferritin (ng/mL)</Label>
              <Input
                id="f-value"
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 1250"
                className="tap-44"
                data-testid="ferritin-value-input"
              />
            </div>
            <div>
              <Label htmlFor="f-notes" className="text-xs">Notes</Label>
              <Textarea
                id="f-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="ferritin-notes-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="tap-44">Cancel</Button>
            <Button
              onClick={save}
              className="tap-44 bg-[#5B7C99] hover:bg-[#4A6A87] text-white"
              data-testid="ferritin-save-btn"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
