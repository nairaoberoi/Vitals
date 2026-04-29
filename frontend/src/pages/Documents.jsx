import React, { useEffect, useMemo, useRef, useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { documentsAPI } from "@/lib/storage";
import { fmt, todayISO } from "@/lib/dateUtils";
import { Plus, FileText, Image as ImageIcon, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const categories = ["MRI", "LFT", "CBC", "Endocrine", "Other"];

export default function Documents() {
  const [refresh, setRefresh] = useState(0);
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(false);

  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("CBC");
  const [testDate, setTestDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const fileRef = useRef(null);

  const [viewer, setViewer] = useState(null); // { url, mime, filename }

  const meta = useMemo(() => documentsAPI.listMeta(), [refresh]);
  const filtered = useMemo(
    () => (filter === "All" ? meta : meta.filter((m) => m.category === filter)),
    [meta, filter]
  );

  const handleSave = async () => {
    if (!file) {
      toast.error("Pick a file first");
      return;
    }
    try {
      await documentsAPI.add({ file, category, testDate, notes });
      setOpen(false);
      setFile(null);
      setNotes("");
      setCategory("CBC");
      setTestDate(todayISO());
      if (fileRef.current) fileRef.current.value = "";
      setRefresh((k) => k + 1);
      toast.success("Document saved");
    } catch (e) {
      console.error(e);
      toast.error("Could not save document");
    }
  };

  const openDoc = async (m) => {
    try {
      const blob = await documentsAPI.getBlob(m.id);
      if (!blob) {
        toast.error("File missing");
        return;
      }
      const url = URL.createObjectURL(blob);
      setViewer({ url, mime: m.mime, filename: m.filename });
    } catch (e) {
      console.error(e);
      toast.error("Could not open file");
    }
  };

  const closeViewer = () => {
    if (viewer?.url) URL.revokeObjectURL(viewer.url);
    setViewer(null);
  };

  const removeDoc = async (id) => {
    await documentsAPI.remove(id);
    setRefresh((k) => k + 1);
  };

  return (
    <MobileLayout
      subtitle="Files"
      title="Documents"
      rightAction={
        <Button
          size="icon"
          onClick={() => setOpen(true)}
          data-testid="add-document-btn"
          className="tap-44 w-10 h-10 rounded-full bg-[#5B7C99] hover:bg-[#4A6A87] text-white"
          aria-label="Add document"
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
        </Button>
      }
    >
      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-2 -mx-1 px-1" data-testid="doc-category-filter">
        {["All", ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`tap-44 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
              filter === c
                ? "bg-[#5B7C99] text-white"
                : "bg-[#FBFAF8] border border-border text-foreground/70"
            }`}
            data-testid={`doc-filter-${c.toLowerCase()}`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1 mt-6" data-testid="doc-empty">
          No documents yet.
        </p>
      ) : (
        <ul className="space-y-2" data-testid="doc-list">
          {filtered.map((m) => (
            <li
              key={m.id}
              className="soft-card p-3 flex items-center gap-3"
              data-testid={`doc-item-${m.id}`}
            >
              <button
                onClick={() => openDoc(m)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
                data-testid={`doc-open-${m.id}`}
              >
                <div className="w-11 h-11 rounded-lg bg-[#E8E6E2] grid place-items-center flex-shrink-0">
                  {m.mime?.startsWith("image/") ? (
                    <ImageIcon className="w-5 h-5 text-[#5B7C99]" strokeWidth={1.5} />
                  ) : (
                    <FileText className="w-5 h-5 text-[#5B7C99]" strokeWidth={1.5} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E0E5EC] text-[#3A4D5E]">
                      {m.category}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{fmt(m.testDate, "MMM d, yyyy")}</span>
                  </div>
                  <div className="text-sm truncate">{m.filename}</div>
                  {m.notes && <div className="text-[11px] text-muted-foreground truncate">{m.notes}</div>}
                </div>
              </button>
              <button
                onClick={() => removeDoc(m.id)}
                aria-label="Delete"
                className="tap-44 w-9 h-9 grid place-items-center text-muted-foreground hover:text-foreground"
                data-testid={`doc-delete-${m.id}`}
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl bg-[#FBFAF8]" data-testid="doc-dialog">
          <DialogHeader>
            <DialogTitle>Add document</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">File (PDF or image)</Label>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm tap-44 file:mr-3 file:rounded-lg file:border-0 file:bg-[#5B7C99] file:px-3 file:py-2 file:text-white file:text-xs"
                data-testid="doc-file-input"
              />
              {file && (
                <div className="text-[11px] text-muted-foreground mt-1">
                  {file.name} · {(file.size / 1024).toFixed(0)} KB
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="tap-44" data-testid="doc-category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c} data-testid={`doc-category-option-${c.toLowerCase()}`}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Test date</Label>
              <Input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="tap-44"
                data-testid="doc-date-input"
              />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="doc-notes-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="tap-44">Cancel</Button>
            <Button
              onClick={handleSave}
              className="tap-44 bg-[#5B7C99] hover:bg-[#4A6A87] text-white"
              data-testid="doc-save-btn"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Viewer overlay */}
      {viewer && (
        <div
          className="fixed inset-0 bg-[#0f0f10] z-[60] flex flex-col"
          data-testid="doc-viewer"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm truncate">{viewer.filename}</span>
            <button
              onClick={closeViewer}
              className="tap-44 w-10 h-10 grid place-items-center"
              aria-label="Close"
              data-testid="doc-viewer-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-white">
            {viewer.mime?.startsWith("image/") ? (
              <img src={viewer.url} alt={viewer.filename} className="w-full h-auto" />
            ) : (
              <iframe
                src={viewer.url}
                title={viewer.filename}
                className="w-full h-full border-0"
                style={{ minHeight: "100vh" }}
              />
            )}
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
