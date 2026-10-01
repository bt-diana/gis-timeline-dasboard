import { formatLocalTime } from '@entities/time'
import type { ChartLine, ChartRow } from '../model/buildChartData'

export interface ChartTooltipProps {
  active?: boolean | undefined
  label?: string | number | undefined
  lines: readonly ChartLine[]
  rows: readonly ChartRow[]
}

export function ChartTooltip({ active, label, lines, rows }: ChartTooltipProps) {
  const row = active ? rows.find(({ time }) => time === label) : undefined
  if (!row) return null

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__time">{formatLocalTime(row.time)}</p>
      <ul className="chart-tooltip__list">
        {lines.map((line) => {
          const entry = row.values[line.layerId]
          if (!entry) return null
          return (
            <li key={line.layerId} className="chart-tooltip__item">
              <span className="chart-tooltip__swatch" style={{ background: line.color }} />
              <span>{line.name}</span>
              <span className="chart-tooltip__value">{`${String(entry.value)} ${line.unit}`}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
