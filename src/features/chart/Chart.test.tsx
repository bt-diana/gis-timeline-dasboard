import { render, screen, within } from '@testing-library/react'
import { Chart } from './Chart'

describe('Chart', () => {
  it('renders the Chart region with its placeholder label on its own', () => {
    render(<Chart />)

    const chart = screen.getByRole('region', { name: 'Chart' })
    expect(within(chart).getByText('Chart')).toBeVisible()
  })
})
