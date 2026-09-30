import { ACTIVE_LAYER_FIXTURE_IDS, LAYER_FIXTURES } from './layerFixtures'
import { toggleLayerIds } from './toggleLayerIds'
import type { LayerSummary } from './types'

export interface LayerState {
  layers: readonly LayerSummary[]
  activeLayerIds: readonly string[]
}

export const initialLayerState: LayerState = {
  layers: LAYER_FIXTURES,
  activeLayerIds: ACTIVE_LAYER_FIXTURE_IDS,
}

export function toggleLayer(state: LayerState, layerId: string): LayerState {
  return { ...state, activeLayerIds: toggleLayerIds(state.activeLayerIds, layerId) }
}
