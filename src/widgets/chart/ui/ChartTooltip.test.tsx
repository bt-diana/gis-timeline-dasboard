import { render, screen } from '@testing-library/react'
import type { ChartLine, ChartRow } from '../model/buildChartData'
import { ChartTooltip } from './ChartTooltip'

vi.mock('@entities/time', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@entities/time')>()),
  formatLocalTime: (iso: string) => `local ${iso}`,
}))

const TIME = '2026-01-01T10:00:00Z'

const ROWS: readonly ChartRow[] = [
  { time: TIME, values: { temperature: { normalised: 0, value: -4 } } },
  { time: '2026-01-01T11:00:00Z', values: { temperature: { normalised: 1, value: 6 }, wind: { normalised: 0.5, value: 3 } } },
]

const LINES: readonly ChartLine[] = [
  { layerId: 'temperature', name: 'Temperature', unit: '°C', color: '#111111' },
  { layerId: 'wind', name: 'Wind', unit: 'm/s', color: '#222222' },
]

describe('ChartTooltip', () => {
  it('shows the formatted time and, per line with a value, its name, real value and unit', () => {
    render(<ChartTooltip active label={TIME} lines={LINES} rows={ROWS} />)

    expect(screen.getByText(`local ${TIME}`)).toBeInTheDocument()
    expect(screen.getByText('Temperature')).toBeInTheDocument()
    expect(screen.getByText('-4 °C')).toBeInTheDocument()
    expect(screen.queryByText('Wind')).not.toBeInTheDocument()
  })

  it('lists every line that has a value at that time', () => {
    render(<ChartTooltip active label="2026-01-01T11:00:00Z" lines={LINES} rows={ROWS} />)

    expect(screen.getByText('6 °C')).toBeInTheDocument()
    expect(screen.getByText('3 m/s')).toBeInTheDocument()
  })

  it.each([
    ['inactive', { active: false, label: TIME }],
    ['without a label', { active: true }],
  ])('renders nothing when %s', (_, props) => {
    const { container } = render(<ChartTooltip {...props} lines={LINES} rows={ROWS} />)

    expect(container).toBeEmptyDOMElement()
  })
})
