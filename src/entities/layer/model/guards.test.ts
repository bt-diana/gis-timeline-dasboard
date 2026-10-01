import { TEST_LAYERS } from '@shared/test/layers'
import { isLayerDefinition, isLayerDefinitionList } from './guards'

const [temperature] = TEST_LAYERS

describe('layer guards', () => {
  it('accepts the contract layers', () => {
    expect(isLayerDefinitionList(TEST_LAYERS)).toBe(true)
    expect(isLayerDefinitionList([])).toBe(true)
  })

  it.each([
    ['a missing field', { id: 'x', name: 'X', kind: 'points', timePoints: [] }],
    ['an unknown kind', { ...temperature, kind: 'raster' }],
    ['non-string time points', { ...temperature, timePoints: [1] }],
    ['a non-string id', { ...temperature, id: 7 }],
    ['null', null],
  ])('rejects %s', (_, value) => {
    expect(isLayerDefinition(value)).toBe(false)
  })

  it('rejects a non-array list and a list with one bad item', () => {
    expect(isLayerDefinitionList({ layers: TEST_LAYERS })).toBe(false)
    expect(isLayerDefinitionList([...TEST_LAYERS, { id: 'x' }])).toBe(false)
  })
})
