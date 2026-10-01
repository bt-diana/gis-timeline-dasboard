export const LAYER_PANEL_CONFIG = {
  heading: 'Layers',
  headingId: 'layer-panel-heading',
  loading: 'Loading layers…',
  empty: 'No layers available',
  retry: 'Retry',
  retryLayer: (name: string) => `Retry ${name}`,
} as const
