import { useCallback, useEffect, useRef } from 'react'
import { fetchLayers, loadFailed, loadSucceeded, startLoading } from '@entities/layer'
import { API_MESSAGES, ApiRequestError } from '@shared/api'
import { useAppDispatch } from '@shared/store/appStore'

export function useLoadLayers() {
  const dispatch = useAppDispatch()
  const controllerRef = useRef<AbortController | null>(null)

  const load = useCallback(() => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    dispatch(({ layer }) => ({ layer: startLoading(layer) }))

    fetchLayers(controller.signal).then(
      (layers) => {
        if (controller.signal.aborted) return
        dispatch(({ layer }) => ({ layer: loadSucceeded(layer, layers) }))
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof ApiRequestError ? error.message : API_MESSAGES.unexpected
        dispatch(({ layer }) => ({ layer: loadFailed(layer, message) }))
      },
    )
  }, [dispatch])

  useEffect(() => {
    load()
    return () => {
      controllerRef.current?.abort()
    }
  }, [load])

  return load
}
