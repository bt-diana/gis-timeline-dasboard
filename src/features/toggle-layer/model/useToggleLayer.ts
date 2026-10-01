import { useCallback } from 'react'
import { toggleLayer } from '@entities/layer'
import { useAppDispatch } from '@shared/store/appStore'

export function useToggleLayer() {
  const dispatch = useAppDispatch()

  return useCallback(
    (layerId: string) => {
      dispatch(({ layer }) => ({ layer: toggleLayer(layer, layerId) }))
    },
    [dispatch],
  )
}
