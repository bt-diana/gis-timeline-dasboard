export const TEST_LAYERS = [
  {
    id: 'temperature',
    name: 'Temperature',
    kind: 'points',
    unit: '°C',
    timePoints: ['2026-01-01T11:00:00Z', '2026-01-01T10:00:00Z'],
  },
  {
    id: 'wind',
    name: 'Wind',
    kind: 'arrows',
    unit: 'm/s',
    timePoints: ['2026-01-01T10:00:00Z', '2026-01-01T12:00:00Z'],
  },
  {
    id: 'insolation',
    name: 'Insolation',
    kind: 'heatmap',
    unit: 'W/m²',
    timePoints: ['2026-01-01T12:00:00Z'],
  },
] as const
