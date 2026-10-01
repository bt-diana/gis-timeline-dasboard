import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { LayerListState } from '@entities/layer'
import { TEST_LAYERS } from '@shared/test/layers'
import { LayerPanel, type LayerPanelProps } from './LayerPanel'

function renderPanel(props: Partial<LayerPanelProps> = {}) {
  const onToggleLayer = vi.fn<(layerId: string) => void>()
  const onRetry = vi.fn<() => void>()
  const allProps: LayerPanelProps = {
    layers: TEST_LAYERS,
    activeLayerIds: ['wind'],
    list: { status: 'success' },
    onToggleLayer,
    onRetry,
    ...props,
  }
  const view = render(<LayerPanel {...allProps} />)
  return { ...view, onToggleLayer, onRetry, allProps }
}

function checkedStates() {
  return screen.getAllByRole('switch').map((toggle) => toggle.getAttribute('aria-checked'))
}

const panel = () => screen.getByRole('complementary', { name: 'Layers' })

describe('LayerPanel', () => {
  it('renders the Layers landmark on its own', () => {
    renderPanel()

    expect(panel()).toBeInTheDocument()
  })

  it.each<[string, LayerListState]>([
    ['idle', { status: 'idle' }],
    ['loading', { status: 'loading' }],
  ])('shows the loading status while %s, marked busy, with no switches', (_, list) => {
    renderPanel({ list })

    expect(panel()).toHaveAttribute('aria-busy', 'true')
    expect(within(panel()).getByRole('status')).toHaveTextContent('Loading layers…')
    expect(screen.queryAllByRole('switch')).toHaveLength(0)
  })

  it('shows the error message and a Retry button that calls onRetry once', async () => {
    const user = userEvent.setup()
    const { onRetry } = renderPanel({ list: { status: 'error', message: 'Layer service is down.' } })

    expect(within(panel()).getByRole('alert')).toHaveTextContent('Layer service is down.')
    expect(panel()).toHaveAttribute('aria-busy', 'false')
    expect(screen.queryAllByRole('switch')).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows the empty status when the loaded list is empty', () => {
    renderPanel({ layers: [] })

    expect(within(panel()).getByRole('status')).toHaveTextContent('No layers available')
    expect(screen.queryAllByRole('switch')).toHaveLength(0)
  })

  it('renders one switch per layer, named by layer, in layers order, with its unit', () => {
    renderPanel()

    expect(screen.getAllByRole('switch').map((toggle) => toggle.textContent)).toEqual([
      'Temperature',
      'Wind',
      'Insolation',
    ])
    for (const layer of TEST_LAYERS) {
      const row = screen.getByRole('switch', { name: layer.name }).closest('li')
      expect(row).not.toBeNull()
      expect(within(row as HTMLElement).getByText(layer.unit)).toBeVisible()
    }
  })

  it('checks exactly the switches whose ids are active and ignores unknown ids', () => {
    renderPanel({ activeLayerIds: ['temperature', 'insolation', 'unknown'] })

    expect(checkedStates()).toEqual(['true', 'false', 'true'])
  })

  it.each([
    ['click', (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('switch', { name: 'Temperature' }))],
    [
      'Space',
      async (user: ReturnType<typeof userEvent.setup>) => {
        screen.getByRole('switch', { name: 'Temperature' }).focus()
        await user.keyboard(' ')
      },
    ],
    [
      'Enter',
      async (user: ReturnType<typeof userEvent.setup>) => {
        screen.getByRole('switch', { name: 'Temperature' }).focus()
        await user.keyboard('{Enter}')
      },
    ],
  ])('calls onToggleLayer once with the id on %s', async (_, activate) => {
    const user = userEvent.setup()
    const { onToggleLayer } = renderPanel()

    await activate(user)

    expect(onToggleLayer).toHaveBeenCalledTimes(1)
    expect(onToggleLayer).toHaveBeenCalledWith('temperature')
  })

  it('keeps aria-checked until the props change', async () => {
    const user = userEvent.setup()
    const { rerender, allProps } = renderPanel()

    await user.click(screen.getByRole('switch', { name: 'Temperature' }))
    expect(checkedStates()).toEqual(['false', 'true', 'false'])

    rerender(<LayerPanel {...allProps} activeLayerIds={['wind', 'temperature']} />)
    expect(checkedStates()).toEqual(['true', 'true', 'false'])
  })
})
