---
status: approved
---

# Spec — Layer Panel (revision)

## Requirements

1. `LayerPanel` in `src/features/layer/` replaces the `Layer` stub; same `complementary` landmark named "Layers" (dashboard-layout spec 2).
2. The panel is self-contained: it receives no props and owns its default feature data and active-layer state in the layer feature folder.
3. Default fixture data comes from `layerFixtures.ts` and active selection comes from feature-local state via `layerStore.ts`.
4. Rows, in the order of `LAYER_FIXTURES`: name, unit, and a switch (`role="switch"`, `aria-checked` from the active-layer state, accessible name = layer name). Activating it by click, Space or Enter toggles that layer id on and off.
5. User-facing copy (headings) lives in one `as const` config in the feature folder.
6. `App` renders `<LayerPanel />` only; `App` does not own layer state or pass toggle callbacks.

## Data / state model changes

- New type `LayerSummary`; location is in the feature folder.
- A feature-local layer store (`toggleLayerId`) updates the active selection, which is then re-rendered by the component.
- No request, store slice or MSW handlers are introduced in this change; those remain for task 8.

## Edge cases

- Unknown ids are ignored via the feature-local selection helper.
- Long layer names: wrap, row does not overflow the fixed panel width.
- Toggle is idempotent: pressing the same switch again removes it from the active set.

## Acceptance criteria

- [ ] With three layers, three switches render with correct names and default `aria-checked` state.
- [ ] Clicking, Space and Enter on a switch toggles the selected layer on and off.
- [ ] `App` still renders the "Layers" landmark.
- [ ] `npm run verify` passes.

## Decisions

- Component logic is kept in the feature folder, not in `App`.
- The state is intentionally local to the layer feature until the broader app store is introduced in the API/state task.
