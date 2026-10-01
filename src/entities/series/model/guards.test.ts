import { TEST_SERIES } from '@shared/test/series'
import { isLayerSeries } from './guards'

const { temperature } = TEST_SERIES

describe('isLayerSeries', () => {
  it('accepts a contract body, also with no points', () => {
    expect(isLayerSeries(temperature)).toBe(true)
    expect(isLayerSeries({ layerId: 'wind', points: [] })).toBe(true)
  })

  it.each([
    ['a missing layerId', { points: temperature.points }],
    ['a non-string layerId', { ...temperature, layerId: 7 }],
    ['non-array points', { ...temperature, points: { time: '2026-01-01T10:00:00Z', value: 1 } }],
    ['a non-number value', { ...temperature, points: [{ time: '2026-01-01T10:00:00Z', value: '1' }] }],
    ['a non-string time', { ...temperature, points: [{ time: 10, value: 1 }] }],
    ['a null point', { ...temperature, points: [null] }],
    ['null', null],
  ])('rejects %s', (_, value) => {
    expect(isLayerSeries(value)).toBe(false)
  })
})
