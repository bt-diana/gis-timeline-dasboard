---
status: approved
---

# Plan — Chart

Implements `spec.md` (chart). Starts from `192c869` (layer panel merged).

## Target layout

```
src/
  app/                        App: unchanged, still renders `Chart` from `@widgets/chart`
  widgets/chart/              Chart (props only) + ConnectedChart; useChartData; config (copy, palette)
  features/select-time/       useSelectTime (spec 11), useInitialSelectedTime (spec 10)
  features/load-series/       useLoadSeries: request per newly active layer, abort on switch-off and unmount, retry (spec 4–8)
  entities/series/            LayerSeries, SeriesState, guard, fetchSeries, series slice, normaliseSeries, selector
  entities/time/              time slice, nearestByTimeOfDay, minutesSinceLocalMidnight, formatLocalTime, selector
  shared/store/               adds the `series` and `time` keys
  shared/mocks/               series handler and data
```

## File map

| File | Change |
|---|---|
| `src/entities/series/model/types.ts` | new: `LayerSeries`, `SeriesPoint` (contract), `SeriesState` = `loading` \| `error` + `message` \| `success` + `points` |
| `src/entities/series/model/guards.ts` | new: `isLayerSeries` (spec 1, layer-panel SPEC-5) |
| `src/entities/series/api/fetchSeries.ts` | new: `fetchSeries(layerId, signal)` → `request(SERIES_PATH(layerId), { signal, validate: isLayerSeries })`, `layerId` URI-encoded |
| `src/entities/series/model/seriesSlice.ts` | new: `SeriesSliceState = Readonly<Record<string, SeriesState>>`; `seriesRequested`, `seriesSucceeded`, `seriesFailed`, `seriesRemoved`; empty initial state |
| `src/entities/series/model/normaliseSeries.ts` | new: pure; `points` → `Map<time, { normalised, value }>`; `(v − min)/(max − min)`, flat series `0.5` (spec 14) |
| `src/entities/series/model/selectors.ts` | new: `useSeries()` |
| `src/entities/series/index.ts` | new: public API |
| `src/entities/time/model/timeSlice.ts` | new: `{ selectedTime: string \| null }`; `initSelectedTime(state, points, now)` (no-op when set or range empty), `selectTime(state, points, time)` (no-op when `time` not in `points`) |
| `src/entities/time/model/localTime.ts` | new: pure `minutesSinceLocalMidnight(iso)`, `nearestByTimeOfDay(points, now)` (clamp to ends, tie → earlier, no wrap; spec 10), `formatLocalTime(iso)` → `HH:mm` via `Intl.DateTimeFormat` with `hourCycle: 'h23'` (spec 18) |
| `src/entities/time/model/selectors.ts` | new: `useSelectedTime()` |
| `src/entities/time/index.ts` | new: public API |
| `src/features/select-time/model/useSelectTime.ts` | new: returns `selectTime(time)`; dispatches `selectTime` with the current range points (spec 11, TR-12) |
| `src/features/select-time/model/useInitialSelectedTime.ts` | new: effect on range points; dispatches `initSelectedTime(…, new Date())` (spec 10) |
| `src/features/select-time/index.ts` | new |
| `src/features/load-series/model/useLoadSeries.ts` | new: see Design; returns `retry(layerId)` |
| `src/features/load-series/index.ts` | new |
| `src/widgets/chart/config.ts` | new: `CHART_CONFIG` `as const` (heading, heading id, loading prefix, empty text, Retry label) and `CHART_LINE_COLORS` `as const` (spec 21, 22) |
| `src/widgets/chart/model/buildChartData.ts` | new: pure `buildChartData(points, layers, activeIds, series)` → `{ rows, lines, loading, errors }`; rows `{ time, values: Record<layerId, { normalised, value }> }`, lines in list order with colour by list index (spec 13, 21) |
| `src/widgets/chart/model/useChartData.ts` | new: `useMemo(buildChartData, [points, layers, activeIds, series])` (TR-73) |
| `src/widgets/chart/ui/Chart.tsx` | modified: presentational; props per spec 15; states per spec 20; Recharts `ResponsiveContainer` → `LineChart` (categorical `XAxis` on `time`, `tickFormatter={formatLocalTime}`, hidden `YAxis` domain `[0, 1]`), one `Line` per descriptor with `dataKey` as a function, `connectNulls={false}`, `ReferenceLine x={selectedTime}`, custom `Tooltip` content with name, real value and unit |
| `src/widgets/chart/ui/ChartTooltip.tsx` | new: tooltip content (spec 18) |
| `src/widgets/chart/ui/ConnectedChart.tsx` | new: selectors first, then `useInitialSelectedTime`, `useLoadSeries`, `useSelectTime` (layer-panel PLAN-14 order) |
| `src/widgets/chart/ui/Chart.css` | new: chart states and plot area inside `--chart-height` |
| `src/widgets/chart/index.ts` | modified: exports `ConnectedChart` and `Chart` |
| `src/app/App.tsx` | modified: renders `ConnectedChart` |
| `src/app/App.test.tsx` | modified: the chart stub mocks `ConnectedChart` |
| `src/shared/store/appStore.ts` | modified: `series: initialSeriesState`, `time: initialTimeState` |
| `src/shared/mocks/data/series.ts` | new: `MOCK_SERIES` keyed by mock layer id, one value per hourly point (data only, as PLAN-12) |
| `src/shared/mocks/handlers/series.ts` | new: `GET /api/layers/:layerId/series` after `randomLatency()`; unknown id → 404 `NOT_FOUND` `ApiError` with message from a mock `as const` |
| `src/shared/mocks/handlers/index.ts` | modified: adds series handlers |
| `src/shared/test/series.ts` | new: shared test series for `TEST_LAYERS` |
| `vite.config.ts` | modified: `test.env.TZ` fixed (spec 12) |
| `README.md` | modified at the README stage: architecture tree lists `select-time` and `load-series` |
| tests | see Test plan |

