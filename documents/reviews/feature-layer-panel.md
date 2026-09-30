---
commit: 41df7b770ade235ed9cb22a95141a70640e99000
status: draft
---

# Review — feature/layer-panel

Consolidated findings from the `reviewer` agent, one pass per lens. The subagent tool was not available in this run, so the reviewer ran the four lenses one after another instead of in parallel. Scope: `git diff origin/main...HEAD` at `41df7b7`, including `b3583ac` (gates) and `41df7b7` (FSD refactor). At the main agent's request, the hooks in `.claude/hooks/` and `eslint.config.js` were also reviewed as code. `npm run verify` passes on HEAD (typecheck, lint, 7 test files, 22 tests), confirmed by the reviewer.

The reviewer probed the ESLint rules with `eslint --stdin --stdin-filename <existing file>` and ran `approval-gate.js` against sample Bash commands from a scratchpad script. No repository file was changed apart from this review.

## Previous findings (review at `f4c1ad6`)

| # | Previous finding | Status at `41df7b7` |
|---|---|---|
| CQ-1 | Duplicate `onKeyDown` on a native button | Resolved: `LayerPanel.tsx:29-31` has only `onClick` |
| CQ-2 | `LayerSummary`/`RenderingKind` defined twice | Resolved: single `src/entities/layer/model/types.ts` |
| CQ-3 | Panel styling split between `App.css` and `LayerPanel.css`, double padding | Resolved: `App.css:47-50` keeps only `grid-area` and `min-height`. The widget still carries the app's `shell-layer` class (new CQ-6) |
| CQ-4 | Unused `@app`/`@store`/`@pages` aliases | Resolved: aliases are `@features`, `@shared`, `@widgets`, `@entities`, all used |
| CQ-5 | README described a layout that did not exist | Resolved: README Architecture matches the code |
| TC-1 | Space/Enter untested | Resolved: `LayerPanel.test.tsx:57-75` |
| TC-2 | No `toggleLayerIds` unit test | Resolved: `toggleLayerIds.test.ts` |
| TC-3 | `App` toggle on/off, others unchanged, untested | Resolved: `App.test.tsx:36-51` |
| TC-4 | Two overlapping default-state tests | Resolved |
| TC-5 | Unknown active ids untested | Resolved: `LayerPanel.test.tsx:50-55` |
| G-1 | `LayerPanel` read the store | Resolved: props only, plus `ConnectedLayerPanel` |
| G-2 | Layer list not in the store | Resolved: `layerSlice.ts:5-13` |
| G-3 | Inline dispatch | Resolved: `features/toggle-layer/model/useToggleLayer.ts` |
| G-4 | Slice in `shared/store/layers/` | Resolved: `entities/layer/model/*`; `shared/store/layers/` deleted |
| G-5 | Upward import from `shared/` | Resolved in the code. Lint still lets a relative upward import through (new CQ-4) |
| G-6 | Duplicate types | Resolved |
| G-7 | `onKeyDown` | Resolved |
| G-8 | Components in `src/features/` | Resolved: `src/widgets/{layer-panel,header,map,chart}` with `index.ts` |
| G-9 | Gates matched only `src/features/` | Resolved, with a divergence: all of `src/shared/<segment>/` is gated, not only `src/shared/store/` (new CQ-3) |
| G-10 | ESLint used the old boundaries | Resolved for alias imports. Relative-path gaps remain (new CQ-4) |
| G-11 | `@pages` alias | Resolved |
| G-12 | No props-level tests | Resolved. The "until props change" half is not asserted (new TC-1) |
| G-13 | Old `src/features/<feature>/` wording | Resolved in the SDLC doc, agents and plan template. The dashboard-layout decisions are still marked active (new CQ-7) |

## Security

No findings. No HTML is rendered from data (no `dangerouslySetInnerHTML` or `innerHTML`), and there are no keys, env secrets or new runtime dependencies (`package.json` is not in the diff). Layer names and units are rendered as React text nodes. The hooks run only fixed `git` commands through `execSync`/`execFileSync`.

## Code Quality & Maintainability

