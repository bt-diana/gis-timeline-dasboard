import { toggleLayerIds } from './toggleLayerIds'
import type { LayerDefinition } from './types'

export type LayerListState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export interface LayerState {
  layers: readonly LayerDefinition[]
  activeLayerIds: readonly string[]
  list: LayerListState
}

export const initialLayerState: LayerState = {
  layers: [],
  activeLayerIds: [],
  list: { status: 'idle' },
}

export function startLoading(state: LayerState): LayerState {
  return { ...state, list: { status: 'loading' } }
}

export function loadSucceeded(state: LayerState, layers: readonly LayerDefinition[]): LayerState {
  const knownActiveIds = layers.filter((layer) => state.activeLayerIds.includes(layer.id)).map((layer) => layer.id)
  const activeLayerIds = knownActiveIds.length > 0 ? knownActiveIds : layers.map((layer) => layer.id)
  return { layers, activeLayerIds, list: { status: 'success' } }
}

export function loadFailed(state: LayerState, message: string): LayerState {
  return { ...state, list: { status: 'error', message } }
}

export function toggleLayer(state: LayerState, layerId: string): LayerState {
  return { ...state, activeLayerIds: toggleLayerIds(state.activeLayerIds, layerId) }
}
