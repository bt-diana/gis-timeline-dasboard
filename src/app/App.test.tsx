import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('shows the Layers landmark with a switch per fixture layer', () => {
    const { layer } = renderLandmarks()

    expect(within(layer).getAllByRole('switch').map((toggle) => toggle.textContent)).toEqual([
      'Temperature',
      'Wind',
      'Insolation',
    ])
  })

  it('toggles a layer on and off without changing the other switches', async () => {
    const user = userEvent.setup()
    const { layer } = renderLandmarks()
    const checkedStates = () =>
      within(layer)
        .getAllByRole('switch')
        .map((toggle) => toggle.getAttribute('aria-checked'))

    expect(checkedStates()).toEqual(['false', 'true', 'false'])

    await user.click(within(layer).getByRole('switch', { name: 'Temperature' }))
    expect(checkedStates()).toEqual(['true', 'true', 'false'])

    await user.click(within(layer).getByRole('switch', { name: 'Temperature' }))
    expect(checkedStates()).toEqual(['false', 'true', 'false'])
  })

  it('shows the map and chart landmarks with their placeholder labels', () => {
    const { map, chart } = renderLandmarks()

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
