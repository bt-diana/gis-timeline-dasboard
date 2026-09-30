---
status: draft
revision: 3
---

# Plan — Layer Panel

Revision 2: toggles through a Vedro store (INT-3, SPEC-1) and Feature-Sliced Design (INT-4). Starts from the code on `feature/layer-panel` at `0f55c53`, which already has a Vedro store in `src/shared/store/`.

## Target layout

Layers, top to bottom; a slice imports only from layers below it, never from a sibling slice, and only through the sibling's `index.ts`.

```
src/
  app/                        App: store provider and the shell grid (PLAN-7)
  widgets/layer-panel/        LayerPanel (props only) + connected part
  widgets/header|map|chart/   the three stubs, moved from src/features/ (PLAN-6)
  features/toggle-layer/      the toggle action
  entities/layer/             LayerSummary, fixtures, layer slice, selectors
  shared/store/               the one Vedro store, composed from entity slices (PLAN-5)
```

## Store shape (PLAN-5)

- One Vedro store, one top-level key per entity: `{ layer: LayerState }`; later entities add their own key (e.g. `time`).
- Each slice lives in its entity: `entities/<entity>/model/<entity>Slice.ts` exports the state type, the initial state and pure transitions. The slice file has no Vedro import.
- `shared/store/appStore.ts` is the only file that knows all slices: it builds the state type and initial state from them and calls `createVedro` once.
- Vedro merges `dispatch` results at the top level only, so a transition returns the whole slice key: `({ layer }) => ({ layer: toggleLayer(layer, id) })`.
- `useSelector` re-runs every selector on each change and re-renders only when the result differs (compared with `JSON.stringify`), so selectors return the smallest piece they need.
- FSD exception: `shared/store/appStore.ts` imports from `entities/*/model/*Slice.ts`, the only import from `shared/` to a higher layer. Allowed for that one file in ESLint. The store cannot live in `app/`: entities and features would then import from `app/`, which imports them back.

## File map

| File | Change |
|---|---|
| `src/entities/layer/model/types.ts` | moved from `src/entities/layer/model.ts`: `RenderingKind`, `LayerSummary` |
| `src/entities/layer/model/layerFixtures.ts` | moved from `src/shared/store/layers/` |
| `src/entities/layer/model/layerSlice.ts` | new: `LayerState` (`layers`, `activeLayerIds`), `initialLayerState` seeded from the fixtures, `toggleLayer` |
| `src/entities/layer/model/toggleLayerIds.ts` | moved from `src/shared/store/layers/layerSlice.ts`: the pure toggle on an id list |
| `src/entities/layer/model/selectors.ts` | new: `useLayers()`, `useActiveLayerIds()` over the app store |
| `src/entities/layer/index.ts` | new: public API |
| `src/features/toggle-layer/model/useToggleLayer.ts` | new: returns `(id) => void` dispatching the slice's `toggleLayer` |
| `src/features/toggle-layer/index.ts` | new |
| `src/widgets/layer-panel/ui/LayerPanel.tsx` | moved from `src/features/layer/`: back to props only (spec 2), no `onKeyDown`, no shell grid class |
| `src/widgets/layer-panel/ui/ConnectedLayerPanel.tsx` | new: selectors + `useToggleLayer` into `LayerPanel` (spec 5) |
| `src/widgets/layer-panel/ui/LayerPanel.css`, `config.ts`, `index.ts` | moved / new |
| `src/widgets/{header,map,chart}/` | moved from `src/features/`, with `index.ts` |
| `src/shared/store/appStore.ts` | modified: state composed from entity slices; `src/shared/store/layers/` deleted |
| `src/app/App.tsx` | modified: renders `ConnectedLayerPanel` inside its `shell-layer` grid cell, and the widgets from `@widgets/*` |
| `src/features/layer/`, `src/features/{header,map,chart}/`, `src/entities/layer/model.ts` | deleted (moved) |
| `tsconfig.app.json`, `vite.config.ts` | modified: drop the unused `@pages` alias |
| `eslint.config.js` | modified: FSD import rules replace the feature-boundary rules (dashboard-layout PLAN-1), with the `appStore.ts` exception |
| `.claude/hooks/design-gate.js` | modified: matches `src/{widgets,features,entities}/<slice>/` and `src/shared/store/`, not only `src/features/` |
| `.claude/hooks/approval-gate.js` | modified: same pattern for test files; before each shell command, records every artifact's status (PLAN-9) |
| `.claude/hooks/approval-state.js`, `.claude/hooks/approval-bash-check.js` | new: shared status helpers; after each shell command, puts back a status that became `approved` without the user's approval (PLAN-9) |
| `.claude/settings.json`, `.gitignore` | modified: register the shell approval check; ignore its snapshots |
| `.claude/hooks/design-folders.js` | modified: `sliceOf` gates the sliced layers and `src/shared/store/` only (PLAN-8); slice → design folder (`layer`, `toggle-layer`, `store` → `layer-panel`; `header`, `map`, `chart` → `dashboard-layout`) |
| `documents/design/dashboard-layout/plan.md` | modified: PLAN-1 and PLAN-3 marked superseded by INT-4 |
| `README.md` | modified: Architecture section (current layout, how it evolved and why) |
| `documents/AI_Native_SDLC.md`, `.claude/agents/implementer.md`, `.claude/agents/plan-writer.md`, `documents/design/TEMPLATE/plan.md` | modified: `src/features/<feature>/` wording becomes FSD slices |

