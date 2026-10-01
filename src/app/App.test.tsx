import { render, screen } from '@testing-library/react'
import { App } from './App'

vi.mock('@widgets/header', () => ({ Header: () => <div data-testid="header" /> }))
vi.mock('@widgets/layer-panel', () => ({ ConnectedLayerPanel: () => <div data-testid="layer-panel" /> }))
vi.mock('@widgets/map', () => ({ ConnectedMap: () => <div data-testid="map" /> }))
vi.mock('@widgets/chart', () => ({ ConnectedChart: () => <div data-testid="chart" /> }))

describe('App', () => {
  it('renders the header, layer panel, map and chart', () => {
    render(<App />)

    for (const testId of ['header', 'layer-panel', 'map', 'chart']) {
      expect(screen.getByTestId(testId)).toBeInTheDocument()
    }
  })
})
