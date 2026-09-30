import { render, screen, within } from '@testing-library/react'
import { App } from './App'

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
  it('shows the banner with the dashboard heading', () => {
    const { header } = renderLandmarks()

    expect(within(header).getByRole('heading', { name: 'GIS Timeline Dashboard' })).toBeInTheDocument()
  })

  it('shows the layer, map and chart landmarks with their placeholder labels', () => {
    const { layer, map, chart } = renderLandmarks()

    expect(within(layer).getByText('Layers')).toBeVisible()
    expect(within(map).getByText('Map')).toBeVisible()
    expect(within(chart).getByText('Chart')).toBeVisible()
  })

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
