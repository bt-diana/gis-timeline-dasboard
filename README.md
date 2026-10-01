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
  features/        user actions: toggle-layer, load-layers
  entities/        business entities, e.g. layer: types, API call, state slice, selectors
  shared/api/      request function and API errors
  shared/store/    one Vedro store
  shared/mocks/    the mock API (MSW)
```

There is no `pages/` layer, because the app has only one page.

State lives in one Vedro store. Each entity keeps its part of the state in its own slice file (`entities/<entity>/model/<entity>Slice.ts`), and `shared/store/appStore.ts` puts the slices together. This is the only place where `shared/` imports from a higher layer. Components select only the part of the state they need, so a change re-renders only the components that use it.

UI components get their data through props. A connected part of the widget reads the store and passes the data and actions down. I use Vedro's own hooks as they are; my custom hooks only add logic on top of them.

### How it evolved

At first, code was grouped by feature in `src/features/<feature>/`, with shared code in `src/shared/`. The layer panel was planned as a component driven only by props, and the store was planned for a later task, together with the API requests.

Then I decided to make the layer switches work right away. For that, the active layers had to be in the store, so I configured Vedro in the layer panel task instead of later. The map and the chart will need the active layers too, so keeping them in the panel state was not an option.

After adding the store, a question came up: where should the feature-related state be stored? I chose Feature-Sliced Design to answer it. I often follow FSD, and I like its business-logic thinking: the code is split by business entities and user actions, so each piece of state has a clear place next to its logic.

Later I decided that each roadmap task should be a fully working feature, not a UI first and the data later. So the layer panel task also got the API client, the layers request and the mock API. At first the mock API ran only in dev, but then the built app and the demo had no data, so now it runs in every build.

During the review, Claude proposed to replace Vedro's hooks with its own hooks on React's `useSyncExternalStore`. I rejected it: the task is to show how Vedro is used, so I keep Vedro's hooks as they are and accept their limits.

The decisions are recorded in `documents/design/layer-panel/` (INT-3 – INT-5, SPEC-7, PLAN-5, PLAN-7, PLAN-12 – PLAN-15).

## Data flow

A request goes through one function in `shared/api`. It passes an `AbortSignal`, checks the response against the API contract, and turns any failure into a short message for the user. The `layer` entity has the API call, and the `load-layers` feature writes the result to the store. When a new request starts, the old one is cancelled, and only the newest response is written, so a slow old response never replaces a newer one.

There is no real backend. MSW serves the mock API in the browser in every build, so the app works with `npm run dev`, with `npm run build`, and on the demo. Responses come with a random delay of 300–1500 ms. Tests do not use MSW: they mock the request functions directly.

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
