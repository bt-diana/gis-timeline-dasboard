import { useCallback } from 'react'
import { toggleLayer } from '@entities/layer'
import { useAppStore } from '@shared/store/appStore'

export function useToggleLayer() {
  const store = useAppStore()

  return useCallback(
    (layerId: string) => {
      store.dispatch(({ layer }) => ({ layer: toggleLayer(layer, layerId) }))
    },
    [store],
  )
}
