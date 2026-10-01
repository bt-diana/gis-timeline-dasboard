import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { LayerListState } from '@entities/layer'
import { TEST_LAYERS } from '@shared/test/layers'
import { LayerPanel, type LayerPanelProps } from './LayerPanel'

function renderPanel(props: Partial<LayerPanelProps> = {}) {
  const onToggleLayer = vi.fn<(layerId: string) => void>()
  const onRetry = vi.fn<() => void>()
  const onRetryLayer = vi.fn<(layerId: string) => void>()
  const allProps: LayerPanelProps = {
    layers: TEST_LAYERS,
    activeLayerIds: ['wind'],
    list: { status: 'success' },
    snapshots: {},
    onToggleLayer,
    onRetry,
    onRetryLayer,
    ...props,
  }
  const view = render(<LayerPanel {...allProps} />)
  return { ...view, onToggleLayer, onRetry, onRetryLayer, allProps }
}

function checkedStates() {
  return screen.getAllByRole('switch').map((toggle) => toggle.getAttribute('aria-checked'))
}

const panel = () => screen.getByRole('complementary', { name: 'Layers' })
const T10 = '2026-01-01T10:00:00Z'

function rowOf(name: string) {
  const row = screen.getByRole('switch', { name }).closest('li')
  if (!row) throw new Error(`No row for ${name}`)
  return row
}

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

  it.each([
    ['loading', { status: 'loading', time: T10, features: null }],
    ['waiting for a retry', { status: 'stale', time: T10 }],
  ] as const)('shows a quiet busy row state while a layer is %s', (_, snapshot) => {
    renderPanel({ snapshots: { wind: snapshot } })

    const row = rowOf('Wind')
    expect(row).toHaveAttribute('aria-busy', 'true')
    expect(within(row).queryByRole('alert')).toBeNull()
    expect(rowOf('Temperature')).toHaveAttribute('aria-busy', 'false')
  })

  it('shows a layer error in its row with a Retry that calls onRetryLayer with the id', async () => {
    const user = userEvent.setup()
    const { onRetryLayer, onRetry } = renderPanel({
      snapshots: { wind: { status: 'error', time: T10, message: 'No data for this layer at the selected time.' } },
    })

    expect(within(rowOf('Wind')).getByRole('alert')).toHaveTextContent('No data for this layer at the selected time.')
    expect(within(rowOf('Temperature')).queryByRole('alert')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Retry Wind' }))

    expect(onRetryLayer).toHaveBeenCalledTimes(1)
    expect(onRetryLayer).toHaveBeenCalledWith('wind')
    expect(onRetry).not.toHaveBeenCalled()
  })

  it('shows nothing extra for a loaded layer', () => {
    renderPanel({ snapshots: { wind: { status: 'success', time: T10, features: { type: 'FeatureCollection', features: [] } } } })

    expect(rowOf('Wind')).toHaveAttribute('aria-busy', 'false')
    expect(within(rowOf('Wind')).queryByRole('alert')).toBeNull()
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
