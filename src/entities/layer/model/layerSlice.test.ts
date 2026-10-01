import { TEST_LAYERS } from '@shared/test/layers'
import { initialLayerState, loadFailed, loadSucceeded, startLoading, toggleLayer, type LayerState } from './layerSlice'

const loadedWith = (activeLayerIds: readonly string[]): LayerState => ({
  ...initialLayerState,
  activeLayerIds,
})

describe('layerSlice', () => {
  it('starts empty and idle', () => {
    expect(initialLayerState).toEqual({ layers: [], activeLayerIds: [], list: { status: 'idle' } })
  })

  it('startLoading marks the list as loading and keeps the rest', () => {
    const state = loadedWith(['wind'])

    expect(startLoading(state)).toEqual({ ...state, list: { status: 'loading' } })
  })

  it('loadSucceeded stores the layers and makes all layers active when none was', () => {
    const next = loadSucceeded(startLoading(initialLayerState), TEST_LAYERS)

    expect(next.layers).toBe(TEST_LAYERS)
    expect(next.activeLayerIds).toEqual(['temperature', 'wind', 'insolation'])
    expect(next.list).toEqual({ status: 'success' })
  })

  it('loadSucceeded keeps known active ids in list order and drops unknown ones', () => {
    const next = loadSucceeded(loadedWith(['insolation', 'gone', 'wind']), TEST_LAYERS)

    expect(next.activeLayerIds).toEqual(['wind', 'insolation'])
  })

  it('loadSucceeded falls back to all layers when no active id is known', () => {
    expect(loadSucceeded(loadedWith(['gone']), TEST_LAYERS).activeLayerIds).toEqual(['temperature', 'wind', 'insolation'])
  })

  it('loadSucceeded with an empty list leaves nothing active', () => {
    const next = loadSucceeded(loadedWith(['wind']), [])

    expect(next.activeLayerIds).toEqual([])
    expect(next.list).toEqual({ status: 'success' })
  })

  it('loadFailed stores the message', () => {
    expect(loadFailed(startLoading(initialLayerState), 'Down.').list).toEqual({ status: 'error', message: 'Down.' })
  })

  it('toggleLayer toggles the id and keeps the layers', () => {
    const loaded = loadSucceeded(initialLayerState, TEST_LAYERS)
    const next = toggleLayer(loaded, 'wind')

    expect(next.activeLayerIds).toEqual(['temperature', 'insolation'])
    expect(next.layers).toBe(loaded.layers)
    expect(toggleLayer(next, 'wind').activeLayerIds).toEqual(['temperature', 'insolation', 'wind'])
  })
})
