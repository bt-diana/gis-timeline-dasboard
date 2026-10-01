import { TEST_SNAPSHOTS } from '@shared/test/snapshots'
import { isLayerSnapshot } from './guards'

const { temperature, wind } = TEST_SNAPSHOTS
const withFeature = (feature: unknown) => ({ ...temperature, features: { type: 'FeatureCollection', features: [feature] } })
const [valid] = temperature.features.features

describe('isLayerSnapshot', () => {
  it('accepts value and speed/direction bodies, also with no features', () => {
    expect(isLayerSnapshot(temperature)).toBe(true)
    expect(isLayerSnapshot(wind)).toBe(true)
    expect(isLayerSnapshot({ ...temperature, features: { type: 'FeatureCollection', features: [] } })).toBe(true)
  })

  it.each([
    ['a missing layerId', { time: temperature.time, features: temperature.features }],
    ['a non-string time', { ...temperature, time: 10 }],
    ['a non-collection', { ...temperature, features: [] }],
    ['a non-point geometry', withFeature({ ...valid, geometry: { type: 'LineString', coordinates: [70, 40] } })],
    ['too few coordinates', withFeature({ ...valid, geometry: { type: 'Point', coordinates: [70] } })],
    ['a non-number value', withFeature({ ...valid, properties: { value: '1' } })],
    ['speed without direction', withFeature({ ...valid, properties: { speed: 1 } })],
    ['null', null],
  ])('rejects %s', (_, value) => {
    expect(isLayerSnapshot(value)).toBe(false)
  })
})
