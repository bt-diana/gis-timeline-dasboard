---
status: draft
---

# Roadmap — GIS Timeline Dashboard

Task list derived from `GIS_Timeline_BRD.md`, `GIS_Timeline_TRD.md` and `GIS_Timeline_API.md`. Each task is one feature and goes through intent → spec → plan → tests → code → review.

Order: the UI first, as presentational components driven by props. Then the API client core as its own task. Then one task per request, each adding its endpoint function, its MSW mock and the store slice, and wiring the UI to it.

| # | Task | Covers | Depends on | Status |
|---|---|---|---|---|
| 1 | Map library selection: MapLibre GL JS chosen (INT-4) and installed | BR-12, TR-06 | none | done |
| 2 | Dashboard layout: stubs and app shell; left are manual check, verify, build, acceptance, review | TR-61 | 1 | done |
| 3 | Layer panel UI: feature-local layer data and store-backed on/off toggles; loading, error and empty states left to task 8 | BR-03, AR-01 | 2 | in progress |
| 4 | Timeline UI: time picker over a list of time points from props | BR-06 | 2 | todo |
| 5 | Map UI: `MapView` adapter with a MapLibre instance created once, bundled GeoJSON background, fake adapter for tests | BR-01, TR-40, TR-41 | 2 | todo |
| 6 | Chart UI: Recharts time-series chart from props, selected-time marker | BR-07, TR-50, TR-51, TR-53 | 2 | todo |
| 7 | API client core: MSW set up for tests and dev; one request function with `AbortSignal` support, response validation against the contract types, and `ApiError` turned into a user-readable message. No endpoints yet | TR-05, TR-30, TR-31, TR-60 | 2 | todo |
| 8 | Layers request: `GET /api/layers` mock with the 3 layers, latency and error codes, shared types, endpoint function on the client core, Vedro store (confirm the API first): layers, active layers, loading/error/success. Wires the layer panel, refactors it to add the list and per-layer loading, error (with retry) and empty states, and derives the timeline range | BR-02, BR-03, BR-09, BR-10, TR-05, TR-10, TR-20–22, TR-30, TR-33 | 3, 4, 7 | todo |
| 9 | Snapshot request: `GET /api/layers/:layerId/snapshot` mock with hourly data 10:00–14:00 and `NO_DATA`; selected time in the store, per-layer loading/error, superseded responses discarded. Wires the timeline and the map with renderers for points, arrows and heatmap, updated in place, previous data kept while loading. Split by kind if the spec gets large | BR-04–06, BR-08, BR-11, TR-11, TR-23, TR-31, TR-34, TR-42, TR-43, TR-72 | 5, 8 | todo |
| 10 | Series request: `GET /api/layers/:layerId/series` mock, endpoint function, series selector in the store. Wires the chart | BR-07, BR-08, TR-13, TR-50, TR-51 | 6, 8 | todo |
| 11 | Failure injection: test-only switch that makes a chosen layer return `500` | TR-30, TR-82 | 9 | todo |
| 12 | Sync and race-condition hardening: integration tests for rapid scrubbing and toggling, out-of-order responses, error states | BR-08, BR-11, TR-32, TR-82 | 9, 10, 11 | todo |
| 13 | Performance pass: per-slice subscriptions, memoized series, no fetch for inactive layers, payload sizes | BR-32, TR-71–74 | 12 | todo |
| 14 | README: the 8 required sections plus AI usage, assembled from the `## Decisions` entries | BR-41, TR-75, TR-83 | all | todo |

Tasks 3–6 are independent and can be done in any order.

## Open points

- The TRD cites BR-20 (chart click selects time), BR-21 (3D object) and BR-22 (hosting), which the BRD does not define. Out of scope: the user declined the optional extras.
- The Vedro API is confirmed at the start of task 8.
