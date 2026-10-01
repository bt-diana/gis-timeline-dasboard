import type { ReactNode } from 'react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { formatLocalTime } from '@entities/time'
import type { ChartLine, ChartRow } from '../model/buildChartData'
import { Chart, type ChartProps } from './Chart'

interface LineChartStubProps {
  children?: ReactNode
  data?: readonly ChartRow[]
  onClick?: (state: { activeLabel?: string | number | undefined }) => void
}
interface XAxisStubProps {
  dataKey?: unknown
  tickFormatter?: unknown
}
interface LineStubProps {
  name?: string
  stroke?: string
  connectNulls?: boolean
  dataKey?: (row: ChartRow) => unknown
}
interface TooltipStubProps {
  content?: ReactNode | ((props: { active: boolean; label: string }) => ReactNode)
}

const captured = vi.hoisted(() => ({
  lineChart: null as LineChartStubProps | null,
  xAxis: null as XAxisStubProps | null,
  lines: [] as LineStubProps[],
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: (props: LineChartStubProps) => {
    captured.lineChart = props
    return <div data-testid="line-chart">{props.children}</div>
  },
  XAxis: (props: XAxisStubProps) => {
    captured.xAxis = props
    return <div data-testid="x-axis" />
  },
  YAxis: () => <div data-testid="y-axis" />,
  Line: (props: LineStubProps) => {
    captured.lines.push(props)
    return <div data-testid="line" data-name={props.name} data-stroke={props.stroke} />
  },
  ReferenceLine: ({ x }: { x?: string }) => <div data-testid="reference-line" data-x={x} />,
  Tooltip: ({ content }: TooltipStubProps) => (
    <div data-testid="tooltip">
      {typeof content === 'function' ? content({ active: true, label: '2026-01-01T10:00:00Z' }) : content}
    </div>
  ),
}))

vi.mock('./ChartTooltip', () => ({ ChartTooltip: () => <div data-testid="chart-tooltip" /> }))

const POINTS = ['2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z', '2026-01-01T12:00:00Z'] as const

const ROWS: readonly ChartRow[] = [
  { time: POINTS[0], values: { temperature: { normalised: 0, value: -4 }, wind: { normalised: 0.5, value: 3 } } },
  { time: POINTS[1], values: { temperature: { normalised: 1, value: 6 } } },
  { time: POINTS[2], values: { wind: { normalised: 0.5, value: 3 } } },
]

const LINES: readonly ChartLine[] = [
  { layerId: 'temperature', name: 'Temperature', unit: '°C', color: '#111111' },
  { layerId: 'wind', name: 'Wind', unit: 'm/s', color: '#222222' },
]

function renderChart(props: Partial<ChartProps> = {}) {
  const onSelectTime = vi.fn<(time: string) => void>()
  const onRetry = vi.fn<(layerId: string) => void>()
  const allProps: ChartProps = {
    rows: ROWS,
    lines: LINES,
    selectedTime: POINTS[1],
    list: { status: 'success' },
    activeLayerCount: 2,
    loading: [],
    errors: [],
    onSelectTime,
    onRetry,
    ...props,
  }
  render(<Chart {...allProps} />)
  return { onSelectTime, onRetry }
}

const region = () => screen.getByRole('region', { name: 'Chart' })

function clickPlot(activeLabel: string | number | undefined) {
  act(() => {
    captured.lineChart?.onClick?.({ activeLabel })
  })
}

beforeEach(() => {
  captured.lineChart = null
  captured.xAxis = null
  captured.lines = []
})

