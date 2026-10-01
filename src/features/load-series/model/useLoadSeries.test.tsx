import type { ReactNode } from 'react'
import { act, render, renderHook, screen } from '@testing-library/react'
import { loadSucceeded, toggleLayer } from '@entities/layer'
import { fetchSeries, useSeries, type LayerSeries } from '@entities/series'
import { API_MESSAGES, ApiRequestError } from '@shared/api'
import { AppStoreProvider, initialAppStoreState, useAppStore, type AppStoreState } from '@shared/store/appStore'
import { deferred, type Deferred } from '@shared/test/deferred'
import { TEST_LAYERS } from '@shared/test/layers'
import { TEST_SERIES } from '@shared/test/series'
import { useLoadSeries } from './useLoadSeries'

vi.mock('@entities/series/api/fetchSeries')

const fetchSeriesMock = vi.mocked(fetchSeries)
const ALL_IDS = TEST_LAYERS.map((layer) => layer.id)

interface PendingRequest {
  layerId: string
  signal: AbortSignal
  response: Deferred<LayerSeries>
}

function queueResponses() {
  const requests: PendingRequest[] = []
  fetchSeriesMock.mockImplementation((layerId, signal) => {
    const response = deferred<LayerSeries>()
    requests.push({ layerId, signal, response })
    return response.promise
  })
  const requestFor = (layerId: string, nth = 0) => {
    const request = requests.filter((entry) => entry.layerId === layerId)[nth]
    if (!request) throw new Error(`No request ${String(nth)} for ${layerId}`)
    return request
  }
  return { requests, requestFor }
}

function stateWithActive(activeLayerIds: readonly string[]): AppStoreState {
  return {
    ...initialAppStoreState,
    layer: { ...loadSucceeded(initialAppStoreState.layer, TEST_LAYERS), activeLayerIds },
  }
}

function renderLoader(activeLayerIds: readonly string[] = ALL_IDS) {
  const state = stateWithActive(activeLayerIds)
  const wrapper = ({ children }: { children: ReactNode }) => <AppStoreProvider state={state}>{children}</AppStoreProvider>
  const view = renderHook(
    () => {
      const series = useSeries()
      const store = useAppStore()
      return { series, store, retry: useLoadSeries() }
    },
    { wrapper },
  )
  const toggle = (layerId: string) => {
    act(() => {
      view.result.current.store.dispatch(({ layer }) => ({ layer: toggleLayer(layer, layerId) }))
    })
  }
  return { ...view, toggle }
}

async function settle(run: () => void) {
  await act(async () => {
    run()
    await Promise.resolve()
  })
}

const success = (layerId: keyof typeof TEST_SERIES) => ({ status: 'success', points: TEST_SERIES[layerId].points })

afterEach(() => {
  fetchSeriesMock.mockReset()
})

