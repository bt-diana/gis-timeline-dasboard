# GIS Timeline Dashboard
 
Interactive GIS map with time-based data layers, timeline sync, and Recharts analytics.

Demo: https://gis-timeline-dasboard.netlify.app/
 
The work went task by task, as listed in [documents/ROADMAP.md](documents/ROADMAP.md).

## About
 
A small React + TypeScript app with an interactive map, several data layers, a timeline and charts.
The goal is to build one data flow between the map, the timeline and the charts, so all of them always show the same state.
 
## Architecture

The code follows [Feature-Sliced Design](https://feature-sliced.design/). Each layer imports only from the layers below it, and slices on the same layer don't import each other.

```
src/
  app/             App: store provider and the page grid
  widgets/         layer-panel, header, map, chart
  features/        user actions and loading: toggle-layer, select-time, retry-snapshot,
                   load-layers, load-series, load-snapshots
  entities/        layer, series, snapshot, time: types, API call, state slice, selectors
  shared/lib/      small helpers
  shared/api/      request function and API errors
  shared/store/    one Vedro store
  shared/mocks/    the mock API (MSW)
```

There is no `pages/` layer, because the app has only one page.

UI components get their data through props. A connected part of the widget (`Connected*.tsx`) reads the store and passes the data and actions down.

### Why MapLibre GL JS

I compared MapLibre GL JS, Mapbox GL JS, OpenLayers and Google Maps on written criteria before writing any map code. MapLibre and Mapbox scored the same: both are WebGL, describe layers as JSON style objects, and have points, symbols and heatmap layers built in. MapLibre won the tie: it has an open license, needs no access token and is about a third of Mapbox's size. Layers described as JSON fit the idea that a layer is data, not code. The background is a small bundled GeoJSON, so the demo needs no tile service.

The map is used only behind an adapter (`widgets/map/lib/createMapLibreAdapter.ts`) with two methods, `setLayers` and `destroy`, so the rest of the app does not know about MapLibre and the library can be replaced in one file.

The decision is in `documents/design/map-library-selection/intent.md` (INT-4).

### State in Vedro

The app has one Vedro store with four slices:

| Slice | What it holds |
|---|---|
| `layer` | layer definitions, active layer ids, the status of the layer list request |
| `time` | the selected time |
| `series` | the chart series and its status, per layer |
| `snapshot` | the map data for the selected time and its status, per layer |

Each entity keeps its slice in its own file (`entities/<entity>/model/<entity>Slice.ts`) as pure functions that take the state and return a new one, so they are tested without React. `shared/store/appStore.ts` puts the slices together. This is the only place where `shared/` imports from a higher layer.

Components read the store through small selector hooks (`useActiveLayerIds`, `useSelectedTime`, `useSnapshots`…), so each one subscribes only to the part it uses. Derived data, such as the timeline range, is computed from the state, not stored. I use Vedro's own hooks as they are; my custom hooks only add logic on top of them.

### How it evolved

At first, code was grouped by feature in `src/features/<feature>/`, with shared code in `src/shared/`. The layer panel was planned as a component driven only by props, and the store was planned for a later task, together with the API requests.

Then I decided to make the layer switches work right away. For that, the active layers had to be in the store, so I configured Vedro in the layer panel task instead of later. The map and the chart will need the active layers too, so keeping them in the panel state was not an option.

After adding the store, a question came up: where should the feature-related state be stored? I chose Feature-Sliced Design to answer it. I often follow FSD, and I like its business-logic thinking: the code is split by business entities and user actions, so each piece of state has a clear place next to its logic.

Later I decided that each roadmap task should be a fully working feature, not a UI first and the data later. So the layer panel task also got the API client, the layers request and the mock API. At first the mock API ran only in dev, but then the built app and the demo had no data, so now it runs in every build.

During the review, Claude proposed to replace Vedro's hooks with its own hooks on React's `useSyncExternalStore`. I rejected it: the task is to show how Vedro is used, so I keep Vedro's hooks as they are and accept their limits.

The decisions are recorded in `documents/design/layer-panel/` (INT-3 – INT-5, SPEC-7, PLAN-5, PLAN-7, PLAN-12 – PLAN-15).

## Data flow

The store is the only link between the widgets. No widget talks to another one directly.

1. `load-layers` requests `GET /api/layers` and writes the layer definitions. The timeline range is the list of time points of the layers.
2. `select-time` sets the first selected time: the point nearest to the current time of day. After that, a click on the chart selects a time. There is no separate timeline control: the chart already shows every time point, so it is the time picker.
3. The layer panel toggles active layer ids.
4. `load-series` requests the series of each active layer once. The chart draws them and marks the selected time. A series does not depend on the time, so it is kept when the layer is switched off and reused when it is switched on again.
5. `load-snapshots` requests the snapshot of each active layer at the selected time. The map draws them; the panel shows per-layer loading and errors with a retry.

So a click on the chart changes only `time.selectedTime`, and the map, chart and panel all follow from it.

### Requests and race conditions

A request goes through one function in `shared/api`. It passes an `AbortSignal`, checks the response against the API contract, and turns any failure into a short message for the user. Each entity has its API call, and a `load-*` feature writes the result to the store.

Each layer has its own `AbortController`. When the time or the active layers change, the old request is aborted, and a response from an aborted request is never written. So a slow response for an old time point or for a layer that was switched off cannot replace newer data. Tests cover these cases with responses resolved out of order.

There is no real backend. MSW serves the mock API in the browser in every build, so the app works with `npm run dev`, with `npm run build`, and on the demo. Responses come with a random delay of 300–1500 ms, so out-of-order responses really happen. Tests do not use MSW: they mock the request functions directly.

## Boundaries

| Part | Where | What it does |
|---|---|---|
| UI | `widgets/*/ui` | Renders props, calls callbacks. No requests, no store access except in `Connected*.tsx` |
| State | `entities/*/model`, `shared/store` | Slices as pure functions, selectors |
| Data access | `shared/api`, `entities/*/api`, `features/load-*` | Requests, validation, cancellation, writing results to the store. Knows nothing about the UI |
| Map | `widgets/map/lib` | The MapLibre adapter and one renderer per rendering kind. Gets ready-made GeoJSON, reads no store |
| Analytics | `widgets/chart` | Builds the chart data from the store with a memoized selector, draws it with Recharts, reports clicks |

ESLint checks the FSD rules: layers import only from lower layers, and slices on the same layer don't import each other.

## Performance

What I considered:

- **Re-renders.** Components subscribe only to the slice they use, so a time change does not re-render the layer list, and a toggle does not re-render the header.
- **The map instance.** It is created once. React re-renders don't recreate it; the adapter updates it imperatively.
- **Map updates.** A time change updates the data of an existing source with `setData`. A toggle hides or shows a layer through `visibility` instead of removing and adding it again.
- **No flashing.** While the next time point loads, the map keeps the previous data and one indicator above the map names the requested time.
- **Inactive layers.** They are not requested and not drawn.
- **Derived data.** Chart data and map features are built in `useMemo` and only when their inputs change.
- **Requests.** Superseded requests are aborted, not just ignored, so they don't use the network. A loaded series is reused instead of being requested again.

Not considered: GPU and device limits with many visible layers (WebGL support, texture memory). With 3 layers it doesn't matter; with 100 it would need measuring on weak devices.

## Scaling from 3 to 100+ layers

- **A layer is data.** A new layer is a new entry in `GET /api/layers` with its `kind`, `unit` and time points. No new folder and no new code.
- **Rendering by kind.** The map picks a renderer from the layer's `kind` (`points`, `arrows`, `heatmap`). A new kind is one new renderer function.
- **Load only what is visible.** Data is requested per active layer, so 100 defined layers cost nothing until they are switched on.
- **Per-layer state.** Series and snapshots are keyed by layer id, with their own status and their own cancellation, so one slow or failing layer does not block the others.

What would change at 100+ layers:

- The panel would need search, groups and a virtualized list.
- One chart with 100 lines is unreadable; it would need a limit or several small charts.
- Many snapshot requests per time change would need a batch endpoint, or a limit on the number of active layers.
- Large datasets would move to vector tiles or be loaded by the map itself instead of passing through the store.

## Trade-offs

- **The chart is the time picker.** The requirement asks for a timeline; the chart already shows every time point, so a second control would duplicate it. Time is selected only by a click, not from the keyboard, and there is no autoplay.
- **Each chart line is scaled to its own range.** Three units (°C, m/s, W/m²) fit on one chart without three axes. The Y axis has no absolute values; real values are in the tooltip.
- **Local time.** The first selected time and the labels use the browser's time zone, so viewers in different zones see different labels.
- **One loading indicator** above the map instead of one per layer. It doesn't say which layer is still loading.
- **Errors in two places.** A failed series shows its error and retry in the chart, a failed snapshot in the layer panel.
- **Series stay in memory** after their layer is switched off, so switching it on again is instant.
- **Vedro's hooks as they are.** I didn't replace them with my own, because the task is to show how Vedro is used.
- **A mock API in production.** MSW runs in the built app, because there is no backend and the demo must work.
- **A plain background.** Bundled GeoJSON instead of real tiles; the task is about architecture, not visuals.
- **Desktop only.** No mobile layout.

## AI usage

I built this project with Claude Code, following Anthropic's AI-native SDLC: design docs, tests, code and review for every feature. Claude wrote most of the documents, tests and code; I reviewed every step and made the architectural decisions. What Claude proposed, what I changed or rejected and why, and my experience with this way of working are in [documents/AI_USAGE.md](documents/AI_USAGE.md).

## Stack
 
- React
- TypeScript
- Vite
- MapLibre GL
- Recharts
- Vedro
- MSW
- Vitest + Testing Library

## Scripts

Install dependencies:

```bash
npm install
```

Start the app locally (the mock API runs in the browser):

```bash
npm run dev
```

Build and check the production app (the mock API is included, so the build works without a backend):

```bash
npm run build
npm run preview
```

Run the test suite:

```bash
npm test
```

Run the full verification pipeline:

```bash
npm run verify
```

This runs the type check, lint, and tests together.
