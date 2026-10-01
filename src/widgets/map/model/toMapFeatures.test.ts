import { TEST_SNAPSHOTS } from '@shared/test/snapshots'
import { toMapFeatures } from './toMapFeatures'

const properties = (snapshot: (typeof TEST_SNAPSHOTS)[keyof typeof TEST_SNAPSHOTS]) =>
  toMapFeatures(snapshot.features).features.map((feature) => feature.properties)

describe('toMapFeatures', () => {
  it('scales value to 0–1 of the snapshot range, with direction 0', () => {
    expect(properties(TEST_SNAPSHOTS.temperature)).toEqual([
      { norm: 0, direction: 0 },
      { norm: 1, direction: 0 },
    ])
  })

  it('scales speed and keeps direction for arrows', () => {
    expect(properties(TEST_SNAPSHOTS.wind)).toEqual([
      { norm: 0, direction: 90 },
      { norm: 1, direction: 180 },
    ])
  })

  it('keeps the coordinates', () => {
    expect(toMapFeatures(TEST_SNAPSHOTS.wind.features).features[1]?.geometry).toEqual({
      type: 'Point',
      coordinates: [71, 41],
    })
  })

  it('places a flat snapshot at 0.5', () => {
    const [first] = TEST_SNAPSHOTS.temperature.features.features
    if (!first) throw new Error('fixture')
    const flat = { type: 'FeatureCollection' as const, features: [first, first] }

    expect(toMapFeatures(flat).features.map(({ properties: { norm } }) => norm)).toEqual([0.5, 0.5])
  })

  it('returns the same result for the same snapshot', () => {
    expect(toMapFeatures(TEST_SNAPSHOTS.wind.features)).toBe(toMapFeatures(TEST_SNAPSHOTS.wind.features))
  })
})
