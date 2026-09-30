export type RenderingKind = 'points' | 'arrows' | 'heatmap'

export interface LayerSummary {
  id: string
  name: string
  kind: RenderingKind
  unit: string
}
