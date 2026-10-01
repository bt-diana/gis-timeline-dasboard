import { request } from '@shared/api'
import { isLayerSeries } from '../model/guards'
import type { LayerSeries } from '../model/types'

const seriesPath = (layerId: string) => `/api/layers/${encodeURIComponent(layerId)}/series`

export function fetchSeries(layerId: string, signal: AbortSignal): Promise<LayerSeries> {
  return request(seriesPath(layerId), { signal, validate: isLayerSeries })
}
