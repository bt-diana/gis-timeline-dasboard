---
status: approved
---

# Intent — Chart

## Problem

The chart region is a stub. Users cannot see how the active layers change over time, and they have no way to pick a time point: the chart is the only time picker (dashboard-layout INT-2), so without it the selected time is never set and the map (task 5) has nothing to follow.

## Requirement source

- BR-04, BR-06, BR-07, BR-08, BR-11 (roadmap task 4).
- Supporting: TR-12 (chart click uses the shared select-time action), TR-13 (series derived, not stored twice), TR-31 (series of a deactivated layer discarded), TR-50–53 (Recharts chart, selected-time marker, click selects time, no fetching in the chart), TR-71 (chart re-renders only on its own state), TR-73 (memoized series), TR-82 (tests for states and races).
- Contract: `GIS_Timeline_API.md` (`GET /api/layers/:layerId/series`, `LayerSeries`, `ApiError`, latency).
- Carried over: dashboard-layout INT-0 (one line per active layer, selected time marked, a click picks a time), INT-2, INT-3 (no play); layer-panel INT-3/INT-4 (Vedro store, FSD), INT-5 (shared API client core and MSW reused), INT-7 (fully implemented widget); TR-22 range selector from task 3.

## Prior incidents

None found (`documents/incidents/` holds only the template).

## Goals

- MSW mock for `GET /api/layers/:layerId/series` with the contract's latency and error codes; one request per active layer through the shared API client core.
- Entity `series`: a slice with each layer's series and its own request status (loading, error, success).
- Entity `time`: the selected time in the store, initially the current time (INT-1); feature `select-time`: the one store action that changes it (TR-11, TR-12), used by the chart now and read by the map in task 5.
- A response for a layer deactivated before it arrives is discarded or aborted, never written as current (TR-31); loaded series are kept and reused (INT-4).
- Widget `chart`: a Recharts line chart with one line per active layer across all time points, a marker at the selected time, and a click that selects the nearest time point; lines scaled per series with real values in the tooltip (INT-2).
- Chart data is derived from the store by a memoized selector (TR-13, TR-73); the widget has no fetching or business logic (TR-53) and re-renders only on series, active layers and selected time (TR-71).
- Chart states: no active layers (empty), series loading, per-layer series error with retry (INT-3), success.

## Non-goals

- Snapshot requests, the map, the loading indicator above the map (task 5).
- Per-layer snapshot loading and error in the layer panel (layer-panel INT-1, task 5).
- Play / autoplay (dashboard-layout INT-3); a separate timeline control (dashboard-layout INT-2).
- Cross-widget sync and race integration tests across panel, chart and map (task 5).
- Keyboard selection of the time (INT-5).

## Open questions for the user

- INT-1 reads "current time" as the time point nearest to the current clock time, clamped to the timeline range; to confirm in the spec (e.g. whether only the time of day counts, since the mock data covers 10:00–14:00 of one date).

## Decisions

### INT-1 — The initial selected time is the current time

- **Status:** active
- **Decision:** Before any click, the selected time is the time point nearest to the current clock time, clamped to the timeline range.
- **Options considered:** First time point; last time point; none until the user clicks; current time.
- **Why:** The user chose "current time".
- **Trade-off accepted:** The initial time depends on the clock, so tests must fix it; outside the range it falls back to the nearest end.
- **AI involvement:** Claude proposed the first time point; the user changed it to "current time". The nearest-point-and-clamp reading is Claude's interpretation of the user's words and may need confirmation in the spec.

### INT-2 — Each line is scaled to its own range

- **Status:** active
- **Decision:** Each series is normalised to its own min–max range on one chart; the tooltip shows real values with the layer's unit.
- **Options considered:** Per-series normalisation (as in the prototype); one Y axis per unit; one small chart per layer.
- **Why:** Three units (°C, m/s, W/m²) share one chart strip without a crowded axis set.
- **Trade-off accepted:** The Y axis carries no absolute values; magnitudes are read from the tooltip.
- **AI involvement:** Proposed by Claude; accepted by the user.

### INT-3 — Series errors and retry are shown inside the chart

- **Status:** active
- **Decision:** A failed series request shows its layer's error message with a retry inside the chart area.
- **Options considered:** Inside the chart; in the layer panel next to the layer.
- **Why:** The series belongs to the chart; the layer panel keeps the snapshot errors (dashboard-layout INT-4, task 5).
- **Trade-off accepted:** A layer can show errors in two places once the map lands (series in the chart, snapshot in the panel).
- **AI involvement:** Proposed by Claude; accepted by the user.

### INT-4 — Loaded series are kept and reused

- **Status:** active
- **Decision:** A loaded series stays in the store when its layer is switched off and is reused, without a new request, when the layer is switched on again. A response that arrives after its layer was switched off is still discarded (TR-31).
- **Options considered:** Keep and reuse; drop and request again.
- **Why:** A series does not depend on the selected time, so it does not go stale while the layer is off.
- **Trade-off accepted:** Series of inactive layers stay in memory (three small series); a failed series is requested again on reactivation.
- **AI involvement:** Proposed by Claude; accepted by the user.

### INT-5 — No keyboard time selection

- **Status:** active
- **Decision:** Time is selected by clicking the chart only; no keyboard selection in this task.
- **Options considered:** Arrow-key selection on the chart in this task; click only.
- **Why:** The user declined it, and no BR or TR requires it.
- **Trade-off accepted:** The selected time cannot be changed from the keyboard.
- **AI involvement:** Proposed by Claude; rejected by the user.
