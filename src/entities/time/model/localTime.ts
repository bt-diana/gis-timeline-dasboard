const MINUTES_PER_HOUR = 60
const SECONDS_PER_MINUTE = 60

const timeOfDayFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

function minutesOfDay(date: Date): number {
  return date.getHours() * MINUTES_PER_HOUR + date.getMinutes() + date.getSeconds() / SECONDS_PER_MINUTE
}

export function minutesSinceLocalMidnight(iso: string): number {
  return minutesOfDay(new Date(iso))
}

export function nearestByTimeOfDay(points: readonly string[], now: Date): string | null {
  const target = minutesOfDay(now)
  let nearest: { point: string; minutes: number; distance: number } | null = null
  for (const point of points) {
    const minutes = minutesSinceLocalMidnight(point)
    const distance = Math.abs(minutes - target)
    const closer = nearest === null || distance < nearest.distance
    const earlierOnTie = nearest !== null && distance === nearest.distance && minutes < nearest.minutes
    if (closer || earlierOnTie) nearest = { point, minutes, distance }
  }
  return nearest?.point ?? null
}

export function formatLocalTime(iso: string): string {
  return timeOfDayFormat.format(new Date(iso))
}