- **major** `b3583ac` (whole commit): the "gates" commit also carries the source moves: 22 files, including the moves of `LayerPanel.tsx`, `config.ts`, `LayerPanel.css`, the three stubs and the types, and the deletion of `src/features/layer/LayerPanel.test.tsx`. On its own, the commit does not typecheck. `tsc -b` on a `git archive b3583ac` snapshot fails because `src/app/App.tsx:2-5` imports `@features/*`, `src/shared/store/appStore.ts:2` imports `./layers/layerSlice`, and `LayerPanel.tsx:2-3` imports `@shared/store/layers/*`. This contradicts PLAN-3, PLAN-4 and build step 1 (gate changes as their own commit). It also leaves a commit that does not build, and build step 2 (tests written and failing first) cannot be verified, because tests and code land together in `41df7b7`. Fix: with the user's consent, split the history so `b3583ac` holds only `.claude/` and the doc wording and the moves go into `41df7b7`. Otherwise, record a REV decision that accepts the history as it is.
- **major** `.claude/hooks/approval-gate.js:222-229`: the Bash approval check tests the command text, not what the command does. Both kinds of error were reproduced by running the hook. It misses real flips: `sed --in-place ...` (the `\s-i` pattern does not match `--in-place`), `cd documents/design/x && sed -i 's/draft/approved/' plan.md` (no full artifact path in the text), and `cp /tmp/plan.md documents/design/x/plan.md`, `git checkout other -- <artifact>` or `git show other:<artifact> > <artifact>` from an already-approved copy (the word `approved` is not in the text). It blocks commands that write nothing: `grep -n "status: approved" documents/design/layer-panel/plan.md 2>/dev/null` is denied because a bare `>` counts as a write, and so is any `node`/`python` invocation, even read-only. A heredoc that mentions an artifact path, and `echo ... approved ... >> README.md`, are also denied; this reviewer's own scratchpad probe script was blocked. In addition, line 226 consumes the approval token on any match. If a harmless flagged command runs right after the user approves, it uses up the token, and the real Write is then denied. Fix: check the effect, not the text. For example, snapshot the frontmatter `status` of design and review files in PreToolUse(Bash) and compare it in a PostToolUse(Bash) hook, which reverts or reports a flip made without a token. At minimum, match `--in-place`, count `>` only when it redirects to an artifact path, and consume the token only when an artifact actually flips.
- **minor** `.claude/hooks/design-folders.js:9,14-17`: `sliceOf` gates every `src/shared/<segment>/` under a design folder named after the segment. A later `src/shared/api/` (roadmap task 7), `shared/ui` or `shared/lib` would then need `documents/design/api/` etc. and would be blocked by `design-gate.js` and, for tests, `approval-gate.js:233,243`. `store: 'layer-panel'` sends every future store edit (for example the timeline adding a `time` slice to `appStore.ts`) to the layer-panel docs instead of the feature's own. The plan's file map says only `src/shared/store/`, and neither choice has a decision. `designFolderFor[slice]` on a plain object also resolves inherited keys: a slice named `constructor` maps to a function. Fix: gate only `src/shared/store/` as planned, or record the broader rule as a decision. Use `Object.hasOwn(designFolderFor, slice)`.
- **minor** `eslint.config.js:54,70,72,74-82`: relative imports get past the layer rules outside the sliced layers. This passes lint: `import { toggleLayer } from '../../entities/layer'` in `src/shared/store/appStore.ts` (an upward import from `shared/`, which also bypasses the "only `*Slice` files" exception). So does `import ... from '../entities/layer/model/toggleLayerIds'` in `src/app/App.tsx` (a deep import that skips `index.ts`). Only slice files have the `../` depth rule. Fix: add a relative-path pattern to `sharedBoundaries` and `storeException` (for example `^(\.\./){2,}`, since shared files sit one segment deep) and to `appBoundaries` (`^\.\./(widgets|features|entities)/`).
- **minor** `eslint.config.js:14-20`: `slicesOf` reads `src/<layer>` relative to `process.cwd()`. If ESLint runs from another directory (an editor integration, a parent folder), no slice rules are generated and nothing reports it. Fix: resolve the path from `import.meta.dirname`.
- **minor** `src/widgets/layer-panel/ui/LayerPanel.tsx:13`: the props-only widget sets the app shell's grid class `shell-layer` (`src/app/App.css:47`). A widget now depends on app-layer CSS, which goes against the downward-only rule of INT-4, and the standalone component carries grid placement. Fix: let `App` place it, with a wrapper or a `className` prop from `App`.
- **minor** Decisions check: `documents/design/dashboard-layout/plan.md:90-92` (PLAN-1, feature boundaries in ESLint) and `:108-110` (PLAN-3, gate map for the stub folders) still say `Status: active`. Layer-panel INT-4 supersedes both, and the code no longer follows them. The new Bash approval check (`approval-gate.js:222-229`), gating all of `src/shared/<segment>/` (CQ-3) and runtime slice discovery in ESLint have no decision entry. `plan.md` file map row `useToggleLayer.ts` says it dispatches `toggleLayerIds`, while the code (`useToggleLayer.ts:10`) and the plan's own "Store shape" section dispatch `toggleLayer`. Fix: mark the dashboard-layout PLAN-1 and PLAN-3 as superseded by layer-panel INT-4, record the gate and lint choices, and correct the file-map wording (with the user's approval, since the docs are approved).

