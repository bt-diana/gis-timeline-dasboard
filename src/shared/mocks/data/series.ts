export const MOCK_SERIES: Readonly<Record<string, { layerId: string; points: { time: string; value: number }[] }>> = {
  temperature: {
    layerId: 'temperature',
    points: [
      { time: '2026-01-01T10:00:00Z', value: -3.5 },
      { time: '2026-01-01T11:00:00Z', value: -1.2 },
      { time: '2026-01-01T12:00:00Z', value: 0.8 },
      { time: '2026-01-01T13:00:00Z', value: 1.6 },
      { time: '2026-01-01T14:00:00Z', value: 0.4 },
    ],
  },
  wind: {
    layerId: 'wind',
    points: [
      { time: '2026-01-01T10:00:00Z', value: 4.2 },
      { time: '2026-01-01T11:00:00Z', value: 5.1 },
      { time: '2026-01-01T12:00:00Z', value: 6.3 },
      { time: '2026-01-01T13:00:00Z', value: 5.8 },
      { time: '2026-01-01T14:00:00Z', value: 4.9 },
    ],
  },
  insolation: {
    layerId: 'insolation',
    points: [
      { time: '2026-01-01T10:00:00Z', value: 180 },
      { time: '2026-01-01T11:00:00Z', value: 260 },
      { time: '2026-01-01T12:00:00Z', value: 310 },
      { time: '2026-01-01T13:00:00Z', value: 290 },
      { time: '2026-01-01T14:00:00Z', value: 210 },
    ],
  },
}
