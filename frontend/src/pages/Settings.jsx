import React from "react";
import { Link } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { exportJSON, exportCSV } from "@/lib/exportData";
import { clearAllData } from "@/lib/storage";
import { ArrowLeft, Download, FileText, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function SettingsPage() {
  const handleClear = () => {
    clearAllData();
    toast.success("All data cleared");
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <MobileLayout
      subtitle="App"
      title="Settings"
      rightAction={
        <Link
          to="/"
          aria-label="Back"
          data-testid="settings-back-btn"
          className="tap-44 w-10 h-10 rounded-full grid place-items-center text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </Link>
      }
    >
      <section className="space-y-3 mb-6" data-testid="settings-export">
        <h2 className="text-sm font-medium px-1">Export data</h2>
        <p className="text-xs text-muted-foreground px-1 mb-2">
          Download a copy of all logged data for sharing with the doctor. Files are generated on this device.
        </p>
        <button
          onClick={exportJSON}
          className="soft-card w-full p-4 flex items-center gap-3 hover:border-foreground/30 transition-colors text-left tap-44"
          data-testid="export-json-btn"
        >
          <div className="w-10 h-10 rounded-lg bg-[#E8E6E2] grid place-items-center">
            <Download className="w-4 h-4 text-[#5B7C99]" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-sm font-medium">Full backup (JSON)</div>
            <div className="text-[11px] text-muted-foreground">All logs in one structured file</div>
          </div>
        </button>
        <button
          onClick={exportCSV}
          className="soft-card w-full p-4 flex items-center gap-3 hover:border-foreground/30 transition-colors text-left tap-44"
          data-testid="export-csv-btn"
        >
          <div className="w-10 h-10 rounded-lg bg-[#E8E6E2] grid place-items-center">
            <FileText className="w-4 h-4 text-[#5B7C99]" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-sm font-medium">CSV summary</div>
            <div className="text-[11px] text-muted-foreground">One CSV per data type — opens in Excel</div>
          </div>
        </button>
      </section>

      <section className="space-y-3 mb-6" data-testid="settings-storage">
        <h2 className="text-sm font-medium px-1">Storage</h2>
        <div className="soft-card p-4 text-xs text-muted-foreground leading-relaxed">
          All data is kept on this device only — in the browser's local storage and IndexedDB.
          Nothing is sent to any server. Clearing your browser data will erase your logs, so
          consider exporting periodically.
        </div>
      </section>

      <section className="space-y-3" data-testid="settings-danger">
        <h2 className="text-sm font-medium px-1">Reset</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="soft-card w-full p-4 flex items-center gap-3 text-left tap-44"
              data-testid="clear-data-btn"
            >
              <div className="w-10 h-10 rounded-lg bg-[#E8E6E2] grid place-items-center">
                <Trash2 className="w-4 h-4 text-[#996A5B]" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-sm font-medium">Clear all data</div>
                <div className="text-[11px] text-muted-foreground">Removes all logs and uploaded documents</div>
              </div>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-sm rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete every transfusion, ferritin reading, symptom log, diet
                entry, and uploaded document on this device. Consider exporting first.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClear} data-testid="confirm-clear-btn">
                Clear everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </MobileLayout>
  );
}
