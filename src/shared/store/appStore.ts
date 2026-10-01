import { useCallback, useSyncExternalStore } from 'react'
import { createVedro } from 'vedro'
import { initialLayerState, type LayerState } from '@entities/layer/model/layerSlice'

export interface AppStoreState {
  layer: LayerState
}

export type AppStoreUpdate = (state: AppStoreState) => Partial<AppStoreState>

export const initialAppStoreState: AppStoreState = {
  layer: initialLayerState,
}

const { Provider, useStore } = createVedro(initialAppStoreState)

export const AppStoreProvider = Provider

export function useAppStoreSelector<T>(select: (state: AppStoreState) => T): T {
  const store = useStore()
  const subscribe = useCallback(
    (onChange: () => void) => {
      const unsubscribe = store.on('@state', onChange)
      let subscribed = true
      return () => {
        if (!subscribed) return
        subscribed = false
        unsubscribe()
      }
    },
    [store],
  )
  return useSyncExternalStore(subscribe, () => select(store.get()))
}

export function useAppDispatch(): (update: AppStoreUpdate) => void {
  const store = useStore()
  return useCallback(
    (update: AppStoreUpdate) => {
      store.dispatch(update)
    },
    [store],
  )
}
