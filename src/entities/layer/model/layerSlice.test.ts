import { LAYER_FIXTURES } from './layerFixtures'
import { initialLayerState, toggleLayer } from './layerSlice'

describe('layerSlice', () => {
  it('starts with the three fixture layers and wind active', () => {
    expect(initialLayerState.layers).toEqual(LAYER_FIXTURES)
    expect(initialLayerState.activeLayerIds).toEqual(['wind'])
  })

  it('toggleLayer returns a new slice with the id toggled and the layers kept', () => {
    const next = toggleLayer(initialLayerState, 'temperature')

    expect(next).not.toBe(initialLayerState)
    expect(next.activeLayerIds).toEqual(['wind', 'temperature'])
    expect(next.layers).toBe(initialLayerState.layers)
    expect(toggleLayer(next, 'wind').activeLayerIds).toEqual(['temperature'])
  })
})
