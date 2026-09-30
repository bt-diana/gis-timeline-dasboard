---
status: draft
---

# Roadmap — GIS Timeline Dashboard

Task list derived from `GIS_Timeline_BRD.md`, `GIS_Timeline_TRD.md` and `GIS_Timeline_API.md`. Each task is one feature and goes through intent → spec → plan → tests → code → review.

Order: one task per widget, each fully implemented (layer-panel INT-7): its UI, its requests and MSW mocks, its store slices, all loading, error and empty states, its race-condition and performance concerns, and its tests. The shared API client core and the MSW setup are built by the first task that needs them. Slice names follow Feature-Sliced Design (layer-panel INT-4).

| # | Task | Covers | Depends on | Status |
|---|---|---|---|---|
| 1 | Map library selection: MapLibre GL JS chosen (INT-4) and installed | BR-12, TR-06 | none | done |
| 2 | Dashboard layout: stubs and app shell; left are manual check, verify, build, acceptance, review | TR-60 | 1 | done |
| 3 | Layer panel — widget `layer-panel`, entity `layer`, feature `toggle-layer`. Vedro store (INT-3) and FSD (INT-4) set up. Shared API client core: request function with `AbortSignal`, response validation against the contract types, `ApiError` turned into a user-readable message. MSW for dev and tests. `GET /api/layers` mock with the 3 layers, 300–1500 ms latency, error codes and the failure-injection switch. Layer slice: definitions, active ids, list request status. Panel: list loading, error with retry and empty states (INT-2); toggles. Retry of a superseded list request discarded | BR-02, BR-03, BR-09, BR-10, BR-11, AR-01, TR-03, TR-05, TR-10, TR-11, TR-20, TR-21, TR-30, TR-31, TR-33, TR-60, TR-71, TR-82 | 2 | in progress |
| 4 | Chart — widget `chart`, entities `series` and `time`, feature `select-time`. `GET /api/layers/:layerId/series` mock and request per active layer, series slice with per-layer status, shared timeline range derived from the layers' time points, selected time in the store, a click on the chart selects the time (dashboard INT-2), selected-time marker, series of a deactivated layer discarded, memoized series | BR-04, BR-06, BR-07, BR-08, BR-11, TR-12, TR-13, TR-22, TR-31, TR-50–53, TR-71, TR-73, TR-82 | 3 | todo |
| 5 | Map — widget `map`, entity `snapshot`. MapLibre adapter created once, bundled GeoJSON background, fake adapter for tests. `GET /api/layers/:layerId/snapshot` mock with hourly data 10:00–14:00 and `NO_DATA`, request per active layer at the selected time, superseded requests aborted, previous data kept while loading. Renderers for points, arrows and heatmap selected by `kind`, updated in place. Loading indicator above the map (dashboard INT-4); per-layer loading and error with retry in the layer panel (INT-1). Sync and race integration tests across panel, chart and map | BR-01, BR-04, BR-05, BR-08, BR-11, TR-23, TR-31, TR-32, TR-34, TR-40–43, TR-70, TR-72, TR-74, TR-82 | 3, 4 | todo |
| 6 | README: the 8 required sections plus AI usage, assembled from the `## Decisions` entries | BR-41, TR-75, TR-83 | all | todo |

## Open points

- The TRD cites BR-20 (chart click selects time), BR-21 (3D object) and BR-22 (hosting), which the BRD does not define. Out of scope: the user declined the optional extras.
- The Vedro API is confirmed in task 3 (layer-panel plan).
- There is no separate timeline widget: the chart is the time picker (dashboard-layout INT-2), so BR-06 is covered by task 4.
