import { exportAllJSON } from "./storage";

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCSV(rows, headers) {
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h])).join(","));
  }
  return lines.join("\n");
}

export function exportJSON() {
  const data = exportAllJSON();
  downloadFile(
    `thal-tracker-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(data, null, 2),
    "application/json"
  );
}

export function exportCSV() {
  const data = exportAllJSON();
  const date = new Date().toISOString().slice(0, 10);

  // Transfusions
  const transfusionRows = data.transfusions.map((t) => ({
    date: t.date,
    units: t.units || "",
    pre_hb_date: t.preHb?.date || "",
    pre_hb_value: t.preHb?.value || "",
    day_hb_date: t.dayHb?.date || "",
    day_hb_value: t.dayHb?.value || "",
    notes: t.notes || "",
  }));
  downloadFile(
    `transfusions-${date}.csv`,
    toCSV(transfusionRows, [
      "date", "units", "pre_hb_date", "pre_hb_value", "day_hb_date", "day_hb_value", "notes",
    ]),
    "text/csv"
  );

  downloadFile(
    `ferritin-${date}.csv`,
    toCSV(
      data.ferritin.map((f) => ({ date: f.date, value: f.value, notes: f.notes || "" })),
      ["date", "value", "notes"]
    ),
    "text/csv"
  );

  downloadFile(
    `fatigue-${date}.csv`,
    toCSV(
      data.fatigue.map((f) => ({ date: f.date, level: f.level, notes: f.notes || "" })),
      ["date", "level", "notes"]
    ),
    "text/csv"
  );

  downloadFile(
    `headache-${date}.csv`,
    toCSV(
      data.headache.map((h) => ({
        date: h.date,
        severity: h.severity || "",
        duration_hours: h.durationHours || "",
        notes: h.notes || "",
      })),
      ["date", "severity", "duration_hours", "notes"]
    ),
    "text/csv"
  );

  downloadFile(
    `diet-${date}.csv`,
    toCSV(
      data.diet.map((d) => ({
        date: d.date,
        time: d.time || "",
        meal: d.meal || "",
        location: d.location || "Home",
        text: d.text || "",
        notes: d.notes || "",
      })),
      ["date", "time", "meal", "location", "text", "notes"]
    ),
    "text/csv"
  );

  downloadFile(
    `desferal-${date}.csv`,
    toCSV(
      data.desferal.map((d) => ({
        date: d.date,
        done: d.done ? "yes" : "no",
        dose_mg: d.dose ?? "",
      })),
      ["date", "done", "dose_mg"]
    ),
    "text/csv"
  );
}
