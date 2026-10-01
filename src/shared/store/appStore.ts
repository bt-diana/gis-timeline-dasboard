import { createVedro } from 'vedro'
import { initialLayerState, type LayerState } from '@entities/layer/model/layerSlice'
import { initialSeriesState, type SeriesSliceState } from '@entities/series/model/seriesSlice'
import { initialTimeState, type TimeState } from '@entities/time/model/timeSlice'

export interface AppStoreState {
  layer: LayerState
  series: SeriesSliceState
  time: TimeState
}

export const initialAppStoreState: AppStoreState = {
  layer: initialLayerState,
  series: initialSeriesState,
  time: initialTimeState,
}

export const {
  Context: AppStoreContext,
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useSelector: useAppStoreSelector,
  useDispatch: useAppStoreDispatch,
} = createVedro(initialAppStoreState)
