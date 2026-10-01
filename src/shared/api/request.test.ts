import { API_MESSAGES } from './config'
import { isAbortError } from './apiError'
import { request } from './request'

const isNumberList = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'number')

function respond(body: string, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status }))
}

function send(signal = new AbortController().signal) {
  return request('/api/numbers', { signal, validate: isNumberList })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('request', () => {
  it('returns the validated body', async () => {
    respond('[1, 2]')

    await expect(send()).resolves.toEqual([1, 2])
  })

  it('passes the signal to fetch', async () => {
    const fetchSpy = respond('[1]')
    const controller = new AbortController()

    await send(controller.signal)

    expect(fetchSpy).toHaveBeenCalledWith('/api/numbers', { signal: controller.signal })
  })

  it('rejects with the ApiError message on an ApiError body', async () => {
    respond(JSON.stringify({ error: { code: 'INTERNAL', message: 'Layer service is down.' } }), 500)

    await expect(send()).rejects.toThrow('Layer service is down.')
  })

  it.each([
    ['a non-JSON error body', () => respond('<html>oops</html>', 500)],
    ['a JSON error body that is not an ApiError', () => respond('{"detail":"x"}', 502)],
    ['a body that fails validation', () => respond('["a"]')],
    ['a network failure', () => vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))],
  ])('rejects with the fixed message on %s', async (_, arrange) => {
    arrange()

    await expect(send()).rejects.toThrow(API_MESSAGES.unexpected)
  })

  it('rejects as aborted when the signal aborts', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        }),
    )
    const controller = new AbortController()
    const pending = send(controller.signal)

    controller.abort()

    const error: unknown = await pending.catch((reason: unknown) => reason)
    expect(isAbortError(error)).toBe(true)
  })
})
