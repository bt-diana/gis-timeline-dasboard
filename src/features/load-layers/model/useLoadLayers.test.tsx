import type { ReactNode } from 'react'
import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import { fetchLayers, useActiveLayerIds, useLayerList, useLayers, type LayerDefinition } from '@entities/layer'
import { API_MESSAGES, ApiRequestError } from '@shared/api'
import { AppStoreProvider, initialAppStoreState } from '@shared/store/appStore'
import { deferred, type Deferred } from '@shared/test/deferred'
import { TEST_LAYERS } from '@shared/test/layers'
import { useLoadLayers } from './useLoadLayers'

vi.mock('@entities/layer/api/fetchLayers')

const fetchLayersMock = vi.mocked(fetchLayers)

function queueResponses(count: number) {
  const responses: Deferred<readonly LayerDefinition[]>[] = []
  const signals: AbortSignal[] = []
  fetchLayersMock.mockImplementation((signal) => {
    signals.push(signal)
    const response = deferred<readonly LayerDefinition[]>()
    responses.push(response)
    return response.promise
  })
  return { responses, signals, count }
}

function wrapper({ children }: { children: ReactNode }) {
  return <AppStoreProvider state={initialAppStoreState}>{children}</AppStoreProvider>
}

function renderLoader() {
  return renderHook(
    () => {
      const list = useLayerList()
      const layers = useLayers()
      const activeLayerIds = useActiveLayerIds()
      return { list, layers, activeLayerIds, retry: useLoadLayers() }
    },
    { wrapper },
  )
}

afterEach(() => {
  fetchLayersMock.mockReset()
})

describe('useLoadLayers', () => {
  it('loads on mount: loading, then the layers with the first one active', async () => {
    const { responses } = queueResponses(1)
    const { result } = renderLoader()

    expect(result.current.list).toEqual({ status: 'loading' })
    expect(fetchLayersMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      responses[0]?.resolve(TEST_LAYERS)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.list).toEqual({ status: 'success' })
    })
    expect(result.current.layers).toEqual(TEST_LAYERS)
    expect(result.current.activeLayerIds).toEqual(['temperature'])
  })

  it('shows the request error message, and a retry then succeeds', async () => {
    const { responses } = queueResponses(2)
    const { result } = renderLoader()

    await act(async () => {
      responses[0]?.reject(new ApiRequestError('Layer service is down.'))
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(result.current.list).toEqual({ status: 'error', message: 'Layer service is down.' })
    })

    act(() => {
      result.current.retry()
    })
    expect(result.current.list).toEqual({ status: 'loading' })

    await act(async () => {
      responses[1]?.resolve(TEST_LAYERS)
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(result.current.list).toEqual({ status: 'success' })
    })
  })

  it('a retry while pending aborts the first request, and its late response is discarded', async () => {
    const { responses, signals } = queueResponses(2)
    const { result } = renderLoader()

    act(() => {
      result.current.retry()
    })
    expect(signals[0]?.aborted).toBe(true)
    expect(signals[1]?.aborted).toBe(false)

    const secondList = TEST_LAYERS.slice(1)
    await act(async () => {
      responses[1]?.resolve(secondList)
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(result.current.list).toEqual({ status: 'success' })
    })

    await act(async () => {
      responses[0]?.resolve(TEST_LAYERS)
      await Promise.resolve()
    })

    expect(result.current.layers).toEqual(secondList)
    expect(result.current.activeLayerIds).toEqual(['wind'])
  })

  it('shows the fixed message for an error that is not an ApiRequestError', async () => {
    const { responses } = queueResponses(1)
    const { result } = renderLoader()

    await act(async () => {
      responses[0]?.reject(new Error('boom'))
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.list).toEqual({ status: 'error', message: API_MESSAGES.unexpected })
    })
  })

  it('a failure of a superseded request is discarded too', async () => {
    const { responses } = queueResponses(2)
    const { result } = renderLoader()

    act(() => {
      result.current.retry()
    })
    await act(async () => {
      responses[0]?.reject(new ApiRequestError('Old failure.'))
      await Promise.resolve()
    })

    expect(result.current.list).toEqual({ status: 'loading' })
  })

  it('unmounting during a request aborts it and writes nothing', async () => {
    const { responses, signals } = queueResponses(1)
    function Loader() {
      useLoadLayers()
      return null
    }
    function Probe() {
      const list = useLayerList()
      const layers = useLayers()
      return <output>{`${list.status}:${String(layers.length)}`}</output>
    }
    const tree = (withLoader: boolean) => (
      <AppStoreProvider state={initialAppStoreState}>
        <Probe />
        {withLoader && <Loader />}
      </AppStoreProvider>
    )
    const { rerender } = render(tree(true))
    expect(screen.getByRole('status')).toHaveTextContent('loading:0')

    rerender(tree(false))
    expect(signals[0]?.aborted).toBe(true)

    await act(async () => {
      responses[0]?.resolve(TEST_LAYERS)
      await Promise.resolve()
    })
    expect(screen.getByRole('status')).toHaveTextContent('loading:0')
  })
})
