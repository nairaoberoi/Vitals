# Thalassemia Tracker — PRD

## Original problem statement
Single-user personal mobile-first web app for a thalassemia major patient. Tracks transfusions, ferritin, fatigue, headaches, diet, and test documents. Calm clinical tone. No login, no gamification, no streaks, no motivational language. All data persists locally on device. Designed for 390px-wide mobile viewport. Fixed bottom navigation. ≥44px tap targets.

## Architecture
- **Frontend**: React 19 + react-router-dom + TailwindCSS + shadcn/ui + recharts + react-day-picker + sonner.
- **Persistence**: 100% client-side.
  - `localStorage` keys (`thal.transfusions`, `thal.ferritin`, `thal.fatigue`, `thal.headache`, `thal.diet`, `thal.documents.meta`)
  - `IndexedDB` (database `thal_docs`, store `files`) for uploaded PDF / image blobs.
- **Backend**: not used by the app. Template FastAPI server is left intact but unused.
- **Theme**: `#F2F1EF` warm off-white background, `#5B7C99` slate-blue accent, warm gray secondary text. Manrope sans + Fraunces display headings.

## User persona
A single thalassemia major patient using this on their personal phone. No multi-user / no sharing.

## Core requirements (static)
1. **Dashboard** — days since last transfusion, latest ferritin, today's fatigue level, gentle prompt when nothing logged, quick fatigue 1–5, quick add for headache / meal / symptoms, recent strip.
2. **Transfusion calendar** — full month calendar with marked transfusion days, dual-line Hb chart (pre-Hb vs day-Hb), history list, +-add dialog, detail view with edit/delete.
3. **Ferritin log** — chronological list, line chart, latest reading with delta indicator, +-add.
4. **Symptoms** — Fatigue (1–5 tap scale, weekly bar, monthly heatmap, history) + Headache (severity / duration / notes, weekly frequency chart).
5. **Diet** — day-by-day swipeable log, meal-tagged entries (Breakfast / Lunch / Dinner / Snack), free text + notes.
6. **Documents** — file cabinet for PDFs/images by category (MRI / LFT / CBC / Endocrine / Other), sorted desc by test date, filterable, in-app viewer.
7. **Settings** — Export JSON, Export CSV (per data type), Clear all data.

## What's been implemented (Feb 2026, day 1)
- All 7 sections above, fully functional, no mocks.
- 6-item fixed bottom nav lifted above the platform "Made with Emergent" badge.
- Persistence verified across page reloads (incl. uploaded files via IndexedDB).
- End-to-end frontend test at 390×844 viewport — 95% pass; the one HIGH issue (badge / nav overlap) was fixed and re-verified.

## Prioritized backlog
- **P1**: Optional reminders ("transfusion due in N days"), basic transfusion-cycle calculation.
- **P1**: PDF text-search / preview thumbnails for Documents.
- **P2**: Multi-day diet view (week summary), iron-rich tag stats.
- **P2**: PWA / installable + offline manifest (already works offline thanks to local storage).
- **P2**: Encrypted local backup (passphrase) before export.

## Next tasks
- Confirm with user whether passive due-date reminders are wanted.
- Discuss: do we want to allow attaching a PDF/image directly to a transfusion entry (e.g., the lab slip for that pre-Hb reading)?
