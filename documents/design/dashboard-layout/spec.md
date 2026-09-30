---
status: approved
---

# Spec — Dashboard Layout

## Requirements

1. `App` renders the app shell with four regions: header, layer region, map area, chart area.
2. Regions are landmarks with accessible names:
   - header: `banner`, containing the heading "GIS Timeline Dashboard".
   - layer region: `complementary`, named "Layers".
   - map area: `main`, named "Map".
   - chart area: `region`, named "Chart".
3. Each region is rendered by one stub component from its own folder: `src/features/header/`, `src/features/layer/`, `src/features/map/`, `src/features/chart/`. `App` only composes them.
4. Each stub renders its region name as a visible placeholder label and nothing else: no data, no controls, no state.
5. Arrangement (INT-1): header across the top; layer region on the left; map area to the right of the panel; chart area below the map area, spanning the map area's width.
6. Sizing: the shell fills the viewport and the page itself does not scroll. The layer region has a fixed width, the chart area a fixed height, and the map area takes the remaining space (INT-5: the map fits its container without cropping; applies when the map lands).
7. Stubs take no props and import nothing from other features. `src/features/*` folders do not import each other; only `App` imports them (TR-60).
8. `documents/GIS_Timeline_API.md` is unchanged by this task.

## Data / state model changes

None. No store, selectors, actions, mock API handlers or network requests are added. Loading, error and retry UI (INT-4) are not rendered by the stubs; their placement is fixed only by requirement 5's regions: the loading indicator belongs to the map area, per-layer errors to the layer region.

## Edge cases

- Narrow or short viewport: regions keep their arrangement; the map area shrinks first, panel width and chart height stay fixed. No mobile or responsive layout in this task (SPEC-1).
- Empty regions: a stub with nothing to show still renders its placeholder label.
- Races, loading and error states: not applicable, no data is requested.

## Acceptance criteria

- [ ] Rendering `App` shows the `banner` with the heading "GIS Timeline Dashboard".
- [ ] Rendering `App` shows a `complementary` landmark named "Layers", a `main` landmark named "Map" and a `region` named "Chart", each with its placeholder label.
- [ ] Each of the four stub components renders on its own, without `App` and without providers.
- [ ] In DOM order: header, layer region, map area, chart area.
- [ ] The chart area is a descendant of the same column as the map area, not of the layer region.
- [ ] No module under `src/features/<feature>/` imports from another `src/features/<other>/`.
- [ ] `npm run build`, `npm run lint` and `npm test` pass.

## Decisions

### SPEC-1 — Mobile and responsive layout are out of scope

- **Status:** active
- **Decision:** The layout targets a desktop viewport only. No mobile layout, breakpoints or other responsive behaviour.
- **Options considered:** Mobile layout; responsive breakpoints; desktop only.
- **Why:** Not required by any BR or TR; the user ruled both out.
- **Trade-off accepted:** On narrow viewports the fixed-width layer region and fixed-height chart area squeeze the map area.
- **AI involvement:** Raised as a question by Claude; decided by the user.
