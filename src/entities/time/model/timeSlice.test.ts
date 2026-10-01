import { nearestByTimeOfDay } from './localTime'
import { initialTimeState, initSelectedTime, selectTime } from './timeSlice'

vi.mock('./localTime', () => ({ nearestByTimeOfDay: vi.fn() }))

const nearestMock = vi.mocked(nearestByTimeOfDay)
const POINTS = ['2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z', '2026-01-01T12:00:00Z'] as const
const NOW = new Date('2030-05-05T12:00:00Z')

afterEach(() => {
  nearestMock.mockReset()
})

describe('timeSlice', () => {
  it('starts with no selected time', () => {
    expect(initialTimeState).toEqual({ selectedTime: null })
  })

  it('initSelectedTime sets the point nearest to now', () => {
    nearestMock.mockReturnValue(POINTS[1])

    expect(initSelectedTime(initialTimeState, POINTS, NOW)).toEqual({ selectedTime: POINTS[1] })
    expect(nearestMock).toHaveBeenCalledWith(POINTS, NOW)
  })

  it('initSelectedTime keeps a time that is already set', () => {
    nearestMock.mockReturnValue(POINTS[1])
    const state = { selectedTime: POINTS[2] }

    expect(initSelectedTime(state, POINTS, NOW)).toBe(state)
  })

  it('initSelectedTime ignores an empty range', () => {
    expect(initSelectedTime(initialTimeState, [], NOW)).toBe(initialTimeState)
  })

  it('selectTime sets a point of the range', () => {
    expect(selectTime({ selectedTime: POINTS[0] }, POINTS, POINTS[2])).toEqual({ selectedTime: POINTS[2] })
  })

  it('selectTime ignores a time outside the range', () => {
    const state = { selectedTime: POINTS[0] }

    expect(selectTime(state, POINTS, '2026-01-01T13:00:00Z')).toBe(state)
  })
})
