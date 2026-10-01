import type { FeatureCollection } from 'geojson'
import { MAP_CONFIG } from '../config'

const { west, south, east, north } = MAP_CONFIG.area
const STEP_DEGREES = 1

const range = (from: number, to: number) =>
  Array.from({ length: Math.floor(to - from) + 1 }, (_, index) => Math.ceil(from) + index * STEP_DEGREES).filter(
    (value) => value <= to,
  )

const line = (coordinates: number[][]) => ({
  type: 'Feature' as const,
  properties: {},
  geometry: { type: 'LineString' as const, coordinates },
})

export const BACKGROUND: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south],
          ],
        ],
      },
    },
    ...range(west, east).map((lon) => line([[lon, south], [lon, north]])),
    ...range(south, north).map((lat) => line([[west, lat], [east, lat]])),
  ],
}
