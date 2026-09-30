---
status: approved
---

# Plan — Layer Panel

## File map

| File | Change |
|---|---|
| `src/features/layer/types.ts` | new: `RenderingKind` and `LayerSummary` (`id`, `name`, `kind`, `unit`) |
| `src/features/layer/LayerPanel.tsx` | new: replaces `Layer.tsx`; `LayerPanelProps` = `layers`, `activeLayerIds`, `onToggleLayer` |
| `src/features/layer/LayerPanel.css` | new: row layout, name wrapping inside the fixed panel width |
| `src/features/layer/layerPanelConfig.ts` | new: `LAYER_PANEL_CONFIG` `as const` (heading copy, heading id) |
| `src/features/layer/LayerPanel.test.tsx` | new: replaces `Layer.test.tsx` |
| `src/features/layer/Layer.tsx`, `Layer.test.tsx` | deleted |
| `src/app/layerFixtures.ts` | new: `LAYER_FIXTURES` `as const` (the three mock layers from `GIS_Timeline_API.md`) and `ACTIVE_LAYER_FIXTURE_IDS` |
| `src/app/App.tsx` | modified: renders `LayerPanel` with the fixtures and a no-op `onToggleLayer` (spec 5) |
| `src/app/App.test.tsx` | modified: Layers landmark still present, now showing the fixture switches |
| `src/app/App.css` | modified: `.shell-layer` loses the placeholder look |
| `.claude/hooks/design-gate.js` | modified: `layer` maps to `layer-panel` instead of `dashboard-layout` |
| `.claude/hooks/design-folders.js` | new: the feature-to-design-folder map shared by both gates |
| `.claude/hooks/approval-gate.js` | modified: resolves the design folder through `design-folders.js` when checking `plan.md` before tests |

## Design

- Types live in the feature folder; the contract types arrive with task 8.
- `activeLayerIds: readonly string[]`; membership via `includes`, so unknown ids are ignored by construction.
- Each switch is a native `<button type="button" role="switch" aria-checked>` whose text is the layer name; the browser turns Space and Enter into one click, so no key handlers.
- Row: `<li>` with the switch (name only, so the accessible name is exactly the layer name) and the unit as a sibling in a muted style.
- No `useState`, no store import; `aria-checked` comes only from props.
- Long names: `overflow-wrap: anywhere` and `min-width: 0` on the name.

## Build sequence

1. Change the `layer` entry in `design-gate.js` to `layer-panel`.
2. Write the tests below; confirm they fail because `LayerPanel` does not exist.
3. Add `src/features/layer/types.ts` and `layerPanelConfig.ts`.
4. Implement `LayerPanel` and its CSS; delete `Layer.tsx` and `Layer.test.tsx`.
5. Add `layerFixtures.ts`; render `LayerPanel` in `App`; drop the placeholder class from the panel.
6. Run `npm run dev`; check a long name wraps without overflowing the panel.
7. Run `npm run verify`; present the result and wait for the user's acceptance of the implementation.
8. After the acceptance, run the review (`reviewer` agent) and walk the user through its findings.

## Test plan

- [ ] `LayerPanel`: renders alone as `complementary` named "Layers".
- [ ] `LayerPanel`: three layers give three switches named by layer, in `layers` order, each showing its unit (AC 1, spec 3).
- [ ] `LayerPanel`: `aria-checked` is `true` exactly for ids in `activeLayerIds` (AC 1).
- [ ] `LayerPanel`: an unknown id in `activeLayerIds` adds no row and checks nothing.
- [ ] `LayerPanel`: click, Space and Enter on a switch each call `onToggleLayer` once with that id (AC 2).
- [ ] `LayerPanel`: after a click, `aria-checked` is unchanged until props change (no internal state).
- [ ] `App`: the "Layers" landmark still renders, with the fixture switches (AC 3).
- [ ] By hand: long name wraps, no horizontal overflow of the panel.
- [ ] `npm run verify` passes (AC 4), then the review via the `reviewer` agent after acceptance.

## Decisions

- PLAN-1: `activeLayerIds` is `readonly string[]`.
- PLAN-2: `LayerSummary` lives in `src/features/layer/`.
- PLAN-3: the `design-gate.js` mapping change is made in this feature, as its own commit.
- PLAN-4: `approval-gate.js` gets the same mapping through a map shared with `design-gate.js`, as its own commit before the tests.
