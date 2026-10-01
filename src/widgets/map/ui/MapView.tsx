import { useEffect, useRef } from 'react'
import { createMapLibreAdapter } from '../lib/createMapLibreAdapter'
import type { MapAdapter, MapLayerData } from '../lib/types'

export interface MapViewProps {
  layers: readonly MapLayerData[]
}

export function MapView({ layers }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const adapterRef = useRef<MapAdapter | null>(null)
  const layersRef = useRef(layers)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const adapter = createMapLibreAdapter(container)
    adapterRef.current = adapter
    adapter.setLayers(layersRef.current)
    return () => {
      adapter.destroy()
      adapterRef.current = null
    }
  }, [])

  useEffect(() => {
    layersRef.current = layers
    adapterRef.current?.setLayers(layers)
  }, [layers])

  return <div ref={containerRef} className="map__canvas" data-testid="map-canvas" />
}
