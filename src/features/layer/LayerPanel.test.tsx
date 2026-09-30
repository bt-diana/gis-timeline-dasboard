import { render, screen, within } from '@testing-library/react'
import { LAYER_FIXTURES } from './layerFixtures'
import { LayerPanel } from './LayerPanel'

function checkedStates() {
  return screen.getAllByRole('switch').map((toggle) => toggle.getAttribute('aria-checked'))
}

describe('LayerPanel', () => {
  it('renders the Layers landmark on its own', () => {
    render(<LayerPanel />)

    expect(screen.getByRole('complementary', { name: 'Layers' })).toBeInTheDocument()
  })

  it('renders one switch per layer, named by layer, in layers order, with its unit', () => {
    render(<LayerPanel />)

    const switches = screen.getAllByRole('switch')
    expect(switches.map((toggle) => toggle.textContent)).toEqual(['Temperature', 'Wind', 'Insolation'])
    for (const layer of LAYER_FIXTURES) {
      const row = screen.getByRole('switch', { name: layer.name }).closest('li')
      expect(row).not.toBeNull()
      expect(within(row as HTMLElement).getByText(layer.unit)).toBeVisible()
    }
  })

  it('checks the default active fixture layer', () => {
    render(<LayerPanel />)

    expect(checkedStates()).toEqual(['false', 'true', 'false'])
  })

  it('renders the default fixture set without needing props', () => {
    render(<LayerPanel />)

    expect(screen.getAllByRole('switch')).toHaveLength(LAYER_FIXTURES.length)
    expect(checkedStates()).toEqual(['false', 'true', 'false'])
  })
})
