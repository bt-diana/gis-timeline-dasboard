import { useActiveLayerIds, useLayerList, useLayers } from '@entities/layer'
import { useSnapshots } from '@entities/snapshot'
import { useLoadLayers } from '@features/load-layers'
import { useRetrySnapshot } from '@features/retry-snapshot'
import { useToggleLayer } from '@features/toggle-layer'
import { LayerPanel } from './LayerPanel'

export function ConnectedLayerPanel() {
  const layers = useLayers()
  const activeLayerIds = useActiveLayerIds()
  const list = useLayerList()
  const toggleLayer = useToggleLayer()
  const retry = useLoadLayers()
  const snapshots = useSnapshots()
  const retryLayer = useRetrySnapshot()

  return (
    <LayerPanel
      layers={layers}
      activeLayerIds={activeLayerIds}
      list={list}
      snapshots={snapshots}
      onToggleLayer={toggleLayer}
      onRetry={retry}
      onRetryLayer={retryLayer}
    />
  )
}
