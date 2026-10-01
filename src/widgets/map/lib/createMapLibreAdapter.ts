import 'maplibre-gl/dist/maplibre-gl.css'
import { Map as MapLibreMap, setWorkerUrl, type GeoJSONSource, type MapOptions } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import type { RenderingKind } from '@entities/layer'
import { MAP_CONFIG } from '../config'
import { drawArrowImage } from './arrowImage'
import { BACKGROUND } from './background'
import { ARROW_IMAGE_ID, RENDER_ORDER, RENDERERS } from './renderers'
import type { CreateMapAdapter, MapFeatures, MapLayerData } from './types'

setWorkerUrl(workerUrl)

const { west, south, east, north } = MAP_CONFIG.area
const BOUNDS: [number, number, number, number] = [west, south, east, north]

const STYLE: Exclude<MapOptions['style'], string | undefined> = {
  version: 8,
  sources: { background: { type: 'geojson', data: BACKGROUND } },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#dfe9f3' } },
    {
      id: 'area',
      type: 'fill',
      source: 'background',
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'fill-color': '#f4f1ea' },
    },
    {
      id: 'graticule',
      type: 'line',
      source: 'background',
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: { 'line-color': '#c9ced4', 'line-width': 1 },
    },
  ],
}

interface RenderedLayer {
  kind: RenderingKind
  data: MapFeatures
}

export const createMapLibreAdapter: CreateMapAdapter = (container) => {
  const map = new MapLibreMap({
    container,
    style: STYLE,
    bounds: BOUNDS,
    fitBoundsOptions: { padding: MAP_CONFIG.padding },
    attributionControl: false,
    dragRotate: false,
  })
  const rendered = new Map<string, RenderedLayer>()
  const order: string[] = []
  let pending: readonly MapLayerData[] = []
  let loaded = false

  const fit = () => {
    map.fitBounds(BOUNDS, { padding: MAP_CONFIG.padding, animate: false })
  }

  const addLayer = ({ id, kind, data }: MapLayerData) => {
    map.addSource(id, { type: 'geojson', data: data })
    const beforeId = order.find((other) => {
      const otherKind = rendered.get(other)?.kind
      return otherKind !== undefined && RENDER_ORDER[otherKind] > RENDER_ORDER[kind]
    })
    map.addLayer(RENDERERS[kind](id), beforeId)
    order.splice(beforeId === undefined ? order.length : order.indexOf(beforeId), 0, id)
    rendered.set(id, { kind, data })
  }

  const apply = (layers: readonly MapLayerData[]) => {
    const visible = new Set(layers.map(({ id }) => id))
    for (const layer of layers) {
      const current = rendered.get(layer.id)
      if (!current) {
        addLayer(layer)
        continue
      }
      if (current.data !== layer.data) {
        void map.getSource<GeoJSONSource>(layer.id)?.setData(layer.data)
        current.data = layer.data
      }
      map.setLayoutProperty(layer.id, 'visibility', 'visible')
    }
    for (const id of rendered.keys()) {
      if (!visible.has(id)) map.setLayoutProperty(id, 'visibility', 'none')
    }
  }

  map.on('load', () => {
    const arrow = drawArrowImage()
    if (arrow) map.addImage(ARROW_IMAGE_ID, arrow)
    loaded = true
    apply(pending)
  })
  map.on('resize', fit)

  return {
    setLayers(layers) {
      pending = layers
      if (loaded) apply(layers)
    },
    destroy() {
      map.remove()
    },
  }
}
