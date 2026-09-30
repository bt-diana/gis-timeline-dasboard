---
status: approved
---

# Mock API Contract — GIS Timeline Dashboard

Served by MSW (TR-05). All bodies are JSON; times are ISO 8601 UTC strings. Implements TR-20, TR-22, TR-23, TR-30, TR-31, TR-33, TR-70.

## Types

```ts
type RenderingKind = 'points' | 'arrows' | 'heatmap';

interface LayerDefinition {
  id: string;
  name: string;
  kind: RenderingKind;
  unit: string;
  timePoints: string[];
}

interface LayerSnapshot {
  layerId: string;
  time: string;
  features: GeoJSON.FeatureCollection<GeoJSON.Point, SnapshotProperties>;
}

type SnapshotProperties =
  | { value: number }
  | { speed: number; direction: number };

interface LayerSeries {
  layerId: string;
  points: { time: string; value: number }[];
}

interface ApiError {
  error: { code: 'BAD_REQUEST' | 'NOT_FOUND' | 'NO_DATA' | 'INTERNAL'; message: string };
}
```

## Layers

`layerId` is the `id` of a `LayerDefinition` returned by `GET /api/layers`. It is an opaque string; clients never hard-code the set. Adding a layer means adding a definition and its data, with no new endpoint (TR-21).

The mock ships three layers:

| `id` | `name` | `kind` | `unit` | Snapshot properties |
|---|---|---|---|---|
| `temperature` | Temperature | `points` | `°C` | `{ value }` |
| `wind` | Wind | `arrows` | `m/s` | `{ speed, direction }` |
| `insolation` | Insolation | `heatmap` | `W/m²` | `{ value }` |

## Endpoints

| Method and path | Returns | Notes |
|---|---|---|
| `GET /api/layers` | `LayerDefinition[]` | Definitions only, no data. The shared timeline range is derived from the union of `timePoints` (TR-22). |
| `GET /api/layers/:layerId/snapshot?time=<ISO>` | `LayerSnapshot` | Data for one layer at one time point. Called only for active layers (TR-70, TR-72). |
| `GET /api/layers/:layerId/series` | `LayerSeries` | One aggregated value per time point, for the chart. Independent of the selected time. |

- `direction` is degrees clockwise from north; `speed` uses the layer's `unit`.
- Response shapes per `kind`: `points` and `heatmap` use `{ value }`; `arrows` uses `{ speed, direction }`.

## Errors

| Status | `code` | When |
|---|---|---|
| 400 | `BAD_REQUEST` | `time` missing or not a valid ISO time |
| 404 | `NOT_FOUND` | Unknown `layerId` |
| 404 | `NO_DATA` | Layer exists but has no data for `time` (TR-23) |
| 500 | `INTERNAL` | Any other failure |

The UI shows `error.message` only, never the raw response (TR-30).

## Behaviour

- Latency: every response is delayed 300–1500 ms at random, so responses can arrive out of order (TR-33).
- Cancellation: callers pass an `AbortSignal`; a superseded request is aborted and its result discarded (TR-31).
- Failure injection: a test-only switch makes a chosen layer return `500`, used by the loading/error tests and the demo.

## Open points

- Time points per layer are identical in the first version (hourly 10:00–14:00); `NO_DATA` exists so layers with different points remain possible.
- Coordinates are WGS84 lon/lat, to match the map feature.
