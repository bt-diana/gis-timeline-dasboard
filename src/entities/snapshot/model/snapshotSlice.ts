import type { SnapshotFeatures, SnapshotState } from './types'

export type SnapshotSliceState = Readonly<Record<string, SnapshotState>>

export const initialSnapshotState: SnapshotSliceState = {}

function previousFeatures(state: SnapshotState | undefined): SnapshotFeatures | null {
  if (state?.status === 'success' || state?.status === 'loading') return state.features
  return null
}

export function snapshotRequested(state: SnapshotSliceState, layerId: string, time: string): SnapshotSliceState {
  return { ...state, [layerId]: { status: 'loading', time, features: previousFeatures(state[layerId]) } }
}

export function snapshotSucceeded(
  state: SnapshotSliceState,
  layerId: string,
  time: string,
  features: SnapshotFeatures,
): SnapshotSliceState {
  return { ...state, [layerId]: { status: 'success', time, features } }
}

export function snapshotFailed(
  state: SnapshotSliceState,
  layerId: string,
  time: string,
  message: string,
): SnapshotSliceState {
  return { ...state, [layerId]: { status: 'error', time, message } }
}

export function snapshotRetried(state: SnapshotSliceState, layerId: string): SnapshotSliceState {
  const current = state[layerId]
  if (current?.status !== 'error') return state
  return { ...state, [layerId]: { status: 'stale', time: current.time } }
}

export function snapshotRemoved(state: SnapshotSliceState, layerId: string): SnapshotSliceState {
  return Object.fromEntries(Object.entries(state).filter(([id]) => id !== layerId))
}
