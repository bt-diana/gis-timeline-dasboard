import './LayerPanel.css'
import type { LayerDefinition, LayerListState } from '@entities/layer'
import type { SnapshotSliceState, SnapshotState } from '@entities/snapshot'
import { LAYER_PANEL_CONFIG } from '../config'

export interface LayerPanelProps {
  layers: readonly LayerDefinition[]
  activeLayerIds: readonly string[]
  list: LayerListState
  snapshots: SnapshotSliceState
  onToggleLayer: (layerId: string) => void
  onRetry: () => void
  onRetryLayer: (layerId: string) => void
}

function LayerDataStatus({
  layer,
  snapshot,
  onRetryLayer,
}: {
  layer: LayerDefinition
  snapshot: SnapshotState | undefined
  onRetryLayer: (layerId: string) => void
}) {
  if (snapshot?.status !== 'error') return null
  return (
    <div role="alert" className="layer-panel__layer-error">
      <span className="layer-panel__error-message">{snapshot.message}</span>
      <button
        type="button"
        className="layer-panel__retry"
        aria-label={LAYER_PANEL_CONFIG.retryLayer(layer.name)}
        onClick={() => {
          onRetryLayer(layer.id)
        }}
      >
        {LAYER_PANEL_CONFIG.retry}
      </button>
    </div>
  )
}

function LayerSwitches({
  layers,
  activeLayerIds,
  snapshots,
  onToggleLayer,
  onRetryLayer,
}: Pick<LayerPanelProps, 'layers' | 'activeLayerIds' | 'snapshots' | 'onToggleLayer' | 'onRetryLayer'>) {
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
        <li
          key={layer.id}
          className="layer-panel__row"
          aria-busy={snapshots[layer.id]?.status === 'loading' || snapshots[layer.id]?.status === 'stale'}
        >
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
          <LayerDataStatus layer={layer} snapshot={snapshots[layer.id]} onRetryLayer={onRetryLayer} />
        </li>
      ))}
    </ul>
  )
}

export function LayerPanel({
  layers,
  activeLayerIds,
  list,
  snapshots,
  onToggleLayer,
  onRetry,
  onRetryLayer,
}: LayerPanelProps) {
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
        <LayerSwitches
          layers={layers}
          activeLayerIds={activeLayerIds}
          snapshots={snapshots}
          onToggleLayer={onToggleLayer}
          onRetryLayer={onRetryLayer}
        />
      )}
    </aside>
  )
}