describe('useLoadSeries', () => {
  it('requests each active layer once and stores each series', async () => {
    const { requestFor } = queueResponses()
    const { result } = renderLoader()

    expect(fetchSeriesMock.mock.calls.map(([layerId]) => layerId)).toEqual(ALL_IDS)
    expect(result.current.series).toEqual({
      temperature: { status: 'loading' },
      wind: { status: 'loading' },
      insolation: { status: 'loading' },
    })

    await settle(() => {
      for (const layerId of ALL_IDS) requestFor(layerId).response.resolve(TEST_SERIES[layerId])
    })

    expect(result.current.series).toEqual({
      temperature: success('temperature'),
      wind: success('wind'),
      insolation: success('insolation'),
    })
  })

  it('reuses a loaded series when its layer is switched off and on, without a new request', async () => {
    const { requestFor } = queueResponses()
    const { result, toggle } = renderLoader(['wind'])
    await settle(() => {
      requestFor('wind').response.resolve(TEST_SERIES.wind)
    })

    toggle('wind')
    toggle('wind')

    expect(fetchSeriesMock).toHaveBeenCalledTimes(1)
    expect(result.current.series).toEqual({ wind: success('wind') })
  })

  it('aborts a pending layer switched off, discards its late response, and writes only the new request on reactivation', async () => {
    const { requestFor } = queueResponses()
    const { result, toggle } = renderLoader(['wind'])

    toggle('wind')

    expect(requestFor('wind').signal.aborted).toBe(true)
    expect(result.current.series).toEqual({})

    await settle(() => {
      requestFor('wind').response.resolve(TEST_SERIES.wind)
    })
    expect(result.current.series).toEqual({})

    toggle('wind')
    expect(fetchSeriesMock).toHaveBeenCalledTimes(2)
    expect(requestFor('wind', 1).signal.aborted).toBe(false)
    expect(result.current.series).toEqual({ wind: { status: 'loading' } })

    const secondPoints = [{ time: '2026-01-01T10:00:00Z', value: 9 }]
    await settle(() => {
      requestFor('wind', 1).response.resolve({ layerId: 'wind', points: secondPoints })
    })
    expect(result.current.series).toEqual({ wind: { status: 'success', points: secondPoints } })
  })

  it('writes responses that arrive out of order each to its own layer', async () => {
    const { requestFor } = queueResponses()
    const { result } = renderLoader(['temperature', 'wind'])

    await settle(() => {
      requestFor('wind').response.resolve(TEST_SERIES.wind)
    })
    expect(result.current.series).toEqual({ temperature: { status: 'loading' }, wind: success('wind') })

    await settle(() => {
      requestFor('temperature').response.resolve(TEST_SERIES.temperature)
    })
    expect(result.current.series).toEqual({ temperature: success('temperature'), wind: success('wind') })
  })

  it('stores the request error, and retry requests that layer only', async () => {
    const { requestFor } = queueResponses()
    const { result } = renderLoader(['temperature', 'wind'])
    await settle(() => {
      requestFor('temperature').response.reject(new ApiRequestError('Series service is down.'))
      requestFor('wind').response.resolve(TEST_SERIES.wind)
    })
    expect(result.current.series).toEqual({
      temperature: { status: 'error', message: 'Series service is down.' },
      wind: success('wind'),
    })

    act(() => {
      result.current.retry('temperature')
    })
    expect(fetchSeriesMock).toHaveBeenCalledTimes(3)
    expect(fetchSeriesMock).toHaveBeenLastCalledWith('temperature', expect.any(AbortSignal))
    expect(result.current.series).toEqual({ temperature: { status: 'loading' }, wind: success('wind') })

    await settle(() => {
      requestFor('temperature', 1).response.resolve(TEST_SERIES.temperature)
    })
    expect(result.current.series).toEqual({ temperature: success('temperature'), wind: success('wind') })
  })

  it('stores the fixed message for an error that is not an ApiRequestError', async () => {
    const { requestFor } = queueResponses()
    const { result } = renderLoader(['wind'])

    await settle(() => {
      requestFor('wind').response.reject(new Error('boom'))
    })

    expect(result.current.series).toEqual({ wind: { status: 'error', message: API_MESSAGES.unexpected } })
  })

  it('a retry while pending aborts the first request and discards its late response', async () => {
    const { requestFor } = queueResponses()
    const { result } = renderLoader(['wind'])

    act(() => {
      result.current.retry('wind')
    })
    expect(requestFor('wind').signal.aborted).toBe(true)
    expect(requestFor('wind', 1).signal.aborted).toBe(false)

    await settle(() => {
      requestFor('wind').response.reject(new ApiRequestError('Old failure.'))
    })
    expect(result.current.series).toEqual({ wind: { status: 'loading' } })
  })

  it('requests a failed layer again when it is switched off and on', async () => {
    const { requestFor } = queueResponses()
    const { toggle } = renderLoader(['wind'])
    await settle(() => {
      requestFor('wind').response.reject(new ApiRequestError('Series service is down.'))
    })

    toggle('wind')
    expect(fetchSeriesMock).toHaveBeenCalledTimes(1)

    toggle('wind')
    expect(fetchSeriesMock).toHaveBeenCalledTimes(2)
    expect(fetchSeriesMock).toHaveBeenLastCalledWith('wind', expect.any(AbortSignal))
  })

  it('unmounting during requests aborts them and writes nothing', async () => {
    const { requests } = queueResponses()
    function Loader() {
      useLoadSeries()
      return null
    }
    function Probe() {
      return <output>{JSON.stringify(useSeries())}</output>
    }
    const state = stateWithActive(['temperature', 'wind'])
    const tree = (withLoader: boolean) => (
      <AppStoreProvider state={state}>
        <Probe />
        {withLoader && <Loader />}
      </AppStoreProvider>
    )
    const { rerender } = render(tree(true))
    const pendingText = screen.getByRole('status').textContent

    rerender(tree(false))
    expect(requests.map(({ signal }) => signal.aborted)).toEqual([true, true])

    await settle(() => {
      for (const { layerId, response } of requests) response.resolve({ layerId, points: [] })
    })
    expect(screen.getByRole('status').textContent).toBe(pendingText)
  })
})
