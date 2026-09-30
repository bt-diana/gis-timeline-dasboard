import { useActiveLayerIds, useLayers } from '@entities/layer'
import { useToggleLayer } from '@features/toggle-layer'
import { LayerPanel } from './LayerPanel'

export function ConnectedLayerPanel() {
  const layers = useLayers()
  const activeLayerIds = useActiveLayerIds()
  const toggleLayer = useToggleLayer()

  return <LayerPanel layers={layers} activeLayerIds={activeLayerIds} onToggleLayer={toggleLayer} />
}
