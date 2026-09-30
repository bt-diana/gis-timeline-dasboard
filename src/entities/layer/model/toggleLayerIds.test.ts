import { toggleLayerIds } from './toggleLayerIds'

describe('toggleLayerIds', () => {
  it('adds a missing id at the end', () => {
    expect(toggleLayerIds(['wind'], 'temperature')).toEqual(['wind', 'temperature'])
  })

  it('removes a present id and keeps the order of the others', () => {
    expect(toggleLayerIds(['temperature', 'wind', 'insolation'], 'wind')).toEqual(['temperature', 'insolation'])
  })

  it('does not change the given list', () => {
    const activeLayerIds = ['wind']

    toggleLayerIds(activeLayerIds, 'wind')

    expect(activeLayerIds).toEqual(['wind'])
  })
})
