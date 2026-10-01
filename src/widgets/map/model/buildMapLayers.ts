import type { LayerDefinition } from '@entities/layer'
import type { SnapshotSliceState } from '@entities/snapshot'
import type { MapLayerData } from '../lib/types'
import { toMapFeatures } from './toMapFeatures'

export function buildMapLayers(
  layers: readonly LayerDefinition[],
  activeLayerIds: readonly string[],
  snapshots: SnapshotSliceState,
): MapLayerData[] {
  return layers.flatMap(({ id, kind }) => {
    const snapshot = snapshots[id]
    if (!activeLayerIds.includes(id) || !snapshot) return []
    const features = snapshot.status === 'success' || snapshot.status === 'loading' ? snapshot.features : null
    return features ? [{ id, kind, data: toMapFeatures(features) }] : []
  })
}

export function isLoading(activeLayerIds: readonly string[], snapshots: SnapshotSliceState): boolean {
  return activeLayerIds.some((id) => {
    const status = snapshots[id]?.status
    return status === 'loading' || status === 'stale'
  })
}
