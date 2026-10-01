import { render } from '@testing-library/react'
import { TEST_SNAPSHOTS } from '@shared/test/snapshots'
import { createMapLibreAdapter } from '../lib/createMapLibreAdapter'
import type { MapAdapter, MapLayerData } from '../lib/types'
import { toMapFeatures } from '../model/toMapFeatures'
import { MapView } from './MapView'

vi.mock('../lib/createMapLibreAdapter', () => ({ createMapLibreAdapter: vi.fn() }))

const createMock = vi.mocked(createMapLibreAdapter)
const WIND: MapLayerData[] = [{ id: 'wind', kind: 'arrows', data: toMapFeatures(TEST_SNAPSHOTS.wind.features) }]

function fakeAdapter() {
  const adapter = { setLayers: vi.fn<MapAdapter['setLayers']>(), destroy: vi.fn<MapAdapter['destroy']>() }
  createMock.mockReturnValue(adapter)
  return adapter
}

afterEach(() => {
  createMock.mockReset()
})

describe('MapView', () => {
  it('creates the adapter once in its container and passes the initial layers', () => {
    const adapter = fakeAdapter()
    const { getByTestId } = render(<MapView layers={WIND} />)

    expect(createMock).toHaveBeenCalledTimes(1)
    expect(createMock).toHaveBeenCalledWith(getByTestId('map-canvas'))
    expect(adapter.setLayers).toHaveBeenLastCalledWith(WIND)
  })

  it('updates the same adapter when the layers change, without recreating it', () => {
    const adapter = fakeAdapter()
    const { rerender } = render(<MapView layers={WIND} />)

    rerender(<MapView layers={[]} />)

    expect(createMock).toHaveBeenCalledTimes(1)
    expect(adapter.setLayers).toHaveBeenLastCalledWith([])
  })

  it('destroys the adapter on unmount', () => {
    const adapter = fakeAdapter()
    const { unmount } = render(<MapView layers={WIND} />)

    unmount()

    expect(adapter.destroy).toHaveBeenCalledTimes(1)
  })
})
