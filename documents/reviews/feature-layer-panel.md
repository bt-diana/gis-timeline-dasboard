---
commit: 5930c1282c5891140f3ed0a8c35362a7b78bff43
status: draft
---

# Review — feature/layer-panel

Consolidated findings from the `reviewer` agent, one pass per lens. The subagent tool was not available in this run, so the reviewer ran the four lenses one after another instead of in parallel. Scope: `git diff origin/main...HEAD` at `5930c12`, focused on the fixes since the previous review: `dc804a5` (code) and `5930c12` (plan revision 5, draft). The rest of the branch was covered by the previous review at `d4250fa`. That commit no longer exists after the history rewrite and the rebase onto `origin/main`, but the reviewed code did not change. New finding IDs continue from the previous review's IDs (CQ-7, TC-6), so earlier IDs keep their meaning.

Design basis: intent rev 3 (approved), spec rev 3 (approved), plan rev 5 (**draft**, awaiting approval; adds PLAN-14, PLAN-15, PLAN-16).

Checked by the reviewer at `5930c12`:

- `npm run verify` passes: typecheck, lint, 12 test files, 61 tests.
- `npm run build` succeeds; `dist` holds only `index.html`, one JS and one CSS asset. In `dist`, `grep -i` finds no `msw`, `mockServiceWorker`, `QaControl`, `qa-control`, `Fail API requests` or `qa:fail-api`. One dev-only log string is still there (CQ-9). `dist` was deleted afterwards; the working tree is clean.
- `useAppStoreSelector` / `useAppDispatch` (PLAN-14), checked against the Vedro 1.1.0 source (`lib/_Vedro.js`, `lib/_internal/_Notifier.js`, `lib/_internal/_Dispatcher.js`, `lib/_internal/_DTO.js`, `lib/_createVedro.js`):
  - **Subscription.** `store.on('@state', cb)` → `Notifier.onState` calls `cb(state, state, INIT)` synchronously, then pushes `cb` and returns an unsubscribe. With `useSyncExternalStore`, `cb` is React's per-subscription `handleStoreChange`. That callback only re-renders if the snapshot changed, so the INIT call costs one `getSnapshot` call and is harmless. It is also useful: it catches a write made between render and subscribe. `subscribe` is memoised on `[store]`, so React does not resubscribe on every render.
  - **Unsubscription.** Vedro's unsubscribe is `splice(indexOf(cb), 1)` with no `-1` guard. React calls each subscription's destroy exactly once, and every `handleStoreChange` is a distinct function, so the right entry is removed. Calling it a second time would remove the last subscriber instead (see CQ-8).
  - **Stable snapshot.** `store.get()` returns a new shallow copy of the root (`DTO.getState` → `{...state}`), so returning the root would loop. Every selector in the codebase (`selectors.ts:6,10,14`, `appStore.test.tsx:28,44`) returns a nested reference (`layer.layers`, `layer.activeLayerIds`, `layer.list`). These are stable between dispatches, because the `layer` object is copied by reference. No render loop.
  - **Reference stability across transitions.** `startLoading`, `loadFailed` and `toggleLayer` spread `state`, so `layers` keeps its reference; only `loadSucceeded` sets a new `layers` array. `useTimelineRange`'s `useMemo([layers])` therefore recomputes only on a successful load. A probe (scratchpad, not committed) confirmed that after a toggle wrapped in `act`, `layers` is the same reference and `activeLayerIds` updates.
  - **Writes before subscribe.** Vedro dispatches synchronously and notifies `@state` subscribers before key subscribers. A write made in a child mount effect, before the parent's subscribe effect, is picked up by React's post-subscribe snapshot check and by the INIT call. `appStore.test.tsx:19-40` covers this case.
  - **StrictMode.** The Provider's `useRef(new Vedro(...))` may build a spare store on the double render, but only the committed one reaches the context. Effect double-invocation unsubscribes and resubscribes with distinct callbacks. `useAppDispatch` is stable, so `load` is stable and `useLoadLayers` runs its effect once per (strict) mount: the first request is aborted and the second writes. `App.test.tsx:70-82` covers this.
  - **Dispatch.** `useAppDispatch` is `useCallback` on `[store]`, so it is stable for the life of the provider (`appStore.test.tsx:10-17`). Sync updaters go through `dispatchWithCB`; none of the updaters is `async`.
