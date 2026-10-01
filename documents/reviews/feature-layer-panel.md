---
commit: d4250faa8caeb909010a2286e52bf85c44fabaf0
status: draft
---

# Review — feature/layer-panel

Consolidated findings from the `reviewer` agent, one pass per lens. The subagent tool was not available in this run, so the reviewer ran the four lenses one after another instead of in parallel. Scope: `git diff origin/main...HEAD` at `d4250fa`, focused on the commits since the approved spec `9ae9820` (mainly `aad6bfb`, plus `d4250fa` plan build notes), with the rest of the branch covered briefly. This review replaces the earlier draft at `41df7b7`; its findings were resolved by the revision-2/3 commits and are not repeated.

Checked by the reviewer at `d4250fa`:

- `npm run verify` passes: typecheck, lint, 11 test files, 54 tests.
- `npm run build` succeeds; `dist` holds only `index.html`, one JS and one CSS asset. `grep -ril` for `msw`, `mockServiceWorker`, `QaControl`, `qa-control`, `Fail API requests` and `qa:fail-api` in `dist` finds nothing. `dist` was deleted afterwards; the working tree is clean.
- ESLint rejects `@shared/mocks/...` from a widget, `../mocks/...` from `src/shared/api/`, and `../../shared/mocks/...` from an entity (probed with `eslint --stdin`).
- `useLoadLayers` races, traced against the Vedro 1.1.0 source (`useVedroSelector` subscribes in `useEffect`, compares with `JSON.stringify`): StrictMode double mount (first request aborted by cleanup, its late result dropped by the `signal.aborted` check, the second request writes), Retry while pending, superseded success, superseded failure, and unmount are all handled correctly. No correctness defect found.

## Security

No findings. Server `ApiError` messages and layer names are rendered as React text, never as HTML; no keys or secrets; `msw` is a devDependency and is absent from the production bundle; the failure switch only reads and writes one `sessionStorage` boolean.

## Code Quality & Maintainability

- **CQ-1 (minor)** `src/features/load-layers/model/useLoadLayers.ts:7` vs `src/features/toggle-layer/model/useToggleLayer.ts:6` — the two features get dispatch in two ways. `useLoadLayers` uses `useAppStore().dispatch`, because Vedro's `useDispatch` returns `dispatch.bind(store)`, a new function on every render, so an effect depending on it would reload on every render. `useToggleLayer` uses `useAppStoreDispatch`, so its `useCallback` changes on every render and does nothing (performance angle: `onToggleLayer` is never stable, so a future `memo` on the panel or rows would not help). The reason is not recorded anywhere. Fix: export one stable dispatch hook from `appStore.ts` (for example `useAppStore()` plus `store.dispatch`) and use it in both features. Record the Vedro `useDispatch` behaviour in the plan's Design notes, next to the `useSelector` note.
- **CQ-2 (minor)** `src/widgets/layer-panel/ui/LayerPanel.tsx:49` — `idle` is rendered as loading. This is a non-obvious choice with no Decision entry; spec 16 lists only loading, error, empty and success. It also hides the recorded Vedro limitation: if a component ever calls `useLoadLayers()` before its selectors, the missed `loading` write still looks right, because `idle` already shows "Loading layers…". Fix: add a Decision (or a plan Design line) saying idle shows as loading and why.
- **CQ-3 (minor)** `src/widgets/layer-panel/ui/ConnectedLayerPanel.tsx:7-11` — correctness depends on hook order: selectors must be called before `useLoadLayers()` (plan Design note). Only a convention enforces this, and no test fails if the order flips (see CQ-2 and TC-2). Fix: add a test that would fail if `startLoading` is missed, for example a component that calls the selectors after `useLoadLayers()` and asserts `aria-busy`/status during loading with a non-idle initial state. Alternatively, make the selectors re-read `store.get()` after they subscribe, in a thin wrapper in `appStore.ts`.
- **CQ-4 (minor)** `src/shared/mocks/failureSwitch.ts:21` and `src/app/App.tsx:10` — two non-obvious dev-mock choices are only in the plan's file map or not recorded at all: the failure switch persists in `sessionStorage`, so "default off" (SPEC-4) holds only for a fresh tab session; and `QaControl` is also excluded when `MODE === 'test'`. Fix: add a short PLAN Decision covering both.
- **CQ-5 (minor)** `src/main.tsx:14` — if `worker.start()` rejects (no Service Worker support, an insecure origin, or a stale worker script), the app never renders and the rejection goes unhandled. Fix: render in a `.finally`, or catch and `console.error`, so dev still shows the panel's error state.
- **CQ-6 (minor)** `src/shared/api/apiError.ts:9` and `src/entities/layer/model/guards.ts:5` — `isRecord` is defined twice. Later guards (series, snapshot) will add more copies. Fix: export `isRecord` from `@shared/api` (or a `shared/lib` guard module) and import it in `guards.ts`.

