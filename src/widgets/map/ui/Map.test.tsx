import { render, screen, within } from '@testing-library/react'
import { Map } from './Map'

vi.mock('./MapView', () => ({ MapView: () => <div data-testid="map-view" /> }))

const map = () => screen.getByRole('main', { name: 'Map' })

describe('Map', () => {
  it('renders the Map landmark with the map view', () => {
    render(<Map layers={[]} loadingTime={null} />)

    expect(within(map()).getByTestId('map-view')).toBeInTheDocument()
    expect(map()).toHaveAttribute('aria-busy', 'false')
    expect(within(map()).getByRole('status')).toBeEmptyDOMElement()
  })

  it('names the loading time above the map and marks it busy', () => {
    render(<Map layers={[]} loadingTime="16:00" />)

    expect(map()).toHaveAttribute('aria-busy', 'true')
    expect(within(map()).getByRole('status')).toHaveTextContent('Loading data for 16:00…')
  })
})