## Design

- Vedro API confirmed from `node_modules/vedro/README.md`: `createVedro(initialState)` returns `Provider`, `useSelector`, `useDispatch`, `useStore`; `dispatch` takes a key and value, a partial object, or a function of state returning a partial.
- `useSelector` subscribes to the selected part only, so toggling re-renders the panel and not the header (TR-71).
- `LayerPanel` keeps `activeLayerIds: readonly string[]` and `includes` (PLAN-1); the native button turns Space and Enter into one click, so the `onKeyDown` added in `0f55c53` goes.
- Toggle logic stays a pure function in the entity, testable without React; the feature only binds it to `dispatch`.
- ESLint without new packages: `no-restricted-imports` per layer lists the higher layers and sibling slices, plus a pattern forcing imports through `index.ts`.

## Build sequence

1. Update `design-folders.js`, `design-gate.js`, `approval-gate.js` for FSD paths; check by hand that a staged slice file is gated. Own commit.
2. Write the tests below; confirm the new ones fail.
3. Create `entities/layer` (types, fixtures, slice, toggle, selectors, `index.ts`); compose `appStore.ts` from the slice; delete `src/shared/store/layers/` and `entities/layer/model.ts`.
4. Create `features/toggle-layer`.
5. Move `LayerPanel` to `widgets/layer-panel`, restore props, add `ConnectedLayerPanel`; move the three stubs to `widgets/`.
6. `App` renders the widgets from `@widgets/*` inside the store provider.
7. Replace the ESLint boundary rules; check by hand against a temporary sibling-slice import and an upward import, and that `appStore.ts` may import a slice.
8. Update the SDLC doc, agents and plan template wording.
9. `npm run dev`: toggles work, long name wraps.
10. `npm run verify`; present and wait for acceptance.
11. After acceptance, the review via the `reviewer` agent.

## Test plan

- [ ] `toggleLayerIds`: adds a missing id, removes a present one, leaves other ids and their order.
- [ ] Layer slice: initial state has the three fixture layers and `['wind']` active; `toggleLayer` returns a new slice with the id toggled.
- [ ] `LayerPanel`: renders alone as `complementary` named "Layers".
- [ ] `LayerPanel`: three switches named by layer, in `layers` order, each with its unit.
- [ ] `LayerPanel`: `aria-checked` is `true` exactly for ids in `activeLayerIds`; unknown ids add nothing.
- [ ] `LayerPanel`: click, Space and Enter each call `onToggleLayer` once with that id.
- [ ] `LayerPanel`: `aria-checked` unchanged after a click until props change.
- [ ] `App`: clicking an inactive switch turns it on, clicking again turns it off, others unchanged (spec AC 3).
- [ ] `App`: landmarks, order and placement tests still pass after the move.
- [x] By hand: gate blocks a slice commit and a slice test without approved docs; the shell approval check puts back an unapproved `approved` and keeps the token through harmless commands; ESLint rejects sibling, upward, deep and relative cross-layer imports and allows `appStore.ts` → slice file; in the running app click and Space toggle, a long name wraps with no horizontal overflow, no page errors.
- [ ] `npm run verify` passes, then the review.

## Decisions

- PLAN-1: `activeLayerIds` is `readonly string[]`. Status: active.
- PLAN-2: `LayerSummary` lives in `src/features/layer/`. Status: superseded by INT-4 (FSD puts it in `entities/layer`).
- PLAN-3: the `design-gate.js` mapping change is made in this feature, as its own commit. Status: active.
- PLAN-4: `approval-gate.js` gets the same mapping through a map shared with `design-gate.js`, as its own commit before the tests. Status: active.

