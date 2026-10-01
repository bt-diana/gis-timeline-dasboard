const point = (coordinates: [number, number], properties: { value: number } | { speed: number; direction: number }) => ({
  type: 'Feature' as const,
  geometry: { type: 'Point' as const, coordinates },
  properties,
})

export const TEST_SNAPSHOTS = {
  temperature: {
    layerId: 'temperature',
    time: '2026-01-01T10:00:00Z',
    features: {
      type: 'FeatureCollection' as const,
      features: [point([70, 40], { value: -2 }), point([71, 41], { value: 6 })],
    },
  },
  temperatureLater: {
    layerId: 'temperature',
    time: '2026-01-01T11:00:00Z',
    features: {
      type: 'FeatureCollection' as const,
      features: [point([70, 40], { value: 1 }), point([71, 41], { value: 9 })],
    },
  },
  wind: {
    layerId: 'wind',
    time: '2026-01-01T10:00:00Z',
    features: {
      type: 'FeatureCollection' as const,
      features: [point([70, 40], { speed: 2, direction: 90 }), point([71, 41], { speed: 4, direction: 180 })],
    },
  },
}
