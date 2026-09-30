import { render, screen, within } from '@testing-library/react'
import { Header } from './Header'

describe('Header', () => {
  it('renders the banner with the dashboard heading on its own', () => {
    render(<Header />)

    const banner = screen.getByRole('banner')
    expect(within(banner).getByRole('heading', { name: 'GIS Timeline Dashboard' })).toBeInTheDocument()
  })
})
