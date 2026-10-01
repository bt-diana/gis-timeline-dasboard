import { nearestByTimeOfDay } from './localTime'

export interface TimeState {
  selectedTime: string | null
}

export const initialTimeState: TimeState = { selectedTime: null }

export function initSelectedTime(state: TimeState, points: readonly string[], now: Date): TimeState {
  if (state.selectedTime !== null || points.length === 0) return state
  return { selectedTime: nearestByTimeOfDay(points, now) }
}

export function selectTime(state: TimeState, points: readonly string[], time: string): TimeState {
  return points.includes(time) ? { selectedTime: time } : state
}
