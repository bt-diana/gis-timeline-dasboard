import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppStoreProvider, initialAppStoreState } from '@shared/store/appStore'
import { LAYER_FIXTURES } from '@shared/store/layers/layerFixtures'
import { LayerPanel } from './LayerPanel'

function checkedStates() {
  return screen.getAllByRole('switch').map((toggle) => toggle.getAttribute('aria-checked'))
}

function renderPanel() {
  return render(
    <AppStoreProvider state={initialAppStoreState}>
      <LayerPanel />
    </AppStoreProvider>,
  )
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
    for (const layer of LAYER_FIXTURES) {
      const row = screen.getByRole('switch', { name: layer.name }).closest('li')
      expect(row).not.toBeNull()
      expect(within(row as HTMLElement).getByText(layer.unit)).toBeVisible()
    }
  })

  it('checks the default active fixture layer', () => {
    renderPanel()

    expect(checkedStates()).toEqual(['false', 'true', 'false'])
  })

  it('renders the default fixture set without needing props', () => {
    renderPanel()

    expect(screen.getAllByRole('switch')).toHaveLength(LAYER_FIXTURES.length)
    expect(checkedStates()).toEqual(['false', 'true', 'false'])
  })

  it('toggles the selected layer state on click', async () => {
    const user = userEvent.setup()
    renderPanel()

    const temperature = screen.getByRole('switch', { name: 'Temperature' })
    expect(temperature).toHaveAttribute('aria-checked', 'false')

    await user.click(temperature)
    expect(temperature).toHaveAttribute('aria-checked', 'true')

    await user.click(temperature)
    expect(temperature).toHaveAttribute('aria-checked', 'false')
  })
})
