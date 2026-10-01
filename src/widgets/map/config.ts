export const MAP_CONFIG = {
  heading: 'Map',
  headingId: 'map-heading',
  loading: (time: string) => `Loading data for ${time}…`,
  area: { west: 69.3, south: 39.2, east: 80.3, north: 43.3 },
  padding: 24,
} as const
