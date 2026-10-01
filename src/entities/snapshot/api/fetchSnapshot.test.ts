import { request } from '@shared/api'
import { TEST_SNAPSHOTS } from '@shared/test/snapshots'
import { isLayerSnapshot } from '../model/guards'
import { fetchSnapshot } from './fetchSnapshot'

vi.mock('@shared/api', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  request: vi.fn(),
}))

const requestMock = vi.mocked(request)

afterEach(() => {
  requestMock.mockReset()
})

describe('fetchSnapshot', () => {
  it('requests the snapshot path at the time with the signal and the guard, and returns the body', async () => {
    requestMock.mockResolvedValue(TEST_SNAPSHOTS.wind)
    const controller = new AbortController()

    await expect(fetchSnapshot('wind', '2026-01-01T10:00:00Z', controller.signal)).resolves.toBe(TEST_SNAPSHOTS.wind)

    expect(requestMock).toHaveBeenCalledTimes(1)
    expect(requestMock).toHaveBeenCalledWith('/api/layers/wind/snapshot?time=2026-01-01T10%3A00%3A00Z', {
      signal: controller.signal,
      validate: isLayerSnapshot,
    })
  })

  it('URI-encodes the layer id', async () => {
    requestMock.mockResolvedValue(TEST_SNAPSHOTS.wind)

    await fetchSnapshot('a b/c', 'x', new AbortController().signal)

    expect(requestMock).toHaveBeenCalledWith('/api/layers/a%20b%2Fc/snapshot?time=x', expect.anything())
  })
})
