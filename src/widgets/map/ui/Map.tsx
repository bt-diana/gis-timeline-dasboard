import './Map.css'
import { MAP_CONFIG } from '../config'
import type { MapLayerData } from '../lib/types'
import { MapView } from './MapView'

export interface MapProps {
  layers: readonly MapLayerData[]
  loadingTime: string | null
}

export function Map({ layers, loadingTime }: MapProps) {
  return (
    <main className="shell-map map" aria-labelledby={MAP_CONFIG.headingId} aria-busy={loadingTime !== null}>
      <h2 id={MAP_CONFIG.headingId} className="map__heading">
        {MAP_CONFIG.heading}
      </h2>
      <MapView layers={layers} />
      <p role="status" className="map__loading">
        {loadingTime === null ? '' : MAP_CONFIG.loading(loadingTime)}
      </p>
    </main>
  )
}
