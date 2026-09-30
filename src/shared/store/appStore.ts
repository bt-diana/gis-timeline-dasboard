import { createVedro } from 'vedro'
import { initialLayerState, type LayerState } from './layers/layerSlice'

export interface AppStoreState {
  layer: LayerState
}

export const initialAppStoreState: AppStoreState = {
  layer: initialLayerState,
}

export const {
  Context: AppStoreContext,
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useSelector: useAppStoreSelector,
  useDispatch: useAppStoreDispatch,
} = createVedro(initialAppStoreState)
