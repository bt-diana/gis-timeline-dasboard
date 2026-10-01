---
status: approved
---

# Spec — Chart

## Requirements

### Series request and mock

1. `GET /api/layers/:layerId/series` returns `LayerSeries` through the shared `request` function, validated by a hand-written `isLayerSeries` guard (layer-panel SPEC-5).
2. The MSW handler serves one value per time point for each of the three mock layers after `randomLatency()` (TR-33); an unknown `layerId` returns `404 NOT_FOUND` with an `ApiError` body. Known layers always succeed; error states are covered by tests that `vi.mock` the request function (layer-panel SPEC-7).

### Series entity (INT-4, TR-31)

3. The series slice holds, per layer id, one of: `loading`, `error` with its message, or `success` with its points. A layer with no entry has never been requested or was aborted.
4. When a layer is active and has no entry or an `error` entry, its series is requested: one request per layer, never two at once for the same layer.
5. A `success` entry is kept when its layer is switched off and reused without a request when it is switched on again (INT-4).
6. Switching a layer off while its request is pending aborts that request and removes its entry; a late or aborted response is never written (TR-31, BR-11).
7. Retry for a layer starts a new request for that layer only.
8. The requests are aborted when the chart unmounts; nothing is written afterwards.

### Time entity and select-time feature (INT-1, TR-11, TR-12)

9. The time slice holds `selectedTime: string | null`, one of the timeline range's points or `null` while the range is empty.
10. When the range becomes non-empty and no time is selected, the selected time is set to the range point whose local time of day (minutes since local midnight, browser time zone) is nearest to the current local clock time; the date is ignored. A clock before the earliest or after the latest point selects that end; a tie picks the earlier point. Minutes since local midnight do not wrap around: in a range that crosses local midnight, a 00:00 point counts as the earliest of the day (INT-1, SPEC-1, SPEC-2).
11. `select-time` is the only action that changes the selected time after that; it accepts only a point of the range.
12. The clock is injectable and tests fix the time zone, so results do not depend on the machine (INT-1 trade-off).

### Chart widget (INT-2, INT-3, TR-50–53, TR-71, TR-73)

13. A memoized selector derives the chart rows from the timeline range, the layers, the active ids and the series: one row per range point, and per active layer with a loaded series its normalised value and its real value (TR-13, TR-73).
14. Normalisation is per series: `(value − min) / (max − min)`; a flat series (`max = min`) sits at `0.5`. A point missing from a series is a gap in its line (INT-2).
15. `Chart` is presentational: props are the rows, the line descriptors (layer id, name, unit, colour), the selected time, the per-layer loading and error entries, the list state, `onSelectTime(time)` and `onRetry(layerId)`. The connected part wires the store and the requests; the widget does no fetching (TR-53).
16. The connected part subscribes only to layers, active ids, list state, series and selected time (TR-71).
17. Success: a Recharts line chart with one line per active layer with a loaded series, the X axis over every range point, no absolute Y values, and a vertical marker at the selected time (TR-50, TR-51).
18. X-axis and tooltip times are shown as `HH:mm` in the browser's local time zone (SPEC-3). The tooltip shows the time and, per line, the layer name with its real value and unit (INT-2).
19. A click anywhere on the plot calls `onSelectTime` once with the nearest range point (TR-52, TR-12).
20. States inside the "Chart" region, shown together where they apply:
    - loading: the layer list is `idle` or `loading`, or an active layer's series is loading — a text status naming the loading layers; the plot area marked `aria-busy`;
    - error: per failed active layer, its name, its `error.message` and a "Retry" button that calls `onRetry(layerId)` once (INT-3);
    - empty: no active layers once the list has settled — a text status;
    - success: the plot, as soon as at least one active series is loaded.
21. Line colours come from an `as const` palette assigned by the layer's position in the list; layer ids are never hard-coded (contract: opaque `layerId`).
22. User-facing copy (heading, status texts, Retry label) lives in an `as const` config.
23. Code follows FSD (layer-panel INT-4): entities `series` and `time`, feature `select-time`, widget `chart`; the series-loading hook placement is settled in the plan.

## Data / state model changes

