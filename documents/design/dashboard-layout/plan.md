---
status: approved
revision: 2
---

# Plan — Dashboard Layout

## File map

| File | Change |
|---|---|
| `src/App.tsx` | modified: composes the four regions in the shell |
| `src/App.css` | new: shell grid, fixed panel width and chart height, placeholder look |
| `src/main.tsx` | unchanged |
| `eslint.config.js` | modified: `no-restricted-imports` rules for feature and layer boundaries (see Architecture) |
| `.claude/hooks/design-gate.js` | modified: maps the four stub folders to `documents/design/dashboard-layout/` (PLAN-3) |
| `src/features/header/Header.tsx` | new: `banner` with the heading |
| `src/features/layer/Layer.tsx` | new: `complementary` "Layers" stub |
| `src/features/map/Map.tsx` | new: `main` "Map" stub |
| `src/features/chart/Chart.tsx` | new: `region` "Chart" stub |
| `src/features/*/*.test.tsx` | new: one render test per stub |
| `src/App.test.tsx` | new: landmarks, DOM order and column structure |

Shell markup:

```
div.shell
  Header
  Layer
  div.workspace
    Map
    Chart
```

## Architecture

Target structure, following TRD §7. Only the four feature stubs are built in this task; the rest marks where later features go.

```
src/
  features/
    header/  layer/  map/  chart/   built now (stubs)
  shared/
    model/    planned: LayerDefinition, LayerSnapshot, RenderingKind (types from the API contract)
    api/      planned: fetch functions, AbortSignal, response validation
    store/    planned: Vedro store, actions, selectors
  mocks/      planned: MSW handlers and layer data
```

- `features/layer/`: layer list and toggles only, reading the store.
- `features/map/`: map adapter and one renderer per `RenderingKind`, chosen by `definition.kind` (TR-43).
- `features/chart/`: chart and series preparation.
- `shared/` holds what several features need, because features do not import each other. Dependencies point one way: features → `shared/store` → `shared/api` (TR-60).
- A layer is data, not a folder (PLAN-2).

Import rules in `eslint.config.js`, using `no-restricted-imports`:

| Files in | May not import from |
|---|---|
| `src/features/<feature>/` | any other `src/features/<feature>/` |
| `src/shared/` | `src/features/` |
| `src/shared/api/` | `src/shared/store/` |

## Build sequence

1. Extend `design-gate.js` so commits touching the four stub folders check `documents/design/dashboard-layout/` (PLAN-3).
2. Write the tests below; confirm they fail because the components do not exist.
3. Add the four stubs, each rendering its landmark and placeholder label.
4. Compose them in `App.tsx`; add `App.css` for the grid (panel width, chart height, map takes the rest, no page scroll).
5. Add the import rules from the Architecture table to `eslint.config.js`.
6. Run `npm run dev` and check the arrangement and sizing by eye.
7. Run `npm run verify` (typecheck, lint, test) and `npm run build`; present the result and wait for the user's acceptance of the implementation.
8. After the acceptance, run the review (`reviewer` agent) and walk the user through its findings.

## Test plan

Every acceptance criterion in `spec.md` maps to a test. jsdom does not apply layout, so sizing is checked by hand.

- [ ] `App.test.tsx`: `banner` contains the heading "GIS Timeline Dashboard".
- [ ] `App.test.tsx`: `complementary` named "Layers", `main` named "Map" and `region` named "Chart" are present, each showing its placeholder label.
- [ ] `App.test.tsx`: landmarks appear in DOM order header, layer, map, chart.
- [ ] `App.test.tsx`: the Map and Chart landmarks share a parent, and that parent does not contain the Layers landmark.
- [ ] One test per stub (`Header`, `Layer`, `Map`, `Chart`): renders alone, with no providers, exposing its landmark.
- [ ] Lint (`eslint.config.js`): each rule in the Architecture table rejects its import. Checked once by adding a temporary violation for each, seeing `npm run lint` fail, and removing it.
- [ ] Design gate: a commit staging a file under `src/features/header/` is allowed with the approved `dashboard-layout` docs tracked, and blocked when they are not.
- [ ] By hand (spec requirements 5 and 6): header on top, layer left, chart below map at the map's width, no page scroll, chart height and panel width fixed.
- [ ] `npm run verify` and `npm run build` pass.

## Decisions

### PLAN-1 — Feature import boundaries are enforced by ESLint

- **Status:** superseded by layer-panel INT-4 (ESLint now enforces FSD layer and slice boundaries)
- **Decision:** Rules against imports between `src/features/<feature>/` folders are defined in `eslint.config.js` with `no-restricted-imports`. There is no test that scans source files.
- **Options considered:** A test reading source files and checking their imports; an ESLint rule.
- **Why:** The user wants import rules defined in lint, where they fail in the editor and in `npm run lint` and cover features added later.
- **Trade-off accepted:** The rule is checked once by hand against a temporary violation, not by a permanent automated test.
- **AI involvement:** Test proposed by Claude; rejected by the user in favour of ESLint.

### PLAN-2 — A layer is data, not a folder

- **Status:** active
- **Decision:** Adding a layer adds a definition plus its mock data in `mocks/`, with no new folder and no code (TR-21). Layer definitions are loaded from `GET /api/layers` into the store. Nothing of this is built in this task; the four stubs do not depend on it.
- **Options considered:** One feature folder per layer; layer definitions hard-coded in the client; definitions served by the mock API and held in the store.
- **Why:** The design must scale to 30–100 layers without restructuring (TR-70), and the layer list must come from data, not hard-coded branches (TR-20).
- **Trade-off accepted:** Layer-specific behaviour beyond what `kind`, `unit` and `timePoints` express cannot be added without extending the definition type.
- **AI involvement:** Proposed by Claude in the architecture sketch; accepted by the user, who asked for it to be recorded as a decision.

### PLAN-3 — The design gate is extended to cover the stub folders

- **Status:** superseded (the stubs moved to `src/widgets/`; the design gate was removed in the layer-panel task)
- **Decision:** `design-gate.js` is extended so commits touching `src/features/header/`, `layer/`, `map/` and `chart/` are checked against `documents/design/dashboard-layout/` instead of a same-named design folder. The four folders are not nested under `src/features/dashboard-layout/`.
- **Options considered:** Nest the four folders under `src/features/dashboard-layout/`; extend the gate; bypass with `SDLC_SKIP_GATE=1`.
- **Why:** The user wants the feature folders kept as planned, matching TRD §7 and TR-61, and the gate adapted to them.
- **Trade-off accepted:** The gate gains a mapping from folders to design folders that must be updated when a stub's own feature gets its design docs (e.g. `map`).
- **AI involvement:** Options raised by Claude; the user chose to extend the gate. The mapping mechanism is Claude's proposal within that choice.
