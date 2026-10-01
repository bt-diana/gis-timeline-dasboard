import type { SeriesSliceState } from '@entities/series'
import { TEST_LAYERS } from '@shared/test/layers'
import { TEST_SERIES } from '@shared/test/series'
import { CHART_LINE_COLORS } from '../config'
import { buildChartData } from './buildChartData'

const normaliseMock = vi.hoisted(() =>
  vi.fn((points: readonly { time: string; value: number }[]) =>
    new Map(points.map(({ time, value }) => [time, { normalised: value / 1000, value }])),
  ),
)

vi.mock('@entities/series', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  normaliseSeries: normaliseMock,
}))

const POINTS = ['2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z', '2026-01-01T12:00:00Z']
const ALL_IDS = ['wind', 'temperature', 'insolation']

const LOADED: SeriesSliceState = {
  temperature: { status: 'success', points: TEST_SERIES.temperature.points },
  wind: { status: 'success', points: TEST_SERIES.wind.points },
  insolation: { status: 'success', points: TEST_SERIES.insolation.points },
}

const entry = (value: number) => ({ normalised: value / 1000, value })

describe('buildChartData', () => {
  it('builds one row per range point with the normalised and real values of each line, gaps where a series has no point', () => {
    const { rows } = buildChartData(POINTS, TEST_LAYERS, ALL_IDS, LOADED)

    expect(rows).toEqual([
      { time: POINTS[0], values: { temperature: entry(-4), wind: entry(3) } },
      { time: POINTS[1], values: { temperature: entry(6) } },
      { time: POINTS[2], values: { wind: entry(3), insolation: entry(420) } },
    ])
  })

  it('makes lines of active loaded layers only, in list order, coloured by list position', () => {
    const { lines, rows } = buildChartData(POINTS, TEST_LAYERS, ['insolation', 'wind'], LOADED)

    expect(lines).toEqual([
      { layerId: 'wind', name: 'Wind', unit: 'm/s', color: CHART_LINE_COLORS[1] },
      { layerId: 'insolation', name: 'Insolation', unit: 'W/m²', color: CHART_LINE_COLORS[2] },
    ])
    expect(rows.every(({ values }) => !('temperature' in values))).toBe(true)
  })

  it('ignores series points outside the range, also for scaling', () => {
    normaliseMock.mockClear()
    const series: SeriesSliceState = {
      temperature: { status: 'success', points: [...TEST_SERIES.temperature.points, { time: '2026-01-01T09:00:00Z', value: 50 }] },
    }

    const { rows } = buildChartData(POINTS, TEST_LAYERS, ['temperature'], series)

    expect(rows.map(({ time }) => time)).toEqual(POINTS)
    expect(rows.flatMap(({ values }) => Object.values(values).map(({ value }) => value))).toEqual([-4, 6])
    expect(normaliseMock).toHaveBeenCalledWith(TEST_SERIES.temperature.points)
  })

  it('lists active loading and failed layers, and skips inactive ones', () => {
    const series: SeriesSliceState = {
      temperature: { status: 'loading' },
      wind: { status: 'error', message: 'Series service is down.' },
      insolation: { status: 'error', message: 'Inactive failure.' },
    }

    const { lines, loading, errors } = buildChartData(POINTS, TEST_LAYERS, ['temperature', 'wind'], series)

    expect(lines).toEqual([])
    expect(loading).toEqual([{ layerId: 'temperature', name: 'Temperature' }])
    expect(errors).toEqual([{ layerId: 'wind', name: 'Wind', message: 'Series service is down.' }])
  })

  it('lists an active layer with no series entry as loading, without a line', () => {
    const series: SeriesSliceState = { wind: { status: 'success', points: TEST_SERIES.wind.points } }

    const { lines, loading } = buildChartData(POINTS, TEST_LAYERS, ['temperature', 'wind'], series)

    expect(lines.map(({ layerId }) => layerId)).toEqual(['wind'])
    expect(loading).toEqual([{ layerId: 'temperature', name: 'Temperature' }])
  })

  it('returns rows without values and no lines when nothing is active', () => {
    const data = buildChartData(POINTS, TEST_LAYERS, [], LOADED)

    expect(data.rows).toEqual(POINTS.map((time) => ({ time, values: {} })))
    expect(data.lines).toEqual([])
    expect(data.loading).toEqual([])
    expect(data.errors).toEqual([])
  })
})
