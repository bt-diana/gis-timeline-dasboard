import { MOCK_LAYERS } from './layers'

export const MOCK_AREA = { west: 69.3, south: 39.2, east: 80.3, north: 43.3 } as const

const POINT_COLUMNS = 9
const POINT_ROWS = 5
const ARROW_COLUMNS = 8
const ARROW_ROWS = 4
const HEATMAP_COLUMNS = 12
const HEATMAP_ROWS = 6

type Properties = { value: number } | { speed: number; direction: number }

interface Cell {
  column: number
  row: number
  coordinates: [number, number]
}

const round = (value: number, digits = 1) => Number(value.toFixed(digits))

function grid(columns: number, rows: number): Cell[] {
  const width = MOCK_AREA.east - MOCK_AREA.west
  const height = MOCK_AREA.north - MOCK_AREA.south
  return Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const lon = MOCK_AREA.west + (width * (column + 0.5)) / columns
    const lat = MOCK_AREA.south + (height * (row + 0.5)) / rows
    return { column, row, coordinates: [round(lon, 3), round(lat, 3)] }
  })
}

const PROPERTIES: Record<string, { cells: Cell[]; at: (cell: Cell, hour: number) => Properties }> = {
  temperature: {
    cells: grid(POINT_COLUMNS, POINT_ROWS),
    at: ({ column, row }, hour) => ({ value: round(-6 + hour * 1.4 + column * 0.6 - row * 1.8 + Math.sin(column + row)) }),
  },
  wind: {
    cells: grid(ARROW_COLUMNS, ARROW_ROWS),
    at: ({ column, row }, hour) => ({
      speed: round(2 + ((column * 3 + row * 5 + hour * 2) % 9) * 0.8),
      direction: (200 + column * 15 + row * 20 + hour * 25) % 360,
    }),
  },
  insolation: {
    cells: grid(HEATMAP_COLUMNS, HEATMAP_ROWS),
    at: ({ column, row }, hour) => ({
      value: Math.round(Math.max(0, 300 - Math.abs(hour - 2) * 60 + Math.cos(column / 2) * 80 + Math.sin(row) * 60)),
    }),
  },
}

export function mockSnapshot(layerId: string, time: string) {
  const layer = MOCK_LAYERS.find(({ id }) => id === layerId)
  const properties = PROPERTIES[layerId]
  if (!layer || !properties) return { found: false } as const
  const hour = layer.timePoints.indexOf(time)
  if (hour === -1) return { found: true, snapshot: null } as const
  const features = properties.cells.map((cell) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: cell.coordinates },
    properties: properties.at(cell, hour),
  }))
  return { found: true, snapshot: { layerId, time, features: { type: 'FeatureCollection', features } } } as const
}
