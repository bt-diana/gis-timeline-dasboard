import { TEST_LAYERS } from '@shared/test/layers'
import { timelineRange } from './timelineRange'

describe('timelineRange', () => {
  it('returns the sorted, de-duplicated union with its first and last points', () => {
    expect(timelineRange(TEST_LAYERS)).toEqual({
      points: ['2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z', '2026-01-01T12:00:00Z'],
      first: '2026-01-01T10:00:00Z',
      last: '2026-01-01T12:00:00Z',
    })
  })

  it('returns an empty range for no layers', () => {
    expect(timelineRange([])).toEqual({ points: [], first: null, last: null })
  })
})
