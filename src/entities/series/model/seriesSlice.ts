import type { SeriesPoint, SeriesState } from './types'

export type SeriesSliceState = Readonly<Record<string, SeriesState>>

export const initialSeriesState: SeriesSliceState = {}

export function seriesRequested(state: SeriesSliceState, layerId: string): SeriesSliceState {
  return { ...state, [layerId]: { status: 'loading' } }
}

export function seriesSucceeded(
  state: SeriesSliceState,
  layerId: string,
  points: readonly SeriesPoint[],
): SeriesSliceState {
  return { ...state, [layerId]: { status: 'success', points } }
}

export function seriesFailed(state: SeriesSliceState, layerId: string, message: string): SeriesSliceState {
  return { ...state, [layerId]: { status: 'error', message } }
}

export function seriesRemoved(state: SeriesSliceState, layerId: string): SeriesSliceState {
  return Object.fromEntries(Object.entries(state).filter(([id]) => id !== layerId))
}