- `src/main.tsx`: `startDevMocks().catch(log).then(render)` renders whether or not `worker.start()` rejects. In production `startDevMocks` returns at once and the `browser` import is dropped. `src/shared/lib/isRecord.ts` is the only `isRecord` in `src`; `shared/api/apiError.ts` imports it relatively and `entities/layer/model/guards.ts` through `@shared/lib`.

## Previous findings

| ID | Finding (at `d4250fa`) | Status at `5930c12` | Evidence |
|---|---|---|---|
| CQ-1 | Two ways to get dispatch; `useAppStoreDispatch` unstable | Fixed | `appStore.ts:28-35` stable `useAppDispatch`, used by `useLoadLayers.ts:7` and `useToggleLayer.ts:6`; plan Design note and PLAN-14 (draft) |
| CQ-2 | `idle` rendered as loading without a Decision | Fixed (decision in draft) | PLAN-15 in plan rev 5 (draft); `LayerPanel.tsx:49` unchanged |
| CQ-3 | Hook-order constraint in `ConnectedLayerPanel` | Fixed | `useSyncExternalStore` reads the current value at subscribe, so hook order no longer matters; the plan's ordering note was removed |
| CQ-4 | `sessionStorage` persistence and `MODE !== 'test'` guard unrecorded | Fixed (decision in draft) | PLAN-16 in plan rev 5 (draft) |
| CQ-5 | `main.tsx` never renders if `worker.start()` rejects | Fixed | `main.tsx:22-28`; plan by-hand check "worker script missing" ticked (not re-run by the reviewer) |
| CQ-6 | `isRecord` duplicated | Fixed | `src/shared/lib/isRecord.ts`, the only definition |
| TC-1 | No StrictMode double-mount test | Fixed | `App.test.tsx:70-82` asserts two calls, first signal aborted, list shown once. The late arrival of an aborted response is covered by `useLoadLayers.test.tsx:87-113` |
| TC-2 | No test guards selector-before-loader order | Fixed | `appStore.test.tsx:19-40` (write in a child mount effect before the reader subscribes) |
| TC-3 | Long-name wrap untested and dropped from the by-hand list | Fixed | Restored and ticked in the plan's by-hand list (`plan.md` test plan); CSS-only, not re-run by the reviewer |
| TC-4 | App test omits units; empty list not tested through the loader | Fixed | `App.test.tsx:52-60` (units), `:62-68` (`fetchLayers` → `[]`) |
| TC-5 | Non-`ApiRequestError` fallback untested | Fixed | `useLoadLayers.test.tsx:115-127` |
| PE-1 | Vedro selectors `JSON.stringify` the list on every dispatch | Fixed | Vedro `useSelector` is no longer used; `useSyncExternalStore` compares with `Object.is` |

## Security

No findings. `dc804a5` adds no new rendering of data as HTML. The new `console.error` in `main.tsx` logs only the local worker start error. The production bundle has no MSW or QA control code.

## Code Quality & Maintainability

