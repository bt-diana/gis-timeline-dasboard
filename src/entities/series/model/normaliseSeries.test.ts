import { normaliseSeries } from './normaliseSeries'

describe('normaliseSeries', () => {
  it('scales each value to 0–1 of the series range and keeps the real value', () => {
    const normalised = normaliseSeries([
      { time: 'a', value: -4 },
      { time: 'b', value: 6 },
      { time: 'c', value: 1 },
    ])

    expect(normalised).toEqual(
      new Map([
        ['a', { normalised: 0, value: -4 }],
        ['b', { normalised: 1, value: 6 }],
        ['c', { normalised: 0.5, value: 1 }],
      ]),
    )
  })

  it('places a flat series at 0.5', () => {
    const normalised = normaliseSeries([
      { time: 'a', value: 3 },
      { time: 'b', value: 3 },
    ])

    expect(normalised.get('a')).toEqual({ normalised: 0.5, value: 3 })
    expect(normalised.get('b')).toEqual({ normalised: 0.5, value: 3 })
  })

  it('returns an empty map for no points', () => {
    expect(normaliseSeries([]).size).toBe(0)
  })
})
