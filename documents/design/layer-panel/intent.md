---
status: approved
revision: 3
---

# Intent — Layer Panel

## Problem

The layer region is a stub. Users cannot see which layers exist, switch them on and off, or tell that the layer list failed to load. The layer list is not loaded from the mock API yet.

## Requirement source

- BR-02, BR-03, BR-04, BR-09, BR-10, BR-11, AR-01 (roadmap task 3; previous roadmap tasks 3, 7 and 8, INT-5).
- Supporting: TR-05 (MSW), TR-10/TR-11 (Vedro store as the source of truth), TR-20/TR-21 (layers described by data), TR-22 (timeline range derived from the layers), TR-30 (loading/error/success rendered), TR-31 (superseded requests discarded), TR-33 (latency), TR-60 (dependencies point one way), TR-71 (panel re-renders only on its own state), TR-82 (tests for states and races).
- Contract: `GIS_Timeline_API.md` (`GET /api/layers`, `ApiError`, latency, failure injection).
- Layout: dashboard-layout INT-0 (panel content), INT-4 (per-layer error with retry in the panel).

## Goals

- The layer list is loaded from `GET /api/layers`, served by MSW in every build (spec SPEC-7; tests mock the requests), with the contract's latency and error codes (INT-5).
- A shared API client core: one request function with `AbortSignal`, response validation against the contract types, `ApiError` turned into a user-readable message (INT-5).
- The layer slice in the Vedro store holds the definitions, the active layer ids and the list request status (INT-3, INT-5); a selector derives the shared timeline range from the layers' time points (TR-22).
- The panel renders list loading, error with retry, empty and success (INT-2); a retry supersedes a pending request.
- One on/off switch per layer that changes the active layers in the store (INT-3); keyboard-operable, accessible name per layer.
- A test-only failure-injection switch in the mock, so the error states are tested and demoable.
- Code follows Feature-Sliced Design (INT-4).

## Non-goals

- Per-layer loading and error with retry (INT-1): they are the status of each layer's snapshot request, which exists only with the map (roadmap task 5). The layers request is one request for the whole list, so it has list-level states only (INT-2).
- Series and snapshot endpoints, time selection (roadmap tasks 4 and 5).
- Layer values ("latest average" from dashboard-layout INT-0): needs snapshot data (task 5).
- Map rendering and the loading indicator above the map (dashboard-layout INT-4, task 5).

## Decisions

### INT-1 — Per-layer loading is a quiet row state

- **Status:** active
- **Decision:** A loading layer's row is dimmed and marked `aria-busy`; no per-layer spinner.
- **Options considered:** Quiet row state; per-layer spinner; no per-layer loading display.
- **Why:** Meets the roadmap's per-layer loading display without contradicting dashboard-layout INT-4 (the only spinner is above the map).
- **Trade-off accepted:** Loading is visually subtle in the panel; the map indicator stays the primary signal.
- **AI involvement:** Proposed by Claude; accepted by the user.

### INT-2 — The panel renders whole-list loading and error now

- **Status:** active
- **Decision:** The panel takes a list-level status prop and renders loading, error with retry, and empty for the layer list itself.
- **Options considered:** Handle list states in this task; defer them to task 8.
- **Why:** Keeps all layer-panel states in one presentational component, so task 8 only wires the store.
- **Trade-off accepted:** List states are built before a real request exists; task 8 must map its store state onto this prop.
- **AI involvement:** Question raised by Claude; decided by the user.

### INT-3 — The switches toggle layers now, through a Vedro store

- **Status:** active
- **Decision:** Toggling a switch changes the active layers in this task. Active layer ids live in a Vedro store, so Vedro is configured here instead of in task 8.
- **Options considered:** No-op `onToggleLayer` with fixture props until task 8 (the approved plan); working toggles through a store now.
- **Why:** The user wants the buttons to work right away.
- **Trade-off accepted:** Part of task 8 (Vedro setup, active-layers state) moves into this task; the Vedro API must be confirmed now (roadmap open point). The non-goal "Store, Vedro slice" narrows to the layers request, its MSW mock and request statuses.
- **AI involvement:** Decided by the user.

### INT-4 — The code follows Feature-Sliced Design

- **Status:** active
- **Decision:** `src/` is organised by Feature-Sliced Design layers and slices.
- **Options considered:** Keep `src/features/<feature>/` with `src/shared/` (TR-61, dashboard-layout PLAN-3); Feature-Sliced Design.
- **Why:** Adding the store raised the question of where feature-related state belongs; FSD gives each slice a fixed place for its model (store), UI and types.
- **Trade-off accepted:** Diverges from TR-61 and dashboard-layout PLAN-1/PLAN-3: the TRD, the ESLint import rules, and `design-gate.js`/`design-folders.js` (which match `src/features/<feature>/`) must be updated; existing stubs move.
- **AI involvement:** Decided by the user.

### INT-5 — The layers request and MSW are built in this task

- **Status:** active
- **Decision:** Tasks 3 (layer panel UI), 7 (API client core) and 8 (layers request) of the previous roadmap are implemented together in this task: the layer list comes from `GET /api/layers` through a shared API client core, mocked with MSW, and the shared timeline range is derived from the loaded layers. Replaces the non-goal "requests, MSW mock (task 8)" of revision 2; INT-2 (list-level states) is built now.
- **Options considered:** Fixtures now and requests in later tasks 7 and 8 (revision 2); tasks 3, 7 and 8 in this task.
- **Why:** The user wants each feature fully implemented, not a UI now and its data later (INT-7).
- **Trade-off accepted:** This task also builds the API client core and the MSW setup that later tasks reuse, so it is larger.
- **AI involvement:** Decided by the user.

### INT-7 — The roadmap is split by widget, each fully implemented

- **Status:** active
- **Decision:** One roadmap task per widget (layer panel, chart, map), each with its UI, requests, MSW mocks, store slices, states, race handling, performance and tests. The separate API core, request, failure-injection, race-hardening and performance tasks are folded into them.
- **Options considered:** UI tasks first, then one task per request (the previous roadmap); one task per widget, fully implemented.
- **Why:** Each task then ends with a feature that works end to end.
- **Trade-off accepted:** Tasks are larger, and the first one also builds the shared API and MSW setup.
- **AI involvement:** Decided by the user; the task split proposed by Claude.
