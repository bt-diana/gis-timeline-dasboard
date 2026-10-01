import { useCallback, useEffect, useRef } from 'react'
import { useActiveLayerIds } from '@entities/layer'
import { fetchSeries, seriesFailed, seriesRemoved, seriesRequested, seriesSucceeded } from '@entities/series'
import { API_MESSAGES, ApiRequestError } from '@shared/api'
import { useAppStore } from '@shared/store/appStore'

export function useLoadSeries() {
  const store = useAppStore()
  const activeLayerIds = useActiveLayerIds()
  const controllersRef = useRef(new Map<string, AbortController>())
  const previousIdsRef = useRef<readonly string[]>([])

  const load = useCallback(
    (layerId: string) => {
      const controllers = controllersRef.current
      controllers.get(layerId)?.abort()
      const controller = new AbortController()
      controllers.set(layerId, controller)
      store.dispatch(({ series }) => ({ series: seriesRequested(series, layerId) }))

      const settle = () => {
        if (controllers.get(layerId) === controller) controllers.delete(layerId)
      }

      fetchSeries(layerId, controller.signal).then(
        ({ points }) => {
          if (controller.signal.aborted) return
          settle()
          store.dispatch(({ series }) => ({ series: seriesSucceeded(series, layerId, points) }))
        },
        (error: unknown) => {
          if (controller.signal.aborted) return
          settle()
          const message = error instanceof ApiRequestError ? error.message : API_MESSAGES.unexpected
          store.dispatch(({ series }) => ({ series: seriesFailed(series, layerId, message) }))
        },
      )
    },
    [store],
  )

  useEffect(() => {
    const controllers = controllersRef.current
    const previousIds = previousIdsRef.current
    for (const layerId of previousIds) {
      const controller = controllers.get(layerId)
      if (activeLayerIds.includes(layerId) || !controller) continue
      controller.abort()
      controllers.delete(layerId)
      store.dispatch(({ series }) => ({ series: seriesRemoved(series, layerId) }))
    }
    for (const layerId of activeLayerIds) {
      if (previousIds.includes(layerId)) continue
      if (store.get('series')[layerId]?.status !== 'success') load(layerId)
    }
    previousIdsRef.current = activeLayerIds
  }, [activeLayerIds, load, store])

  useEffect(() => {
    const controllers = controllersRef.current
    return () => {
      for (const controller of controllers.values()) controller.abort()
      controllers.clear()
      previousIdsRef.current = []
    }
  }, [])

  return load
}