## Types

```ts
type SeriesState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'success'; points: readonly SeriesPoint[] }
interface ChartLine { layerId: string; name: string; unit: string; color: string }
interface ChartRow { time: string; values: Readonly<Record<string, { normalised: number; value: number }>> }
interface ChartProps { rows; lines; selectedTime: string | null; list: LayerListState; activeLayerCount: number; loading: readonly { layerId; name }[]; errors: readonly { layerId; name; message }[]; onSelectTime(time: string): void; onRetry(layerId: string): void }
```

## Design

- `useLoadSeries` keeps `Map<layerId, AbortController>` and the previous active ids in refs; its effect runs on `activeLayerIds` changes.
- Newly active id whose entry (read with `store.get('series')`) is not `success` → abort any old controller, `seriesRequested`, `fetchSeries`; the result is written only while its own signal is live (TR-31).
- Newly inactive id with a live controller → abort and `seriesRemoved` (spec 6); `success` and `error` entries of inactive layers stay (spec 5; an error is requested again on reactivation).
- Requests start only on activation, on mount and on Retry, never because an entry is `error`, so a failure never loops (Claude's reading of spec 4, see Open questions).
- Cleanup aborts all controllers and clears the previous ids, so StrictMode's second mount requests again and overwrites the stale `loading` entries; nothing is written after unmount (spec 8).
- `retry(layerId)`: abort that layer's controller, request it again (spec 7).
- Cross-entity derivation (layers + series) lives in the widget's `model/`, since entities do not import each other; `Chart` itself stays logic-free (TR-53).
- Every dispatch returns whole `series` / `time` keys (layer-panel PLAN-5); `store.dispatch` from `useAppStore()` (PLAN-14).
- Click: `LineChart onClick` takes the categorical `activeLabel`, which Recharts picks as the nearest X category; `onSelectTime` is called only when it is a range point (spec 19).
- Plot shown when `lines.length > 0`; loading text lists `loading` names; list `idle`/`loading` counts as loading; empty when `activeLayerCount === 0` and the list is `success` or `error` (spec 20, edge case "layer list failed").
- Test time zone: `Asia/Bishkek` (UTC+6, no DST); the midnight case uses test points `17:00Z–19:00Z` (23:00, 00:00, 01:00 local).

## Build sequence

1. Write the tests below; confirm they fail.
2. `entities/series`: types, guard, `fetchSeries`, slice, `normaliseSeries`, selector.
3. `entities/time`: slice, local-time helpers, selector; `appStore` keys; `vite.config.ts` TZ.
4. `features/select-time` and `features/load-series`.
5. `widgets/chart`: config, `buildChartData`, `useChartData`, `Chart`, `ChartTooltip`, `ConnectedChart`, CSS; `App` wiring.
6. `shared/mocks`: series data and handler.
7. By hand in `npm run dev`, then `npm run build` and `npm run preview`: lines appear with latency, tooltip values with units, click moves the marker, toggles reuse loaded series.
8. `npm run verify`; present and wait for acceptance.
9. After acceptance, the review via the `reviewer` agent.

## Test plan

- [ ] `isLayerSeries`: accepts a contract body; rejects a missing `layerId`, non-array `points`, a non-number `value`, a non-string `time`. `fetchSeries` calls `request` (mocked) with the series path, the signal and the guard.
- [ ] Series slice: `seriesRequested`, `seriesSucceeded`, `seriesFailed`, `seriesRemoved` each touch only their own layer.
- [ ] `normaliseSeries`: per-series 0–1, flat series 0.5, real values kept.
- [ ] Time slice: `initSelectedTime` sets once and ignores an empty range; `selectTime` sets a range point and ignores one outside the range.
- [ ] `nearestByTimeOfDay` with injected `now`: nearest by local time of day regardless of date; earliest before the range; latest after it; earlier on a tie; 00:00 counted as earliest in a range crossing local midnight. `formatLocalTime` gives local `HH:mm`.
- [ ] `useLoadSeries` with `fetchSeries` mocked (deferred promises): one request per active layer; loaded layer off and on → no new request; pending layer off → aborted, late response writes nothing, on again → new request whose result alone is written; responses out of order each land in their own entry; failure then `retry` requests that layer only; failed layer off and on → requested again; unmount during requests writes nothing.
- [ ] `useInitialSelectedTime` with a fixed system time: sets the nearest point once the range loads; does not override a later `selectTime`.
- [ ] `buildChartData`: one row per range point; only active layers with `success` series become lines, in list order with palette colours; gaps for missing points; out-of-range series points ignored; loading and error lists. `useChartData` returns the same reference on unchanged inputs.
- [ ] `Chart` with `recharts` mocked as `data-testid` stubs: loading (`aria-busy`, status naming layers), error (name, message, Retry calls `onRetry(layerId)` once), empty, success (one line stub per descriptor, marker stub at `selectedTime`), errors beside loaded lines; the `LineChart` stub's `onClick` with an `activeLabel` calls `onSelectTime` once with it. `ChartTooltip`: time as `HH:mm`, name, real value and unit.
- [ ] `App`: renders the four children as stubs.
- [ ] By hand: build sequence step 7.
- [ ] `npm run verify` passes, then the review.

## Claude's choices

Claude's choices, kept as written; the user approved the plan without changing them:

1. Spec 4 trigger: a series is requested on activation, on mount and on Retry; a literal "whenever an entry is `error`" would re-request a failing layer in a loop.
2. Initial time is set from `ConnectedChart` via `useInitialSelectedTime`; the map (task 5) relies on the chart being mounted.
3. `Chart` tests mock `recharts` with stubs (CLAUDE.md rule) rather than rendering real SVG in jsdom.
4. Copy: heading "Chart", loading "Loading series: Temperature, Wind…", empty "Turn on a layer to see its series", "Retry". Palette colours chosen at build time from the app's tokens, readable in light and dark.

## Verification

Written by the `reviewer` agent after the user accepts the implementation; the push gate reads it. The user approves it by setting the Status below, only after reading the findings and resolutions.

- **Reviewed commit:** `9f388ab83992fff16d37c0fc6b610a8e113da7b6`
- **Status:** draft

### Checks

- [x] `npm run verify`: typecheck, lint and 123 tests in 22 files pass.
- [x] `npm run build`: passes. The main chunk grows from 236 kB (73 kB gzip) on `main` to 591 kB (176 kB gzip) because of Recharts, and Vite now warns about chunks over 500 kB (PERF-1). No API keys or secrets in `dist/` (the only grep hit is MSW's domain-name list). `npm audit --omit=dev`: 0 vulnerabilities.
- Re-review after the CQ-1 and CQ-4 fixes skipped at the user's request; `npm run verify` passes on the fix commit.
- [ ] By hand in `npm run dev` and `npm run preview` (lines appear with latency, tooltip shows real values with units, a click moves the marker, toggles reuse loaded series): not run by the reviewer (no browser in the review session). This also confirms that Recharts 3's `activeLabel` gives the clicked time, which unit tests can only stub.

### Findings

One row per finding from the Security, Code Quality & Maintainability, Test Coverage & Correctness and Performance & Efficiency lenses, or "No findings." per lens.

| ID | Lens | Severity | Finding | Resolution | AI involvement |
|---|---|---|---|---|---|
| SEC-1 | Security | — | No findings. Data reaches the DOM only as React text (no `dangerouslySetInnerHTML`; error messages and values come from the API), `layerId` is URI-encoded, responses go through `isLayerSeries`, tooltip colours come from the `as const` palette, and the bundle has no keys. | — | — |
| CQ-1 | Code Quality / Test Coverage | minor | `src/widgets/chart/model/buildChartData.ts:56`: `normaliseSeries` runs on all of a series' points, so a value outside the range is hidden from the plot but still sets the line's min/max. That breaks the spec edge case "series value for a time outside the range: ignored". The `buildChartData` test mocks `normaliseSeries`, so it can't catch this. Fix: filter `entry.points` to the range points before `normaliseSeries`, and add an assertion that the in-range scaling is unchanged. | Fixed: out-of-range points are filtered before `normaliseSeries`; the test asserts the scaling input. | Found by Claude (reviewer); fix by Claude, chosen by the user. |
| CQ-2 | Code Quality | minor | `documents/design/chart/plan.md` "Claude's choices": four non-obvious choices sit outside `## Decisions`. One of them, the spec 4 trigger (request only on activation, mount and Retry), departs from the literal spec. Unlike the layer-panel plan, they have no Decision record. Fix: move choices 1 and 2 into `## Decisions` as PLAN-3 and PLAN-4 (docs only). | Accepted: `## Decisions` holds only user-made decisions; the user declined recording build choices. | Found by Claude (reviewer); accepted by the user. |
| CQ-3 | Code Quality | minor | `src/widgets/chart/ui/Chart.tsx:79`: `aria-busy` is on the whole Chart region, but spec 20 says "the plot area". While loading there is often no plot to mark, so the region is the workable reading. Suggest: accept as is, and record it with CQ-2. | Accepted: while loading there is usually no plot to mark, so the region carries `aria-busy`. | Found by Claude (reviewer); accepted by the user. |
| CQ-4 | Code Quality | minor | `src/shared/mocks/data/layers.ts:1`: `HOURLY_TIME_POINTS` is now exported as the plan said, but nothing imports it, and `src/shared/mocks/data/series.ts` repeats the time literals. Fix: drop the `export` and the plan's file-map row, or accept as is. | Fixed: `export` dropped and the plan's file-map row removed. | Found by Claude (reviewer); fix by Claude, chosen by the user. |
| TC-1 | Test Coverage | minor | `src/features/select-time/model/useSelectTime.ts`: has no test file of its own. It is only used for real inside `useInitialSelectedTime.test.tsx`. The range check lives in the tested `selectTime` slice function, and `useToggleLayer` follows the same no-test pattern. Suggest: accept as is. | Accepted: thin wrapper over the tested `selectTime`; the user agreed it needs no own test. | Found by Claude (reviewer); accepted by the user. |
| PERF-1 | Performance | minor | Build: Recharts more than doubles the main chunk (73 kB to 176 kB gzip), and Vite warns about the 500 kB limit. TR-50 requires Recharts, and the dashboard needs the chart on first paint. Suggest: accept as is; code-splitting is YAGNI here. Re-renders are fine: chart data is memoized on its four inputs, a time click only re-renders the chart, and stale responses are aborted. | Accepted: TR-50 requires Recharts and the chart is on first paint; code-splitting is YAGNI. | Found by Claude (reviewer); accepted by the user. |

## Decisions

### PLAN-1 — Series loading lives in a `load-series` feature

- **Status:** active
- **Decision:** The series-loading hook is a new feature `features/load-series`, matching `load-layers` (spec 23).
- **Options considered:** Feature `load-series`; `widgets/chart/model/useLoadSeries`.
- **Why:** Request logic stays out of the widget, as with `load-layers`.
- **Trade-off accepted:** One more slice than the spec's list names.
- **AI involvement:** Proposed by Claude; accepted by the user.

### PLAN-2 — Tests run in the `Asia/Bishkek` time zone

- **Status:** active
- **Decision:** All tests run with the time zone fixed to `Asia/Bishkek` (UTC+6, no daylight saving).
- **Options considered:** `Asia/Bishkek`; another fixed non-UTC zone.
- **Why:** A fixed non-UTC zone without daylight saving makes local-time results stable and exposes UTC/local mix-ups.
- **Trade-off accepted:** Local-time behaviour is tested in one zone only.
- **AI involvement:** Proposed by Claude; accepted by the user.
