import './LayerPanel.css'
import { ACTIVE_LAYER_FIXTURE_IDS, LAYER_FIXTURES } from './layerFixtures'
import { LAYER_PANEL_CONFIG } from './layerPanelConfig'

export function LayerPanel() {
  return (
    <aside className="shell-layer layer-panel" aria-labelledby={LAYER_PANEL_CONFIG.headingId}>
      <h2 id={LAYER_PANEL_CONFIG.headingId} className="layer-panel__heading">
        {LAYER_PANEL_CONFIG.heading}
      </h2>

      <ul className="layer-panel__list">
        {LAYER_FIXTURES.map((layer) => {
          const isActive = ACTIVE_LAYER_FIXTURE_IDS.includes(layer.id)

          return (
            <li key={layer.id} className="layer-panel__row">
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                className="layer-panel__switch"
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
