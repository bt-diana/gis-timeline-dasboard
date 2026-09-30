import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { LayerSummary } from '@entities/layer'
import { LayerPanel } from './LayerPanel'

const LAYERS: readonly LayerSummary[] = [
  { id: 'temperature', name: 'Temperature', kind: 'points', unit: '°C' },
  { id: 'wind', name: 'Wind', kind: 'arrows', unit: 'm/s' },
  { id: 'insolation', name: 'Insolation', kind: 'heatmap', unit: 'W/m²' },
]

function renderPanel(activeLayerIds: readonly string[] = ['wind']) {
  const onToggleLayer = vi.fn<(layerId: string) => void>()
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

    expect(screen.getAllByRole('switch').map((toggle) => toggle.textContent)).toEqual([
      'Temperature',
      'Wind',
      'Insolation',
    ])
    for (const layer of LAYERS) {
      const row = screen.getByRole('switch', { name: layer.name }).closest('li')
      expect(row).not.toBeNull()
      expect(within(row as HTMLElement).getByText(layer.unit)).toBeVisible()
    }
  })

  it('checks exactly the switches whose ids are active', () => {
    renderPanel(['temperature', 'insolation'])

    expect(checkedStates()).toEqual(['true', 'false', 'true'])
  })

  it('ignores unknown active ids', () => {
    renderPanel(['unknown'])

    expect(screen.getAllByRole('switch')).toHaveLength(LAYERS.length)
    expect(checkedStates()).toEqual(['false', 'false', 'false'])
  })

  it.each([
    ['click', (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('switch', { name: 'Temperature' }))],
    ['Space', async (user: ReturnType<typeof userEvent.setup>) => {
      screen.getByRole('switch', { name: 'Temperature' }).focus()
      await user.keyboard(' ')
    }],
    ['Enter', async (user: ReturnType<typeof userEvent.setup>) => {
      screen.getByRole('switch', { name: 'Temperature' }).focus()
      await user.keyboard('{Enter}')
    }],
  ])('calls onToggleLayer once with the id on %s', async (_, activate) => {
    const user = userEvent.setup()
    const { onToggleLayer } = renderPanel()

    await activate(user)

    expect(onToggleLayer).toHaveBeenCalledTimes(1)
    expect(onToggleLayer).toHaveBeenCalledWith('temperature')
  })

  it('keeps aria-checked until the props change', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByRole('switch', { name: 'Temperature' }))

    expect(checkedStates()).toEqual(['false', 'true', 'false'])
  })
})
