import type { SeriesPoint } from './types'

export interface NormalisedValue {
  normalised: number
  value: number
}

const FLAT_SERIES_LEVEL = 0.5

export function normaliseSeries(points: readonly SeriesPoint[]): ReadonlyMap<string, NormalisedValue> {
  const values = points.map(({ value }) => value)
  const min = Math.min(...values)
  const span = Math.max(...values) - min
  return new Map(
    points.map(({ time, value }) => [
      time,
      { normalised: span === 0 ? FLAT_SERIES_LEVEL : (value - min) / span, value },
    ]),
  )
}
