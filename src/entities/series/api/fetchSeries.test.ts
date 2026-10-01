import { request } from '@shared/api'
import { TEST_SERIES } from '@shared/test/series'
import { isLayerSeries } from '../model/guards'
import { fetchSeries } from './fetchSeries'

vi.mock('@shared/api', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  request: vi.fn(),
}))

const requestMock = vi.mocked(request)

afterEach(() => {
  requestMock.mockReset()
})

describe('fetchSeries', () => {
  it('requests the series path with the signal and the guard, and returns the body', async () => {
    requestMock.mockResolvedValue(TEST_SERIES.wind)
    const controller = new AbortController()

    await expect(fetchSeries('wind', controller.signal)).resolves.toBe(TEST_SERIES.wind)

    expect(requestMock).toHaveBeenCalledTimes(1)
    expect(requestMock).toHaveBeenCalledWith('/api/layers/wind/series', {
      signal: controller.signal,
      validate: isLayerSeries,
    })
  })

  it('URI-encodes the layer id', async () => {
    requestMock.mockResolvedValue(TEST_SERIES.wind)

    await fetchSeries('a b/c', new AbortController().signal)

    expect(requestMock).toHaveBeenCalledWith('/api/layers/a%20b%2Fc/series', expect.anything())
  })
})
