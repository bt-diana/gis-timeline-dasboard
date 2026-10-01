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

export const {
  Context: AppStoreContext,
  Provider: AppStoreProvider,
  useStore: useAppStore,
} = createVedro(initialAppStoreState)

export function useAppStoreSelector<T>(select: (state: AppStoreState) => T): T {
  const store = useAppStore()
  const subscribe = useCallback((onChange: () => void) => store.on('@state', onChange), [store])
  return useSyncExternalStore(subscribe, () => select(store.get()))
}

export function useAppDispatch(): (update: AppStoreUpdate) => void {
  const store = useAppStore()
  return useCallback(
    (update: AppStoreUpdate) => {
      store.dispatch(update)
    },
    [store],
  )
}
