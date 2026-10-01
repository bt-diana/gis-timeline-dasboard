---
commit: 49cafdbdaed7d16042e3fa5dbec23625e2121489
status: draft
---

# Review — feature/layer-panel

Consolidated findings from the `reviewer` agent, one pass per lens. The subagent tool was not available in this run, so the reviewer ran the four lenses one after another instead of in parallel. Scope: `git diff origin/main...HEAD` at `49cafdb`, focused on the changes since the previous review at `5930c12`: `e800b36` (fixes on custom store hooks), `97a1065` (Vedro hooks restored), and the plan commits through `49cafdb` (plan rev 5 approved, store-hook decisions merged into PLAN-14). The source code is the same at `6add5d6` and `49cafdb`. The rest of the branch was covered by the earlier reviews. New finding IDs continue from the previous ones, so earlier IDs keep their meaning.

Design basis: intent rev 3, spec rev 3, plan rev 5 (all approved). Active decisions: PLAN-5, PLAN-7, PLAN-12, PLAN-13, PLAN-14 ("Vedro's hooks are used as is").

Accepted trade-offs, not raised as findings (PLAN-14 and the plan's Design section): Vedro's `useSelector` misses writes made before it subscribes, so selectors are called before `useLoadLayers()`; it compares selector results with `JSON.stringify` on every write; `useDispatch` changes identity on every render, so features call `dispatch` on the store from `useStore()`. Exporting the raw store and Vedro's unguarded unsubscribe are also treated as accepted, as the user directed. PLAN-14's trade-off text does not name these two explicitly; they follow from its decision to use `useStore`.

Checked by the reviewer at `49cafdb`:

- `npm run verify` passes: typecheck, lint, 11 test files, 58 tests. Three fewer than at `5930c12`, because `97a1065` removed `appStore.test.tsx`.
- `npm run build` succeeds. `dist` holds only `index.html`, one JS and one CSS asset. `grep -i` in `dist` finds no `msw`, `QaControl`, `qa-control`, `mockServiceWorker`, `Dev API mocks` or `Fail API requests`. `dist` was deleted afterwards, and the working tree is clean.
- `src/shared/store/appStore.ts` is identical to its rev-4 form at `e3563ed`: it re-exports Vedro's `Context`, `Provider`, `useStore`, `useSelector` and `useDispatch` unchanged. That matches the plan file map (`plan.md:59`).
- Vedro 1.1.0 source (`lib/_createVedro.js`, `lib/hooks/useStoreSelector.hook.js`, `lib/_internal/_Notifier.js`):
  - `useSelector` keeps its value in `useState(cb(store.get()))` and subscribes in a `[]`-deps effect. The `@state` INIT callback compares `cb(state)` with itself, so it never recovers a missed write. Later writes compare `cb(prevState)` with `cb(state)` by `JSON.stringify`.
  - `useStore` reads the context and returns the store from the Provider's `useRef`, which is stable. `useDispatch` returns `store.dispatch.bind(store)`, a new function on every render. This confirms the plan's Design note (`plan.md:72`).
- Hook order (`plan.md:71`):
  - `ConnectedLayerPanel.tsx:7-11` calls `useLayers`, `useActiveLayerIds` and `useLayerList` before `useToggleLayer` and `useLoadLayers`. Effects run in call order, so the selectors subscribe before the load's mount effect writes `loading`.
  - `useLoadLayers.test.tsx:32-36` uses the same order. Its `Probe` in `:155-165` renders before `Loader`, so sibling effects subscribe first.
  - No other component in `src` reads the store.
  - Under StrictMode the reconnect runs the effects in the same order, so the second load's `loading` write is seen as well.
- Hook-order probe, in a scratch copy that was not committed:
  - Moving `useLoadLayers()` first in `ConnectedLayerPanel` leaves all 58 tests passing. The panel stays `idle` until the load settles, and `idle` renders exactly like `loading` (`LayerPanel.tsx:49`, plan Design note). The order in the connected widget therefore has no observable effect today.
  - Moving it first in the `useLoadLayers.test.tsx` harness fails two tests (`expected { status: 'idle' } to deeply equal { status: 'loading' }`). So the rule is pinned where it can be observed.
- `useLoadLayers.ts:7,27` and `useToggleLayer.ts:6,12` depend only on `store`. `load` and the toggle callback are therefore stable for the life of the provider. `useLoadLayers`' mount effect runs once per (strict) mount, and `App.test.tsx:70-82` still covers the StrictMode double mount. Abort and latest-wins logic is unchanged from the reviewed revision.
- `src/main.tsx:5-13`: the `try/catch` around the mocks import and `worker.start()` sits after the `DEV` early return. The production build drops it, and the app renders whether or not the worker starts.

## Previous findings

| ID | Finding (at `5930c12`) | Status at `49cafdb` | Evidence |
|---|---|---|---|
| CQ-7 | Code relied on decisions in the draft plan rev 5; duplicate `main.tsx` file-map row | Fixed | Plan rev 5 is `status: approved`. All Decisions entries the code relies on are active (PLAN-5, -7, -12, -13, -14). `idle` as loading and the `sessionStorage` switch are recorded as Design notes (`plan.md:73-74`). `src/main.tsx` appears once in the file map (`plan.md:53`). |
| CQ-8 | Reference-only selector contract and exported raw store relied on convention | Fixed in `e800b36`, then the fix was removed by `97a1065` (PLAN-14); no longer applies | (a) The custom `useSyncExternalStore` selector is gone. Vedro's `useSelector` stores its value in `useState` and compares with `JSON.stringify`, so a selector returning a new object cannot cause a render loop. (b) The raw store is exported again (`appStore.ts:13,15`) as part of using Vedro's hooks as is; accepted under PLAN-14. |
| CQ-9 | Dev-only `.catch` and its log message in the production bundle | Fixed | `main.tsx:7-12` (catch inside the `DEV` branch); `dist` grep finds no `Dev API mocks` |
| TC-6 | `appStore.test.tsx` dispatched outside `act`; no unsubscribe test | Fixed in `e800b36`, then the test file was removed by `97a1065` (PLAN-14); no longer applies | No custom store code is left to test; selector, dispatch and subscription behaviour is Vedro's own |

## Security

No findings. The changes since `5930c12` add no rendering of data as HTML, and `src` has no `innerHTML` or `dangerouslySetInnerHTML`. The only log in `main.tsx` is dev-only and absent from `dist`. The production bundle contains no MSW, worker script or QA control code. No dependencies changed.

## Code Quality & Maintainability

- **CQ-10 (minor, process)** `documents/design/layer-panel/plan.md:141-148`: decision PLAN-14 was rewritten in place. Until `87e0be2`, PLAN-14 recorded the rejected `useSyncExternalStore` replacement (`Status: superseded by PLAN-15`) and PLAN-15 recorded "Vedro's hooks are used as is". After `49cafdb`, PLAN-14 holds the opposite decision and PLAN-15 is gone. The SDLC requires decisions to be append-only, never edited or deleted, and a rejected proposal to be recorded as its own superseded entry (`documents/AI_Native_SDLC.md:42-43`, `documents/design/TEMPLATE/plan.md:26`). The rejected proposal survives in PLAN-14's Options and AI involvement lines, so the current plan loses no information. But the ID PLAN-14 now means opposite things in history: commit `e800b36` and the review draft `a2e9db9` cite PLAN-14 for the custom hooks. The README's AI-usage section is meant to draw rejected proposals from superseded entries (`AI_Native_SDLC.md:44`). The user directed the merge. Fix: either accept it as the user's choice and record that here as a REV decision, or restore the superseded entry for the rejected proposal under its own ID and keep "used as is" under a new ID.

Decisions check:

- The code follows every active decision and Design note. Specifically:
  - one Vedro store with one `layer` key, every transition returning the whole key (PLAN-5);
  - Vedro hooks used as is, with custom hooks only adding logic (PLAN-14: `useLoadLayers`, `useToggleLayer`, and the selector hooks in `entities/layer/model/selectors.ts`, which wrap `useSelector`);
  - selectors before `useLoadLayers()` (`ConnectedLayerPanel.tsx:7-11`);
  - `dispatch` called on the store from `useStore()`;
  - mocks and test helpers in `shared` (PLAN-12);
  - plain `fetch` (PLAN-13).
- `useAppStoreDispatch` (`appStore.ts:17`) is exported but has no caller, consistent with the Design note that features avoid it. It stays because the file map lists Vedro's exports as is.
- No non-obvious choice in the code since `5930c12` lacks a record.

## Test Coverage & Correctness

No new findings. Changes since `5930c12`:

| Item | Test |
|---|---|
| Selectors before the loader, as the plan's Design note requires | `useLoadLayers.test.tsx:32-36`, `:155-165`. The probe confirms the harness fails if the order is swapped. |
| StrictMode double mount with the store-based dispatch | `App.test.tsx:70-82` |
| Loading, success, error with Retry, latest-wins, discarded superseded failure, unmount writes nothing | `useLoadLayers.test.tsx:47-177`, `App.test.tsx:42-109` |
| `npm run verify` passes | Verified by the reviewer (58 tests) |

Every spec acceptance criterion and edge case still has a test or a ticked by-hand check. The three removed `appStore.test.tsx` tests covered only the custom hooks that PLAN-14 removed. Note: the hook order inside `ConnectedLayerPanel` has no observable effect today, because `idle` renders as `loading`. The first widget that tells `idle` and `loading` apart, or reads the store from a parent or a later sibling of the panel, will depend on the accepted selector-timing trade-off.

## Performance & Efficiency

No findings beyond the accepted `JSON.stringify` comparison (PLAN-14). Each dispatch runs three selectors, each stringifying its previous and new result. At three layers this is negligible. `useTimelineRange`'s `useMemo([layers])` recomputes only when the `layers` selector's state changes, which happens only when the list content changes. `load` and the toggle callback are stable, so the mount effect does not re-run and a future `memo` on the panel would work.

## Resolution

| ID | Severity | Finding | Resolution | AI involvement |
|---|---|---|---|---|
| CQ-10 | minor | PLAN-14 rewritten in place and PLAN-15 deleted, against the append-only decision rule; PLAN-14 means opposite things in history | TODO | TODO |

## Decisions

None.
