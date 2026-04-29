import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { transfusionsAPI } from "@/lib/storage";
import { fmt } from "@/lib/dateUtils";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function TransfusionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [entry, setEntry] = useState(null);
  const [form, setForm] = useState(null);

  useEffect(() => {
    const e = transfusionsAPI.get(id);
    if (!e) {
      navigate("/transfusions");
      return;
    }
    setEntry(e);
    setForm({
      date: e.date,
      units: e.units ?? "",
      preDate: e.preHb?.date ?? "",
      preValue: e.preHb?.value ?? "",
      dayValue: e.dayHb?.value ?? "",
      notes: e.notes ?? "",
    });
  }, [id, navigate]);

  if (!entry || !form) return null;

  const save = () => {
    transfusionsAPI.upsert({
      id: entry.id,
      date: form.date,
      units: form.units ? Number(form.units) : null,
      preHb: form.preValue ? { date: form.preDate || null, value: Number(form.preValue) } : null,
      dayHb: form.dayValue ? { date: form.date, value: Number(form.dayValue) } : null,
      notes: form.notes,
    });
    const fresh = transfusionsAPI.get(entry.id);
    setEntry(fresh);
    setEditing(false);
    toast.success("Saved");
  };

  const remove = () => {
    transfusionsAPI.remove(entry.id);
    toast.success("Entry removed");
    navigate("/transfusions");
  };

  return (
    <MobileLayout
      subtitle="Transfusion"
      title={fmt(entry.date, "MMM d, yyyy")}
      rightAction={
        <Link
          to="/transfusions"
          className="tap-44 w-10 h-10 rounded-full grid place-items-center text-muted-foreground"
          aria-label="Back"
          data-testid="transfusion-back-btn"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </Link>
      }
    >
      {!editing ? (
        <div className="space-y-3" data-testid="transfusion-detail-view">
          <div className="soft-card p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1">Units</div>
            <div className="text-2xl font-medium tabular">{entry.units ?? "—"}</div>
          </div>

          <div className="soft-card p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1">Pre-transfusion Hb</div>
            <div className="text-2xl font-medium tabular">
              {entry.preHb?.value ?? "—"}
              {entry.preHb?.value != null && <span className="text-sm text-muted-foreground ml-1">g/dL</span>}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {entry.preHb?.date ? fmt(entry.preHb.date, "EEE, MMM d") : "Date not noted"}
            </div>
          </div>

          <div className="soft-card p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1">Hb on transfusion day</div>
            <div className="text-2xl font-medium tabular">
              {entry.dayHb?.value ?? "—"}
              {entry.dayHb?.value != null && <span className="text-sm text-muted-foreground ml-1">g/dL</span>}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {entry.dayHb?.date ? fmt(entry.dayHb.date, "EEE, MMM d") : ""}
            </div>
          </div>

          <div className="soft-card p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1">Notes</div>
            <div className="text-sm whitespace-pre-wrap">{entry.notes || <span className="text-muted-foreground">No notes</span>}</div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setEditing(true)}
              data-testid="edit-transfusion-btn"
              className="tap-44 flex-1 bg-[#5B7C99] hover:bg-[#4A6A87] text-white"
            >
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="tap-44"
                  data-testid="delete-transfusion-btn"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-sm rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove this transfusion entry?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="confirm-cancel-btn">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={remove} data-testid="confirm-delete-btn">Remove</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ) : (
        <div className="space-y-3" data-testid="transfusion-edit-view">
          <div className="soft-card p-4 space-y-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="tap-44"
                data-testid="edit-date-input"
              />
            </div>
            <div>
              <Label className="text-xs">Units</Label>
              <Input
                type="number"
                step="0.5"
                inputMode="decimal"
                value={form.units}
                onChange={(e) => setForm({ ...form, units: e.target.value })}
                className="tap-44"
                data-testid="edit-units-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Pre-Hb date</Label>
                <Input
                  type="date"
                  value={form.preDate}
                  onChange={(e) => setForm({ ...form, preDate: e.target.value })}
                  className="tap-44"
                  data-testid="edit-pre-date"
                />
              </div>
              <div>
                <Label className="text-xs">Pre-Hb (g/dL)</Label>
                <Input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={form.preValue}
                  onChange={(e) => setForm({ ...form, preValue: e.target.value })}
                  className="tap-44"
                  data-testid="edit-pre-value"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Day-Hb (g/dL)</Label>
              <Input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={form.dayValue}
                onChange={(e) => setForm({ ...form, dayValue: e.target.value })}
                className="tap-44"
                data-testid="edit-day-value"
              />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                data-testid="edit-notes"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)} className="tap-44 flex-1" data-testid="cancel-edit-btn">
              Cancel
            </Button>
            <Button onClick={save} className="tap-44 flex-1 bg-[#5B7C99] hover:bg-[#4A6A87] text-white" data-testid="save-edit-btn">
              Save
            </Button>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