### PLAN-5 — One Vedro store, one slice file per entity

- **Status:** active
- **Decision:** A single Vedro store in `shared/store/appStore.ts`, with one top-level key per entity. Each entity keeps its state type, initial state and transitions in its own slice file in `entities/<entity>/model/`.
- **Options considered:** One store per entity with nested providers; one store with all state in one file; one store composed from per-entity slice files.
- **Why:** One store keeps one source of truth (TR-10) and one provider; slice files keep each entity's state next to its business logic, which is the point of FSD (INT-4). Vedro allows it: the state is one object and each slice is one key.
- **Trade-off accepted:** `appStore.ts` imports from `entities/`, an FSD exception allowed for that file only. Every dispatch returns the whole slice key, since Vedro merges only top-level keys.
- **AI involvement:** Claude recommended one store per entity; the user chose one store with per-entity slice files. Claude confirmed in the Vedro source that it works.

### PLAN-6 — The header, map and chart stubs move to widgets now

- **Status:** active
- **Decision:** `src/features/{header,map,chart}/` move to `src/widgets/` in this task.
- **Options considered:** Move now; leave them until their own tasks.
- **Why:** No folder is left in the old layout, and the ESLint and gate rules cover one layout only.
- **Trade-off accepted:** The layer-panel diff touches three stubs it does not otherwise change.
- **AI involvement:** Proposed by Claude; accepted by the user.

### PLAN-7 — No pages layer

- **Status:** active
- **Decision:** No `src/pages/`; `App` keeps the shell grid and renders the widgets directly.
- **Options considered:** A `pages/dashboard/` layer with the grid; the grid in `App`.
- **Why:** The app has only one page, so a pages layer adds a folder with nothing to separate.
- **Trade-off accepted:** If a second page appears, the grid moves out of `App` into `pages/`.
- **AI involvement:** Claude recommended a pages layer; the user rejected it because there is only one page.

### PLAN-8 — The design gate covers FSD slices and the store

- **Status:** active
- **Decision:** `design-gate.js` and `approval-gate.js` gate `src/{widgets,features,entities}/<slice>/` and `src/shared/store/`. `designFolderFor` maps `store`, `layer` and `toggle-layer` to `layer-panel`, and `header`, `map`, `chart` to `dashboard-layout`; any other slice needs a design folder of its own name. `src/app/` and the rest of `src/shared/` are not gated. Supersedes dashboard-layout PLAN-3.
- **Options considered:** Gate only `src/features/` (the old gate); gate every `src/shared/<segment>/` under its own design folder; gate the sliced layers plus `src/shared/store/`.
- **Why:** The old gate let the `src/shared/` and `src/entities/` commits through. Gating every shared segment would block a future `shared/api` until a design folder of that name exists.
- **Trade-off accepted:** `store` points to `layer-panel` until another feature adds a slice to the store; that feature updates the map.
- **AI involvement:** Proposed by Claude after the review; accepted by the user.

### PLAN-9 — Shell edits of approvals are checked by their result

- **Status:** active
- **Decision:** Before each shell command, `approval-gate.js` records the status of every design and review artifact. After it, `approval-bash-check.js` compares them; a status that became `approved` without the user's approval in chat is put back and reported. The approval token is spent only by a real change to `approved`.
- **Options considered:** Match the command text (the first version); compare the statuses before and after the command.
- **Why:** The review showed the text match missed `sed --in-place`, `cd` then `sed`, `cp` and `git checkout`, and blocked harmless reads, while spending the token on them.
- **Trade-off accepted:** Every shell command reads the frontmatter of all artifacts twice; the change is undone after the fact rather than prevented.
- **AI involvement:** Proposed by Claude after the review; accepted by the user.

### PLAN-10 — ESLint finds slices from the folders at load time

- **Status:** active
- **Decision:** `eslint.config.js` lists the slice folders of each layer when it loads, resolved from the config file's folder, and builds the boundary rules from them. `src/app/` and `src/shared/` also reject relative imports into other layers.
- **Options considered:** A fixed list of slices in the config; folder discovery; a new ESLint plugin (needs approval under TR-07).
- **Why:** A new slice is covered without editing the config, and no package is added.
- **Trade-off accepted:** A new slice folder gets rules only when ESLint reloads its config (restart the editor's ESLint server).
- **AI involvement:** Proposed by Claude; the folder resolution and relative-import rules added after the review; accepted by the user.
