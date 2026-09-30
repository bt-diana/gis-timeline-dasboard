# GIS Timeline Dashboard
 
Interactive GIS map with time-based data layers, timeline sync, and Recharts analytics.
 
> 🚧 **Work in progress.** The project is just starting, and the current repo progress is reflected in the roadmap at [documents/ROADMAP.md](documents/ROADMAP.md). This README will continue to be updated as the work goes on.
 
## About
 
A small React + TypeScript app with an interactive map, several data layers, a timeline and charts.
The goal is to build one data flow between the map, the timeline and the charts, so all of them always show the same state.
 
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

- src/app — app shell and top-level layout
- src/features/header — dashboard header
- src/features/layer — layer panel area
- src/features/map — map region placeholder
- src/features/chart — chart region placeholder
- src/test — shared test setup
