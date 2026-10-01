export { fetchSeries } from './api/fetchSeries'
export type { LayerSeries, SeriesPoint, SeriesState } from './model/types'
export { normaliseSeries, type NormalisedValue } from './model/normaliseSeries'
export {
  seriesFailed,
  seriesRemoved,
  seriesRequested,
  seriesSucceeded,
  type SeriesSliceState,
} from './model/seriesSlice'
export { useSeries } from './model/selectors'
