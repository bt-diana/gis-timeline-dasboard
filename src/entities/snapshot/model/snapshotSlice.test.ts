import { TEST_SNAPSHOTS } from '@shared/test/snapshots'
import {
  initialSnapshotState,
  snapshotFailed,
  snapshotRemoved,
  snapshotRequested,
  snapshotRetried,
  snapshotSucceeded,
  type SnapshotSliceState,
} from './snapshotSlice'

const { temperature, wind } = TEST_SNAPSHOTS
const T10 = '2026-01-01T10:00:00Z'
const T11 = '2026-01-01T11:00:00Z'
const windLoaded: SnapshotSliceState = { wind: { status: 'success', time: T10, features: wind.features } }

describe('snapshotSlice', () => {
  it('starts empty', () => {
    expect(initialSnapshotState).toEqual({})
  })

  it('snapshotRequested marks only that layer as loading, with no data on first request', () => {
    expect(snapshotRequested(windLoaded, 'temperature', T10)).toEqual({
      ...windLoaded,
      temperature: { status: 'loading', time: T10, features: null },
    })
  })

  it('snapshotRequested keeps the previous data while the next time loads', () => {
    expect(snapshotRequested(windLoaded, 'wind', T11)).toEqual({
      wind: { status: 'loading', time: T11, features: wind.features },
    })
  })

  it('snapshotRequested drops data after an error', () => {
    const failed = snapshotFailed(windLoaded, 'wind', T10, 'No data.')

    expect(snapshotRequested(failed, 'wind', T11)).toEqual({ wind: { status: 'loading', time: T11, features: null } })
  })

  it('snapshotSucceeded stores the features and time for only that layer', () => {
    expect(snapshotSucceeded(windLoaded, 'temperature', T10, temperature.features)).toEqual({
      ...windLoaded,
      temperature: { status: 'success', time: T10, features: temperature.features },
    })
  })

  it('snapshotFailed stores the message for only that layer', () => {
    expect(snapshotFailed(windLoaded, 'temperature', T10, 'No data.')).toEqual({
      ...windLoaded,
      temperature: { status: 'error', time: T10, message: 'No data.' },
    })
  })

  it('snapshotRetried marks a failed layer stale and ignores other states', () => {
    const failed = snapshotFailed(windLoaded, 'temperature', T10, 'No data.')

    expect(snapshotRetried(failed, 'temperature')).toEqual({ ...windLoaded, temperature: { status: 'stale', time: T10 } })
    expect(snapshotRetried(windLoaded, 'wind')).toBe(windLoaded)
    expect(snapshotRetried(windLoaded, 'unknown')).toBe(windLoaded)
  })

  it('snapshotRemoved drops only that layer entry', () => {
    const state = snapshotRequested(windLoaded, 'temperature', T10)

    expect(snapshotRemoved(state, 'temperature')).toEqual(windLoaded)
  })

  it('does not change the given state', () => {
    const state = { ...windLoaded }

    snapshotRequested(state, 'wind', T11)
    snapshotRemoved(state, 'wind')

    expect(state).toEqual(windLoaded)
  })
})
