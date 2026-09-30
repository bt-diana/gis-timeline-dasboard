const LAYER_LABEL_ID = 'layer-region-label'

export function Layer() {
  return (
    <aside className="shell-layer placeholder" aria-labelledby={LAYER_LABEL_ID}>
      <h2 id={LAYER_LABEL_ID} className="placeholder-label">
        Layers
      </h2>
    </aside>
  )
}
