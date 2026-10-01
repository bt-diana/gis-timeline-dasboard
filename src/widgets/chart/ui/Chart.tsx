import './Chart.css'
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { LayerListState } from '@entities/layer'
import { formatLocalTime } from '@entities/time'
import { CHART_CONFIG } from '../config'
import type { ChartLayerError, ChartLayerStatus, ChartLine, ChartRow } from '../model/buildChartData'
import { ChartTooltip } from './ChartTooltip'

export interface ChartProps {
  rows: readonly ChartRow[]
  lines: readonly ChartLine[]
  selectedTime: string | null
  list: LayerListState
  activeLayerCount: number
  loading: readonly ChartLayerStatus[]
  errors: readonly ChartLayerError[]
  onSelectTime: (time: string) => void
  onRetry: (layerId: string) => void
}

const NORMALISED_DOMAIN = [0, 1]

function loadingText(loading: readonly ChartLayerStatus[]) {
  if (loading.length === 0) return CHART_CONFIG.loading
  return `${CHART_CONFIG.loadingPrefix}${loading.map(({ name }) => name).join(', ')}${CHART_CONFIG.loadingSuffix}`
}

function Plot({ rows, lines, selectedTime, onSelectTime }: Pick<ChartProps, 'rows' | 'lines' | 'selectedTime' | 'onSelectTime'>) {
  return (
    <div className="chart__plot">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={rows}
          onClick={({ activeLabel }) => {
            if (typeof activeLabel === 'string' && rows.some(({ time }) => time === activeLabel)) {
              onSelectTime(activeLabel)
            }
          }}
        >
          <XAxis dataKey="time" tickFormatter={formatLocalTime} />
          <YAxis hide domain={NORMALISED_DOMAIN} />
          <Tooltip
            content={({ active, label }) => <ChartTooltip active={active} label={label} lines={lines} rows={rows} />}
          />
          {lines.map((line) => (
            <Line
              key={line.layerId}
              name={line.name}
              stroke={line.color}
              dataKey={(row: ChartRow) => row.values[line.layerId]?.normalised}
              connectNulls={false}
              dot={false}
              isAnimationActive={false}
            />
          ))}
          {selectedTime !== null && <ReferenceLine x={selectedTime} className="chart__marker" />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Chart({
  rows,
  lines,
  selectedTime,
  list,
  activeLayerCount,
  loading,
  errors,
  onSelectTime,
  onRetry,
}: ChartProps) {
  const listSettled = list.status === 'success' || list.status === 'error'
  const isLoading = !listSettled || loading.length > 0
  const isEmpty = listSettled && activeLayerCount === 0

  return (
    <section className="chart" aria-labelledby={CHART_CONFIG.headingId} aria-busy={isLoading}>
      <h2 id={CHART_CONFIG.headingId} className="chart__heading">
        {CHART_CONFIG.heading}
      </h2>

      {isLoading && (
        <p role="status" className="chart__status">
          {loadingText(loading)}
        </p>
      )}

      {isEmpty && (
        <p role="status" className="chart__status">
          {CHART_CONFIG.empty}
        </p>
      )}

      {errors.map((error) => (
        <div key={error.layerId} role="alert" className="chart__error">
          <p className="chart__error-message">
            <strong>{error.name}</strong> {error.message}
          </p>
          <button
            type="button"
            className="chart__retry"
            onClick={() => {
              onRetry(error.layerId)
            }}
          >
            {CHART_CONFIG.retry}
          </button>
        </div>
      ))}

      {lines.length > 0 && (
        <Plot rows={rows} lines={lines} selectedTime={selectedTime} onSelectTime={onSelectTime} />
      )}
    </section>
  )
}
