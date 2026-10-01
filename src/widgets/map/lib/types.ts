import type { FeatureCollection, Point } from 'geojson'
import type { RenderingKind } from '@entities/layer'

export interface MapFeatureProperties {
  readonly norm: number
  readonly direction: number
}

export type MapFeatures = FeatureCollection<Point, MapFeatureProperties>

export interface MapLayerData {
  readonly id: string
  readonly kind: RenderingKind
  readonly data: MapFeatures
}

export interface MapAdapter {
  setLayers(layers: readonly MapLayerData[]): void
  destroy(): void
}

export type CreateMapAdapter = (container: HTMLElement) => MapAdapter
