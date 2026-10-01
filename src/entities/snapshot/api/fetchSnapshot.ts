import { request } from '@shared/api'
import { isLayerSnapshot } from '../model/guards'
import type { LayerSnapshot } from '../model/types'

const snapshotPath = (layerId: string, time: string) =>
  `/api/layers/${encodeURIComponent(layerId)}/snapshot?time=${encodeURIComponent(time)}`

export function fetchSnapshot(layerId: string, time: string, signal: AbortSignal): Promise<LayerSnapshot> {
  return request(snapshotPath(layerId, time), { signal, validate: isLayerSnapshot })
}
