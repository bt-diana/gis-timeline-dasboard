import type { LayerSummary } from '@features/layer/types'

export const LAYER_FIXTURES: readonly LayerSummary[] = [
  { id: 'temperature', name: 'Temperature', kind: 'points', unit: '°C' },
  { id: 'wind', name: 'Wind', kind: 'arrows', unit: 'm/s' },
  { id: 'insolation', name: 'Insolation', kind: 'heatmap', unit: 'W/m²' },
] as const

export const ACTIVE_LAYER_FIXTURE_IDS = ['wind'] as const
