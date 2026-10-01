export type SnapshotProperties =
  | { readonly value: number }
  | { readonly speed: number; readonly direction: number }

export interface SnapshotFeature {
  readonly type: 'Feature'
  readonly geometry: { readonly type: 'Point'; readonly coordinates: readonly number[] }
  readonly properties: SnapshotProperties
}

export interface SnapshotFeatures {
  readonly type: 'FeatureCollection'
  readonly features: readonly SnapshotFeature[]
}

export interface LayerSnapshot {
  readonly layerId: string
  readonly time: string
  readonly features: SnapshotFeatures
}

export type SnapshotState =
  | { status: 'loading'; time: string; features: SnapshotFeatures | null }
  | { status: 'success'; time: string; features: SnapshotFeatures }
  | { status: 'error'; time: string; message: string }
  | { status: 'stale'; time: string }
