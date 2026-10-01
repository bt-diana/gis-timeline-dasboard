import type { LayerDefinition } from './types'

export interface TimelineRange {
  points: readonly string[]
  first: string | null
  last: string | null
}

export function timelineRange(layers: readonly LayerDefinition[]): TimelineRange {
  const points = [...new Set(layers.flatMap((layer) => layer.timePoints))].sort(
    (a, b) => Date.parse(a) - Date.parse(b),
  )
  return { points, first: points.at(0) ?? null, last: points.at(-1) ?? null }
}
