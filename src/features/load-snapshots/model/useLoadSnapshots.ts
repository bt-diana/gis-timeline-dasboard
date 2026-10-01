import { useEffect, useRef } from 'react'
import { useActiveLayerIds } from '@entities/layer'
import {
  fetchSnapshot,
  snapshotFailed,
  snapshotRemoved,
  snapshotRequested,
  snapshotSucceeded,
  useSnapshots,
} from '@entities/snapshot'
import { useSelectedTime } from '@entities/time'
import { API_MESSAGES, ApiRequestError } from '@shared/api'
import { useAppStore } from '@shared/store/appStore'

export function useLoadSnapshots() {
  const store = useAppStore()
  const activeLayerIds = useActiveLayerIds()
  const selectedTime = useSelectedTime()
  const snapshots = useSnapshots()
  const controllersRef = useRef(new Map<string, AbortController>())

  useEffect(() => {
    const controllers = controllersRef.current

    const staleIds = new Set([...controllers.keys(), ...Object.keys(snapshots)])
    for (const layerId of staleIds) {
      if (activeLayerIds.includes(layerId)) continue
      controllers.get(layerId)?.abort()
      controllers.delete(layerId)
      if (layerId in snapshots) store.dispatch(({ snapshot }) => ({ snapshot: snapshotRemoved(snapshot, layerId) }))
    }

    if (selectedTime === null) return

    for (const layerId of activeLayerIds) {
      const current = snapshots[layerId]
      if (current?.time === selectedTime && current.status !== 'stale') continue

      controllers.get(layerId)?.abort()
      const controller = new AbortController()
      controllers.set(layerId, controller)
      store.dispatch(({ snapshot }) => ({ snapshot: snapshotRequested(snapshot, layerId, selectedTime) }))

      const settle = () => {
        if (controllers.get(layerId) === controller) controllers.delete(layerId)
      }

      fetchSnapshot(layerId, selectedTime, controller.signal).then(
        ({ features }) => {
          if (controller.signal.aborted) return
          settle()
          store.dispatch(({ snapshot }) => ({ snapshot: snapshotSucceeded(snapshot, layerId, selectedTime, features) }))
        },
        (error: unknown) => {
          if (controller.signal.aborted) return
          settle()
          const message = error instanceof ApiRequestError ? error.message : API_MESSAGES.unexpected
          store.dispatch(({ snapshot }) => ({ snapshot: snapshotFailed(snapshot, layerId, selectedTime, message) }))
        },
      )
    }
  }, [activeLayerIds, selectedTime, snapshots, store])

  useEffect(() => {
    const controllers = controllersRef.current
    return () => {
      for (const controller of controllers.values()) controller.abort()
      controllers.clear()
    }
  }, [])
}
