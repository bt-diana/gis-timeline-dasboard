import { useCallback } from 'react'
import { toggleLayer } from '@entities/layer'
import { useAppStoreDispatch } from '@shared/store/appStore'

export function useToggleLayer() {
  const dispatch = useAppStoreDispatch()

  return useCallback(
    (layerId: string) => {
      dispatch(({ layer }) => ({ layer: toggleLayer(layer, layerId) }))
    },
    [dispatch],
  )
}
