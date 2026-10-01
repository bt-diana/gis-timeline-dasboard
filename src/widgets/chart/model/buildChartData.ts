import type { LayerDefinition } from '@entities/layer'
import { normaliseSeries, type NormalisedValue, type SeriesSliceState } from '@entities/series'
import { CHART_LINE_COLORS } from '../config'

export interface ChartLine {
  layerId: string
  name: string
  unit: string
  color: string
}

export interface ChartRow {
  time: string
  values: Readonly<Record<string, NormalisedValue>>
}

export interface ChartLayerStatus {
  layerId: string
  name: string
}

export interface ChartLayerError extends ChartLayerStatus {
  message: string
}

export interface ChartData {
  rows: readonly ChartRow[]
  lines: readonly ChartLine[]
  loading: readonly ChartLayerStatus[]
  errors: readonly ChartLayerError[]
}

const lineColor = (listIndex: number) => CHART_LINE_COLORS[listIndex % CHART_LINE_COLORS.length] ?? CHART_LINE_COLORS[0]

export function buildChartData(
  points: readonly string[],
  layers: readonly LayerDefinition[],
  activeLayerIds: readonly string[],
  series: SeriesSliceState,
): ChartData {
  const lines: ChartLine[] = []
  const loading: ChartLayerStatus[] = []
  const errors: ChartLayerError[] = []
  const loaded: { layerId: string; values: ReadonlyMap<string, NormalisedValue> }[] = []

  layers.forEach((layer, listIndex) => {
    if (!activeLayerIds.includes(layer.id)) return
    const entry = series[layer.id]
    const status = { layerId: layer.id, name: layer.name }
    if (!entry || entry.status === 'loading') {
      loading.push(status)
    } else if (entry.status === 'error') {
      errors.push({ ...status, message: entry.message })
    } else {
      lines.push({ ...status, unit: layer.unit, color: lineColor(listIndex) })
      loaded.push({ layerId: layer.id, values: normaliseSeries(entry.points.filter(({ time }) => points.includes(time))) })
    }
  })

  const rows = points.map((time) => ({
    time,
    values: Object.fromEntries(
      loaded.flatMap(({ layerId, values }) => {
        const value = values.get(time)
        return value ? [[layerId, value] as const] : []
      }),
    ),
  }))

  return { rows, lines, loading, errors }
}
