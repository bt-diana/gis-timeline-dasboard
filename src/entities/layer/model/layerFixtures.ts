import type { LayerSummary } from './types'

export const LAYER_FIXTURES: readonly LayerSummary[] = [
  { id: 'temperature', name: 'Temperature', kind: 'points', unit: '°C' },
  { id: 'wind', name: 'Wind', kind: 'arrows', unit: 'm/s' },
  { id: 'insolation', name: 'Insolation', kind: 'heatmap', unit: 'W/m²' },
]

export const ACTIVE_LAYER_FIXTURE_IDS: readonly string[] = ['wind']
