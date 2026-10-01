import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { loadSucceeded, toggleLayer } from '@entities/layer'
import type { SeriesSliceState } from '@entities/series'
import { AppStoreProvider, initialAppStoreState, useAppStore, type AppStoreState } from '@shared/store/appStore'
import { TEST_LAYERS } from '@shared/test/layers'
import { TEST_SERIES } from '@shared/test/series'
import { buildChartData } from './buildChartData'
import { useChartData } from './useChartData'

vi.mock('./buildChartData', () => ({
  buildChartData: vi.fn(() => ({ rows: [], lines: [], loading: [], errors: [] })),
}))

const buildMock = vi.mocked(buildChartData)
const POINTS = ['2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z', '2026-01-01T12:00:00Z']
const SERIES: SeriesSliceState = { wind: { status: 'success', points: TEST_SERIES.wind.points } }

const STATE: AppStoreState = {
  ...initialAppStoreState,
  layer: loadSucceeded(initialAppStoreState.layer, TEST_LAYERS),
  series: SERIES,
}

function renderChartData() {
  const wrapper = ({ children }: { children: ReactNode }) => <AppStoreProvider state={STATE}>{children}</AppStoreProvider>
  return renderHook(() => ({ data: useChartData(), store: useAppStore() }), { wrapper })
}

afterEach(() => {
  buildMock.mockClear()
})

describe('useChartData', () => {
  it('builds the chart data from the range points, layers, active ids and series in the store', () => {
    const { result } = renderChartData()

    expect(buildMock).toHaveBeenLastCalledWith(POINTS, TEST_LAYERS, ['temperature', 'wind', 'insolation'], SERIES)
    expect(result.current.data).toBe(buildMock.mock.results.at(-1)?.value)
  })

  it('returns the same reference while its inputs are unchanged', () => {
    const { result, rerender } = renderChartData()
    const first = result.current.data

    rerender()
    act(() => {
      result.current.store.dispatch(({ time }) => ({ time: { ...time, selectedTime: POINTS[1] ?? null } }))
    })

    expect(result.current.data).toBe(first)
    expect(buildMock).toHaveBeenCalledTimes(1)
  })

  it('builds again when an input changes', () => {
    const { result } = renderChartData()
    const first = result.current.data

    act(() => {
      result.current.store.dispatch(({ layer }) => ({ layer: toggleLayer(layer, 'wind') }))
    })

    expect(result.current.data).not.toBe(first)
    expect(buildMock).toHaveBeenLastCalledWith(POINTS, TEST_LAYERS, ['temperature', 'insolation'], SERIES)
  })
})
