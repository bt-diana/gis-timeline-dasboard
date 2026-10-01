import { isRecord } from '@shared/lib'
import type { LayerSnapshot, SnapshotFeature, SnapshotFeatures, SnapshotProperties } from './types'

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

function isSnapshotProperties(value: unknown): value is SnapshotProperties {
  if (!isRecord(value)) return false
  return isNumber(value.value) || (isNumber(value.speed) && isNumber(value.direction))
}

function isSnapshotFeature(value: unknown): value is SnapshotFeature {
  if (!isRecord(value) || value.type !== 'Feature' || !isRecord(value.geometry)) return false
  const { type, coordinates } = value.geometry
  return (
    type === 'Point' &&
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    coordinates.every(isNumber) &&
    isSnapshotProperties(value.properties)
  )
}

function isSnapshotFeatures(value: unknown): value is SnapshotFeatures {
  return (
    isRecord(value) &&
    value.type === 'FeatureCollection' &&
    Array.isArray(value.features) &&
    value.features.every(isSnapshotFeature)
  )
}

export function isLayerSnapshot(value: unknown): value is LayerSnapshot {
  return (
    isRecord(value) &&
    typeof value.layerId === 'string' &&
    typeof value.time === 'string' &&
    isSnapshotFeatures(value.features)
  )
}
