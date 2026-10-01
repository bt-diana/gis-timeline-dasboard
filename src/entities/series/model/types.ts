export interface SeriesPoint {
  readonly time: string
  readonly value: number
}

export interface LayerSeries {
  readonly layerId: string
  readonly points: readonly SeriesPoint[]
}

export type SeriesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; points: readonly SeriesPoint[] }
