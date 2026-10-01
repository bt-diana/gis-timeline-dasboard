import { isRecord } from '@shared/lib'
import type { LayerSeries, SeriesPoint } from './types'

function isSeriesPoint(value: unknown): value is SeriesPoint {
  return isRecord(value) && typeof value.time === 'string' && typeof value.value === 'number'
}

export function isLayerSeries(value: unknown): value is LayerSeries {
  return (
    isRecord(value) &&
    typeof value.layerId === 'string' &&
    Array.isArray(value.points) &&
    value.points.every(isSeriesPoint)
  )
}