Decisions check: all other non-obvious choices in the diff map to recorded decisions (INT-5, SPEC-3 to SPEC-6, PLAN-5, PLAN-10, PLAN-12, PLAN-13, plus the plan's Design notes on abort detection, latest-wins, StrictMode and Vedro `useSelector`). The code does not contradict any recorded decision.

## Test Coverage & Correctness

Acceptance criteria against tests:

| Criterion | Test |
|---|---|
| Request: validated body, `ApiError` message, fixed message, aborted | `src/shared/api/request.test.ts:21-69` |
| Mocked load shows loading, then three switches with names, units, first active | `src/app/App.test.tsx:205-213` (names, first active), units only in `LayerPanel.test.tsx:331-344`, see TC-4 |
| Failure shows message and Retry; Retry recovers | `App.test.tsx:230-240`, `useLoadLayers.test.tsx:66-90` |
| By hand: dev MSW latency, QA control, production build without MSW or QA control | Plan test plan by hand (ticked); build part re-verified by this reviewer |
| Empty list shows the empty state | `LayerPanel.test.tsx:324-329` (props), `layerSlice.test.ts:38-43` (slice), see TC-4 |
| Retry while pending; slow first after fast second | `useLoadLayers.test.tsx:92-118`, superseded failure `:120-133` |
| Unmount during a request writes nothing | `useLoadLayers.test.tsx:135-163` |
| Timeline range sorted, de-duplicated, empty | `timelineRange.test.ts:5-15` |
| Toggling and keyboard behaviour | `LayerPanel.test.tsx:352-387`, `App.test.tsx:215-228`, `toggleLayerIds.test.ts` |
| `npm run verify` passes | Verified by the reviewer |

- **TC-1 (minor)** `src/features/load-layers/model/useLoadLayers.test.tsx` — the spec edge case "React StrictMode mounts twice in dev" has no test. The logic is correct by trace (the first request is aborted by cleanup and its late response is dropped), but nothing guards it. `App.test.tsx` renders `<App />` without `StrictMode`, while `main.tsx` uses it. Fix: render the loader inside `<StrictMode>`, assert that `signals[0].aborted` is true and that `fetchLayers` was called twice, resolve the first response after the second, and assert that only the second result is in the store.
- **TC-2 (minor)** `src/widgets/layer-panel/ui/ConnectedLayerPanel.tsx` — no test covers the hook-order constraint (see CQ-3). Every test that drives the loader calls the selectors first (`useLoadLayers.test.tsx:32-36`), and `idle` renders the same as `loading`. Fix: as in CQ-3.
- **TC-3 (minor)** spec edge case "Long layer names: wrap, no horizontal overflow" (`LayerPanel.css:43`) has no test, and `d4250fa` dropped "long names wrap" from the plan's ticked by-hand checklist (`plan.md` test plan). Fix: restore it to the by-hand list and check it, or record that it is covered by the CSS only.
- **TC-4 (minor)** `src/app/App.test.tsx:205-213` — the acceptance criterion says the mocked app shows "names, units and the first layer active", but the integrated test asserts names and `aria-checked` only. The empty-list criterion is tested only through props and the slice, not through the loader with `fetchLayers` resolving `[]`. Fix: assert the units in the App test, and add an App or loader case that resolves `[]` and expects "No layers available" with no switches.
- **TC-5 (minor)** `src/features/load-layers/model/useLoadLayers.ts:23` — the fallback for a rejection that is not an `ApiRequestError` (it shows `API_MESSAGES.unexpected`) is untested. Fix: reject the deferred with `new Error('boom')` and expect the fixed message.

## Performance & Efficiency

- **PE-1 (minor, mostly future)** `src/entities/layer/model/selectors.ts:5-20` (Vedro `useVedroSelector`) — every selector hook is notified on every store dispatch and runs `JSON.stringify` on its previous and next value. `useLayers` (also used inside `useTimelineRange`) therefore serialises the whole layer list, with all time points, on every dispatch, including toggles today and timeline ticks once tasks 4 and 5 add time selection. This is negligible with three layers and five points. Fix: no change now. When the time-selection slice lands, measure it, and consider a reference-equality selector wrapper in `appStore.ts`. Record this next to the `useSelector` note in the plan.
- See also CQ-1: `onToggleLayer` is not stable across renders.

No other findings: there are no redundant requests (abort plus the signal check), `useTimelineRange` is memoised on the `layers` reference, mock payloads are tiny, and the panel re-renders only on its three selectors.

## Resolution

| ID | Severity | Finding | Resolution | AI involvement |
|---|---|---|---|---|
| CQ-1 | minor | Two ways to get dispatch; `useAppStoreDispatch` unstable, reason unrecorded | TODO | TODO |
| CQ-2 | minor | `idle` rendered as loading without a Decision; masks missed `loading` | TODO | TODO |
| CQ-3 | minor | Hook-order constraint in `ConnectedLayerPanel` enforced only by convention | TODO | TODO |
| CQ-4 | minor | `sessionStorage` persistence and `MODE !== 'test'` guard not recorded as decisions | TODO | TODO |
| CQ-5 | minor | `main.tsx` never renders if `worker.start()` rejects | TODO | TODO |
| CQ-6 | minor | `isRecord` duplicated in `apiError.ts` and `guards.ts` | TODO | TODO |
| TC-1 | minor | No StrictMode double-mount test | TODO | TODO |
| TC-2 | minor | No test guards the selector-before-loader order | TODO | TODO |
| TC-3 | minor | Long-name wrap edge case untested and dropped from the by-hand list | TODO | TODO |
| TC-4 | minor | App test omits units; empty list not tested through the loader | TODO | TODO |
| TC-5 | minor | Non-`ApiRequestError` fallback in `useLoadLayers` untested | TODO | TODO |
| PE-1 | minor | Vedro selectors `JSON.stringify` the layer list on every dispatch | TODO | TODO |

## Decisions

None.
