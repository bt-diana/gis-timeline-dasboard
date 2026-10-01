import { layerHandlers } from './layers'
import { seriesHandlers } from './series'
import { snapshotHandlers } from './snapshots'

export const handlers = [...layerHandlers, ...seriesHandlers, ...snapshotHandlers]
