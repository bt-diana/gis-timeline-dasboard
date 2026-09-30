import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LayerPanel } from './LayerPanel'
import type { LayerSummary } from './types'

const LAYERS: LayerSummary[] = [
  { id: 'temperature', name: 'Temperature', kind: 'points', unit: '°C' },
  { id: 'wind', name: 'Wind', kind: 'arrows', unit: 'm/s' },
  { id: 'insolation', name: 'Insolation', kind: 'heatmap', unit: 'W/m²' },
]

function renderPanel(activeLayerIds: readonly string[] = ['wind']) {
  const onToggleLayer = vi.fn()
  const view = render(<LayerPanel layers={LAYERS} activeLayerIds={activeLayerIds} onToggleLayer={onToggleLayer} />)
  return { ...view, onToggleLayer }
}

function checkedStates() {
  return screen.getAllByRole('switch').map((toggle) => toggle.getAttribute('aria-checked'))
}

describe('LayerPanel', () => {
  it('renders the Layers landmark on its own', () => {
    renderPanel()

    expect(screen.getByRole('complementary', { name: 'Layers' })).toBeInTheDocument()
  })

  it('renders one switch per layer, named by layer, in layers order, with its unit', () => {
    renderPanel()

    const switches = screen.getAllByRole('switch')
    expect(switches.map((toggle) => toggle.textContent)).toEqual(['Temperature', 'Wind', 'Insolation'])
    for (const layer of LAYERS) {
      const row = screen.getByRole('switch', { name: layer.name }).closest('li')
      expect(row).not.toBeNull()
      expect(within(row as HTMLElement).getByText(layer.unit)).toBeVisible()
    }
  })

  it('checks exactly the switches whose ids are in activeLayerIds', () => {
    renderPanel(['temperature', 'insolation'])

    expect(checkedStates()).toEqual(['true', 'false', 'true'])
  })

  it('ignores unknown ids in activeLayerIds', () => {
    renderPanel(['unknown'])

    expect(screen.getAllByRole('switch')).toHaveLength(LAYERS.length)
    expect(checkedStates()).toEqual(['false', 'false', 'false'])
  })

  it('calls onToggleLayer once with the layer id on click', async () => {
    const user = userEvent.setup()
    const { onToggleLayer } = renderPanel()

    await user.click(screen.getByRole('switch', { name: 'Temperature' }))

    expect(onToggleLayer).toHaveBeenCalledTimes(1)
    expect(onToggleLayer).toHaveBeenCalledWith('temperature')
  })

  it.each([
    ['Space', ' '],
    ['Enter', '{Enter}'],
  ])('calls onToggleLayer once with the layer id on %s', async (_key, keys) => {
    const user = userEvent.setup()
    const { onToggleLayer } = renderPanel()
    screen.getByRole('switch', { name: 'Insolation' }).focus()

    await user.keyboard(keys)

    expect(onToggleLayer).toHaveBeenCalledTimes(1)
    expect(onToggleLayer).toHaveBeenCalledWith('insolation')
  })

  it('keeps aria-checked unchanged after a click until props change', async () => {
    const user = userEvent.setup()
    const { rerender, onToggleLayer } = renderPanel(['wind'])
    const temperature = screen.getByRole('switch', { name: 'Temperature' })

    await user.click(temperature)

    expect(temperature).toHaveAttribute('aria-checked', 'false')

    rerender(<LayerPanel layers={LAYERS} activeLayerIds={['wind', 'temperature']} onToggleLayer={onToggleLayer} />)

    expect(temperature).toHaveAttribute('aria-checked', 'true')
  })
})
