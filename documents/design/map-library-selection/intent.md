---
status: draft
---

# Intent — Map Library Selection

## Problem

The assignment lets the author choose the map library and requires the choice to be justified in the README. The map is the costliest dependency to swap once renderers, the timeline update path and tests exist, so the choice is made on written criteria before any map code.

## Requirement source

- BR-12, TR-06, TRD §9 "Map library" (open decision settled here).
- Criteria derive from BR-04, BR-05, BR-30, BR-32, BR-41 item 2, TR-02, TR-40–TR-43, TR-70, TR-72, TR-82 and the assignment's evaluation points (React–map integration, performance, extensibility, no overengineering).
- Gap: the TRD cites BR-20, BR-21 and BR-22, which the BRD does not define. Not blocking.

## Goals

- Fix the criteria before comparing: hard gates, then weighted criteria, each traced to a requirement.
- Score the candidates from documentation and record the result as a decision, which the README's "why this map library" section is built from.
- Choose the package and install it.

## Non-goals

- Any production code.
- Benchmarking GPU and device limits at many visible layers (INT-2).
- Vendor cost and token constraints (INT-3).

## Criteria

### Hard gates (fail = eliminated)

| ID | Gate | Traces to |
|---|---|---|
| G1 | In the allowed set or a defensible "equivalent" | BR-12 |
| G2 | Renders GeoJSON and a heatmap, raster or image layer | BR-05 |
| G3 | TypeScript types usable in strict mode without `any` | TR-02 |
| G4 | Map instance created once and updated imperatively from outside React | TR-41 |

### Weighted criteria (score 1–5 from documentation)

| ID | Criterion | Looked at | Traces to | Weight |
|---|---|---|---|---|
| C1 | Time-switching smoothness | 10 time points swap in place, no layer re-adding, no flash | BR-04, TR-34, TR-42 | 5 |
| C2 | Scaling to 30–100 layers | Cost of adding a layer definition; inactive layers cost nothing | BR-30, TR-70, TR-72, TR-43 | 4 |
| C3 | React integration | Fits behind a `MapView` boundary driven by store state, no re-creation, clean unmount | TR-40, TR-41 | 4 |
| C4 | Testability | Adapter can be faked in Vitest and jsdom without WebGL | TR-82 | 4 |
| C5 | Performance and bundle | Bundle size delta, frame behaviour while scrubbing | BR-32 | 3 |
| C6 | Type quality | Precision of source, layer and event types; casts needed | TR-02 | 3 |

## Approach

1. Score the candidates from documentation (Evidence).
2. Record the decision.
3. Install the chosen package.

## Evidence

Sources: npm registry and the official MapLibre, react-map-gl and OpenLayers docs. Cells marked * are from prior knowledge, not checked.

| | MapLibre GL JS 6.11 | OpenLayers 10.10 | Mapbox GL JS 3.32 | Google Maps |
|---|---|---|---|---|
| License, types | BSD-3, ships types | BSD-2, ships types | Custom license, ships types | not checked |
| Unpacked size | 20.8 MB | 12.3 MB | 67.3 MB | not checked |
| C2 layer as data | Style-spec JSON, in-place `setData` / `updateData` | Class instances, factory needed, built-in `Heatmap` | Same model as MapLibre* | Not checked |
| C3 React | `react-map-gl` or imperative adapter; v6 needs `setWorkerUrl()` in the bundler | No official wrapper*, ref + effect adapter | `react-map-gl`, token* | `@vis.gl/react-google-maps`, runtime script* |
| C4 testing | Needs WebGL, no official test guidance, fake the adapter | Canvas*, fake the adapter | As MapLibre* | Runtime `google` global to mock* |
| Score C2 / C3 / C4 | 5 / 4 / 3 | 3 / 3 / 3 | 5 / 4 / 3 | 2 / 3 / 2 |
| Weighted total (max 60) | **48** | 36 | 48 | 28 |
| Decision | **Chosen** | Rejected: weaker layer-as-data fit, no React wrapper | Rejected: tie with MapLibre, but custom license, token, 3x package size | Rejected: lowest score, layer model not suited to data layers |

C1, C5 and C6 are not scored: nothing in the documentation settles them. They are checked while building the map feature.

## Decisions

### INT-1 — Vendor-free packages only, no real-data map or tile package

- **Status:** superseded by INT-3
- **Decision:** Only vendor-free, open-source map packages; no vendor tile services or real geodata. Layer data is mock (BR-02, BR-10, TR-05). The map needs only a minimal background such as bundled GeoJSON, settled in the map feature's `spec.md`.
- **Options considered:** Vendor tile services (Mapbox, Google); free third-party tiles (OpenFreeMap, Protomaps, OSM raster); bundled GeoJSON background.
- **Why:** The assignment allows mock data and does not require real tiles. This satisfies G2, keeps the hosted demo working with no setup and keeps tests deterministic.
- **Trade-off accepted:** A plainer background; the evaluation is on architecture, not visuals.
- **AI involvement:** Decided by the user in chat.

### INT-2 — GPU and device limits at large layer counts are a future consideration

- **Status:** active
- **Decision:** GPU and device limits with many visible layers (WebGL availability, texture memory, fill rate) are not a selection criterion or spike measurement.
- **Options considered:** Benchmark 10, 50 and 100 synthetic layers on throttled hardware; add a WebGL-availability gate.
- **Why:** The assignment requires 3 layers and asks only that the architecture stay understandable at 30–100 and that the README explains scaling. It warns against overengineering. TR-70 and TR-72 already cover the design side.
- **Trade-off accepted:** No measured evidence for low-end devices at high layer counts; the README lists it as a known future risk.
- **AI involvement:** Raised as a question by the user; scope proposed by AI and accepted by the user.

### INT-3 — Vendor cost and token requirements are not a gate; free tiers are acceptable

- **Status:** active
- **Decision:** Needing a token or a paid account is not an elimination gate. Mapbox GL JS and Google Maps stay candidates on their free tier. Cost and token exposure is recorded as a consideration for future product development. Layer data stays mock.
- **Options considered:** Keep the no-token gate (vendor-free only); treat cost as a scored criterion.
- **Why:** The demo is not going to be used in practice, so free-tier limits do not matter here.
- **Trade-off accepted:** A token-bound library may win and ship a key in the client bundle; acceptable for a demo, a risk for a real product.
- **AI involvement:** Decided by the user in chat. Supersedes INT-1's vendor-free rule.

### INT-4 — Use MapLibre GL JS

- **Status:** active
- **Decision:** MapLibre GL JS is the map library, installed as `maplibre-gl`. Weights: C1–C4 highest, C5–C6 lower; only C2–C4 are scored (see Evidence).
- **Options considered:** OpenLayers, Mapbox GL JS, Google Maps.
- **Why:** Highest score on C2–C4, tied with Mapbox. The tie goes to MapLibre because it has the same style-spec model with an open license, no token and about a third of the package size. Layers as JSON fit TR-20.
- **Trade-off accepted:** No spike, so C1 (smooth time switching), C5 and C6 are unverified. The v6 bundler worker setup is a known integration cost. The TR-40 adapter keeps a swap cheap if the build shows a problem.
- **AI involvement:** Decided by Claude on the user's instruction to decide; scores and weights proposed by Claude.