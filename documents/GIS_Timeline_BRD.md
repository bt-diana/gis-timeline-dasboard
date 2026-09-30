---
status: approved
---

# Business Requirements — GIS Timeline Dashboard

Source: the test assignment (`.claude/Тестовое задание.pdf`), plus the author's own requirements (§3.2, IDs `AR-xxx`). Requirement IDs (`BR-xxx` from the assignment, `AR-xxx` from the author) are referenced from `documents/design/<feature>/intent.md` and `spec.md`.

## 1. Purpose

Deliver a small React + TypeScript application with an interactive map, several user-toggleable data layers, a timeline and a chart. The goal is **not** UI design; it is to show how the author designs architecture, handles state, cartography, time-based data and its visualization.

The central business value: map, timeline and chart are **independent parts of the UI that are driven by one data flow**, so they always show the same state.

## 2. Audience and evaluation

The result is reviewed by an engineering team. They evaluate engineering quality, not code volume or visual complexity:

- Architecture
- TypeScript quality
- Use of Vedro
- State management
- React–map integration
- Use of Recharts
- GIS layer modeling
- Time-data modeling
- Map, timeline and chart synchronization
- Async handling
- Race conditions
- Performance
- Separation of responsibilities
- Extensibility
- Readability
- The author's ability to explain their decisions

A minimal UI is acceptable.

## 3. Scope

### 3.1 In scope

| ID | Requirement |
|---|---|
| BR-01 | The page shows an interactive map. |
| BR-02 | The map has at least 3 user layers (e.g. temperature, wind, insolation) backed by mock data. No real backend is required. |
| BR-03 | Each layer can be switched on and off by the user. |
| BR-04 | Each layer has data over a time range with at least several time points, and the user can switch between time points smoothly. |
| BR-05 | Each layer's data is displayed directly on the map. The rendering approach (GeoJSON, raster, polygons, points, heatmap, …) is the author's choice. |
| BR-06 | A timeline lets the user pick a time point; changing it changes the data shown on the map. |
| BR-07 | At least one Recharts chart shows a time series for one or more layers. |
| BR-08 | Chart, timeline and map are linked: changing the selected time point is reflected on the map, the timeline and the chart. |
| BR-09 | Application state (active layers, selected time point, loading state, and the data needed to keep map, timeline and chart in sync) is managed with Vedro. |
| BR-10 | Data loads through a mock API or a simulated asynchronous request. |
| BR-11 | Rapid switching of the timeline or layers, while an earlier request is still pending, behaves correctly (no stale data shown). |
| BR-12 | The chosen map library is one of Mapbox GL JS, MapLibre GL JS, Google Maps, OpenLayers, or an equivalent, and the choice is justified in the README. |

### 3.2 Author requirements (Diana Butiakova)

Requirements added by the author. They are not part of the assignment.

| ID | Requirement |
|---|---|
| AR-01 | Every request handles all three outcomes: loading, error and success. The user sees a loading indicator while a request is pending, a clear error message if it fails, and the data only when it succeeds. |

### 3.3 Out of scope

- Visual/interaction design polish.

## 4. Non-functional business requirements

| ID | Requirement |
|---|---|
| BR-30 | The solution stays understandable if 3 layers grow to 30–100, and if the number of charts and data sources increases. |
| BR-32 | Potential performance problems are identified and accounted for. |

## 5. Deliverables

| ID | Deliverable |
|---|---|
| BR-40 | A GitHub/GitLab repository link. |
| BR-41 | A README describing the solution (see §6). |

## 6. README content (BR-41)

Short, not large documentation. It must explain:

1. How the application architecture is organized.
2. Why this map library was chosen.
3. How state is organized in Vedro.
4. How the timeline, data, map and Recharts are connected.
5. Where the boundaries lie between UI, state, data access, map and analytics.
6. Which potential performance problems were considered.
7. How the solution would scale from 3 to 100+ GIS layers.
8. Which trade-offs were deliberately made.

If AI tools were used, the README also states: which tools, for which tasks, what decisions the AI proposed, and which decisions were changed or rejected and why.

## 7. Success criteria

- Every mandatory requirement (BR-01 … BR-12) works in a running app.
- Changing the selected time visibly and consistently updates map, timeline and chart.
- Rapid timeline/layer switching never leaves the UI showing data for a time point or layer that is no longer selected.
- The README answers all eight questions and can be read in a few minutes.
- A reviewer can locate the responsibility boundaries in the code without guessing.
