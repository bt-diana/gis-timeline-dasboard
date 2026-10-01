import type { AddLayerObject } from 'maplibre-gl'
import type { RenderingKind } from '@entities/layer'

export const ARROW_IMAGE_ID = 'map-arrow'

const LOW_COLOR = '#2c7bb6'
const MID_COLOR = '#ffffbf'
const HIGH_COLOR = '#d7191c'

export const RENDER_ORDER: Readonly<Record<RenderingKind, number>> = { heatmap: 0, points: 1, arrows: 2 }

export const RENDERERS: Readonly<Record<RenderingKind, (id: string) => AddLayerObject>> = {
  points: (id) => ({
    id,
    source: id,
    type: 'circle',
    paint: {
      'circle-radius': 7,
      'circle-color': ['interpolate', ['linear'], ['get', 'norm'], 0, LOW_COLOR, 0.5, MID_COLOR, 1, HIGH_COLOR],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
    },
  }),
  arrows: (id) => ({
    id,
    source: id,
    type: 'symbol',
    layout: {
      'icon-image': ARROW_IMAGE_ID,
      'icon-rotate': ['get', 'direction'],
      'icon-rotation-alignment': 'map',
      'icon-size': ['interpolate', ['linear'], ['get', 'norm'], 0, 0.5, 1, 1.1],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  }),
  heatmap: (id) => ({
    id,
    source: id,
    type: 'heatmap',
    paint: {
      'heatmap-weight': ['get', 'norm'],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 20, 8, 60],
      'heatmap-intensity': 0.5,
      'heatmap-opacity': 0.6,
    },
  }),
}