- **CQ-7 (minor, process)** `src/shared/store/appStore.ts:21-35`, `src/widgets/layer-panel/ui/LayerPanel.tsx:49`, `src/app/App.tsx:10`: the code relies on decisions that exist only in the **draft** plan rev 5. PLAN-14 (replacing Vedro's `useSelector`/`useDispatch`) is a new architectural choice; PLAN-15 and PLAN-16 record existing behaviour. PLAN-14's own AI-involvement line says "awaiting the user's approval", yet all three entries are marked `Status: active` in an unapproved plan. Also, the plan's file map lists `src/main.tsx` twice (lines 53 and 61). Fix: get plan rev 5 approved before this review is approved, or revert to the rev 4 approach if PLAN-14 is rejected. Merge the two `main.tsx` rows.
- **CQ-8 (minor)** `src/shared/store/appStore.ts:15-24`: two safety properties of the new hooks depend on convention only.
  - (a) A selector must return a stored reference. `store.get()` builds a new root object on every call, so a selector such as `s => s`, `s => ({ ... })` or `s => s.layer.layers.filter(...)` makes `useSyncExternalStore` loop: React warns "getSnapshot should be cached", then throws "Maximum update depth exceeded". This is written in PLAN-14's trade-off, but nothing in `appStore.ts` stops it, and later tasks (time selection, chart series) will add selectors.
  - (b) `useAppStore` (the raw Vedro store) is still exported. A direct `store.on(...)` caller that unsubscribes twice would hit Vedro's unguarded `splice(indexOf(cb), 1)` and silently remove another component's subscription.

  Fix: stop exporting `useAppStore`/`AppStoreContext` from `appStore.ts` (no caller outside the file uses them). Optionally, add a dev-only check in `useAppStoreSelector` that `select` returns `Object.is`-equal values for two `get()` calls. Or accept as-is and rely on React's dev warning.
- **CQ-9 (minor)** `src/main.tsx:23-25`: the production bundle still contains the `.catch` handler and its message "Dev API mocks failed to start; the app runs without them." In production `startDevMocks` never rejects, so this is dead code. The message is also misleading if it ever appears in a production build log. Fix: put the catch inside `startDevMocks` (after the `DEV` early return), for example `await worker.start(...).catch(...)`, so the whole branch is removed in production.

Decisions check: the other non-obvious choices in `dc804a5` map to recorded decisions or Design notes: PLAN-14 (store hooks), PLAN-15 (idle as loading), PLAN-16 (session switch, QA control off in tests), and the file-map rows for `main.tsx` fallback and `shared/lib/isRecord`. The code does not contradict any recorded decision. The Design notes on abort detection, latest-wins and StrictMode still match `useLoadLayers.ts`.

## Test Coverage & Correctness

Acceptance criteria against tests (changes since the previous review only):

| Criterion | Test |
|---|---|
| Mocked load shows loading, then three switches with names, units, first active | `App.test.tsx:42-50`, `:52-60` |
| Empty list shows the empty state | `App.test.tsx:62-68` (through the loader), `LayerPanel.test.tsx`, `layerSlice.test.ts` |
| StrictMode double mount (spec edge case) | `App.test.tsx:70-82` |
| Non-`ApiError` failure shows the fixed message | `useLoadLayers.test.tsx:115-127`, `request.test.ts` |
| `npm run verify` passes | Verified by the reviewer (61 tests) |

Every spec acceptance criterion and edge case now has a test or a ticked by-hand check.

- **TC-6 (minor)** `src/shared/store/appStore.test.tsx:42-52`: the test "a selector keeps its value when another part of the store changes" proves nothing. `dispatch` is called outside `act`, so React does not re-render before the assertion and `result.current` is still the first render's value. The assertion would pass even if the selector returned a new array on every write. A scratchpad probe confirmed it: 0 re-renders after the un-`act`ed dispatch, plus an "update … not wrapped in act(...)" warning. There is also no hook-level test that a selector updates after a dispatch, or that unmount unsubscribes; the App tests cover the first only indirectly. Fix: wrap the dispatch in `act`, also select `activeLayerIds` and assert that it became `['wind']` (so the re-render is proven) while `layers` keeps its reference. Add a case that unmounts one of two readers, dispatches, and checks that the remaining reader still updates. That guards the Vedro `splice` path.

## Performance & Efficiency

No findings. Each dispatch now costs one `store.get()` shallow copy (one key) and one `Object.is` per subscribed selector. The `JSON.stringify` per selector is gone (PE-1). `useTimelineRange` recomputes only when `layers` changes reference, which happens only on `loadSucceeded`. `onToggleLayer` and `onRetry` are now stable across renders, so a future `memo` on the panel or its rows would work.

## Resolution

| ID | Severity | Finding | Resolution | AI involvement |
|---|---|---|---|---|
| CQ-7 | minor | Code relies on PLAN-14/15/16, which are only in the draft plan rev 5; duplicate `main.tsx` file-map row | TODO | TODO |
| CQ-8 | minor | Reference-only selector contract and the exported raw store rely on convention (render loop / Vedro double-unsubscribe risk) | TODO | TODO |
| CQ-9 | minor | Dev-only `.catch` and its log message remain in the production bundle | TODO | TODO |
| TC-6 | minor | `appStore.test.tsx:42-52` dispatches outside `act`, so it proves nothing; no unsubscribe test | TODO | TODO |

## Decisions

None.
