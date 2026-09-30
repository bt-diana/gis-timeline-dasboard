---
status: approved
revision: 2
---

# Intent — Layer Panel

## Problem

The layer region is a stub. Users cannot see which layers exist, switch them on and off, or tell that a layer failed to load.

## Requirement source

- BR-03, AR-01 (roadmap task 3).
- Supporting: TR-20 (layers described by data), TR-30 (per-request loading/error/success rendered), TR-71 (panel re-renders only on its own props).
- Layout: dashboard-layout INT-0 (panel content), INT-4 (loading indicator above the map; per-layer error with retry in the panel).

## Goals

- Replace the `Layer` stub with a presentational panel driven only by props: layer definitions (`id`, `name`, `kind`, `unit` per `GIS_Timeline_API.md`), active layer ids, per-layer request status.
- One on/off switch per layer; toggling calls a callback prop, the panel holds no state of its own.
- Per-layer status display: error message with a retry callback; loading as a quiet row state, no spinner (INT-1).
- Whole-list loading, error with retry, and empty list rendered from a list-level status prop (INT-2).
- Accessible: switches are keyboard-operable with an accessible name per layer.

## Non-goals

- Store, Vedro slice, MSW mock, requests (task 8).
- Layer values ("latest average" from INT-0): needs snapshot data (task 9).
- Map rendering and the loading indicator above the map (INT-4, task 5/9).
- Wiring into `App` beyond rendering the panel with fixture props.

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