## Test Coverage & Correctness

- **minor** `src/widgets/layer-panel/ui/LayerPanel.test.tsx:77-84`: "keeps aria-checked until the props change" asserts only that the state is unchanged after a click. It never rerenders with new `activeLayerIds`, so the plan item's "until props change" half (the switch follows props) is not exercised at panel level. Fix: `rerender(<LayerPanel … activeLayerIds={['temperature', 'wind']} />)` and assert `['true', 'true', 'false']`.
- **minor** Plan test plan, "By hand" item: nothing records that the gate blocked a slice commit, that ESLint rejected a sibling and an upward import, or that a long name wraps. The reviewer's probes confirm that alias-based sibling, upward and deep imports are rejected. The relative forms from `shared/` and `app/` are not (CQ-4), so the by-hand check did not cover them. Fix: record the manual checks (commands and results) in the PR description, and repeat them after CQ-4.

Every spec acceptance criterion is tested: three switches with names and `aria-checked` (`LayerPanel.test.tsx:29-48`), click/Space/Enter once (`:57-75`), `App` on/off with the others unchanged (`App.test.tsx:36-51`), toggle adds and removes (`toggleLayerIds.test.ts`, `layerSlice.test.ts`), and the Layers landmark (`App.test.tsx:26-34`, `LayerPanel.test.tsx:23-27`). Spec edge cases: unknown ids, toggle twice and all off are covered. Long names wrap through CSS (`overflow-wrap: anywhere`, `min-width: 0`) and can only be checked by hand.

## Performance & Efficiency

No findings at this app's scale. `ConnectedLayerPanel` selects `layer.layers` and `layer.activeLayerIds` separately, and Vedro re-renders only when the `JSON.stringify` of a selector's result changes, so a toggle does not re-render the header or the map and chart stubs. `useToggleLayer` is memoised on `dispatch`. For later tasks: `useVedroSelector` (`node_modules/vedro/lib/hooks/useStoreSelector.hook.js`) runs every subscribed selector twice and stringifies both results on each dispatch. That is fine for three layers, but snapshot and series data (tasks 9 and 10) should not be selected as large objects. Selectors must also not close over props, because the subscription keeps the first closure (`useEffect(..., [])`).

## Resolution

| Finding | Severity | Resolution | AI involvement |
|---|---|---|---|
| CQ-1 `b3583ac` mixes gate changes with source moves and does not typecheck on its own (PLAN-3/PLAN-4) | major | TODO | TODO |
| CQ-2 Bash approval check: text-based false negatives (`--in-place`, relative path, `cp`/`git checkout` of an approved copy) and false positives (`2>/dev/null`, any `node`/`python`), plus token consumed on false positives | major | TODO | TODO |
| CQ-3 `sliceOf` gates every `src/shared/<segment>/` by segment name; `store` → `layer-panel`; inherited-key lookup | minor | TODO | TODO |
| CQ-4 ESLint misses relative upward and deep imports from `shared/` (including `appStore.ts`) and `app/` | minor | TODO | TODO |
| CQ-5 ESLint `slicesOf` depends on `process.cwd()` | minor | TODO | TODO |
| CQ-6 `LayerPanel` uses the app-layer `shell-layer` class | minor | TODO | TODO |
| CQ-7 dashboard-layout PLAN-1/PLAN-3 still active; gate and lint choices unrecorded; plan file-map wording for `useToggleLayer` | minor | TODO | TODO |
| TC-1 "until props change" half not asserted in `LayerPanel` | minor | TODO | TODO |
| TC-2 By-hand gate, lint and wrap checks not recorded | minor | TODO | TODO |

## Decisions

### REV-1 — Hooks and lint config reviewed as code under Code Quality

- **Status:** active
- **Decision:** Findings in `.claude/hooks/*.js` and `eslint.config.js` are filed under Code Quality & Maintainability, and they were checked by running them (ESLint on stdin, the approval hook on sample commands) rather than by reading alone.
- **Options considered:** A separate "Tooling" section; filing under Code Quality; reading only.
- **Why:** The template has four fixed sections, and regex behaviour is easier to judge from real matches than by reading it.
- **Trade-off accepted:** Code Quality mixes app code and tooling findings; the IDs and file paths keep them apart.
- **AI involvement:** The scope was requested by the main agent; the method was chosen by the reviewer.
