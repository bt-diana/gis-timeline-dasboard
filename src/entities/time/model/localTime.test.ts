import { formatLocalTime, minutesSinceLocalMidnight, nearestByTimeOfDay } from './localTime'

const BISHKEK_OFFSET_MINUTES = -360
const POINTS = ['2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z', '2026-01-01T12:00:00Z']
const ACROSS_MIDNIGHT = ['2026-01-01T17:00:00Z', '2026-01-01T18:00:00Z', '2026-01-01T19:00:00Z']

const localClock = (time: string) => new Date(`2030-05-05T${time}:00+06:00`)

describe('local time helpers', () => {
  it('run in the fixed test time zone', () => {
    expect(new Date('2026-01-01T00:00:00Z').getTimezoneOffset()).toBe(BISHKEK_OFFSET_MINUTES)
  })

  it('minutesSinceLocalMidnight counts local minutes of the day', () => {
    expect(minutesSinceLocalMidnight('2026-01-01T10:30:00Z')).toBe(16 * 60 + 30)
    expect(minutesSinceLocalMidnight('2026-01-01T18:00:00Z')).toBe(0)
  })

  it('formatLocalTime gives local HH:mm, with 00 for midnight', () => {
    expect(formatLocalTime('2026-01-01T10:05:00Z')).toBe('16:05')
    expect(formatLocalTime('2026-01-01T18:00:00Z')).toBe('00:00')
  })
})

describe('nearestByTimeOfDay', () => {
  it.each([
    ['nearest by local time of day, regardless of date', '16:40', POINTS[1]],
    ['the earliest point before the range', '09:00', POINTS[0]],
    ['the latest point after the range', '23:00', POINTS[2]],
    ['the earlier point on a tie', '16:30', POINTS[0]],
  ])('selects %s', (_, clock, expected) => {
    expect(nearestByTimeOfDay(POINTS, localClock(clock))).toBe(expected)
  })

  it.each([
    ['00:20', ACROSS_MIDNIGHT[1]],
    ['23:50', ACROSS_MIDNIGHT[0]],
    ['00:50', ACROSS_MIDNIGHT[2]],
  ])('counts 00:00 as the earliest point in a range crossing local midnight (clock %s)', (clock, expected) => {
    expect(nearestByTimeOfDay(ACROSS_MIDNIGHT, localClock(clock))).toBe(expected)
  })

  it('returns null for an empty range', () => {
    expect(nearestByTimeOfDay([], localClock('12:00'))).toBeNull()
  })
})
