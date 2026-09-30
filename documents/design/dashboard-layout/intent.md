---
status: approved
---

# Intent — Dashboard Layout

## Problem

Layers, timeline, chart and map are separate features that all render on one page. Without an agreed page structure and component boundaries, each feature invents its own place in the layout and its own folder, and the responsibilities in TRD §7 blur.

## Requirement source

- BR-01, BR-03, BR-06, BR-07, BR-08, AR-01.
- TR-11, TR-40, TR-53, TR-60, TR-61.
- Reference: `prototypes/dashboard.prototype.html` (throwaway, not part of `main`).

## Goals

- An app shell with four regions, as in the prototype: header, layer panel (sidebar), map area, chart area.
- One stub component per region, each in its own `src/features/<feature>/` folder, rendering a labelled placeholder.
- Region boundaries and folder names match TRD §7 (UI, state, data access, map, analytics), so later features drop in without moving anything.
- A drafted mock API contract for layer data (`documents/GIS_Timeline_API.md`), so the stubs' future data layer has a fixed target.

## Non-goals

- Store, actions, selectors, mock API implementation and MSW.
- MapLibre, the map adapter and the background GeoJSON.
- Recharts and any real chart.
- Loading, error and race-condition behaviour (only where it will be shown is fixed here).
- Visual polish beyond a usable placeholder layout.

## Decisions

### INT-0 — Prototype B is the reference design

- **Status:** active
- **Decision:** `prototypes/dashboard.prototype.html` in its layout-B form is the reference for the page. It shows:
  - Header with the title.
  - Left panel: three layers (temperature as points, wind as arrows, insolation as a heatmap), each with an on/off switch, its unit and its latest average.
  - Map filling the main area, with the selected time shown on it.
  - Chart strip below the map: one line per active layer, the selected time marked, a click picks a time.
  - Five hourly time points, 10:00–14:00.
  - Loading and error states per INT-4, with a retry on a failed layer.
- **Options considered:** Prototype variants A and C, and earlier B versions with a timeline bar and a play button (see INT-1 to INT-5).
- **Why:** It is the layout the user approved after iterating on the prototype.
- **Trade-off accepted:** The prototype uses a drawn SVG map and mock arithmetic, so map behaviour, chart scaling (each series is normalised) and real data are not validated by it.
- **AI involvement:** Prototype built by Claude and changed on the user's feedback; the user approved the result.

### INT-1 — Layout: sidebar, map, chart underneath

- **Status:** active
- **Decision:** Header with the title only; layer panel on the left; map filling the main area; chart in a wide strip below the map.
- **Options considered:** A: map-first, panels floating over the map; B: sidebar + map over chart; C: map with a right rail and vertical timeline.
- **Why:** Chosen by the user after comparing the three prototype layouts.
- **Trade-off accepted:** Fixed-height chart strip takes vertical space from the map.
- **AI involvement:** Three variants proposed by Claude; the user chose B.

### INT-2 — The chart is the time picker; no separate timeline control

- **Status:** active
- **Decision:** The selected time is picked by clicking the chart. There is no timeline panel in the header or elsewhere.
- **Options considered:** Timeline bar in the header (prototype's first version); vertical timeline rail.
- **Why:** The chart already shows every time point, so a second control duplicates it.
- **Trade-off accepted:** BR-06 ("a timeline lets the user pick a time point") is met by the chart, and BR-20/TR-12 become the primary path, not an optional one. BRD, TRD and README wording must be reconciled.
- **AI involvement:** Decided by the user; Claude raised the BR-06 impact.

### INT-3 — No play / autoplay

- **Status:** active
- **Decision:** No play button or automatic time advance.
- **Options considered:** Play/pause control on the timeline.
- **Why:** Not needed by any requirement; the user asked whether it is required and it is not.
- **Trade-off accepted:** Time changes only on explicit user action.
- **AI involvement:** Play button proposed by Claude in the prototype; the user questioned it and it was removed.

### INT-4 — One loading indicator above the map

- **Status:** active
- **Decision:** While layers load for a time point, one indicator above the map names the requested time. Per-layer errors stay in the layer panel with a retry.
- **Options considered:** One spinner per layer.
- **Why:** Three simultaneous spinners for one time change read as noise.
- **Trade-off accepted:** The indicator does not say which layer is still pending.
- **AI involvement:** Decided by the user after seeing per-layer spinners in the prototype.

### INT-5 — The whole map is always visible

- **Status:** active
- **Decision:** The map fits its container without cropping.
- **Options considered:** Fill and crop the map to the container.
- **Why:** The cropped map hid parts of the data.
- **Trade-off accepted:** Empty margins when the container's aspect ratio differs from the map's.
- **AI involvement:** Decided by the user after seeing the cropped map in the prototype.

### INT-6 — Request cancellation uses AbortSignal, specified in the contract only

- **Status:** active
- **Decision:** Superseded requests are cancelled through `AbortSignal`, as written in `documents/GIS_Timeline_API.md`. This task does not implement it; the data-access feature does.
- **Options considered:** Contract only; contract plus a shared cancellable fetch helper; full handling (fetch layer, store, race tests) in this task.
- **Why:** This task builds stubs with no requests, so there is nothing to cancel yet. Fixing the mechanism now gives the data-access feature a target.
- **Trade-off accepted:** Cancellation is untested until the data-access feature lands.
- **AI involvement:** Question raised by the user; Claude recommended contract only and the user accepted.
