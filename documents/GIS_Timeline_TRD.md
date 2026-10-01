---
status: approved
revision: 2
---

# Technical Requirements — GIS Timeline Dashboard

Derived from `documents/GIS_Timeline_BRD.md` and from the assignment's architecture and state-management sections (cited as "Assignment: …"). `TR-xxx` IDs trace back to the `BR-xxx` requirements they satisfy. Where the assignment deliberately leaves a choice open, it is listed in §9 as an open decision to be settled in a feature's `intent.md`/`spec.md`, not here.

## 1. Stack

| ID | Requirement | Satisfies |
|---|---|---|
| TR-01 | React with TypeScript. | BR-09 |
| TR-02 | TypeScript in strict mode, no `any`, no unchecked casts across module boundaries. | Assignment: architecture |
| TR-03 | State managed with [Vedro](https://www.npmjs.com/package/vedro). | BR-09 |
| TR-04 | Charts built with Recharts. | BR-07 |
| TR-05 | Mock API via MSW (per README plan), or an equivalent simulated async request layer. | BR-10 |
| TR-06 | Map library chosen from the allowed set (BR-12); see §9. | BR-12 |
| TR-07 | No new npm package is added without the user's approval (see `.claude/agents/implementer.md`). | — |

## 2. Data flow

```
Timeline ─▶ Application State (Vedro) ─▶ Selected Time ─▶ Layer Data ─┬─▶ Map
                                                                       └─▶ Recharts
```

| ID | Requirement | Satisfies |
|---|---|---|
| TR-10 | The Vedro store is the single source of truth for: active layers, selected time point, per-layer loading/error state, and loaded layer data. | BR-09, Assignment: data flow |
| TR-11 | Timeline, map and chart read from the store and change selection only through store actions. No component keeps its own copy of the selected time or layer visibility. | BR-08, Assignment: data flow |
| TR-12 | Chart-to-timeline selection (BR-20) uses the same store action as the timeline, so both directions share one path. | BR-20 |
| TR-13 | Derived values (e.g. the series for the chart, the features for the current time point) are computed from store state, not stored twice. | Assignment: data flow |

## 3. Domain model

| ID | Requirement | Satisfies |
|---|---|---|
| TR-20 | A GIS layer is described by data, not by hard-coded branches: id, display name, rendering kind (e.g. points, polygons, heatmap, raster), unit, and how its data is fetched. | BR-30, Assignment: architecture |
| TR-21 | Adding a layer means adding one layer definition (and its mock data), with no changes to timeline, chart or store logic. | BR-30 |
| TR-22 | Time data is modeled as an ordered list of time points per layer, each mapping to that layer's data for that instant. A shared timeline range is derived from the layers. | BR-04, Assignment: architecture |
| TR-23 | Layers may have different available time points; behavior when the selected time has no data for a layer is defined in the spec (no silent failure). | BR-04 |

## 4. Async and race conditions

| ID | Requirement | Satisfies |
|---|---|---|
| TR-30 | Every request (each layer load, each time-point load) has explicit loading, error and success states in the store, and the UI renders all three: a loading indicator while pending, a user-readable error on failure (never a raw error object), and data only on success. Success content is never rendered from a pending or failed request. Implements the author requirement `AR-01`. | BR-09, BR-10, AR-01 |
| TR-31 | A response for a superseded request (older time point, or a layer since deactivated) is discarded or cancelled and never written to the store as current. | BR-11 |
| TR-32 | Rapid timeline scrubbing or layer toggling never leaves map, timeline and chart showing different states. | BR-08, BR-11 |
| TR-33 | Mock API has artificial latency, and variable latency for at least some requests, so out-of-order responses can actually occur and be tested. | BR-10, BR-11 |
| TR-34 | Switching between time points is smooth: the previous data stays visible (or transitions) rather than flashing empty while the next point loads. | BR-04 |

## 5. Map integration

| ID | Requirement | Satisfies |
|---|---|---|
| TR-40 | The map library is wrapped behind a thin adapter/component boundary so the rest of the app does not depend on library APIs. | Assignment: architecture |
| TR-41 | The map instance is created once and updated imperatively from store state; React re-renders do not recreate it. | BR-32 |
| TR-42 | Layer toggle and time change update existing map sources/layers rather than removing and re-adding them where the library allows. | BR-32 |
| TR-43 | Each layer's rendering kind is implemented by a renderer selected from the layer definition. | BR-05, BR-30 |
| TR-44 | (Optional) A 3D object is added as its own map layer, independent of the data layers. | BR-21 |

## 6. Chart integration

| ID | Requirement | Satisfies |
|---|---|---|
| TR-50 | At least one Recharts time-series chart displays the series of one or more layers across all time points. | BR-07 |
| TR-51 | The currently selected time is marked on the chart. | BR-08 |
| TR-52 | (Optional) Clicking/selecting a point on the chart dispatches the shared select-time action. | BR-20 |
| TR-53 | The chart consumes prepared series from the store/selectors; it contains no fetching or business logic. | Assignment: architecture |

## 7. Architecture boundaries

The code must make these responsibilities separable and locatable (Assignment: architecture):

| Concern | Owns |
|---|---|
| UI | Layout, layer panel, timeline control, presentational components |
| State | Vedro store, actions, selectors |
| Data access | Mock API / fetch functions, request cancellation, response validation |
| Map | Map adapter, layer renderers |
| Analytics | Chart components, series preparation |

| ID | Requirement |
|---|---|
| TR-60 | Dependencies point one way: UI → state → data access; map and analytics read state, and data access knows nothing about the UI. |

The folder layout is not fixed by the assignment; it is chosen in layer-panel INT-4 (Feature-Sliced Design).

## 8. Performance and scalability

| ID | Requirement | Satisfies |
|---|---|---|
| TR-70 | Design must scale to 30–100 layers, more charts and more data sources without restructuring: layer definitions are data (TR-20), data is loaded per active layer, not all upfront. | BR-30 |
| TR-71 | Time change does not re-render unrelated components; components subscribe to the slice of state they use. | BR-32 |
| TR-72 | Inactive layers are not fetched and not rendered. | BR-32 |
| TR-73 | Expensive derived data (chart series, feature sets) is memoized/selected once. | BR-32 |
| TR-74 | Payload sizes of mock data are kept reasonable; large datasets are not stored in React state. | BR-32 |
| TR-75 | The README lists the performance concerns actually considered and the scaling approach (BR-41 items 6–7). | BR-41 |

## 9. Open decisions (settle in design stage)

Each is settled in the `## Decisions` section of the first feature's design artifact that needs it, and this table then points to that entry.

| Decision | Options / notes |
|---|---|
| Map library | Mapbox GL JS (needs access token), MapLibre GL JS (open source, no token, WebGL, good for 3D via layers), Google Maps, OpenLayers. Justified in README (BR-12). |
| Vedro API and store shape | Confirm the package's API before designing the store; one store vs. several slices. Settled in the layer-panel plan (layer-panel INT-3). |
| Build tooling | Not specified by the assignment or README (e.g. Vite); needs the user's approval as a new dependency. |
| Test runner | Not specified; needed for TDD in the SDLC. Needs approval as a new dependency. |
| Layer rendering kinds | Which of GeoJSON / raster / polygons / points / heatmap is used for each of the 3 layers. |
| Time granularity | Number and spacing of time points, e.g. hourly 10:00–14:00 as in the assignment's example. |
| Hosting | For BR-22 (e.g. GitHub Pages, Vercel, Netlify). |
| 3D object | Whether to attempt BR-21 and with what. |

## 10. Quality and process

| ID | Requirement |
|---|---|
| TR-80 | Development follows `documents/AI_Native_SDLC.md`: design docs approved one at a time, tests first, review before push. |
| TR-81 | No comments in code; names and structure explain the code. |
| TR-82 | Tests cover the acceptance criteria of each `spec.md`, including race conditions (TR-31, TR-32) and loading/error/empty states. |
| TR-83 | README is kept honest per feature (features checklist, architecture, scripts, stack) and includes the AI-usage section (BR-41). |
| TR-84 | Every artifact records its engineering decisions in a `## Decisions` section, so the README's trade-offs and AI-usage sections can be assembled from them. |


## 11. Out of scope

- A real backend or real data sources; all data is mock (`TR-05`).
- Over-engineering: abstractions and infrastructure the task's scale doesn't need.
