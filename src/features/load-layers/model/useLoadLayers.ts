import { useCallback, useEffect, useRef } from 'react'
import { fetchLayers, loadFailed, loadSucceeded, startLoading } from '@entities/layer'
import { API_MESSAGES, ApiRequestError } from '@shared/api'
import { useAppStore } from '@shared/store/appStore'

export function useLoadLayers() {
  const store = useAppStore()
  const controllerRef = useRef<AbortController | null>(null)

  const load = useCallback(() => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    store.dispatch(({ layer }) => ({ layer: startLoading(layer) }))

    fetchLayers(controller.signal).then(
      (layers) => {
        if (controller.signal.aborted) return
        store.dispatch(({ layer }) => ({ layer: loadSucceeded(layer, layers) }))
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof ApiRequestError ? error.message : API_MESSAGES.unexpected
        store.dispatch(({ layer }) => ({ layer: loadFailed(layer, message) }))
      },
    )
  }, [store])

  useEffect(() => {
    load()
    return () => {
      controllerRef.current?.abort()
    }
  }, [load])

  return load
}
