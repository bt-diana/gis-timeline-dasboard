# GIS Timeline Dashboard
 
Interactive GIS map with time-based data layers, timeline sync, and Recharts analytics.

Demo: https://gis-timeline-dasboard.netlify.app/
 
> 🚧 **Work in progress.** The project is just starting, and the current repo progress is reflected in the roadmap at [documents/ROADMAP.md](documents/ROADMAP.md). This README will continue to be updated as the work goes on.
 
## About
 
A small React + TypeScript app with an interactive map, several data layers, a timeline and charts.
The goal is to build one data flow between the map, the timeline and the charts, so all of them always show the same state.
 
## Architecture

The code follows [Feature-Sliced Design](https://feature-sliced.design/). Each layer imports only from the layers below it, and slices on the same layer don't import each other.

```
src/
  app/             App: store provider and the page grid
  widgets/         layer-panel, header, map, chart
  features/        user actions, e.g. toggle-layer
  entities/        business entities, e.g. layer: types, state slice, selectors
  shared/store/    one Vedro store
```

There is no `pages/` layer, because the app has only one page.

State lives in one Vedro store. Each entity keeps its part of the state in its own slice file (`entities/<entity>/model/<entity>Slice.ts`), and `shared/store/appStore.ts` puts the slices together. This is the only place where `shared/` imports from a higher layer. Components select only the part of the state they need, so a change re-renders only the components that use it.

UI components get their data through props. A connected part of the widget reads the store and passes the data and actions down.

### How it evolved

At first, code was grouped by feature in `src/features/<feature>/`, with shared code in `src/shared/`. The layer panel was planned as a component driven only by props, and the store was planned for a later task, together with the API requests.

Then I decided to make the layer switches work right away. For that, the active layers had to be in the store, so I configured Vedro in the layer panel task instead of later. The map and the chart will need the active layers too, so keeping them in the panel state was not an option.

After adding the store, a question came up: where should the feature-related state be stored? I chose Feature-Sliced Design to answer it. I often follow FSD, and I like its business-logic thinking: the code is split by business entities and user actions, so each piece of state has a clear place next to its logic.

The decisions are recorded in `documents/design/layer-panel/` (INT-3 – INT-5, PLAN-5, PLAN-7, PLAN-12 – PLAN-14).

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

Start the app locally:

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

## Repository organization

- src/app — app shell, store provider and the dev-only QA control
- src/widgets — layer-panel, header, map and chart
- src/features — user actions: toggle-layer, load-layers
- src/entities — business entities: layer (types, API call, state slice, selectors)
- src/shared/api — request function and API errors
- src/shared/store — the Vedro store
- src/shared/mocks — MSW mocks for `npm run dev` only
- src/shared/test — test setup and test data
- documents — requirements, roadmap, design docs and reviews
