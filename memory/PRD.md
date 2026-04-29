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

## What's been implemented (Feb 2026)
**Day 1 (Feb 2026)**
- All 7 sections (Dashboard / Transfusions / Ferritin / Symptoms / Diet / Documents / Settings), fully functional, no mocks.
- 6-item fixed bottom nav lifted above the platform "Made with Emergent" badge.
- Persistence verified across page reloads (incl. uploaded files via IndexedDB).
- End-to-end frontend test at 390×844 viewport — 95% pass; HIGH issue (badge / nav overlap) fixed and re-verified.

**Day 2 (Feb 2026)**
- **Quiet next-transfusion estimate** on dashboard — average gap of last 3 transfusion dates; shown as plain secondary text only if ≥2 transfusions are logged. Falls back to "Around your typical interval now…" when overdue. No icon, no color change, no alert styling.
- **Per-transfusion attachments** ("Lab slips & related documents") — files (PDF / image) attached to a specific transfusion entry, viewable in-app, persisted via IndexedDB, separate from the standalone Documents section.
- **PWA support** — `manifest.json` (name "Thal Tracker", short_name "Thal", standalone display, `#F2F1EF` theme + bg, icons 192 / 512 / maskable / 180), `sw.js` service worker (skipWaiting + clients.claim, network-first navigation with offline shell fallback, stale-while-revalidate same-origin assets, cache-first cross-origin). Service worker registered on window load. Apple touch icon + theme-color meta + favicon added. Round-2 testing: **100% pass** including verified offline reads & writes.

**Day 3 (Feb 2026)**
- **Desferal compliance tracker** inside the Ferritin tab (above the trend chart): weekly strip (M T W T F S S) with live "X / 7 nights this week"; full-month calendar with prev/next nav and small slate dot per Desferal night; tap-to-toggle on both controls; "Selected day" panel with optional `dose (mg)` input that appears only when that day is marked. Neutral filled / unfilled — no red, no green. All data via the storage API (`thal.desferal`). Ready for future fatigue-correlation joins (same date format keys both arrays). Round-3 testing: **100% pass (28/28)**.

**Day 4 (Feb 2026) — strict offline / zero-external-requests**
- Removed PostHog analytics, `assets.emergent.sh/scripts/emergent-main.js`, and Google Fonts links from `public/index.html`.
- Self-hosted **Manrope** + **Fraunces** via `@fontsource` (woff2 files bundled by webpack, served from same-origin `/static/media/`).
- Added a strict **Content-Security-Policy** meta tag in `index.html`: `default-src 'self'`, no third-party origins. The browser blocks any cross-origin script/font/connect attempts — even ones injected by upstream CDNs (e.g. preview-environment Cloudflare RUM beacons are caught and refused).
- Verified end-to-end: zero external requests succeed after install. App, fonts, SW, IndexedDB, all data flows are 100% same-origin / on-device. Re-tested all features — no regressions.

**Day 5 (Feb 2026) — one entry per day, both symptom trackers**
- **Fatigue**: was already correctly upserting via `setForDate`; verified pre-selected level on open and id-stability across re-taps (no duplicates). Dashboard's quick-fatigue shares the same one-per-day storage.
- **Headache**: rewrote `headacheAPI` from `add` (which created duplicates) to `setForDate(date, payload)` upserting by calendar date. Dialog now: pre-fills `occurred / severity / duration / notes` from any existing entry on that date, hides severity & duration when "No" is selected, and submitting overwrites in place. Button label and a "Today: …" status line update live. Legacy entries (no `occurred` field) read as `occurred: true` for backward compatibility.
- **Dashboard quick-headache** is now a `<Link to="/symptoms?tab=headache">` — no more silent insertions. Symptoms page honors the `?tab=headache` deep link.
- Round-5 testing: **100% pass (19/19)**, including legacy migration and `Clear all data` regression.

## Prioritized backlog
- **P1**: Optional reminders ("transfusion due in N days"), basic transfusion-cycle calculation.
- **P1**: PDF text-search / preview thumbnails for Documents.
- **P2**: Multi-day diet view (week summary), iron-rich tag stats.
- **P2**: PWA / installable + offline manifest (already works offline thanks to local storage).
- **P2**: Encrypted local backup (passphrase) before export.

## Next tasks
- Confirm with user whether passive due-date reminders are wanted.
- Discuss: do we want to allow attaching a PDF/image directly to a transfusion entry (e.g., the lab slip for that pre-Hb reading)?