- Types: `LayerSeries`, `SeriesState` (per-layer entry).
- Store: `series` slice (`Record<layerId, SeriesState>`), `time` slice (`selectedTime`).
- Endpoint: `GET /api/layers/:layerId/series`, its MSW handler and mock data.
- Selectors: chart rows, line descriptors, selected time.

## Edge cases

- Layer toggled off and on fast while its series is pending: the first request is aborted, a new one starts, only the second result is written.
- Two layers' responses out of order: each is written to its own entry; neither overwrites the other.
- Failed series, layer switched off and on: requested again (INT-4 trade-off).
- Failed and loaded layers at once: the plot shows the loaded lines and the error with Retry is listed beside them.
- Layer list failed: the panel shows the error (layer-panel); the chart shows the empty state.
- Clock before the first or after the last point: the nearest end is selected.
- Range dates differ from today (mock data is 2026-01-01): only the local time of day counts.
- Range crossing local midnight (e.g. 10:00–14:00 UTC seen from UTC+10 ends at 00:00): points are compared by minutes since local midnight with no wrap-around.
- Series value for a time outside the range: ignored. Range point missing from a series: a gap.
- Selected time stays set when all layers are switched off; the marker returns with the first line.
- Click before any series loaded: no plot, nothing to click.

## Acceptance criteria

- [ ] `isLayerSeries` accepts a contract body and rejects malformed ones; `fetchSeries` calls `request` with the series path and the guard.
- [ ] With all layers active and the request mocked, each layer's series is requested once and the chart shows one line per layer.
- [ ] Toggling a loaded layer off and on makes no new request and shows its line again.
- [ ] Toggling a pending layer off aborts it; its late response writes nothing; toggling it back on starts a new request whose result alone is shown.
- [ ] A failed series shows the layer name, message and Retry; Retry requests that layer only and shows its line on success.
- [ ] Unmounting during requests writes nothing.
- [ ] With the clock and time zone fixed, the initial selected time is the point nearest by local time of day regardless of date, the earliest point before the range, the latest after it, and the earlier one on a tie.
- [ ] Axis and tooltip times render as local `HH:mm` for a fixed time zone.
- [ ] `select-time` changes the selected time and ignores a time outside the range.
- [ ] The rows selector normalises per series, places a flat series at 0.5, leaves gaps for missing points, and returns the same reference when its inputs are unchanged.
- [ ] `Chart` renders loading (`aria-busy`, status text), error with Retry calling `onRetry(layerId)` once, empty, and success with the marker at the selected time; Recharts internals are not re-tested.
- [ ] A click on the plot calls `onSelectTime` once with the nearest point.
- [ ] By hand in `npm run dev` and after `npm run build` with `npm run preview`: lines appear with visible latency, the tooltip shows real values with units, a click moves the marker.
- [ ] `npm run verify` passes.

## Decisions

### SPEC-1 — The initial time compares time of day only

- **Status:** active
- **Decision:** The INT-1 initial-time rule compares the time of day only; the date is ignored.
- **Options considered:** Time of day only; full timestamps.
- **Why:** Mock data covers 10:00–14:00 on one past date, so full timestamps would always clamp to the last point.
- **Trade-off accepted:** Data spanning several dates would be matched by time of day, not by the real instant.
- **AI involvement:** Proposed by Claude; confirmed by the user.

### SPEC-2 — Time of day is compared in the browser's local time zone

- **Status:** active
- **Decision:** Each time point's local time of day is compared with the current local clock time.
- **Options considered:** UTC (the data's zone); browser local time zone.
- **Why:** The user chose local time.
- **Trade-off accepted:** The initial point depends on the viewer's time zone (e.g. a UTC+6 viewer sees the 10:00–14:00 UTC data as 16:00–20:00); tests fix the zone.
- **AI involvement:** Claude proposed UTC; the user changed it to local time.

### SPEC-3 — Axis and tooltip labels show local time

- **Status:** active
- **Decision:** X-axis and tooltip times are shown in the browser's local time zone.
- **Options considered:** `HH:mm` UTC with a "UTC" mark; local time.
- **Why:** The user chose local time, consistent with SPEC-2.
- **Trade-off accepted:** Labels differ between viewers in different zones; tests fix the zone.
- **AI involvement:** Claude proposed UTC; the user changed it to local time.
