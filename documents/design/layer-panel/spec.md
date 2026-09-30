---
status: draft
revision: 3
---

# Spec — Layer Panel

## Requirements

### API client core (INT-5, previous task 7)

1. One request function in `shared/api` takes a path, an `AbortSignal` and a response validator, and returns the validated body (TR-60: it knows nothing about the store or the UI).
2. A non-2xx response with an `ApiError` body fails with that body's `error.message`. Any other failure (network error, non-JSON or non-`ApiError` error body, a body that fails validation) fails with a fixed user-readable message. The UI never shows a raw error object (TR-30).
3. An aborted request fails as aborted, never as an error the UI shows.
4. Responses are validated against the contract types in `GIS_Timeline_API.md` without a new package (see Q1).

### Layers request and mock (INT-5, previous task 8)

5. `GET /api/layers` returns `LayerDefinition[]` (`id`, `name`, `kind`, `unit`, `timePoints`) through the request function.
6. MSW serves it in dev (browser worker started before the app renders) and in tests (Node server in the test setup; an unhandled request fails the test).
7. The mock returns the three contract layers, each with hourly time points 10:00–14:00 UTC (the contract's first version), after a random 300–1500 ms delay (TR-33). Tests can set the delay.
8. A failure-injection switch makes `GET /api/layers` answer `500` with an `ApiError` body; tests set it directly, dev sets it with a URL query parameter (see Q3).

### Store (INT-3, INT-5)

9. The layer slice holds `layers: readonly LayerDefinition[]`, `activeLayerIds: readonly string[]` and the list request state: `idle`, `loading`, `error` with its message, or `success`.
10. Loading the list sets `loading`, then `success` with the layers or `error` with the message. On success, active ids not in the list are dropped and the initial active layers are set (see Q2).
11. Only the latest list request may write to the store: starting a new one aborts the pending one, and an aborted or superseded response is discarded (TR-31, BR-11).
12. A selector derives the shared timeline range from the loaded layers: the sorted, de-duplicated union of their `timePoints`, with its first and last point; empty when there are no layers (TR-22).
13. Toggling works as in revision 2: an inactive layer becomes active, an active one inactive.

### Panel (INT-2)

14. `LayerPanel` stays presentational: props are the layers, the active ids, the list state, `onToggleLayer(id)` and `onRetry()`.
15. It renders one of four states inside the "Layers" landmark:
    - loading: a text status, the list marked `aria-busy`;
    - error: the message and a "Retry" button that calls `onRetry` once;
    - empty (success with no layers): a text status;
    - success: the switches as in revision 2 (name, unit, `role="switch"`, `aria-checked`, click, Space and Enter call `onToggleLayer` once).
16. The connected part starts the list load when it mounts and aborts it when it unmounts; Retry starts a new load.
17. User-facing copy (heading, status texts, Retry label, the fixed error message) lives in `as const` configs.
18. Code follows Feature-Sliced Design (INT-4); slice placement is settled in the plan.

## Open questions

- **Q1 — Response validation.** Hand-written type guards per contract type, or a schema library (a new package, needs approval under TR-07). Recommended: type guards; the contract has four small types.
- **Q2 — Active layers after load.** None, the first layer, or all layers. Recommended: the first layer, so the map is not empty and 100 layers are not all fetched at once (TR-70, TR-72).
- **Q3 — Failure injection in dev.** A URL query parameter such as `?fail=layers`, or a small dev-only control on the page. Recommended: the query parameter; no UI to hide in production.

## Why a store

- The active layers and the layer list are shared state: the chart (task 4) and the map (task 5) read them (BR-08, TR-72). TR-10/TR-11 put them in the store.
- The list request state lives next to the list, so every widget can tell loading from empty (TR-30).
- Components subscribe only to the part they use (TR-71).

## Data / state model changes

- Types from the contract: `LayerDefinition`, `RenderingKind`, `ApiError` (replaces `LayerSummary`).
- Layer slice: `layers`, `activeLayerIds`, list request state; transitions for load start, success, failure and toggle; timeline-range selector.
- Endpoint: `GET /api/layers` with its MSW handler, latency and failure switch.
- Fixtures move from the store seed to the mock data.

## Edge cases

- Retry pressed while a request is pending: the pending one is aborted; only the new result is shown.
- Responses out of order (a slow first request finishing after a fast retry): the older one is discarded.
- Unmount during a request (React StrictMode mounts twice in dev): the request is aborted; nothing is written.
- `500` with an `ApiError` body: its message is shown. `500` with a non-JSON body, a network failure, or a malformed `200` body: the fixed message is shown.
- Empty list: the empty state, no switches.
- Time points duplicated across layers or out of order: the range is sorted and de-duplicated.
- Active ids unknown to the loaded list: dropped.
- Long layer names: wrap, no horizontal overflow.

## Acceptance criteria

- [ ] The request function returns a validated body; rejects with the `ApiError` message, the fixed message for malformed or non-`ApiError` failures, and as aborted when its signal aborts.
- [ ] In the app with MSW, the panel shows loading, then three switches with names, units and the initial active layer.
- [ ] With failure injection, the panel shows the error message and Retry; after the switch is cleared, Retry shows the switches.
- [ ] An empty list shows the empty state.
- [ ] Retry while pending, and a slow first response arriving after a fast second one, leave the store with the second result only.
- [ ] Unmounting during a request writes nothing.
- [ ] The timeline-range selector returns the sorted, de-duplicated union with first and last points, and an empty range for no layers.
- [ ] Toggling and the switch keyboard behaviour work as in revision 2.
- [ ] `npm run verify` passes.

## Decisions

- Loading, error and empty states, request statuses and retry are out of scope; the component is refactored when the API requests are added. Status: superseded by SPEC-2.

### SPEC-1 — Toggles change the active layers in the Vedro store

- **Status:** active
- **Decision:** The approved spec's "no store" is dropped: the switches change the active layers in the Vedro store in this task.
- **Options considered:** No-op toggle until task 8; `useState` in `App`; Vedro store now.
- **Why:** The user wants working toggles now (INT-3); active layers are shared with the map and chart, and TR-10/TR-11 put them in the store.
- **Trade-off accepted:** The store is designed before the layers request exists; task 8 replaces the fixture seed with loaded data.
- **AI involvement:** Decided by the user; the store need was written up by Claude.

### SPEC-2 — List states, the layers request and MSW are in scope

- **Status:** active
- **Decision:** The spec's out-of-scope entry for loading, error and empty states, request statuses and retry is replaced: they are built in this task with the API client core, the layers request and the MSW mock.
- **Options considered:** Keep them for later tasks (revision 2); build them now.
- **Why:** The user merged previous roadmap tasks 3, 7 and 8 into this task (INT-5).
- **Trade-off accepted:** The spec is larger, and the API core and MSW setup are designed here for all later requests.
- **AI involvement:** Decided by the user; the requirements written up by Claude.
