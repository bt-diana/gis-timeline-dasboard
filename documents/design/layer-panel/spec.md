---
status: approved
revision: 4
---

# Spec — Layer Panel

## Requirements

### API client core (INT-5, previous task 7)

1. One request function in `shared/api` takes a path, an `AbortSignal` and a response validator, and returns the validated body (TR-60: it knows nothing about the store or the UI).
2. A non-2xx response with an `ApiError` body fails with that body's `error.message`. Any other failure (network error, non-JSON or non-`ApiError` error body, a body that fails validation) fails with a fixed user-readable message. The UI never shows a raw error object (TR-30).
3. An aborted request fails as aborted, never as an error the UI shows.
4. Responses are validated against the contract types in `GIS_Timeline_API.md` with hand-written type guards, no new package (SPEC-5).

### Layers request and mock (INT-5, previous task 8)

5. `GET /api/layers` returns `LayerDefinition[]` (`id`, `name`, `kind`, `unit`, `timePoints`) through the request function.
6. MSW serves it in every build — `npm run dev`, `npm run build` with `npm run preview`, and the deployed demo: the browser worker starts before the app renders. There is no real backend, so the mock is the app's API (SPEC-7).
7. The mock returns the three contract layers, each with hourly time points 10:00–14:00 UTC (the contract's first version), after a random 300–1500 ms delay (TR-33).
8. Requests succeed by default. A dev-only QA control on the page switches failure injection on and off; while on, `GET /api/layers` answers `500` with an `ApiError` body. The control is not rendered in the production build (SPEC-4).
9. Tests do not use MSW: they replace the request functions with `vi.mock` and control each response, its timing and its failure directly (SPEC-7).

### Store (INT-3, INT-5)

10. The layer slice holds `layers: readonly LayerDefinition[]`, `activeLayerIds: readonly string[]` and the list request state: `idle`, `loading`, `error` with its message, or `success`.
11. Loading the list sets `loading`, then `success` with the layers or `error` with the message. On success, active ids not in the list are dropped; when no known id is left, all layers become active.
12. Only the latest list request may write to the store: starting a new one aborts the pending one, and an aborted or superseded response is discarded (TR-31, BR-11).
13. A selector derives the shared timeline range from the loaded layers: the sorted, de-duplicated union of their `timePoints`, with its first and last point; empty when there are no layers (TR-22).
14. Toggling works as in revision 2: an inactive layer becomes active, an active one inactive.

### Panel (INT-2)

15. `LayerPanel` stays presentational: props are the layers, the active ids, the list state, `onToggleLayer(id)` and `onRetry()`.
16. It renders one of four states inside the "Layers" landmark:
    - loading: a text status, the list marked `aria-busy`;
    - error: the message and a "Retry" button that calls `onRetry` once;
    - empty (success with no layers): a text status;
    - success: the switches as in revision 2 (name, unit, `role="switch"`, `aria-checked`, click, Space and Enter call `onToggleLayer` once).
17. The connected part starts the list load when it mounts and aborts it when it unmounts; Retry starts a new load.
18. User-facing copy (heading, status texts, Retry label, the fixed error message) lives in `as const` configs.
19. Code follows Feature-Sliced Design (INT-4); slice placement is settled in the plan.

## Why a store

- The active layers and the layer list are shared state: the chart (task 4) and the map (task 5) read them (BR-08, TR-72). TR-10/TR-11 put them in the store.
- The list request state lives next to the list, so every widget can tell loading from empty (TR-30).
- Components subscribe only to the part they use (TR-71).

## Data / state model changes

- Types from the contract: `LayerDefinition`, `RenderingKind`, `ApiError` (replaces `LayerSummary`).
- Layer slice: `layers`, `activeLayerIds`, list request state; transitions for load start, success, failure and toggle; timeline-range selector.
- Endpoint: `GET /api/layers`; its MSW handler, latency and failure switch are in every build (SPEC-7); the QA control is dev-only.
- Fixtures move from the store seed to the dev mock data; tests keep their own data.

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
- [ ] With the request function mocked by `vi.mock`, the app shows loading, then three switches with names, units and all layers active.
- [ ] When the mocked request fails, the panel shows the error message and Retry; when the next attempt succeeds, Retry shows the switches.
- [ ] By hand in `npm run dev`: the list loads through MSW with visible latency; the QA control makes the next load fail and Retry recover after it is switched off.
- [ ] By hand after `npm run build` and `npm run preview`: the list loads through MSW with visible latency; the QA control is not on the page.
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

### SPEC-3 — MSW runs in dev only; tests mock the request functions

- **Status:** superseded by SPEC-7
- **Decision:** MSW serves the API only in `npm run dev`. Tests replace the request functions with `vi.mock` and control responses, timing and failures directly.
- **Options considered:** MSW in dev and tests (the draft); MSW in dev only with `vi.mock` in tests.
- **Why:** The user prefers tests that mock the requests directly; they need no handler setup and control the order of responses exactly.
- **Trade-off accepted:** Tests do not run the real `fetch` path through the handlers; the request function has its own tests with a mocked `fetch`, and the dev mock is checked by hand.
- **AI involvement:** Decided by the user, changing Claude's draft.

### SPEC-4 — Failure injection through a dev-only QA control

- **Status:** active
- **Decision:** In dev all requests succeed by default. A QA control, rendered only in dev, switches failure injection on and off.
- **Options considered:** A URL query parameter (Claude's recommendation); a dev-only control on the page.
- **Why:** The user wants failures available on demand in dev without them being the default.
- **Trade-off accepted:** A small dev-only UI element; it is left out of the production build.
- **AI involvement:** Decided by the user; Claude had recommended the query parameter.

### SPEC-5 — Responses are validated with hand-written type guards

- **Status:** active
- **Decision:** One type guard per contract type; no schema library.
- **Options considered:** Type guards; a schema library (new package, TR-07).
- **Why:** The contract has four small types; no new dependency.
- **Trade-off accepted:** The guards are kept in step with `GIS_Timeline_API.md` by hand.
- **AI involvement:** Proposed by Claude; accepted by the user.

### SPEC-7 — MSW runs in every build; tests mock the request functions

- **Status:** active
- **Decision:** MSW serves the API in dev, in the production build and in the deployed demo. Tests still replace the request functions with `vi.mock`. Only the QA control stays dev-only (SPEC-4).
- **Options considered:** MSW in dev only (SPEC-3); MSW in every build with the QA control dev-only; MSW and the QA control in every build.
- **Why:** There is no real backend (BR-02, BR-10). With MSW in dev only, `npm run build` with `npm run preview` and the Netlify demo had no API and showed only the error state.
- **Trade-off accepted:** The production bundle includes MSW and its worker script, and the first load waits for the worker to register.
- **AI involvement:** Claude had designed MSW as dev-only; the user found the built app not working and decided it must work with the build script as well.
