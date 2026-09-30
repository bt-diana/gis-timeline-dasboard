import './LayerPanel.css'
import { LAYER_FIXTURES } from '@shared/store/layers/layerFixtures'
import { toggleLayerIds } from '@shared/store/layers/layerSlice'
import { LAYER_PANEL_CONFIG } from './layerPanelConfig'
import { useAppStoreDispatch, useAppStoreSelector } from '@shared/store/appStore'

export function LayerPanel() {
  const activeLayerIds = useAppStoreSelector(({ layer }) => layer.activeLayerIds)
  const dispatch = useAppStoreDispatch()

  return (
    <aside className="shell-layer layer-panel" aria-labelledby={LAYER_PANEL_CONFIG.headingId}>
      <h2 id={LAYER_PANEL_CONFIG.headingId} className="layer-panel__heading">
        {LAYER_PANEL_CONFIG.heading}
      </h2>

      <ul className="layer-panel__list">
        {LAYER_FIXTURES.map((layer) => {
          const isActive = activeLayerIds.includes(layer.id)

          return (
            <li key={layer.id} className="layer-panel__row">
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                className="layer-panel__switch"
                onClick={() => {
                  dispatch(({ layer: currentLayer }) => ({
                    layer: {
                      ...currentLayer,
                      activeLayerIds: toggleLayerIds(currentLayer.activeLayerIds, layer.id),
                    },
                  }))
                }}
                onKeyDown={(event) => {
                  if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault()
                    dispatch(({ layer: currentLayer }) => ({
                      layer: {
                        ...currentLayer,
                        activeLayerIds: toggleLayerIds(currentLayer.activeLayerIds, layer.id),
                      },
                    }))
                  }
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
