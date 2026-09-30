import { render, screen, within } from '@testing-library/react'
import { Layer } from './Layer'

describe('Layer', () => {
  it('renders the Layers landmark with its placeholder label on its own', () => {
    render(<Layer />)

    const layer = screen.getByRole('complementary', { name: 'Layers' })
    expect(within(layer).getByText('Layers')).toBeVisible()
  })
})
