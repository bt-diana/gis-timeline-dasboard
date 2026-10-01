import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { loadSucceeded, toggleLayer } from '@entities/layer'
import { fetchSnapshot, snapshotRetried, useSnapshots, type LayerSnapshot } from '@entities/snapshot'
import { selectTime } from '@entities/time'
import { API_MESSAGES, ApiRequestError } from '@shared/api'
import { AppStoreProvider, initialAppStoreState, useAppStore, type AppStoreState } from '@shared/store/appStore'
import { deferred, type Deferred } from '@shared/test/deferred'
import { TEST_LAYERS } from '@shared/test/layers'
import { TEST_SNAPSHOTS } from '@shared/test/snapshots'
import { useLoadSnapshots } from './useLoadSnapshots'

vi.mock('@entities/snapshot/api/fetchSnapshot')

const fetchSnapshotMock = vi.mocked(fetchSnapshot)
const T10 = '2026-01-01T10:00:00Z'
const T11 = '2026-01-01T11:00:00Z'
const T12 = '2026-01-01T12:00:00Z'

interface PendingRequest {
  layerId: string
  time: string
  signal: AbortSignal
  response: Deferred<LayerSnapshot>
}

function queueResponses() {
  const requests: PendingRequest[] = []
  fetchSnapshotMock.mockImplementation((layerId, time, signal) => {
    const response = deferred<LayerSnapshot>()
    requests.push({ layerId, time, signal, response })
    return response.promise
  })
  const requestFor = (layerId: string, time: string) => {
    const request = requests.findLast((entry) => entry.layerId === layerId && entry.time === time)
    if (!request) throw new Error(`No request for ${layerId} at ${time}`)
    return request
  }
  return { requests, requestFor }
}

function renderLoader(activeLayerIds: readonly string[], selectedTime: string | null = T10) {
  const state: AppStoreState = {
    ...initialAppStoreState,
    layer: { ...loadSucceeded(initialAppStoreState.layer, TEST_LAYERS), activeLayerIds },
    time: { selectedTime },
  }
  const wrapper = ({ children }: { children: ReactNode }) => <AppStoreProvider state={state}>{children}</AppStoreProvider>
  const view = renderHook(
    () => {
      const snapshots = useSnapshots()
      useLoadSnapshots()
      return { snapshots, store: useAppStore() }
    },
    { wrapper },
  )
  const dispatch = (update: (state: AppStoreState) => Partial<AppStoreState>) => {
    act(() => {
      view.result.current.store.dispatch(update)
    })
  }
  return {
    ...view,
    toggle: (layerId: string) => {
      dispatch(({ layer }) => ({ layer: toggleLayer(layer, layerId) }))
    },
    select: (time: string) => {
      dispatch(({ time: state }) => ({ time: selectTime(state, [T10, T11, T12], time) }))
    },
    retry: (layerId: string) => {
      dispatch(({ snapshot }) => ({ snapshot: snapshotRetried(snapshot, layerId) }))
    },
  }
}

async function settle(run: () => void) {
  await act(async () => {
    run()
    await Promise.resolve()
  })
}

afterEach(() => {
  fetchSnapshotMock.mockReset()
})

describe('useLoadSnapshots', () => {
  it('requests nothing without a selected time', () => {
    queueResponses()

    renderLoader(['temperature'], null)

    expect(fetchSnapshotMock).not.toHaveBeenCalled()
  })

  it('requests each active layer once at the selected time and stores the data', async () => {
    const { requests, requestFor } = queueResponses()
    const { result } = renderLoader(['temperature', 'wind'])

    expect(requests.map(({ layerId, time }) => [layerId, time])).toEqual([
      ['temperature', T10],
      ['wind', T10],
    ])
    expect(result.current.snapshots.temperature).toEqual({ status: 'loading', time: T10, features: null })

    await settle(() => {
      requestFor('temperature', T10).response.resolve(TEST_SNAPSHOTS.temperature)
    })

    expect(result.current.snapshots.temperature).toEqual({
      status: 'success',
      time: T10,
      features: TEST_SNAPSHOTS.temperature.features,
    })
    expect(fetchSnapshotMock).toHaveBeenCalledTimes(2)
  })

  it('does not request inactive layers', () => {
    const { requests } = queueResponses()

    renderLoader(['wind'])

    expect(requests.map(({ layerId }) => layerId)).toEqual(['wind'])
  })

  it('aborts the superseded time request, keeps the previous data while loading, and ignores the late response', async () => {
    const { requestFor } = queueResponses()
    const { result, select } = renderLoader(['temperature'])
    await settle(() => {
      requestFor('temperature', T10).response.resolve(TEST_SNAPSHOTS.temperature)
    })

    select(T11)
    select(T12)

    expect(requestFor('temperature', T11).signal.aborted).toBe(true)
    expect(result.current.snapshots.temperature).toEqual({
      status: 'loading',
      time: T12,
      features: TEST_SNAPSHOTS.temperature.features,
    })

    await settle(() => {
      requestFor('temperature', T11).response.resolve(TEST_SNAPSHOTS.temperatureLater)
    })
    expect(result.current.snapshots.temperature?.status).toBe('loading')

    await settle(() => {
      requestFor('temperature', T12).response.resolve(TEST_SNAPSHOTS.temperatureLater)
    })
    expect(result.current.snapshots.temperature).toEqual({
      status: 'success',
      time: T12,
      features: TEST_SNAPSHOTS.temperatureLater.features,
    })
  })

  it('aborts and drops a deactivated layer and ignores its late response', async () => {
    const { requestFor } = queueResponses()
    const { result, toggle } = renderLoader(['temperature', 'wind'])

    toggle('wind')

    expect(requestFor('wind', T10).signal.aborted).toBe(true)
    expect(result.current.snapshots).not.toHaveProperty('wind')

    await settle(() => {
      requestFor('wind', T10).response.resolve(TEST_SNAPSHOTS.wind)
    })
    expect(result.current.snapshots).not.toHaveProperty('wind')
  })

  it('requests a layer again when it is reactivated', () => {
    const { requests } = queueResponses()
    const { toggle } = renderLoader(['temperature', 'wind'])

    toggle('wind')
    toggle('wind')

    expect(requests.filter(({ layerId }) => layerId === 'wind')).toHaveLength(2)
  })

  it.each([
    ['the ApiError message', new ApiRequestError('No data for this layer at the selected time.'), 'No data for this layer at the selected time.'],
    ['the fixed message for an unknown error', new Error('boom'), API_MESSAGES.unexpected],
  ])('stores %s on failure and requests again on retry', async (_, error, message) => {
    const { requestFor } = queueResponses()
    const { result, retry } = renderLoader(['temperature'])

    await settle(() => {
      requestFor('temperature', T10).response.reject(error)
    })
    expect(result.current.snapshots.temperature).toEqual({ status: 'error', time: T10, message })

    retry('temperature')

    expect(fetchSnapshotMock).toHaveBeenCalledTimes(2)
    expect(result.current.snapshots.temperature).toEqual({ status: 'loading', time: T10, features: null })
  })

  it('aborts pending requests on unmount', () => {
    const { requestFor } = queueResponses()
    const { unmount } = renderLoader(['temperature'])

    unmount()

    expect(requestFor('temperature', T10).signal.aborted).toBe(true)
  })
})
