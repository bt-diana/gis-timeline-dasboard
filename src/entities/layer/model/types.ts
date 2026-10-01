export type RenderingKind = 'points' | 'arrows' | 'heatmap'

export interface LayerDefinition {
  readonly id: string
  readonly name: string
  readonly kind: RenderingKind
  readonly unit: string
  readonly timePoints: readonly string[]
}
