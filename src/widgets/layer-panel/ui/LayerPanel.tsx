import './LayerPanel.css'
import type { LayerSummary } from '@entities/layer'
import { LAYER_PANEL_CONFIG } from '../config'

export interface LayerPanelProps {
  layers: readonly LayerSummary[]
  activeLayerIds: readonly string[]
  onToggleLayer: (layerId: string) => void
}

export function LayerPanel({ layers, activeLayerIds, onToggleLayer }: LayerPanelProps) {
  return (
    <aside className="layer-panel" aria-labelledby={LAYER_PANEL_CONFIG.headingId}>
      <h2 id={LAYER_PANEL_CONFIG.headingId} className="layer-panel__heading">
        {LAYER_PANEL_CONFIG.heading}
      </h2>

      <ul className="layer-panel__list">
        {layers.map((layer) => {
          const isActive = activeLayerIds.includes(layer.id)

          return (
            <li key={layer.id} className="layer-panel__row">
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                className="layer-panel__switch"
                onClick={() => {
                  onToggleLayer(layer.id)
                }}
              >
                {layer.name}
              </button>
              <span className="layer-panel__unit">{layer.unit}</span>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
