import { request } from '@shared/api'
import { isLayerDefinitionList } from '../model/guards'
import type { LayerDefinition } from '../model/types'

export function fetchLayers(signal: AbortSignal): Promise<readonly LayerDefinition[]> {
  return request('/api/layers', { signal, validate: isLayerDefinitionList })
}
