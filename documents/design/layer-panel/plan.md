---
status: approved
---

# Plan — Layer Panel (revision)

## File map

| File | Change |
|---|---|
| `src/features/layer/types.ts` | new: `RenderingKind` and `LayerSummary` (`id`, `name`, `kind`, `unit`) |
| `src/features/layer/layerFixtures.ts` | new: `LAYER_FIXTURES` and `ACTIVE_LAYER_FIXTURE_IDS` for default feature-local data |
| `src/features/layer/layerStore.ts` | new: `toggleLayerId` helper for feature-local active-layer state |
| `src/features/layer/LayerPanel.tsx` | new: replaces `Layer.tsx`; self-contained toggle logic using `useState` and the layer store |
| `src/features/layer/LayerPanel.css` | new: row layout, name wrapping inside the fixed panel width |
| `src/features/layer/layerPanelConfig.ts` | new: `LAYER_PANEL_CONFIG` `as const` (heading copy, heading id) |
| `src/features/layer/LayerPanel.test.tsx` | new: verifies default render and toggle interactions |
| `src/features/layer/Layer.tsx`, `src/features/layer/Layer.test.tsx` | deleted |
| `src/app/App.tsx` | modified: renders only `<LayerPanel />` |
| `src/app/App.test.tsx` | modified: Layers landmark still present, rendered by the panel |
| `src/app/App.css` | modified: `.shell-layer` loses the placeholder look |
| `.claude/hooks/design-gate.js` | updated: `layer` maps to `layer-panel` |
| `.claude/hooks/design-folders.js` | new: the feature-to-design-folder map shared by both gates |
| `.claude/hooks/approval-gate.js` | updated: resolves the design folder through `design-folders.js` when checking `plan.md` before tests |

## Design

- Types live in the feature folder and are used by the feature-local fixtures.
- The component has no props and does not receive callbacks from `App`.
- `LayerPanel` owns a local active-layer state via `useState`, backed by `toggleLayerId` in `layerStore.ts`.
- Each switch is a native `<button type="button" role="switch" aria-checked>` whose text is the layer name; click, Space and Enter all trigger the same toggle helper.
- Row: `<li>` with the switch (name only, so the accessible name is exactly the layer name) and the unit as a sibling in a muted style.
- Long names: `overflow-wrap: anywhere` and `min-width: 0` on the name.

## Build sequence

1. Change the `layer` entry in `design-gate.js` to `layer-panel`.
2. Write the tests below; confirm they fail because the toggle interaction is missing.
3. Add `types.ts`, `layerPanelConfig.ts`, `layerFixtures.ts` and `layerStore.ts`.
4. Implement `LayerPanel` and its CSS with feature-local state and no props.
5. Delete the placeholder `Layer.tsx` and `Layer.test.tsx` files.
6. Render only `<LayerPanel />` from `App`; drop the placeholder class from the panel.
7. Run `npm run dev`; check a long name wraps and the toggles change state without overflowing the panel.
8. Run `npm run verify`; present the result and wait for the user's acceptance of the implementation.
9. After acceptance, run the review (`reviewer` agent) and walk the user through its findings.

## Test plan

- [ ] `LayerPanel`: renders alone as `complementary` named "Layers".
- [ ] `LayerPanel`: three layers give three switches named by layer, in fixture order, each showing its unit.
- [ ] `LayerPanel`: default fixture selection checks the expected switch.
- [ ] `LayerPanel`: clicking a switch toggles that layer on/off and updates `aria-checked`.
- [ ] `LayerPanel`: Space and Enter toggle the focused switch.
- [ ] `App`: the "Layers" landmark still renders, with the default fixture switches.
- [ ] By hand: long name wraps, no horizontal overflow of the panel.
- [ ] `npm run verify` passes.

## Decisions

- PLAN-1: the component owns its local active-layer state in the feature folder.
- PLAN-2: `App` does not receive or pass layer props.
- PLAN-3: `toggleLayerId` is the single source of truth for toggling logic in the layer feature.
- PLAN-4: the actual app-wide store comes later in the API/state work, after the UI interaction is proven.
