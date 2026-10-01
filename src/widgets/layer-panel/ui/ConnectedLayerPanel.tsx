import { useActiveLayerIds, useLayerList, useLayers } from '@entities/layer'
import { useLoadLayers } from '@features/load-layers'
import { useToggleLayer } from '@features/toggle-layer'
import { LayerPanel } from './LayerPanel'

export function ConnectedLayerPanel() {
  const layers = useLayers()
  const activeLayerIds = useActiveLayerIds()
  const list = useLayerList()
  const toggleLayer = useToggleLayer()
  const retry = useLoadLayers()

  return (
    <LayerPanel
      layers={layers}
      activeLayerIds={activeLayerIds}
      list={list}
      onToggleLayer={toggleLayer}
      onRetry={retry}
    />
  )
}
