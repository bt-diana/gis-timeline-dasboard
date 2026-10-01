import { render, screen } from '@testing-library/react'
import { fetchLayers } from '@entities/layer'
import { App } from './App'

vi.mock('@entities/layer/api/fetchLayers')

beforeEach(() => {
  vi.mocked(fetchLayers).mockReturnValue(new Promise(() => undefined))
})

afterEach(() => {
  vi.mocked(fetchLayers).mockReset()
})

function renderLandmarks() {
  render(<App />)
  return {
    header: screen.getByRole('banner'),
    layer: screen.getByRole('complementary', { name: 'Layers' }),
    map: screen.getByRole('main', { name: 'Map' }),
    chart: screen.getByRole('region', { name: 'Chart' }),
  }
}

function precedes(first: Element, second: Element) {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)
}

describe('App shell', () => {
  it('orders the landmarks header, layer, map, chart', () => {
    const { header, layer, map, chart } = renderLandmarks()

    expect(precedes(header, layer)).toBe(true)
    expect(precedes(layer, map)).toBe(true)
    expect(precedes(map, chart)).toBe(true)
  })

  it('places the chart in the map column, apart from the layer panel', () => {
    const { layer, map, chart } = renderLandmarks()
    const mapColumn = map.parentElement

    expect(mapColumn).not.toBeNull()
    expect(chart.parentElement).toBe(mapColumn)
    expect(mapColumn?.contains(layer)).toBe(false)
  })
})
