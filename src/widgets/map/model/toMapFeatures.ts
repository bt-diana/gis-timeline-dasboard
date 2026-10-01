import type { SnapshotFeatures, SnapshotProperties } from '@entities/snapshot'
import type { MapFeatures } from '../lib/types'

const FLAT_LEVEL = 0.5

const magnitude = (properties: SnapshotProperties) => ('value' in properties ? properties.value : properties.speed)
const direction = (properties: SnapshotProperties) => ('direction' in properties ? properties.direction : 0)

const cache = new WeakMap<SnapshotFeatures, MapFeatures>()

export function toMapFeatures(snapshot: SnapshotFeatures): MapFeatures {
  const cached = cache.get(snapshot)
  if (cached) return cached
  const values = snapshot.features.map(({ properties }) => magnitude(properties))
  const min = Math.min(...values)
  const span = Math.max(...values) - min
  const result: MapFeatures = {
    type: 'FeatureCollection',
    features: snapshot.features.map(({ geometry, properties }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [...geometry.coordinates] },
      properties: {
        norm: span === 0 ? FLAT_LEVEL : (magnitude(properties) - min) / span,
        direction: direction(properties),
      },
    })),
  }
  cache.set(snapshot, result)
  return result
}
