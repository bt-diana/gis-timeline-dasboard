---
status: approved
---

# Spec — Layer Panel

## Requirements

1. `LayerPanel` in `src/features/layer/` replaces the `Layer` stub; same `complementary` landmark named "Layers" (dashboard-layout spec 2).
2. Props only, no internal state, no store, no requests (intent Goals, TR-60):
   - `layers`: `LayerSummary[]` (`id`, `name`, `kind`, `unit` of `LayerDefinition`).
   - `activeLayerIds`: `ReadonlySet<string>` or array (settled in plan).
   - `onToggleLayer(id)`.
3. Rows, in the order of `layers`: name, unit, and a switch (`role="switch"`, `aria-checked` from `activeLayerIds`, accessible name = layer name). Activating it by click, Space or Enter calls `onToggleLayer(id)` once.
4. User-facing copy (headings) lives in one `as const` config in the feature folder.
5. `App` renders `LayerPanel` with fixed props so the page still renders; real wirrememing is task 8.

## Data / state model changes

- New type `LayerSummary`; location (`src/shared/` vs feature folder) settled in plan.
- No store, endpoints or MSW handlers.

## Edge cases

- `activeLayerIds` containing unknown ids: ignored.
- Long layer names: wrap, row does not overflow the fixed panel width.

## Acceptance criteria

- [ ] With three layers, three switches render with correct names and `aria-checked`.
- [ ] Clicking, Space and Enter on a switch each call `onToggleLayer` with that id once.
- [ ] `App` still renders the "Layers" landmark.
- [ ] `npm run verify` passes.

## Decisions

- Loading, error and empty states, request statuses and retry are out of scope; the component is refactored when the API requests are added.
