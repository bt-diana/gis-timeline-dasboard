import { StrictMode } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fetchLayers } from '@entities/layer'
import { ApiRequestError } from '@shared/api'
import { TEST_LAYERS } from '@shared/test/layers'
import { App } from './App'

vi.mock('@entities/layer/api/fetchLayers')

const fetchLayersMock = vi.mocked(fetchLayers)

beforeEach(() => {
  fetchLayersMock.mockResolvedValue(TEST_LAYERS)
})

afterEach(() => {
  fetchLayersMock.mockReset()
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
  it('shows the banner with the dashboard heading', () => {
    const { header } = renderLandmarks()

    expect(within(header).getByRole('heading', { name: 'GIS Timeline Dashboard' })).toBeInTheDocument()
  })

  it('shows loading, then a switch per loaded layer with the first one active', async () => {
    const { layer } = renderLandmarks()

    expect(within(layer).getByRole('status')).toHaveTextContent('Loading layers…')

    const switches = await within(layer).findAllByRole('switch')
    expect(switches.map((toggle) => toggle.textContent)).toEqual(['Temperature', 'Wind', 'Insolation'])
    expect(switches.map((toggle) => toggle.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false'])
  })

  it('shows each loaded layer with its unit', async () => {
    const { layer } = renderLandmarks()

    for (const definition of TEST_LAYERS) {
      const row = (await within(layer).findByRole('switch', { name: definition.name })).closest('li')
      expect(row).not.toBeNull()
      expect(within(row as HTMLElement).getByText(definition.unit)).toBeVisible()
    }
  })

  it('shows the empty state when the API returns no layers', async () => {
    fetchLayersMock.mockResolvedValue([])
    const { layer } = renderLandmarks()

    expect(await within(layer).findByText('No layers available')).toBeVisible()
    expect(within(layer).queryAllByRole('switch')).toHaveLength(0)
  })

  it('under StrictMode aborts the first mount request and shows the list once', async () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    const layer = screen.getByRole('complementary', { name: 'Layers' })

    expect(await within(layer).findAllByRole('switch')).toHaveLength(3)
    expect(fetchLayersMock).toHaveBeenCalledTimes(2)
    expect(fetchLayersMock.mock.calls[0]?.[0].aborted).toBe(true)
    expect(fetchLayersMock.mock.calls[1]?.[0].aborted).toBe(false)
  })

  it('toggles a layer on and off without changing the other switches', async () => {
    const user = userEvent.setup()
    const { layer } = renderLandmarks()
    const checkedStates = () =>
      within(layer)
        .getAllByRole('switch')
        .map((toggle) => toggle.getAttribute('aria-checked'))

    await user.click(await within(layer).findByRole('switch', { name: 'Wind' }))
    expect(checkedStates()).toEqual(['true', 'true', 'false'])

    await user.click(within(layer).getByRole('switch', { name: 'Wind' }))
    expect(checkedStates()).toEqual(['true', 'false', 'false'])
  })

  it('shows the error and recovers with Retry', async () => {
    const user = userEvent.setup()
    fetchLayersMock.mockRejectedValueOnce(new ApiRequestError('Layer service is down.'))
    const { layer } = renderLandmarks()

    expect(await within(layer).findByRole('alert')).toHaveTextContent('Layer service is down.')

    await user.click(within(layer).getByRole('button', { name: 'Retry' }))

    expect(await within(layer).findAllByRole('switch')).toHaveLength(3)
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
