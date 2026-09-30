---
status: approved
revision: 2
---

# Spec — Layer Panel

## Requirements

1. `LayerPanel` replaces the `Layer` stub; same `complementary` landmark named "Layers" (dashboard-layout spec 2).
2. `LayerPanel` stays presentational: props only, no internal state, no store import, no requests (TR-60):
   - `layers`: `LayerSummary[]` (`id`, `name`, `kind`, `unit` of `LayerDefinition`).
   - `activeLayerIds`: `readonly string[]` (PLAN-1).
   - `onToggleLayer(id)`.
3. Rows, in the order of `layers`: name, unit, and a switch (`role="switch"`, `aria-checked` from `activeLayerIds`, accessible name = layer name). Activating it by click, Space or Enter calls `onToggleLayer(id)` once.
4. User-facing copy (headings) lives in one `as const` config in the layer slice.
5. A connected layer-panel part reads `layers` and `activeLayerIds` from the Vedro store and passes a toggle action as `onToggleLayer` (INT-3); `App` renders it inside the store provider.
6. Toggling an inactive layer makes it active; toggling an active one makes it inactive. The switch's `aria-checked` in the page follows the store.
7. Code follows Feature-Sliced Design (INT-4); slice placement is settled in the plan.

## Why a store

- The active layers are shared state: the map (task 9) renders only active layers and the chart (task 10) draws a line per active layer (BR-08, TR-72). Keeping them in the panel would give each consumer its own copy, which TR-11 forbids.
- BR-09 and TR-10 name the Vedro store as the single source of truth for active layers; working toggles therefore need the store, not `useState` in `App`.
- Components subscribe only to the part they use, so a toggle re-renders the panel and later the map and chart, not the header (TR-71).

## Data / state model changes

- Store fields: `layers: readonly LayerSummary[]`, seeded from the three fixture layers until task 8 loads them; `activeLayerIds: readonly string[]`, initially `['wind']` as today.
- Action: toggle a layer id in `activeLayerIds`.
- Type `LayerSummary` in the layer slice (location settled in plan).
- No endpoints or MSW handlers.

## Edge cases

- `activeLayerIds` containing unknown ids: ignored by the panel.
- Toggling the same layer twice in a row returns it to its first state.
- All layers switched off: every switch shows `aria-checked="false"`; no empty-state message (task 8).
- Long layer names: wrap, row does not overflow the fixed panel width.

## Acceptance criteria

- [ ] With three layers, three switches render with correct names and `aria-checked`.
- [ ] Clicking, Space and Enter on a switch each call `onToggleLayer` with that id once.
- [ ] In `App`, clicking an inactive switch turns it on and clicking it again turns it off; other switches are unchanged.
- [ ] The store's toggle action adds a missing id and removes a present one.
- [ ] `App` still renders the "Layers" landmark.
- [ ] `npm run verify` passes.

## Decisions

- Loading, error and empty states, request statuses and retry are out of scope; the component is refactored when the API requests are added.

### SPEC-1 — Toggles change the active layers in the Vedro store

- **Status:** active
- **Decision:** The approved spec's "no store" is dropped: the switches change the active layers in the Vedro store in this task.
- **Options considered:** No-op toggle until task 8; `useState` in `App`; Vedro store now.
- **Why:** The user wants working toggles now (INT-3); active layers are shared with the map and chart, and TR-10/TR-11 put them in the store.
- **Trade-off accepted:** The store is designed before the layers request exists; task 8 replaces the fixture seed with loaded data.
- **AI involvement:** Decided by the user; the store need was written up by Claude.
