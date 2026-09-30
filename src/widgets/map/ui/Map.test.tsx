import { render, screen, within } from '@testing-library/react'
import { Map } from './Map'

describe('Map', () => {
  it('renders the Map landmark with its placeholder label on its own', () => {
    render(<Map />)

    const map = screen.getByRole('main', { name: 'Map' })
    expect(within(map).getByText('Map')).toBeVisible()
  })
})