describe('Chart', () => {
  it('renders the Chart region with its heading', () => {
    renderChart()

    expect(within(region()).getByRole('heading', { name: 'Chart' })).toBeInTheDocument()
  })

  it.each<[string, Partial<ChartProps>]>([
    ['the layer list is idle', { list: { status: 'idle' }, lines: [], activeLayerCount: 0 }],
    ['the layer list is loading', { list: { status: 'loading' }, lines: [], activeLayerCount: 0 }],
  ])('shows a busy loading status while %s, with no plot', (_, props) => {
    renderChart(props)

    expect(region()).toHaveAttribute('aria-busy', 'true')
    expect(within(region()).getByRole('status')).toHaveTextContent('Loading')
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })

  it('names the layers whose series are loading', () => {
    renderChart({
      lines: [],
      loading: [
        { layerId: 'temperature', name: 'Temperature' },
        { layerId: 'wind', name: 'Wind' },
      ],
    })

    expect(region()).toHaveAttribute('aria-busy', 'true')
    expect(within(region()).getByRole('status')).toHaveTextContent('Loading series: Temperature, Wind')
    expect(screen.queryByText('Turn on a layer to see its series')).not.toBeInTheDocument()
  })

  it('shows each failed layer with its message, and Retry calls onRetry once with its id', async () => {
    const user = userEvent.setup()
    const { onRetry } = renderChart({
      lines: [],
      errors: [
        { layerId: 'temperature', name: 'Temperature', message: 'Series service is down.' },
        { layerId: 'wind', name: 'Wind', message: 'Wind failed.' },
      ],
    })

    const alerts = within(region()).getAllByRole('alert')
    expect(alerts).toHaveLength(2)
    expect(alerts[0]).toHaveTextContent('Temperature')
    expect(alerts[0]).toHaveTextContent('Series service is down.')
    expect(alerts[1]).toHaveTextContent('Wind')
    expect(alerts[1]).toHaveTextContent('Wind failed.')

    const [, windAlert] = alerts
    if (!windAlert) throw new Error('Missing Wind alert')
    await user.click(within(windAlert).getByRole('button', { name: 'Retry' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledWith('wind')
  })

  it.each<[string, ChartProps['list']]>([
    ['loaded', { status: 'success' }],
    ['failed', { status: 'error', message: 'Layer service is down.' }],
  ])('shows the empty status when no layer is active and the list has %s', (_, list) => {
    renderChart({ list, lines: [], activeLayerCount: 0 })

    expect(within(region()).getByRole('status')).toHaveTextContent('Turn on a layer to see its series')
    expect(region()).toHaveAttribute('aria-busy', 'false')
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })

  it('renders the plot with one line per descriptor, the rows, and the marker at the selected time', () => {
    renderChart()

    expect(region()).toHaveAttribute('aria-busy', 'false')
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(captured.lineChart?.data).toBe(ROWS)
    expect(
      screen.getAllByTestId('line').map((line) => [line.dataset.name, line.dataset.stroke]),
    ).toEqual([
      ['Temperature', '#111111'],
      ['Wind', '#222222'],
    ])
    expect(screen.getByTestId('reference-line')).toHaveAttribute('data-x', POINTS[1])
    expect(screen.getByTestId('chart-tooltip')).toBeInTheDocument()
  })

  it('plots each line from its normalised values, leaving gaps where a row has none', () => {
    renderChart()

    const [temperature, wind] = captured.lines
    expect(ROWS.map((row) => temperature?.dataKey?.(row))).toEqual([0, 1, undefined])
    expect(ROWS.map((row) => wind?.dataKey?.(row))).toEqual([0.5, undefined, 0.5])
    expect(captured.lines.every((line) => line.connectNulls === false)).toBe(true)
  })

  it('labels the X axis by row time in local HH:mm', () => {
    renderChart()

    expect(captured.xAxis?.dataKey).toBe('time')
    expect(captured.xAxis?.tickFormatter).toBe(formatLocalTime)
  })

  it('shows no marker while no time is selected', () => {
    renderChart({ selectedTime: null })

    expect(screen.queryByTestId('reference-line')).not.toBeInTheDocument()
  })

  it('shows failed layers beside the loaded lines', () => {
    renderChart({ errors: [{ layerId: 'insolation', name: 'Insolation', message: 'Insolation failed.' }] })

    expect(screen.getAllByTestId('line')).toHaveLength(2)
    expect(within(region()).getByRole('alert')).toHaveTextContent('Insolation failed.')
  })

  it('a click on the plot calls onSelectTime once with the nearest point Recharts reports', () => {
    const { onSelectTime } = renderChart()

    clickPlot(POINTS[2])

    expect(onSelectTime).toHaveBeenCalledTimes(1)
    expect(onSelectTime).toHaveBeenCalledWith(POINTS[2])
  })

  it.each([
    ['no active label', undefined],
    ['a label outside the rows', '2026-01-01T13:00:00Z'],
  ])('a click with %s selects nothing', (_, activeLabel) => {
    const { onSelectTime } = renderChart()

    clickPlot(activeLabel)

    expect(onSelectTime).not.toHaveBeenCalled()
  })
})
