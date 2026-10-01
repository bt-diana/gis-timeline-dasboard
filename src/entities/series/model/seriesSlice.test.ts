import { TEST_SERIES } from '@shared/test/series'
import {
  initialSeriesState,
  seriesFailed,
  seriesRemoved,
  seriesRequested,
  seriesSucceeded,
  type SeriesSliceState,
} from './seriesSlice'

const windLoaded: SeriesSliceState = { wind: { status: 'success', points: TEST_SERIES.wind.points } }

describe('seriesSlice', () => {
  it('starts empty', () => {
    expect(initialSeriesState).toEqual({})
  })

  it('seriesRequested marks only that layer as loading', () => {
    expect(seriesRequested(windLoaded, 'temperature')).toEqual({ ...windLoaded, temperature: { status: 'loading' } })
  })

  it('seriesSucceeded stores the points for only that layer', () => {
    const state = seriesRequested(windLoaded, 'temperature')

    expect(seriesSucceeded(state, 'temperature', TEST_SERIES.temperature.points)).toEqual({
      ...windLoaded,
      temperature: { status: 'success', points: TEST_SERIES.temperature.points },
    })
  })

  it('seriesFailed stores the message for only that layer', () => {
    const state = seriesRequested(windLoaded, 'temperature')

    expect(seriesFailed(state, 'temperature', 'Series service is down.')).toEqual({
      ...windLoaded,
      temperature: { status: 'error', message: 'Series service is down.' },
    })
  })

  it('seriesRemoved drops only that layer entry', () => {
    const state = seriesRequested(windLoaded, 'temperature')

    expect(seriesRemoved(state, 'temperature')).toEqual(windLoaded)
  })

  it('does not change the given state', () => {
    const state = { ...windLoaded }

    seriesRequested(state, 'temperature')
    seriesRemoved(state, 'wind')

    expect(state).toEqual(windLoaded)
  })
})
