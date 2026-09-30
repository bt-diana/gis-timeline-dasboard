import { ACTIVE_LAYER_FIXTURE_IDS } from './layerFixtures'

export interface LayerState {
  activeLayerIds: readonly string[]
}

export const initialLayerState: LayerState = {
  activeLayerIds: [...ACTIVE_LAYER_FIXTURE_IDS],
}

export function toggleLayerIds(activeLayerIds: readonly string[], layerId: string): readonly string[] {
  if (activeLayerIds.includes(layerId)) {
    return activeLayerIds.filter((id) => id !== layerId)
  }

  return [...activeLayerIds, layerId]
}
