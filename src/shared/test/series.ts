export const TEST_SERIES = {
  temperature: {
    layerId: 'temperature',
    points: [
      { time: '2026-01-01T10:00:00Z', value: -4 },
      { time: '2026-01-01T11:00:00Z', value: 6 },
    ],
  },
  wind: {
    layerId: 'wind',
    points: [
      { time: '2026-01-01T10:00:00Z', value: 3 },
      { time: '2026-01-01T12:00:00Z', value: 3 },
    ],
  },
  insolation: {
    layerId: 'insolation',
    points: [{ time: '2026-01-01T12:00:00Z', value: 420 }],
  },
}
