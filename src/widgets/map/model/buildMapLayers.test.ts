import type { SnapshotSliceState } from '@entities/snapshot'
import { TEST_LAYERS } from '@shared/test/layers'
import { TEST_SNAPSHOTS } from '@shared/test/snapshots'
import { buildMapLayers, isLoading } from './buildMapLayers'
import { toMapFeatures } from './toMapFeatures'

const T10 = '2026-01-01T10:00:00Z'
const { temperature, wind } = TEST_SNAPSHOTS

const snapshots: SnapshotSliceState = {
  wind: { status: 'success', time: T10, features: wind.features },
  temperature: { status: 'loading', time: T10, features: temperature.features },
  insolation: { status: 'error', time: T10, message: 'No data.' },
}

describe('buildMapLayers', () => {
  it('returns active layers with data, in layer order, with their kind', () => {
    expect(buildMapLayers(TEST_LAYERS, ['wind', 'temperature', 'insolation'], snapshots)).toEqual([
      { id: 'temperature', kind: 'points', data: toMapFeatures(temperature.features) },
      { id: 'wind', kind: 'arrows', data: toMapFeatures(wind.features) },
    ])
  })

  it('skips inactive layers and layers without data', () => {
    const noData: SnapshotSliceState = { ...snapshots, temperature: { status: 'loading', time: T10, features: null } }

    expect(buildMapLayers(TEST_LAYERS, ['temperature', 'insolation'], noData)).toEqual([])
    expect(buildMapLayers(TEST_LAYERS, [], snapshots)).toEqual([])
  })
})

describe('isLoading', () => {
  it('is true when an active layer is loading or waiting for a retry', () => {
    expect(isLoading(['temperature'], snapshots)).toBe(true)
    expect(isLoading(['insolation'], { insolation: { status: 'stale', time: T10 } })).toBe(true)
  })

  it('is false when active layers are settled or an inactive one is loading', () => {
    expect(isLoading(['wind', 'insolation'], snapshots)).toBe(false)
  })
})
