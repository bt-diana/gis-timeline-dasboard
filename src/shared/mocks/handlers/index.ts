import { layerHandlers } from './layers'
import { seriesHandlers } from './series'

export const handlers = [...layerHandlers, ...seriesHandlers]
