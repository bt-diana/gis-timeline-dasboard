import './LayerPanel.css'
import type { LayerDefinition, LayerListState } from '@entities/layer'
import { LAYER_PANEL_CONFIG } from '../config'

export interface LayerPanelProps {
  layers: readonly LayerDefinition[]
  activeLayerIds: readonly string[]
  list: LayerListState
  onToggleLayer: (layerId: string) => void
  onRetry: () => void
}

function LayerSwitches({
  layers,
  activeLayerIds,
  onToggleLayer,
}: Pick<LayerPanelProps, 'layers' | 'activeLayerIds' | 'onToggleLayer'>) {
  if (layers.length === 0) {
    return (
      <p role="status" className="layer-panel__status">
        {LAYER_PANEL_CONFIG.empty}
      </p>
    )
  }

  return (
    <ul className="layer-panel__list">
      {layers.map((layer) => (
        <li key={layer.id} className="layer-panel__row">
          <button
            type="button"
            role="switch"
            aria-checked={activeLayerIds.includes(layer.id)}
            className="layer-panel__switch"
            onClick={() => {
              onToggleLayer(layer.id)
            }}
          >
            {layer.name}
          </button>
          <span className="layer-panel__unit">{layer.unit}</span>
        </li>
      ))}
    </ul>
  )
}

export function LayerPanel({ layers, activeLayerIds, list, onToggleLayer, onRetry }: LayerPanelProps) {
  const isLoading = list.status === 'idle' || list.status === 'loading'

  return (
    <aside className="layer-panel" aria-labelledby={LAYER_PANEL_CONFIG.headingId} aria-busy={isLoading}>
      <h2 id={LAYER_PANEL_CONFIG.headingId} className="layer-panel__heading">
        {LAYER_PANEL_CONFIG.heading}
      </h2>

      {isLoading && (
        <p role="status" className="layer-panel__status">
          {LAYER_PANEL_CONFIG.loading}
        </p>
      )}

      {list.status === 'error' && (
        <div role="alert" className="layer-panel__error">
          <p className="layer-panel__error-message">{list.message}</p>
          <button type="button" className="layer-panel__retry" onClick={onRetry}>
            {LAYER_PANEL_CONFIG.retry}
          </button>
        </div>
      )}

      {list.status === 'success' && (
        <LayerSwitches layers={layers} activeLayerIds={activeLayerIds} onToggleLayer={onToggleLayer} />
      )}
    </aside>
  )
}
