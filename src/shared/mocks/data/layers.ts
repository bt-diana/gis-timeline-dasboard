const HOURLY_TIME_POINTS = [
  '2026-01-01T10:00:00Z',
  '2026-01-01T11:00:00Z',
  '2026-01-01T12:00:00Z',
  '2026-01-01T13:00:00Z',
  '2026-01-01T14:00:00Z',
]

export const MOCK_LAYERS = [
  { id: 'temperature', name: 'Temperature', kind: 'points', unit: '°C', timePoints: HOURLY_TIME_POINTS },
  { id: 'wind', name: 'Wind', kind: 'arrows', unit: 'm/s', timePoints: HOURLY_TIME_POINTS },
  { id: 'insolation', name: 'Insolation', kind: 'heatmap', unit: 'W/m²', timePoints: HOURLY_TIME_POINTS },
]
